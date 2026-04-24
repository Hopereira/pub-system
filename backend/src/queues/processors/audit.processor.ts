import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../modulos/audit/entities/audit-log.entity';
import { AUDIT_QUEUE } from '../queues.module';

export interface AuditJobData {
  funcionarioEmail?: string;
  action: string;
  entityName: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  description?: string;
  tenantId?: string;
}

@Processor(AUDIT_QUEUE)
export class AuditProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {
    super();
  }

  async process(job: Job<AuditJobData>): Promise<AuditLog | null> {
    try {
      const data = job.data;

      const auditLog = this.auditLogRepository.create({
        funcionarioEmail: data.funcionarioEmail,
        action: data.action,
        entityName: data.entityName,
        entityId: data.entityId,
        oldData: data.oldData,
        newData: data.newData,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        endpoint: data.endpoint,
        method: data.method,
        description: data.description,
        tenantId: data.tenantId,
      } as any);

      const saved = await this.auditLogRepository.save(auditLog) as unknown as AuditLog;

      this.logger.debug(
        `📝 [Queue] Auditoria: ${data.action} em ${data.entityName} por ${data.funcionarioEmail || 'Sistema'}`,
      );

      return saved;
    } catch (error) {
      this.logger.error(`❌ [Queue] Erro ao processar auditoria: ${error.message}`);
      throw error; // BullMQ fará retry automático
    }
  }
}
