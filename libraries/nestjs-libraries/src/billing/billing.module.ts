import { Module } from '@nestjs/common';
import { TPayService } from './tpay.service';
import { TPayWebhookController } from './tpay.webhook.controller';

@Module({
  controllers: [TPayWebhookController],
  providers: [TPayService],
  exports: [TPayService],
})
export class BillingModule {}
