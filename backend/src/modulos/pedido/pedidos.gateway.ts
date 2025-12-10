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
import { Pedido } from './entities/pedido.entity';
import { Comanda } from '../comanda/entities/comanda.entity';

// ✅ NOVO: Interface para tracking de eventos pendentes
interface PendingEvent {
  eventName: string;
  data: unknown;
  timestamp: Date;
  retryCount: number;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
  // ✅ NOVO: Configurações de ping/pong para detectar conexões mortas
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class PedidosGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PedidosGateway.name);
  
  // ✅ NOVO: Contador de clientes conectados
  private connectedClients = 0;

  afterInit(server: Server) {
    this.logger.log('🔌 Gateway de Pedidos inicializado!');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.connectedClients++;
    this.logger.log(`✅ Cliente conectado: ${client.id} | Total: ${this.connectedClients}`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(`❌ Cliente desconectado: ${client.id} | Total: ${this.connectedClients}`);
  }
  
  // ✅ NOVO: Getter para verificar se há clientes conectados
  get hasConnectedClients(): boolean {
    return this.connectedClients > 0;
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

  /**
   * ✅ MELHORADO: Emite evento de novo pedido com logging aprimorado
   * Verifica se há clientes conectados antes de emitir
   */
  emitNovoPedido(pedido: Pedido) {
    if (!this.hasConnectedClients) {
      this.logger.warn(
        `⚠️ Nenhum cliente conectado para receber 'novo_pedido' | Pedido ID: ${pedido.id}`,
      );
    }
    
    this.logger.log(
      `📤 Emitindo 'novo_pedido' | ID: ${pedido.id} | Clientes: ${this.connectedClients}`,
    );
    this.server.emit('novo_pedido', pedido);

    // Emite eventos específicos por ambiente de preparo
    if (pedido.itens && pedido.itens.length > 0) {
      const ambientesNotificados = new Set<string>();

      pedido.itens.forEach((item) => {
        if (
          item.produto?.ambiente?.id &&
          !ambientesNotificados.has(item.produto.ambiente.id)
        ) {
          const ambienteId = item.produto.ambiente.id;
          this.logger.log(
            `📤 Emitindo 'novo_pedido_ambiente:${ambienteId}' | Pedido ID: ${pedido.id}`,
          );
          this.server.emit(`novo_pedido_ambiente:${ambienteId}`, pedido);
          ambientesNotificados.add(ambienteId);
        }
      });
    }
  }

  /**
   * ✅ MELHORADO: Emite evento de status atualizado com logging aprimorado
   */
  emitStatusAtualizado(pedido: Pedido) {
    if (!this.hasConnectedClients) {
      this.logger.warn(
        `⚠️ Nenhum cliente conectado para receber 'status_atualizado' | Pedido ID: ${pedido.id}`,
      );
    }
    
    this.logger.log(
      `📤 Emitindo 'status_atualizado' | ID: ${pedido.id} | Status: ${pedido.status} | Clientes: ${this.connectedClients}`,
    );
    this.server.emit('status_atualizado', pedido);

    // Emite eventos específicos por ambiente quando status muda
    if (pedido.itens && pedido.itens.length > 0) {
      const ambientesNotificados = new Set<string>();

      pedido.itens.forEach((item) => {
        if (
          item.produto?.ambiente?.id &&
          !ambientesNotificados.has(item.produto.ambiente.id)
        ) {
          const ambienteId = item.produto.ambiente.id;
          this.logger.log(
            `📤 Emitindo 'status_atualizado_ambiente:${ambienteId}' | Pedido ID: ${pedido.id}`,
          );
          this.server.emit(`status_atualizado_ambiente:${ambienteId}`, pedido);
          ambientesNotificados.add(ambienteId);
        }
      });
    }
  }

  // ==================================================================
  // ## CORREÇÃO: Adicionamos um novo método para notificar sobre a comanda ##
  // ==================================================================
  emitComandaAtualizada(comanda: Comanda) {
    this.logger.log(
      `Emitindo evento 'comanda_atualizada' para a comanda ID: ${comanda.id}`,
    );
    this.server.emit('comanda_atualizada', comanda);
  }

  /**
   * Emite evento quando uma nova movimentação é registrada no caixa
   * Atualiza em tempo real o resumo do caixa
   */
  emitCaixaAtualizado(aberturaCaixaId: string) {
    this.logger.log(
      `Emitindo evento 'caixa_atualizado' para o caixa ID: ${aberturaCaixaId}`,
    );
    this.server.emit('caixa_atualizado', { aberturaCaixaId });
  }
}
