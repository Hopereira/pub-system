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

  /**
   * Extrai tenant_id do handshake do cliente
   */
  protected extractTenantId(client: Socket): string | null {
    try {
      // Tenta extrair do token JWT no handshake
      const token = client.handshake.auth?.token || 
                    client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (token && this.jwtService) {
        const payload = this.jwtService.decode(token) as any;
        return payload?.empresaId || payload?.tenantId || null;
      }

      // Fallback: tenta extrair do query param
      const tenantId = client.handshake.query?.tenantId as string;
      if (tenantId) {
        return tenantId;
      }

      // Fallback: tenta extrair do header
      const headerTenantId = client.handshake.headers?.['x-tenant-id'] as string;
      if (headerTenantId) {
        return headerTenantId;
      }

      return null;
    } catch (error) {
      this.logger.warn(`Erro ao extrair tenant_id: ${error.message}`);
      return null;
    }
  }

  /**
   * Adiciona cliente ao room do tenant
   * Deve ser chamado no handleConnection
   */
  protected joinTenantRoom(client: Socket): string | null {
    const tenantId = this.extractTenantId(client);
    
    if (tenantId) {
      const roomName = `tenant_${tenantId}`;
      client.join(roomName);
      client.data.tenantId = tenantId;
      this.logger.log(`🏢 Cliente ${client.id} entrou no room: ${roomName}`);
      return tenantId;
    } else {
      this.logger.warn(`⚠️ Cliente ${client.id} conectou sem tenant_id`);
      return null;
    }
  }

  /**
   * Remove cliente do room do tenant
   * Deve ser chamado no handleDisconnect
   */
  protected leaveTenantRoom(client: Socket): void {
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
