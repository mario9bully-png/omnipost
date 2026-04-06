import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { TPayInitRequest, TPayInitResponse, TPayNotification } from './tpay.types';

@Injectable()
export class TPayService {
  private readonly logger = new Logger(TPayService.name);
  private readonly terminalKey = process.env.TPAY_TERMINAL_KEY || '';
  private readonly password = process.env.TPAY_PASSWORD || '';
  private readonly apiUrl = process.env.TPAY_API_URL || 'https://securepay.tinkoff.ru/v2';

  async createPayment(params: {
    orderId: string;
    amount: number;
    description: string;
    customerKey: string;
    successUrl: string;
    failUrl: string;
    notificationUrl: string;
    recurrent?: boolean;
  }): Promise<TPayInitResponse> {
    const body: TPayInitRequest = {
      TerminalKey: this.terminalKey,
      Amount: params.amount,
      OrderId: params.orderId,
      Description: params.description,
      CustomerKey: params.customerKey,
      SuccessURL: params.successUrl,
      FailURL: params.failUrl,
      NotificationURL: params.notificationUrl,
    };

    if (params.recurrent) {
      body.Recurrent = 'Y';
    }

    const response = await fetch(`${this.apiUrl}/Init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data: TPayInitResponse = await response.json();
    if (!data.Success) {
      throw new Error(`TPay Init failed: ${data.ErrorCode}`);
    }

    return data;
  }

  verifyNotification(notification: TPayNotification): boolean {
    const token = notification.Token;
    const fields: Record<string, any> = { ...notification, Password: this.password };
    delete fields.Token;

    const sorted = Object.keys(fields)
      .sort()
      .map((key) => String(fields[key]))
      .join('');

    const hash = crypto.createHash('sha256').update(sorted).digest('hex');
    return hash === token;
  }

  async getPaymentStatus(paymentId: string): Promise<any> {
    const response = await fetch(`${this.apiUrl}/GetState`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ TerminalKey: this.terminalKey, PaymentId: paymentId }),
    });
    return response.json();
  }
}
