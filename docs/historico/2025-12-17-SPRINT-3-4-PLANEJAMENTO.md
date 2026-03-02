# 🔐 Sprint 3-4: Segurança e Auditoria (Crítico)

**Data de Planejamento:** 17 de Dezembro de 2025  
**Sprint:** 3-4  
**Estimativa Total:** 52 horas  
**Prioridade:** 🔴 **CRÍTICO**

**Dependências:**
- ✅ Sprint 1-2: Paginação e Cache
- ✅ Sprint 2-1: Expansão de Cache
- ✅ Sprint 2-2: Invalidação Automática de Cache

---

## 📋 Visão Geral

Esta sprint implementa funcionalidades críticas de segurança e auditoria para o sistema, incluindo:
1. **Refresh Tokens** - Renovação segura de tokens JWT
2. **Auditoria** - Rastreamento completo de ações no sistema
3. **Rate Limiting** - Proteção contra abuso e ataques

---

## 🎯 Objetivos

### **Segurança**
- ✅ Implementar refresh tokens para sessões longas
- ✅ Proteger contra ataques de força bruta
- ✅ Limitar requisições por IP/usuário

### **Auditoria**
- ✅ Registrar todas as ações críticas
- ✅ Rastrear quem fez o quê e quando
- ✅ Facilitar investigação de incidentes

### **Compliance**
- ✅ Atender requisitos de LGPD
- ✅ Manter histórico de alterações
- ✅ Permitir auditoria externa

---

## 📦 Funcionalidade 1: Refresh Tokens (16h)

### **Problema Atual**

**Situação:**
- Access Token expira em 1 hora
- Usuário precisa fazer login novamente
- Experiência ruim (interrupção constante)
- Sessões não persistem entre dispositivos

**Riscos de Segurança:**
- Access Token longo = maior janela de ataque se roubado
- Access Token curto = UX ruim
- Sem mecanismo de revogação de sessões

### **Solução: Refresh Tokens**

**Arquitetura:**
```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE AUTENTICAÇÃO                    │
└─────────────────────────────────────────────────────────────┘

1. LOGIN
   POST /auth/login
   ├─ Validar credenciais
   ├─ Gerar Access Token (1h)
   ├─ Gerar Refresh Token (7 dias)
   ├─ Salvar Refresh Token no banco
   └─ Retornar ambos os tokens

2. REQUISIÇÃO AUTENTICADA
   GET /produtos
   ├─ Enviar Access Token no header
   ├─ Validar Access Token
   └─ Processar requisição

3. ACCESS TOKEN EXPIRADO
   POST /auth/refresh
   ├─ Enviar Refresh Token
   ├─ Validar Refresh Token
   ├─ Verificar se não foi revogado
   ├─ Gerar novo Access Token (1h)
   ├─ Opcionalmente rotacionar Refresh Token
   └─ Retornar novo Access Token

4. LOGOUT
   POST /auth/logout
   ├─ Revogar Refresh Token
   └─ Invalidar sessão
```

### **Implementação**

#### **1.1 Entidade RefreshToken (2h)**

**Arquivo:** `backend/src/modulos/auth/entities/refresh-token.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Funcionario } from '../../funcionario/entities/funcionario.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  token: string;

  @ManyToOne(() => Funcionario, { onDelete: 'CASCADE' })
  funcionario: Funcionario;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  revoked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  revokedByIp: string;

  @Column({ type: 'uuid', nullable: true })
  replacedByToken: string;

  @CreateDateColumn()
  createdAt: Date;

  get isExpired(): boolean {
    return new Date() >= this.expiresAt;
  }

  get isActive(): boolean {
    return !this.revoked && !this.isExpired;
  }
}
```

**Migration:**
```typescript
// backend/src/migrations/XXXXXX-CreateRefreshTokensTable.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateRefreshTokensTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'token',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'funcionarioId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'revoked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'revokedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'revokedByIp',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'replacedByToken',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'refresh_tokens',
      new TableForeignKey({
        columnNames: ['funcionarioId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'funcionarios',
        onDelete: 'CASCADE',
      }),
    );

    // Índices para performance
    await queryRunner.query(`
      CREATE INDEX idx_refresh_tokens_funcionario ON refresh_tokens(funcionarioId);
      CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
      CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expiresAt);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('refresh_tokens');
  }
}
```

#### **1.2 RefreshTokenService (4h)**

**Arquivo:** `backend/src/modulos/auth/refresh-token.service.ts`

```typescript
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from './entities/refresh-token.entity';
import { Funcionario } from '../funcionario/entities/funcionario.entity';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Gera um novo refresh token
   */
  async generateRefreshToken(
    funcionario: Funcionario,
    ipAddress: string,
    userAgent?: string,
  ): Promise<RefreshToken> {
    // Gerar token aleatório seguro
    const token = crypto.randomBytes(64).toString('hex');

    // Calcular data de expiração (7 dias)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Criar refresh token
    const refreshToken = this.refreshTokenRepository.create({
      token,
      funcionario,
      ipAddress,
      userAgent,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);

    this.logger.log(`Refresh token gerado para usuário ${funcionario.email}`);

    return refreshToken;
  }

  /**
   * Valida e retorna um refresh token
   */
  async validateRefreshToken(token: string): Promise<RefreshToken> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
      relations: ['funcionario'],
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (!refreshToken.isActive) {
      throw new UnauthorizedException('Refresh token expirado ou revogado');
    }

    return refreshToken;
  }

  /**
   * Renova o access token usando refresh token
   */
  async refreshAccessToken(
    token: string,
    ipAddress: string,
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    const refreshToken = await this.validateRefreshToken(token);

    // Gerar novo access token
    const payload = {
      sub: refreshToken.funcionario.id,
      email: refreshToken.funcionario.email,
      cargo: refreshToken.funcionario.cargo,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    // Opção 1: Rotação de refresh token (mais seguro)
    // Revogar token antigo e gerar novo
    const rotateRefreshToken = this.configService.get('ROTATE_REFRESH_TOKEN', true);

    if (rotateRefreshToken) {
      await this.revokeToken(refreshToken, ipAddress, 'Rotacionado');

      const newRefreshToken = await this.generateRefreshToken(
        refreshToken.funcionario,
        ipAddress,
        refreshToken.userAgent,
      );

      // Marcar token antigo como substituído
      refreshToken.replacedByToken = newRefreshToken.id;
      await this.refreshTokenRepository.save(refreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken.token,
      };
    }

    // Opção 2: Reutilizar refresh token (menos seguro, mas mais simples)
    return { accessToken };
  }

  /**
   * Revoga um refresh token
   */
  async revokeToken(
    refreshToken: RefreshToken,
    ipAddress: string,
    reason?: string,
  ): Promise<void> {
    refreshToken.revoked = true;
    refreshToken.revokedAt = new Date();
    refreshToken.revokedByIp = ipAddress;

    await this.refreshTokenRepository.save(refreshToken);

    this.logger.log(
      `Refresh token revogado para usuário ${refreshToken.funcionario.email}. Motivo: ${reason || 'Não especificado'}`,
    );
  }

  /**
   * Revoga todos os refresh tokens de um usuário
   */
  async revokeAllUserTokens(funcionarioId: string, ipAddress: string): Promise<void> {
    const tokens = await this.refreshTokenRepository.find({
      where: {
        funcionario: { id: funcionarioId },
        revoked: false,
      },
    });

    for (const token of tokens) {
      await this.revokeToken(token, ipAddress, 'Logout de todas as sessões');
    }

    this.logger.log(`Todos os refresh tokens revogados para usuário ${funcionarioId}`);
  }

  /**
   * Remove refresh tokens expirados (executar periodicamente)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    const count = result.affected || 0;
    this.logger.log(`${count} refresh tokens expirados removidos`);

    return count;
  }

  /**
   * Lista sessões ativas de um usuário
   */
  async getUserActiveSessions(funcionarioId: string): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: {
        funcionario: { id: funcionarioId },
        revoked: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
```

#### **1.3 Atualizar AuthService (3h)**

**Arquivo:** `backend/src/modulos/auth/auth.service.ts`

```typescript
// Adicionar ao AuthService existente

async login(loginDto: LoginDto, ipAddress: string, userAgent?: string) {
  // ... validação de credenciais existente ...

  // Gerar access token (1 hora)
  const accessToken = this.jwtService.sign(payload, {
    expiresIn: '1h',
  });

  // Gerar refresh token (7 dias)
  const refreshToken = await this.refreshTokenService.generateRefreshToken(
    funcionario,
    ipAddress,
    userAgent,
  );

  return {
    accessToken,
    refreshToken: refreshToken.token,
    expiresIn: 3600, // 1 hora em segundos
    funcionario: {
      id: funcionario.id,
      nome: funcionario.nome,
      email: funcionario.email,
      cargo: funcionario.cargo,
    },
  };
}

async logout(refreshToken: string, ipAddress: string): Promise<void> {
  const token = await this.refreshTokenService.validateRefreshToken(refreshToken);
  await this.refreshTokenService.revokeToken(token, ipAddress, 'Logout');
}

async logoutAll(funcionarioId: string, ipAddress: string): Promise<void> {
  await this.refreshTokenService.revokeAllUserTokens(funcionarioId, ipAddress);
}
```

#### **1.4 Endpoints de Refresh Token (2h)**

**Arquivo:** `backend/src/modulos/auth/auth.controller.ts`

```typescript
@Controller('auth')
export class AuthController {
  // ... endpoints existentes ...

  @Post('refresh')
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string' },
      },
    },
  })
  async refresh(
    @Body('refreshToken') refreshToken: string,
    @Ip() ipAddress: string,
  ) {
    return this.refreshTokenService.refreshAccessToken(refreshToken, ipAddress);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer logout e revogar refresh token' })
  async logout(
    @Body('refreshToken') refreshToken: string,
    @Ip() ipAddress: string,
  ) {
    await this.authService.logout(refreshToken, ipAddress);
    return { message: 'Logout realizado com sucesso' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer logout de todas as sessões' }}
  async logoutAll(
    @CurrentUser() user: any,
    @Ip() ipAddress: string,
  ) {
    await this.authService.logoutAll(user.sub, ipAddress);
    return { message: 'Logout de todas as sessões realizado com sucesso' };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar sessões ativas do usuário' }}
  async getSessions(@CurrentUser() user: any) {
    const sessions = await this.refreshTokenService.getUserActiveSessions(user.sub);
    
    return sessions.map(session => ({
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }));
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revogar uma sessão específica' }}
  async revokeSession(
    @Param('id') sessionId: string,
    @CurrentUser() user: any,
    @Ip() ipAddress: string,
  ) {
    const session = await this.refreshTokenService.validateRefreshToken(sessionId);
    
    // Verificar se a sessão pertence ao usuário
    if (session.funcionario.id !== user.sub) {
      throw new UnauthorizedException('Sessão não pertence ao usuário');
    }
    
    await this.refreshTokenService.revokeToken(session, ipAddress, 'Revogado pelo usuário');
    return { message: 'Sessão revogada com sucesso' };
  }
}
```

#### **1.5 Cleanup Job (2h)**

**Arquivo:** `backend/src/modulos/auth/refresh-token-cleanup.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class RefreshTokenCleanupService {
  private readonly logger = new Logger(RefreshTokenCleanupService.name);

  constructor(private readonly refreshTokenService: RefreshTokenService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanup() {
    this.logger.log('Iniciando limpeza de refresh tokens expirados...');
    
    const count = await this.refreshTokenService.cleanupExpiredTokens();
    
    this.logger.log(`Limpeza concluída. ${count} tokens removidos.`);
  }
}
```

#### **1.6 Testes (3h)**

**Arquivo:** `backend/src/modulos/auth/refresh-token.service.spec.ts`

```typescript
describe('RefreshTokenService', () => {
  // Testes unitários
  it('deve gerar refresh token válido', async () => {});
  it('deve validar refresh token', async () => {});
  it('deve rejeitar refresh token expirado', async () => {});
  it('deve rejeitar refresh token revogado', async () => {});
  it('deve renovar access token', async () => {});
  it('deve rotacionar refresh token', async () => {});
  it('deve revogar refresh token', async () => {});
  it('deve revogar todos os tokens do usuário', async () => {});
  it('deve limpar tokens expirados', async () => {});
});
```

### **Checklist de Implementação**

- [ ] Criar entidade RefreshToken
- [ ] Criar migration para tabela refresh_tokens
- [ ] Implementar RefreshTokenService
- [ ] Atualizar AuthService com refresh tokens
- [ ] Criar endpoints de refresh, logout, sessions
- [ ] Implementar cleanup job
- [ ] Escrever testes unitários
- [ ] Escrever testes de integração
- [ ] Atualizar frontend para usar refresh tokens
- [ ] Documentar API no Swagger
- [ ] Testar fluxo completo
- [ ] Deploy em produção

---

## 📦 Funcionalidade 2: Auditoria (24h)

### **Problema Atual**

**Situação:**
- Não há registro de quem fez alterações
- Impossível rastrear ações suspeitas
- Dificulta investigação de incidentes
- Não atende requisitos de LGPD

**Necessidades:**
- Registrar QUEM fez a ação
- Registrar O QUE foi feito
- Registrar QUANDO foi feito
- Registrar DE ONDE (IP, user agent)
- Registrar dados ANTES e DEPOIS

### **Solução: Sistema de Auditoria**

**Arquitetura:**
```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA DE AUDITORIA                     │
└─────────────────────────────────────────────────────────────┘

1. INTERCEPTOR GLOBAL
   ├─ Captura todas as requisições
   ├─ Identifica operações críticas (CREATE, UPDATE, DELETE)
   ├─ Extrai dados relevantes
   └─ Registra no banco de dados

2. DECORATOR @Auditable()
   ├─ Marca métodos que devem ser auditados
   ├─ Define tipo de ação
   └─ Especifica entidade afetada

3. REGISTRO DE AUDITORIA
   ├─ ID da ação
   ├─ Usuário que executou
   ├─ Tipo de ação (CREATE, UPDATE, DELETE, LOGIN, etc)
   ├─ Entidade afetada
   ├─ ID do registro afetado
   ├─ Dados antes (JSON)
   ├─ Dados depois (JSON)
   ├─ IP do cliente
   ├─ User Agent
   └─ Timestamp

4. CONSULTA DE AUDITORIA
   ├─ Filtrar por usuário
   ├─ Filtrar por entidade
   ├─ Filtrar por período
   ├─ Filtrar por tipo de ação
   └─ Exportar relatórios
```

### **Implementação**

#### **2.1 Entidade AuditLog (3h)**

**Arquivo:** `backend/src/modulos/audit/entities/audit-log.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Funcionario } from '../../funcionario/entities/funcionario.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

@Entity('audit_logs')
@Index(['funcionario', 'createdAt'])
@Index(['entityName', 'entityId'])
@Index(['action', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Funcionario, { nullable: true })
  funcionario: Funcionario;

  @Column({ type: 'varchar', length: 255, nullable: true })
  funcionarioEmail: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({ type: 'varchar', length: 100 })
  entityName: string;

  @Column({ type: 'uuid', nullable: true })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  oldData: any;

  @Column({ type: 'jsonb', nullable: true })
  newData: any;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  endpoint: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  method: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

**Migration:**
```typescript
// backend/src/migrations/XXXXXX-CreateAuditLogsTable.ts
export class CreateAuditLogsTable1234567891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'funcionarioId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'funcionarioEmail',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'entityName',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'entityId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'oldData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'newData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'endpoint',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'method',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Índices para performance
    await queryRunner.query(`
      CREATE INDEX idx_audit_logs_funcionario_created ON audit_logs(funcionarioId, createdAt);
      CREATE INDEX idx_audit_logs_entity ON audit_logs(entityName, entityId);
      CREATE INDEX idx_audit_logs_action_created ON audit_logs(action, createdAt);
      CREATE INDEX idx_audit_logs_created_at ON audit_logs(createdAt DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs');
  }
}
```

#### **2.2 AuditService (4h)**

**Arquivo:** `backend/src/modulos/audit/audit.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { Funcionario } from '../funcionario/entities/funcionario.entity';

export interface CreateAuditLogDto {
  funcionario?: Funcionario;
  funcionarioEmail?: string;
  action: AuditAction;
  entityName: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  description?: string;
}

export interface AuditLogFilters {
  funcionarioId?: string;
  entityName?: string;
  entityId?: string;
  action?: AuditAction | AuditAction[];
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Cria um registro de auditoria
   */
  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      ...dto,
      funcionarioEmail: dto.funcionario?.email || dto.funcionarioEmail,
    });

    const saved = await this.auditLogRepository.save(auditLog);

    this.logger.debug(
      `Auditoria registrada: ${dto.action} em ${dto.entityName} por ${dto.funcionarioEmail || 'Sistema'}`,
    );

    return saved;
  }

  /**
   * Busca registros de auditoria com filtros
   */
  async findAll(filters: AuditLogFilters) {
    const {
      funcionarioId,
      entityName,
      entityId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const query = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.funcionario', 'funcionario');

    if (funcionarioId) {
      query.andWhere('audit.funcionarioId = :funcionarioId', { funcionarioId });
    }

    if (entityName) {
      query.andWhere('audit.entityName = :entityName', { entityName });
    }

    if (entityId) {
      query.andWhere('audit.entityId = :entityId', { entityId });
    }

    if (action) {
      if (Array.isArray(action)) {
        query.andWhere('audit.action IN (:...actions)', { actions: action });
      } else {
        query.andWhere('audit.action = :action', { action });
      }
    }

    if (startDate && endDate) {
      query.andWhere('audit.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      query.andWhere('audit.createdAt >= :startDate', { startDate });
    } else if (endDate) {
      query.andWhere('audit.createdAt <= :endDate', { endDate });
    }

    query
      .orderBy('audit.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca histórico de alterações de uma entidade
   */
  async getEntityHistory(entityName: string, entityId: string) {
    return this.auditLogRepository.find({
      where: {
        entityName,
        entityId,
      },
      relations: ['funcionario'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Busca atividades recentes de um usuário
   */
  async getUserActivity(funcionarioId: string, limit: number = 50) {
    return this.auditLogRepository.find({
      where: {
        funcionario: { id: funcionarioId },
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * Gera relatório de auditoria
   */
  async generateReport(filters: AuditLogFilters) {
    const { data } = await this.findAll({ ...filters, limit: 10000 });

    // Formatar dados para exportação
    return data.map(log => ({
      Data: log.createdAt,
      Usuário: log.funcionarioEmail || 'Sistema',
      Ação: log.action,
      Entidade: log.entityName,
      'ID Entidade': log.entityId,
      IP: log.ipAddress,
      Endpoint: log.endpoint,
      Método: log.method,
      Descrição: log.description,
    }));
  }

  /**
   * Remove registros antigos de auditoria (GDPR compliance)
   */
  async cleanupOldLogs(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    const count = result.affected || 0;
    this.logger.log(`${count} registros de auditoria antigos removidos`);

    return count;
  }
}
```

#### **2.3 Decorator @Auditable() (3h)**

**Arquivo:** `backend/src/common/decorators/auditable.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '../../modulos/audit/entities/audit-log.entity';

export const AUDIT_METADATA_KEY = 'audit';

export interface AuditMetadata {
  action: AuditAction;
  entityName: string;
  description?: string;
}

export const Auditable = (metadata: AuditMetadata) =>
  SetMetadata(AUDIT_METADATA_KEY, metadata);
```

#### **2.4 AuditInterceptor (5h)**

**Arquivo:** `backend/src/common/interceptors/audit.interceptor.ts`

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modulos/audit/audit.service';
import { AUDIT_METADATA_KEY, AuditMetadata } from '../decorators/auditable.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<AuditMetadata>(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    );

    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { user, ip, headers, method, url, body } = request;

    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.auditService.log({
            funcionario: user,
            funcionarioEmail: user?.email,
            action: auditMetadata.action,
            entityName: auditMetadata.entityName,
            entityId: response?.id || body?.id,
            newData: response,
            ipAddress: ip,
            userAgent: headers['user-agent'],
            endpoint: url,
            method,
            description: auditMetadata.description,
          });
        } catch (error) {
          // Não falhar a requisição se auditoria falhar
          console.error('Erro ao registrar auditoria:', error);
        }
      }),
    );
  }
}
```

#### **2.5 Endpoints de Auditoria (3h)**

**Arquivo:** `backend/src/modulos/audit/audit.controller.ts`

```typescript
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';
import { AuditService } from './audit.service';
import { AuditAction } from './entities/audit-log.entity';

@ApiTags('Auditoria')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Cargo.ADMIN, Cargo.GERENTE)
  @ApiOperation({ summary: 'Listar registros de auditoria' }}
  @ApiQuery({ name: 'funcionarioId', required: false })
  @ApiQuery({ name: 'entityName', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('funcionarioId') funcionarioId?: string,
    @Query('entityName') entityName?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: AuditAction,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findAll({
      funcionarioId,
      entityName,
      entityId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  @Get('entity/:entityName/:entityId')
  @Roles(Cargo.ADMIN, Cargo.GERENTE)
  @ApiOperation({ summary: 'Histórico de alterações de uma entidade' }}
  async getEntityHistory(
    @Param('entityName') entityName: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.getEntityHistory(entityName, entityId);
  }

  @Get('user/:funcionarioId')
  @Roles(Cargo.ADMIN, Cargo.GERENTE)
  @ApiOperation({ summary: 'Atividades recentes de um usuário' }}
  async getUserActivity(
    @Param('funcionarioId') funcionarioId: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getUserActivity(funcionarioId, limit);
  }

  @Get('report')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Gerar relatório de auditoria' }}
  async generateReport(@Query() filters: any) {
    return this.auditService.generateReport(filters);
  }
}
```

#### **2.6 Uso do Decorator (2h)**

**Exemplo:** Adicionar auditoria em ProdutoService

```typescript
@Auditable({
  action: AuditAction.CREATE,
  entityName: 'Produto',
  description: 'Produto criado',
})
async create(createProdutoDto: CreateProdutoDto): Promise<Produto> {
  // ... código existente ...
}

@Auditable({
  action: AuditAction.UPDATE,
  entityName: 'Produto',
  description: 'Produto atualizado',
})
async update(id: string, updateProdutoDto: UpdateProdutoDto): Promise<Produto> {
  // ... código existente ...
}

@Auditable({
  action: AuditAction.DELETE,
  entityName: 'Produto',
  description: 'Produto removido',
})
async remove(id: string): Promise<Produto> {
  // ... código existente ...
}
```

#### **2.7 Testes (4h)**

**Arquivo:** `backend/src/modulos/audit/audit.service.spec.ts`

```typescript
describe('AuditService', () => {
  it('deve criar registro de auditoria', async () => {});
  it('deve buscar registros com filtros', async () => {});
  it('deve buscar histórico de entidade', async () => {});
  it('deve buscar atividades do usuário', async () => {});
  it('deve gerar relatório', async () => {});
  it('deve limpar registros antigos', async () => {});
});
```

### **Checklist de Implementação**

- [ ] Criar entidade AuditLog
- [ ] Criar migration para tabela audit_logs
- [ ] Implementar AuditService
- [ ] Criar decorator @Auditable()
- [ ] Implementar AuditInterceptor
- [ ] Criar endpoints de consulta
- [ ] Adicionar auditoria em serviços críticos
- [ ] Implementar cleanup job
- [ ] Escrever testes
- [ ] Criar dashboard de auditoria no frontend
- [ ] Documentar API
- [ ] Testar fluxo completo
- [ ] Deploy em produção

---

## 📦 Funcionalidade 3: Rate Limiting (12h)

### **Problema Atual**

**Situação:**
- Sem proteção contra força bruta
- Vulnerável a ataques DDoS
- Sem limite de requisições por usuário/IP
- Possível abuso de recursos

**Riscos:**
- Ataques de força bruta em login
- Sobrecarga do servidor
- Custos elevados de infraestrutura
- Degradação de performance

### **Solução: Rate Limiting**

**Arquitetura:**
```
┌─────────────────────────────────────────────────────────────┐
│                      RATE LIMITING                          │
└─────────────────────────────────────────────────────────────┘

1. GLOBAL RATE LIMIT
   ├─ 100 requisições por minuto por IP
   ├─ Aplicado a todas as rotas
   └─ Proteção básica contra DDoS

2. ENDPOINT-SPECIFIC LIMITS
   ├─ Login: 5 tentativas por 15 minutos
   ├─ Registro: 3 tentativas por hora
   ├─ Reset senha: 3 tentativas por hora
   └─ APIs públicas: 20 requisições por minuto

3. USER-BASED LIMITS
   ├─ Usuários autenticados: 200 req/min
   ├─ Usuários não autenticados: 50 req/min
   └─ Admin: sem limite

4. STORAGE
   ├─ Redis (rápido, distribuído)
   └─ Chaves com TTL automático
```

### **Implementação**

#### **3.1 Instalar Dependências (1h)**

```bash
npm install @nestjs/throttler
```

**Configuração:**
```typescript
// backend/src/app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000, // 1 segundo
            limit: 10, // 10 requisições
          },
          {
            name: 'medium',
            ttl: 10000, // 10 segundos
            limit: 50, // 50 requisições
          },
          {
            name: 'long',
            ttl: 60000, // 1 minuto
            limit: 100, // 100 requisições
          },
        ],
        storage: new ThrottlerStorageRedisService({
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
        }),
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

#### **3.2 Custom Rate Limit Guard (3h)**

**Arquivo:** `backend/src/common/guards/custom-throttler.guard.ts`

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    protected readonly options: any,
    protected readonly storageService: any,
    protected readonly reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Admin não tem limite
    if (user?.cargo === 'ADMIN') {
      return true;
    }

    // Usuários autenticados têm limite maior
    if (user) {
      limit = limit * 2;
    }

    // Usar IP + user ID como chave
    const key = this.generateKey(context, request.ip, user?.sub);

    const { totalHits } = await this.storageService.increment(key, ttl);

    if (totalHits > limit) {
      throw new ThrottlerException(
        `Muitas requisições. Tente novamente em ${Math.ceil(ttl / 1000)} segundos.`,
      );
    }

    return true;
  }

  protected generateKey(
    context: ExecutionContext,
    ip: string,
    userId?: string,
  ): string {
    const request = context.switchToHttp().getRequest();
    const route = request.route.path;
    
    return userId
      ? `throttle:user:${userId}:${route}`
      : `throttle:ip:${ip}:${route}`;
  }
}
```

#### **3.3 Decorators Customizados (2h)**

**Arquivo:** `backend/src/common/decorators/throttle.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const THROTTLE_LIMIT = 'throttle_limit';
export const THROTTLE_TTL = 'throttle_ttl';

export const Throttle = (limit: number, ttl: number) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(THROTTLE_LIMIT, limit)(target, propertyKey, descriptor);
    SetMetadata(THROTTLE_TTL, ttl)(target, propertyKey, descriptor);
  };
};

// Atalhos para casos comuns
export const ThrottleLogin = () => Throttle(5, 900000); // 5 tentativas em 15 min
export const ThrottlePublic = () => Throttle(20, 60000); // 20 req/min
export const ThrottleStrict = () => Throttle(3, 3600000); // 3 req/hora
```

#### **3.4 Aplicar Rate Limiting (3h)**

**Exemplo:** AuthController

```typescript
@Controller('auth')
export class AuthController {
  @Post('login')
  @ThrottleLogin()
  @ApiOperation({ summary: 'Fazer login' }}
  async login(@Body() loginDto: LoginDto, @Ip() ip: string, @Headers('user-agent') userAgent: string) {
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Post('register')
  @ThrottleStrict()
  @ApiOperation({ summary: 'Registrar novo usuário' }}
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('forgot-password')
  @ThrottleStrict()
  @ApiOperation({ summary: 'Solicitar reset de senha' }}
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }
}
```

**Exemplo:** ProdutosController (público)

```typescript
@Controller('produtos')
export class ProdutosController {
  @Get()
  @ThrottlePublic()
  @ApiOperation({ summary: 'Listar produtos' }}
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.produtoService.findAll(paginationDto);
  }
}
```

#### **3.5 Monitoramento (2h)**

**Arquivo:** `backend/src/modulos/monitoring/rate-limit-monitor.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class RateLimitMonitorService {
  private readonly logger = new Logger(RateLimitMonitorService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  @Cron(CronExpression.EVERY_HOUR)
  async monitorRateLimits() {
    const keys = await this.redis.keys('throttle:*');
    
    const stats = {
      totalKeys: keys.length,
      ipBlocks: 0,
      userBlocks: 0,
    };

    for (const key of keys) {
      if (key.includes(':ip:')) {
        stats.ipBlocks++;
      } else if (key.includes(':user:')) {
        stats.userBlocks++;
      }
    }

    this.logger.log(`Rate Limit Stats: ${JSON.stringify(stats)}`);
  }
}
```

#### **3.6 Testes (1h)**

```typescript
describe('Rate Limiting', () => {
  it('deve bloquear após exceder limite', async () => {});
  it('deve permitir após TTL expirar', async () => {});
  it('deve ter limite maior para usuários autenticados', async () => {});
  it('deve não limitar admins', async () => {});
  it('deve usar chave correta (IP + user)', async () => {});
});
```

### **Checklist de Implementação**

- [ ] Instalar @nestjs/throttler
- [ ] Configurar ThrottlerModule com Redis
- [ ] Criar CustomThrottlerGuard
- [ ] Criar decorators customizados
- [ ] Aplicar rate limiting em endpoints críticos
- [ ] Implementar monitoramento
- [ ] Escrever testes
- [ ] Documentar limites na API
- [ ] Testar em produção
- [ ] Ajustar limites conforme necessário

---

## 📊 Resumo da Sprint 3-4

| Funcionalidade | Estimativa | Prioridade | Complexidade |
|----------------|------------|------------|--------------|
| **Refresh Tokens** | 16h | 🔴 Crítico | Média |
| **Auditoria** | 24h | 🔴 Crítico | Alta |
| **Rate Limiting** | 12h | 🔴 Crítico | Baixa |
| **TOTAL** | **52h** | 🔴 Crítico | - |

---

## 🎯 Ordem de Implementação Recomendada

### **Semana 1 (16h)**
1. **Refresh Tokens** - Implementação completa
   - Dias 1-2: Entidade, Service, Migration
   - Dia 3: Endpoints e integração
   - Dia 4: Testes e documentação

### **Semana 2 (24h)**
2. **Auditoria** - Implementação completa
   - Dias 1-2: Entidade, Service, Migration
   - Dia 3: Decorator e Interceptor
   - Dia 4: Endpoints e integração
   - Dia 5: Testes e documentação

### **Semana 3 (12h)**
3. **Rate Limiting** - Implementação completa
   - Dia 1: Configuração e Guards
   - Dia 2: Aplicação em endpoints
   - Dia 3: Testes e ajustes

---

## ✅ Critérios de Sucesso

### **Refresh Tokens**
- [ ] Usuários podem renovar tokens sem fazer login
- [ ] Sessões podem ser gerenciadas (listar, revogar)
- [ ] Tokens expirados são limpos automaticamente
- [ ] Rotação de tokens funciona corretamente

### **Auditoria**
- [ ] Todas as ações críticas são registradas
- [ ] Histórico de alterações disponível
- [ ] Relatórios podem ser gerados
- [ ] Dados antigos são limpos (GDPR)

### **Rate Limiting**
- [ ] Endpoints críticos estão protegidos
- [ ] Limites são respeitados
- [ ] Usuários autenticados têm limites maiores
- [ ] Admins não são limitados

---

## 📚 Documentação Relacionada

- [Sprint 1-2: Paginação e Cache](./2025-12-17-SPRINT-1-2-IMPLEMENTACAO.md)
- [Sprint 2-1: Expansão de Cache](./2025-12-17-SPRINT-2-1-IMPLEMENTACAO.md)
- [Sprint 2-2: Invalidação de Cache](./2025-12-17-SPRINT-2-2-IMPLEMENTACAO.md)

---

**Planejamento criado em:** 17 de Dezembro de 2025  
**Estimativa total:** 52 horas  
**Prioridade:** 🔴 CRÍTICO  
**Status:** 📋 PLANEJADO
