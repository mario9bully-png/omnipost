import { Injectable, Logger } from '@nestjs/common';
import { AlertPayload } from './monitoring.types';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private readonly botToken = process.env.OMNIPOST_ALERT_BOT_TOKEN || '';
  private readonly chatId = process.env.OMNIPOST_ALERT_CHAT_ID || '';

  async sendAlert(payload: AlertPayload): Promise<void> {
    if (!this.botToken || !this.chatId) {
      this.logger.warn('Telegram alert not configured — skipping');
      return;
    }

    const emoji =
      payload.type === 'upload_failed'
        ? '\u274C'
        : payload.type === 'session_expired'
        ? '\uD83D\uDD11'
        : '\u26A0\uFE0F';

    const text = `${emoji} *OmniPost Alert*\n\nPlatform: *${payload.platform}*\nType: ${payload.type}\n${payload.message}`;

    try {
      await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: this.chatId,
            text,
            parse_mode: 'Markdown',
          }),
        }
      );
    } catch (err: any) {
      this.logger.error(`Failed to send Telegram alert: ${err.message}`);
    }
  }

  async sendPublishReport(report: {
    orgName: string;
    results: Array<{ platform: string; success: boolean; error?: string }>;
  }): Promise<void> {
    if (!this.botToken || !this.chatId) return;

    const total = report.results.length;
    const ok = report.results.filter((r) => r.success).length;
    const lines = report.results.map((r) =>
      r.success
        ? `\u2705 ${r.platform}`
        : `\u274C ${r.platform}: ${r.error || 'failed'}`
    );

    const text = `\uD83D\uDCE4 *${report.orgName}*: ${ok}/${total}\n\n${lines.join('\n')}`;

    try {
      await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: this.chatId,
            text,
            parse_mode: 'Markdown',
          }),
        }
      );
    } catch (err: any) {
      this.logger.error(`Failed to send publish report: ${err.message}`);
    }
  }
}
