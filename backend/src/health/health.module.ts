import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { InternalStatusController } from './internal-status.controller';
import { AlertService } from '../common/monitoring/alert.service';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController, InternalStatusController],
  providers: [AlertService],
  exports: [AlertService],
})
export class HealthModule {}
