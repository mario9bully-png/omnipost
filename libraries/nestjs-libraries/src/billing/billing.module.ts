import { Module } from '@nestjs/common';
import { TPayService } from './tpay.service';
import { TPayWebhookController } from './tpay.webhook.controller';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

@Module({
  controllers: [TPayWebhookController],
  providers: [TPayService, PrismaService],
  exports: [TPayService],
})
export class BillingModule {}
