import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Pedido } from './entities/pedido.entity';
import { Comanda } from '../comanda/entities/comanda.entity';
import { BaseTenantGateway } from '../../common/tenant/gateways/base-tenant.gateway';

@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:3001',
      'https://pub-system.vercel.app',
      'https://pubsystem.com.br',
      'https://www.pubsystem.com.br',
      /\.pubsystem\.com\.br$/, // Subdomínios curinga
    ].filter(Boolean),
    credentials: true,
  },
})
export class PedidosGateway
  extends BaseTenantGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  protected readonly logger = new Logger(PedidosGateway.name);

  constructor(jwtService: JwtService) {
    super();
    this.jwtService = jwtService;
  }

  afterInit(server: Server) {
    this.logger.log('🔌 Gateway de Pedidos inicializado com isolamento por tenant!');
  }

  handleConnection(client: Socket, ...args: any[]) {
    const tenantId = this.joinTenantRoom(client);
    if (tenantId) {
      this.logger.log(`✅ Cliente ${client.id} conectado ao tenant: ${tenantId}`);
    } else {
      this.logger.warn(`⚠️ Cliente ${client.id} conectado sem tenant (modo legado)`);
    }
  }

  handleDisconnect(client: Socket) {
    this.leaveTenantRoom(client);
    this.logger.log(`❌ Cliente desconectado: ${client.id}`);
  }

  /**
   * Handler para cliente entrar no room de uma comanda específica
   * Permite receber notificações direcionadas
   */
  @SubscribeMessage('join_comanda')
  handleJoinComanda(client: Socket, comandaId: string) {
    const roomName = `comanda_${comandaId}`;
    client.join(roomName);
    this.logger.log(`Cliente ${client.id} entrou no room: ${roomName}`);
    return { success: true, room: roomName };
  }

  /**
   * Handler para cliente sair do room de uma comanda
   */
  @SubscribeMessage('leave_comanda')
  handleLeaveComanda(client: Socket, comandaId: string) {
    const roomName = `comanda_${comandaId}`;
    client.leave(roomName);
    this.logger.log(`Cliente ${client.id} saiu do room: ${roomName}`);
    return { success: true, room: roomName };
  }

  emitNovoPedido(pedido: Pedido, tenantId?: string) {
    const targetTenantId = tenantId || (pedido as any).tenantId;
    
    // 🔍 DEBUG: Log para verificar estrutura do pedido
    this.logger.debug(`📊 emitNovoPedido - pedido.id: ${pedido.id}, comanda: ${pedido.comanda?.id || 'NULL'}, tenantId: ${targetTenantId || 'NULL'}`);
    
    if (targetTenantId) {
      // ✅ ISOLADO: Emite apenas para o tenant do pedido
      this.emitToTenant(targetTenantId, 'novo_pedido', pedido);
      this.logger.log(
        `🔒 Evento 'novo_pedido' emitido para tenant ${targetTenantId} | Pedido: ${pedido.id}`,
      );

      // Emite eventos específicos por ambiente de preparo (também isolados)
      if (pedido.itens && pedido.itens.length > 0) {
        const ambientesNotificados = new Set<string>();

        pedido.itens.forEach((item) => {
          if (
            item.produto?.ambiente?.id &&
            !ambientesNotificados.has(item.produto.ambiente.id)
          ) {
            const ambienteId = item.produto.ambiente.id;
            this.emitToTenant(targetTenantId, `novo_pedido_ambiente:${ambienteId}`, pedido);
            this.logger.log(`📤 Evento 'novo_pedido_ambiente:${ambienteId}' emitido para tenant ${targetTenantId}`);
            ambientesNotificados.add(ambienteId);
          }
        });
      }
      
      // ✅ CORREÇÃO: Também emite para o room da comanda (clientes públicos)
      if (pedido.comanda?.id) {
        const comandaRoom = `comanda_${pedido.comanda.id}`;
        this.server.to(comandaRoom).emit('novo_pedido', pedido);
        this.logger.log(`📤 Evento 'novo_pedido' TAMBÉM emitido para comanda room: ${comandaRoom}`);
      }
    } else {
      // ⚠️ LEGADO: Fallback para broadcast (compatibilidade)
      this.logger.warn(`⚠️ Pedido ${pedido.id} sem tenant_id, usando broadcast`);
      this.server.emit('novo_pedido', pedido);
    }
  }

  emitStatusAtualizado(pedido: Pedido, tenantId?: string) {
    const targetTenantId = tenantId || (pedido as any).tenantId;
    
    // 🔍 DEBUG: Log para verificar estrutura do pedido
    this.logger.debug(`📊 emitStatusAtualizado - pedido.id: ${pedido.id}, comanda: ${pedido.comanda ? pedido.comanda.id : 'NULL'}, tenantId: ${targetTenantId}`);
    
    if (targetTenantId) {
      // ✅ ISOLADO: Emite apenas para o tenant do pedido
      this.emitToTenant(targetTenantId, 'status_atualizado', pedido);
      this.logger.log(
        `🔒 Evento 'status_atualizado' emitido para tenant ${targetTenantId} | Pedido: ${pedido.id}`,
      );

      // Emite eventos específicos por ambiente quando status muda
      if (pedido.itens && pedido.itens.length > 0) {
        const ambientesNotificados = new Set<string>();

        pedido.itens.forEach((item) => {
          if (
            item.produto?.ambiente?.id &&
            !ambientesNotificados.has(item.produto.ambiente.id)
          ) {
            const ambienteId = item.produto.ambiente.id;
            this.emitToTenant(targetTenantId, `status_atualizado_ambiente:${ambienteId}`, pedido);
            ambientesNotificados.add(ambienteId);
          }
        });
      }
      
      // ✅ CORREÇÃO: Também emite para o room da comanda (clientes públicos)
      if (pedido.comanda?.id) {
        const comandaRoom = `comanda_${pedido.comanda.id}`;
        this.server.to(comandaRoom).emit('status_atualizado', pedido);
        this.logger.log(`📤 Evento 'status_atualizado' TAMBÉM emitido para comanda room: ${comandaRoom}`);
      } else {
        this.logger.warn(`⚠️ Pedido ${pedido.id} não tem comanda associada para emitir evento!`);
      }
    } else {
      // ⚠️ LEGADO: Fallback para broadcast
      this.logger.warn(`⚠️ Pedido ${pedido.id} sem tenant_id, usando broadcast`);
      this.server.emit('status_atualizado', pedido);
    }
  }

  // ==================================================================
  // ## Notificação de comanda atualizada (ISOLADO POR TENANT) ##
  // ==================================================================
  emitComandaAtualizada(comanda: Comanda, tenantId?: string) {
    const targetTenantId = tenantId || (comanda as any).tenantId;
    
    if (targetTenantId) {
      this.emitToTenant(targetTenantId, 'comanda_atualizada', comanda);
      this.logger.log(
        `🔒 Evento 'comanda_atualizada' emitido para tenant ${targetTenantId} | Comanda: ${comanda.id}`,
      );
    } else {
      this.logger.warn(`⚠️ Comanda ${comanda.id} sem tenant_id, usando broadcast`);
      this.server.emit('comanda_atualizada', comanda);
    }
  }

  // ==================================================================
  // ## Nova comanda criada (ISOLADO POR TENANT) ##
  // ==================================================================
  emitNovaComanda(comanda: Comanda, tenantId?: string) {
    const targetTenantId = tenantId || (comanda as any).tenantId;
    
    if (targetTenantId) {
      this.emitToTenant(targetTenantId, 'nova_comanda', comanda);
      this.logger.log(
        `🔒 Evento 'nova_comanda' emitido para tenant ${targetTenantId} | Comanda: ${comanda.id}`,
      );
    } else {
      this.logger.warn(`⚠️ Comanda ${comanda.id} sem tenant_id, usando broadcast`);
      this.server.emit('nova_comanda', comanda);
    }
  }

  /**
   * Emite evento quando uma nova movimentação é registrada no caixa
   * Atualiza em tempo real o resumo do caixa (ISOLADO POR TENANT)
   */
  emitCaixaAtualizado(aberturaCaixaId: string, tenantId?: string) {
    if (tenantId) {
      this.emitToTenant(tenantId, 'caixa_atualizado', { aberturaCaixaId });
      this.logger.log(
        `🔒 Evento 'caixa_atualizado' emitido para tenant ${tenantId} | Caixa: ${aberturaCaixaId}`,
      );
    } else {
      this.logger.warn(`⚠️ Caixa ${aberturaCaixaId} sem tenant_id, usando broadcast`);
      this.server.emit('caixa_atualizado', { aberturaCaixaId });
    }
  }
}
