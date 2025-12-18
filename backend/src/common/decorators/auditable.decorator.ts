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
