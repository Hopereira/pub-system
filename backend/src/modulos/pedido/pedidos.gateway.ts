import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Pedido } from './entities/pedido.entity';
import { Comanda } from '../comanda/entities/comanda.entity'; // Importamos a Comanda

@WebSocketGateway({
  cors: {
    origin: '*', 
  },
})
export class PedidosGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PedidosGateway.name);

  afterInit(server: Server) {
    this.logger.log('Gateway de Pedidos inicializado!');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  emitNovoPedido(pedido: Pedido) {
    this.logger.log(`Emitindo evento 'novo_pedido' para o pedido ID: ${pedido.id}`);
    this.server.emit('novo_pedido', pedido);
    
    // Emite eventos específicos por ambiente de preparo
    if (pedido.itens && pedido.itens.length > 0) {
      const ambientesNotificados = new Set<string>();
      
      pedido.itens.forEach(item => {
        if (item.produto?.ambiente?.id && !ambientesNotificados.has(item.produto.ambiente.id)) {
          const ambienteId = item.produto.ambiente.id;
          this.logger.log(`Emitindo 'novo_pedido_ambiente:${ambienteId}' para o pedido ID: ${pedido.id}`);
          this.server.emit(`novo_pedido_ambiente:${ambienteId}`, pedido);
          ambientesNotificados.add(ambienteId);
        }
      });
    }
  }

  emitStatusAtualizado(pedido: Pedido) {
    this.logger.log(`Emitindo evento 'status_atualizado' para o pedido ID: ${pedido.id}`);
    this.server.emit('status_atualizado', pedido);
    
    // Emite eventos específicos por ambiente quando status muda
    if (pedido.itens && pedido.itens.length > 0) {
      const ambientesNotificados = new Set<string>();
      
      pedido.itens.forEach(item => {
        if (item.produto?.ambiente?.id && !ambientesNotificados.has(item.produto.ambiente.id)) {
          const ambienteId = item.produto.ambiente.id;
          this.logger.log(`Emitindo 'status_atualizado_ambiente:${ambienteId}' para o pedido ID: ${pedido.id}`);
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
    this.logger.log(`Emitindo evento 'comanda_atualizada' para a comanda ID: ${comanda.id}`);
    this.server.emit('comanda_atualizada', comanda);
  }
}