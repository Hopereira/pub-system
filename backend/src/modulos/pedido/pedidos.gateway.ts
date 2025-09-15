// Caminho: backend/src/modulos/pedido/pedidos.gateway.ts

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

// O Gateway escutará na porta 3000, e configuramos o CORS
// para permitir que nosso frontend (localhost:3001) se conecte.
@WebSocketGateway({
  cors: {
    origin: '*', // Em produção, mude para o domínio do seu frontend
  },
})
export class PedidosGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  // Injetamos o servidor Socket.IO para termos acesso a ele
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PedidosGateway.name);

  // --- Métodos do ciclo de vida para loggar conexões ---
  afterInit(server: Server) {
    this.logger.log('Gateway de Pedidos inicializado!');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Cliente conectado: ${client.id}`);
    // Futuramente, aqui podemos fazer o cliente entrar em "salas" específicas
    // Ex: client.join('cozinha_room');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  // --- Métodos para emitir eventos ---

  /**
   * Emite um evento de 'novo_pedido' para todos os clientes conectados.
   * Isso será usado para notificar o painel da cozinha.
   * @param pedido O novo pedido que foi criado.
   */
  emitNovoPedido(pedido: Pedido) {
    this.logger.log(`Emitindo evento 'novo_pedido' para o pedido ID: ${pedido.id}`);
    this.server.emit('novo_pedido', pedido);
  }

  /**
   * Emite um evento de 'status_atualizado' para todos os clientes.
   * Isso notificará o cliente final e o painel da cozinha.
   * @param pedido O pedido com o status atualizado.
   */
  emitStatusAtualizado(pedido: Pedido) {
    this.logger.log(`Emitindo evento 'status_atualizado' para o pedido ID: ${pedido.id}`);
    this.server.emit('status_atualizado', pedido);
  }
}