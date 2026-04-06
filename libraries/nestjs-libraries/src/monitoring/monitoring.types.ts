export interface PlatformHealth {
  platform: string;
  status: 'ok' | 'degraded' | 'down';
  lastCheck: Date;
  consecutiveFailures: number;
  lastError?: string;
}

export interface AlertPayload {
  platform: string;
  type: 'session_expired' | 'upload_failed' | 'health_degraded';
  message: string;
  orgId?: string;
}
