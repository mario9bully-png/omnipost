export interface TPayInitRequest {
  TerminalKey: string;
  Amount: number;
  OrderId: string;
  Description: string;
  CustomerKey?: string;
  Recurrent?: 'Y';
  NotificationURL?: string;
  SuccessURL?: string;
  FailURL?: string;
}

export interface TPayInitResponse {
  Success: boolean;
  ErrorCode: string;
  TerminalKey: string;
  Status: string;
  PaymentId: string;
  OrderId: string;
  Amount: number;
  PaymentURL: string;
}

export interface TPayNotification {
  TerminalKey: string;
  OrderId: string;
  Success: boolean;
  Status: string;
  PaymentId: number;
  ErrorCode: string;
  Amount: number;
  Pan: string;
  Token: string;
}
