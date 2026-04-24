import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

/**
 * BaseTenantGateway - Gateway base com isolamento por tenant
 * 
 * Garante que eventos WebSocket sejam enviados apenas para clientes
 * do mesmo tenant, evitando vazamento de dados entre bares.
 * 
 * Fluxo:
 * 1. Cliente conecta e envia JWT no handshake
 * 2. Gateway extrai tenant_id do JWT
 * 3. Cliente é adicionado ao room "tenant_{tenant_id}"
 * 4. Eventos são emitidos apenas para o room do tenant
 */
export abstract class BaseTenantGateway {
  protected abstract readonly logger: Logger;
  protected abstract server: Server;
  protected jwtService: JwtService;

  // WebSocket metrics
  private static _totalConnections = 0;
  private static _activeConnections = 0;
  private static _authFailures = 0;
  private static _totalEvents = 0;

  static getMetrics() {
    return {
      totalConnections: BaseTenantGateway._totalConnections,
      activeConnections: BaseTenantGateway._activeConnections,
      authFailures: BaseTenantGateway._authFailures,
      totalEvents: BaseTenantGateway._totalEvents,
    };
  }

  static resetMetrics() {
    BaseTenantGateway._totalConnections = 0;
    BaseTenantGateway._authFailures = 0;
    BaseTenantGateway._totalEvents = 0;
  }

  /**
   * Extrai tenant_id do handshake do cliente
   */
  protected extractTenantId(client: Socket): string | null {
    try {
      // SECURITY: Only accept tenantId from verified JWT token
      // Query params and headers are NOT trusted (attacker can spoof)
      const token = client.handshake.auth?.token || 
                    client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (token && this.jwtService) {
        const payload = this.jwtService.verify(token) as any;
        return payload?.tenantId || null;
      }

      return null;
    } catch (error) {
      BaseTenantGateway._authFailures++;
      this.logger.warn(`Erro ao extrair tenant_id do JWT: ${error.message}`);
      return null;
    }
  }

  /**
   * Adiciona cliente ao room do tenant
   * Deve ser chamado no handleConnection
   */
  protected joinTenantRoom(client: Socket): string | null {
    const tenantId = this.extractTenantId(client);
    
    BaseTenantGateway._totalConnections++;
    BaseTenantGateway._activeConnections++;

    if (tenantId) {
      const roomName = `tenant_${tenantId}`;
      client.join(roomName);
      client.data.tenantId = tenantId;
      this.logger.log(`🏢 Cliente ${client.id} entrou no room: ${roomName}`);
      return tenantId;
    } else {
      // Clientes públicos (sem JWT) são permitidos mas sem room de tenant.
      // Eles podem entrar em rooms de comanda específicos via join_comanda.
      this.logger.log(`👤 Cliente público ${client.id} conectado sem tenant (acesso público permitido)`);
      client.data.tenantId = null;
      return null;
    }
  }

  /**
   * Remove cliente do room do tenant
   * Deve ser chamado no handleDisconnect
   */
  protected leaveTenantRoom(client: Socket): void {
    BaseTenantGateway._activeConnections = Math.max(0, BaseTenantGateway._activeConnections - 1);
    const tenantId = client.data.tenantId;
    if (tenantId) {
      const roomName = `tenant_${tenantId}`;
      client.leave(roomName);
      this.logger.log(`🏢 Cliente ${client.id} saiu do room: ${roomName}`);
    }
  }

  /**
   * Emite evento apenas para clientes do tenant especificado
   */
  protected emitToTenant(tenantId: string, event: string, data: any): void {
    const roomName = `tenant_${tenantId}`;
    BaseTenantGateway._totalEvents++;
    this.server.to(roomName).emit(event, data);
    this.logger.debug(`📤 Evento '${event}' emitido para ${roomName}`);
  }

  /**
   * Emite evento para o tenant do cliente
   */
  protected emitToClientTenant(client: Socket, event: string, data: any): void {
    const tenantId = client.data.tenantId;
    if (tenantId) {
      this.emitToTenant(tenantId, event, data);
    } else {
      this.logger.warn(`⚠️ Cliente ${client.id} sem tenant_id, evento não emitido`);
    }
  }

  /**
   * Verifica se cliente pertence ao tenant especificado
   */
  protected isClientInTenant(client: Socket, tenantId: string): boolean {
    return client.data.tenantId === tenantId;
  }

  /**
   * Obtém contagem de clientes conectados por tenant
   */
  protected async getClientCountByTenant(tenantId: string): Promise<number> {
    const roomName = `tenant_${tenantId}`;
    const sockets = await this.server.in(roomName).fetchSockets();
    return sockets.length;
  }
}
