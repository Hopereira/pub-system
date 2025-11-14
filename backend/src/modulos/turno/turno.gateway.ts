import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class TurnoGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TurnoGateway.name);

  afterInit(server: Server) {
    this.logger.log('🔌 Gateway de Turnos inicializado!');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`✅ Cliente conectado ao TurnoGateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Cliente desconectado do TurnoGateway: ${client.id}`);
  }

  /**
   * Emite evento quando funcionário faz check-in
   */
  emitCheckIn(turno: any) {
    this.logger.log(`📥 Emitindo check-in para funcionário: ${turno.funcionarioId}`);
    this.server.emit('funcionario_check_in', turno);
  }

  /**
   * Emite evento quando funcionário faz check-out
   */
  emitCheckOut(turno: any) {
    this.logger.log(`📤 Emitindo check-out para funcionário: ${turno.funcionarioId}`);
    this.server.emit('funcionario_check_out', turno);
  }

  /**
   * Emite evento quando lista de funcionários ativos muda
   */
  emitFuncionariosAtualizados() {
    this.logger.log(`🔄 Emitindo atualização de funcionários ativos`);
    this.server.emit('funcionarios_ativos_atualizado');
  }
}
