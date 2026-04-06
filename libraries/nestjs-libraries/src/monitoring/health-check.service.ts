import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PlatformHealth } from './monitoring.types';
import { AlertService } from './alert.service';

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);
  private healthStatus: Map<string, PlatformHealth> = new Map();
  private readonly ALERT_THRESHOLD = 3;

  constructor(private readonly alertService: AlertService) {}

  @Cron('0 */6 * * *')
  async checkPlaywrightSessions(): Promise<void> {
    const playwrightPlatforms = ['ok', 'yappy', 'dzen', 'rutube'];

    for (const platform of playwrightPlatforms) {
      const current = this.healthStatus.get(platform) || {
        platform,
        status: 'ok' as const,
        lastCheck: new Date(),
        consecutiveFailures: 0,
      };

      try {
        const isHealthy = await this.pingPlatform(platform);

        if (isHealthy) {
          current.status = 'ok';
          current.consecutiveFailures = 0;
        } else {
          current.consecutiveFailures++;
          current.status =
            current.consecutiveFailures >= this.ALERT_THRESHOLD ? 'down' : 'degraded';
          current.lastError = `Health check failed at ${new Date().toISOString()}`;

          if (current.consecutiveFailures === this.ALERT_THRESHOLD) {
            await this.alertService.sendAlert({
              platform,
              type: 'health_degraded',
              message: `Session down ${this.ALERT_THRESHOLD} checks in a row. Re-auth needed.`,
            });
          }
        }
      } catch (err: any) {
        current.consecutiveFailures++;
        current.status = 'degraded';
        current.lastError = err.message;
        this.logger.error(`Health check error for ${platform}: ${err.message}`);
      }

      current.lastCheck = new Date();
      this.healthStatus.set(platform, current);
    }
  }

  getHealthStatus(): PlatformHealth[] {
    return Array.from(this.healthStatus.values());
  }

  getStatus(platform: string): PlatformHealth | undefined {
    return this.healthStatus.get(platform);
  }

  private async pingPlatform(platform: string): Promise<boolean> {
    // In production, this calls the actual Playwright provider's healthCheck()
    // For now, check if the playwright service is reachable
    try {
      const playwrightUrl = process.env.PLAYWRIGHT_HEALTH_URL || 'http://playwright:3500';
      const response = await fetch(`${playwrightUrl}`, { signal: AbortSignal.timeout(10000) });
      const data = await response.json();
      return data.status === 'ok';
    } catch {
      return false;
    }
  }
}
