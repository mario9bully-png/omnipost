import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { TPayService } from './tpay.service';
import { TPayNotification } from './tpay.types';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

@Controller('billing/webhook')
export class TPayWebhookController {
  private readonly logger = new Logger(TPayWebhookController.name);

  constructor(
    private readonly tpayService: TPayService,
    private readonly prisma: PrismaService
  ) {}

  @Post('tpay')
  @HttpCode(200)
  async handleNotification(@Body() notification: TPayNotification) {
    this.logger.log(
      `TPay notification: OrderId=${notification.OrderId} Status=${notification.Status}`
    );

    if (!this.tpayService.verifyNotification(notification)) {
      this.logger.error('Invalid TPay notification signature');
      return 'INVALID';
    }

    if (notification.Status === 'CONFIRMED' && notification.Success) {
      // OrderId format: org_{orgId}_tier_{tierName}_{timestamp}
      const parts = notification.OrderId.split('_');
      const orgId = parts[1];
      const tier = parts[3];

      if (orgId && tier) {
        this.logger.log(`Upgrading org ${orgId} to tier ${tier}`);
        await this.prisma.organization.update({
          where: { id: orgId },
          data: { tier },
        });
      }
    }

    return 'OK';
  }
}
