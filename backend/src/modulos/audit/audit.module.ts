import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditLog } from './entities/audit-log.entity';
import { AuditCleanupService } from './audit-cleanup.service';
import { AuditLogRepository } from './audit.repository';
import { AuditProcessor } from '../../queues/processors/audit.processor';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditService, AuditCleanupService, AuditLogRepository, AuditProcessor],
  controllers: [AuditController],
  exports: [AuditService, AuditLogRepository],
})
export class AuditModule {}
