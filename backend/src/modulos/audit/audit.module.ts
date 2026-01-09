import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditLog } from './entities/audit-log.entity';
import { AuditCleanupService } from './audit-cleanup.service';
import { AuditRepository } from './audit.repository';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditService, AuditCleanupService, AuditRepository],
  controllers: [AuditController],
  exports: [AuditService, AuditRepository],
})
export class AuditModule {}
