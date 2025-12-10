import { Module } from '@nestjs/common';
import { BackupCheckJob } from './backup-check.job';

@Module({
  providers: [BackupCheckJob],
  exports: [BackupCheckJob],
})
export class JobsModule {}
