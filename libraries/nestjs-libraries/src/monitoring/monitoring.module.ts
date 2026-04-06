import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';
import { HealthCheckService } from './health-check.service';

@Module({
  providers: [AlertService, HealthCheckService],
  exports: [AlertService, HealthCheckService],
})
export class MonitoringModule {}
