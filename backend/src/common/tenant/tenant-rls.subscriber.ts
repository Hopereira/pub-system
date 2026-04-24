import { Injectable, Logger } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';

/**
 * TenantRlsSubscriber — Seta app.current_tenant_id na sessão PostgreSQL
 *
 * Este subscriber é a ponte entre o contexto de tenant da aplicação (NestJS)
 * e o Row Level Security do PostgreSQL. Ele seta a variável de sessão
 * `app.current_tenant_id` antes de cada operação de escrita.
 *
 * IMPORTANTE:
 * - Para queries de leitura (SELECT), o tenant_id é setado pelo
 *   TenantRlsConnectionMiddleware no início da requisição.
 * - Este subscriber cobre operações de INSERT/UPDATE/DELETE.
 * - Se o tenant_id não estiver disponível, a variável não é setada
 *   (RLS permite acesso total quando vazia — modo compatível).
 *
 * ROLLBACK:
 * - Remover este subscriber = RLS não filtra nada (policies permitem tudo)
 */
@EventSubscriber()
@Injectable()
export class TenantRlsSubscriber implements EntitySubscriberInterface {
  private readonly logger = new Logger(TenantRlsSubscriber.name);

  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  /**
   * Seta app.current_tenant_id na conexão antes de INSERT
   */
  async beforeInsert(event: InsertEvent<any>): Promise<void> {
    await this.setTenantContext(event);
  }

  /**
   * Seta app.current_tenant_id na conexão antes de UPDATE
   */
  async beforeUpdate(event: UpdateEvent<any>): Promise<void> {
    await this.setTenantContext(event);
  }

  /**
   * Seta app.current_tenant_id na conexão antes de DELETE
   */
  async beforeRemove(event: RemoveEvent<any>): Promise<void> {
    await this.setTenantContext(event);
  }

  /**
   * Extrai tenant_id da entidade e seta na sessão PostgreSQL.
   * Usa SET LOCAL para que a variável seja válida apenas na transação atual.
   */
  private async setTenantContext(
    event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>,
  ): Promise<void> {
    const entity = event.entity;
    if (!entity?.tenantId) return;

    try {
      await event.queryRunner.query(
        `SET LOCAL app.current_tenant_id = $1`,
        [entity.tenantId],
      );
    } catch (error) {
      // Nunca bloquear operação por falha no RLS context
      this.logger.debug(
        `RLS context set failed (non-blocking): ${error.message}`,
      );
    }
  }
}
