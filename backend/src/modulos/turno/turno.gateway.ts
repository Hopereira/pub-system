import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
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
export class TurnoGateway
  extends BaseTenantGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  protected readonly logger = new Logger(TurnoGateway.name);

  constructor(jwtService: JwtService) {
    super();
    this.jwtService = jwtService;
  }

  afterInit(server: Server) {
    this.logger.log('🔌 Gateway de Turnos inicializado com isolamento por tenant!');
  }

  handleConnection(client: Socket, ...args: any[]) {
    const tenantId = this.joinTenantRoom(client);
    if (tenantId) {
      this.logger.log(`✅ Cliente ${client.id} conectado ao TurnoGateway | Tenant: ${tenantId}`);
    }
    // Sem tenantId → BaseTenantGateway já desconectou o cliente
  }

  handleDisconnect(client: Socket) {
    this.leaveTenantRoom(client);
    this.logger.log(`❌ Cliente desconectado do TurnoGateway: ${client.id}`);
  }

  /**
   * Emite evento quando funcionário faz check-in (ISOLADO POR TENANT)
   */
  emitCheckIn(turno: any, tenantId?: string) {
    const targetTenantId = tenantId || turno.tenantId;
    
    if (targetTenantId) {
      this.emitToTenant(targetTenantId, 'funcionario_check_in', turno);
      this.logger.log(`🔒 Check-in emitido para tenant ${targetTenantId} | Funcionário: ${turno.funcionarioId}`);
    } else {
      this.logger.error(`🚫 Turno sem tenant_id — evento descartado (sem broadcast)`);
    }
  }

  /**
   * Emite evento quando funcionário faz check-out (ISOLADO POR TENANT)
   */
  emitCheckOut(turno: any, tenantId?: string) {
    const targetTenantId = tenantId || turno.tenantId;
    
    if (targetTenantId) {
      this.emitToTenant(targetTenantId, 'funcionario_check_out', turno);
      this.logger.log(`🔒 Check-out emitido para tenant ${targetTenantId} | Funcionário: ${turno.funcionarioId}`);
    } else {
      this.logger.error(`🚫 Turno sem tenant_id — evento descartado (sem broadcast)`);
    }
  }

  /**
   * Emite evento quando lista de funcionários ativos muda (ISOLADO POR TENANT)
   */
  emitFuncionariosAtualizados(tenantId?: string) {
    if (tenantId) {
      this.emitToTenant(tenantId, 'funcionarios_ativos_atualizado', {});
      this.logger.log(`🔒 Funcionários atualizados emitido para tenant ${tenantId}`);
    } else {
      this.logger.error(`🚫 Sem tenant_id — evento descartado (sem broadcast)`);
    }
  }
}
