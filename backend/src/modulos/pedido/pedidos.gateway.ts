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
  }

  emitStatusAtualizado(pedido: Pedido) {
    this.logger.log(`Emitindo evento 'status_atualizado' para o pedido ID: ${pedido.id}`);
    this.server.emit('status_atualizado', pedido);
  }

  // ==================================================================
  // ## CORREÇÃO: Adicionamos um novo método para notificar sobre a comanda ##
  // ==================================================================
  emitComandaAtualizada(comanda: Comanda) {
    this.logger.log(`Emitindo evento 'comanda_atualizada' para a comanda ID: ${comanda.id}`);
    this.server.emit('comanda_atualizada', comanda);
  }
}