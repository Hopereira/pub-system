import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { BaseTenantGateway } from './base-tenant.gateway';

// Implementação concreta para testes
class TestTenantGateway extends BaseTenantGateway {
  protected readonly logger = new Logger('TestTenantGateway');
  server: Server;

  constructor(jwtService: JwtService) {
    super();
    this.jwtService = jwtService;
  }

  // Expõe métodos protegidos para teste
  public testExtractTenantId(client: Socket) {
    return this.extractTenantId(client);
  }

  public testJoinTenantRoom(client: Socket) {
    return this.joinTenantRoom(client);
  }

  public testEmitToTenant(tenantId: string, event: string, data: any) {
    return this.emitToTenant(tenantId, event, data);
  }
}

describe('BaseTenantGateway', () => {
  let gateway: TestTenantGateway;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockServer: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<Socket>;

  const TENANT_A_ID = '550e8400-e29b-41d4-a716-446655440001';
  const TENANT_B_ID = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(async () => {
    mockJwtService = {
      decode: jest.fn(),
    } as any;

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      in: jest.fn().mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([]),
      }),
    } as any;

    mockSocket = {
      id: 'socket-123',
      handshake: {
        auth: {},
        headers: {},
        query: {},
      },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      data: {},
    } as any;

    gateway = new TestTenantGateway(mockJwtService);
    gateway.server = mockServer;
  });

  describe('extractTenantId', () => {
    it('deve extrair tenant_id do JWT no auth', () => {
      mockSocket.handshake.auth = { token: 'jwt-token' };
      mockJwtService.decode.mockReturnValue({ tenantId: TENANT_A_ID });

      const result = gateway.testExtractTenantId(mockSocket);

      expect(result).toBe(TENANT_A_ID);
      expect(mockJwtService.decode).toHaveBeenCalledWith('jwt-token');
    });

    it('deve extrair tenant_id do header Authorization', () => {
      mockSocket.handshake.headers = { authorization: 'Bearer jwt-token' };
      mockJwtService.decode.mockReturnValue({ tenantId: TENANT_B_ID });

      const result = gateway.testExtractTenantId(mockSocket);

      expect(result).toBe(TENANT_B_ID);
    });

    it('deve extrair tenant_id do query param como fallback', () => {
      mockSocket.handshake.query = { tenantId: TENANT_A_ID };

      const result = gateway.testExtractTenantId(mockSocket);

      expect(result).toBe(TENANT_A_ID);
    });

    it('deve extrair tenant_id do header x-tenant-id como fallback', () => {
      mockSocket.handshake.headers = { 'x-tenant-id': TENANT_B_ID };

      const result = gateway.testExtractTenantId(mockSocket);

      expect(result).toBe(TENANT_B_ID);
    });

    it('deve retornar null se não encontrar tenant_id', () => {
      const result = gateway.testExtractTenantId(mockSocket);

      expect(result).toBeNull();
    });
  });

  describe('joinTenantRoom', () => {
    it('deve adicionar cliente ao room do tenant', () => {
      mockSocket.handshake.auth = { token: 'jwt-token' };
      mockJwtService.decode.mockReturnValue({ tenantId: TENANT_A_ID });

      const result = gateway.testJoinTenantRoom(mockSocket);

      expect(result).toBe(TENANT_A_ID);
      expect(mockSocket.join).toHaveBeenCalledWith(`tenant_${TENANT_A_ID}`);
      expect(mockSocket.data.tenantId).toBe(TENANT_A_ID);
    });

    it('deve retornar null se cliente não tiver tenant_id', () => {
      const result = gateway.testJoinTenantRoom(mockSocket);

      expect(result).toBeNull();
      expect(mockSocket.join).not.toHaveBeenCalled();
    });
  });

  describe('emitToTenant', () => {
    it('deve emitir evento apenas para o room do tenant', () => {
      const eventData = { pedidoId: '123', status: 'PRONTO' };

      gateway.testEmitToTenant(TENANT_A_ID, 'novo_pedido', eventData);

      expect(mockServer.to).toHaveBeenCalledWith(`tenant_${TENANT_A_ID}`);
      expect(mockServer.emit).toHaveBeenCalledWith('novo_pedido', eventData);
    });

    it('deve emitir para tenant diferente sem afetar outro', () => {
      const eventDataA = { pedidoId: '123' };
      const eventDataB = { pedidoId: '456' };

      gateway.testEmitToTenant(TENANT_A_ID, 'novo_pedido', eventDataA);
      gateway.testEmitToTenant(TENANT_B_ID, 'novo_pedido', eventDataB);

      expect(mockServer.to).toHaveBeenCalledWith(`tenant_${TENANT_A_ID}`);
      expect(mockServer.to).toHaveBeenCalledWith(`tenant_${TENANT_B_ID}`);
    });
  });

  describe('Isolamento entre Tenants', () => {
    it('cliente do Tenant A não deve receber eventos do Tenant B', () => {
      // Simula cliente do Tenant A conectado
      mockSocket.handshake.auth = { token: 'jwt-token-a' };
      mockJwtService.decode.mockReturnValue({ tenantId: TENANT_A_ID });
      gateway.testJoinTenantRoom(mockSocket);

      // Emite evento para Tenant B
      gateway.testEmitToTenant(TENANT_B_ID, 'novo_pedido', { id: '999' });

      // Verifica que o evento foi para o room do Tenant B (não A)
      expect(mockServer.to).toHaveBeenCalledWith(`tenant_${TENANT_B_ID}`);
      expect(mockServer.to).not.toHaveBeenCalledWith(`tenant_${TENANT_A_ID}`);
    });
  });
});
