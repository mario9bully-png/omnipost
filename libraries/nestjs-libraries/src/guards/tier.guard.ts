import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const REQUIRED_FEATURE_KEY = 'omnipost:required_feature';

export const RequireFeature = (feature: string) =>
  SetMetadata(REQUIRED_FEATURE_KEY, feature);

interface TierConfig {
  tiers: Record<
    string,
    {
      name: string;
      features: Record<string, boolean>;
      limits: Record<string, number>;
    }
  >;
}

let tiersConfig: TierConfig | null = null;

function loadTiersConfig(): TierConfig {
  if (tiersConfig) return tiersConfig;
  try {
    const configPath = path.join(process.cwd(), 'config', 'tiers.yaml');
    tiersConfig = yaml.load(fs.readFileSync(configPath, 'utf8')) as TierConfig;
  } catch {
    tiersConfig = { tiers: {} };
  }
  return tiersConfig;
}

@Injectable()
export class TierGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const feature = this.reflector.get<string>(
      REQUIRED_FEATURE_KEY,
      context.getHandler()
    );
    if (!feature) return true;

    const request = context.switchToHttp().getRequest();
    const orgTier = request.user?.currentOrganization?.tier || process.env.OMNIPOST_TIER || 'start';

    const config = loadTiersConfig();
    const tier = config.tiers[orgTier];
    if (!tier) return true;

    if (!tier.features[feature]) {
      throw new ForbiddenException(
        `Функция "${feature}" недоступна на тарифе "${tier.name}". Обновите тариф.`
      );
    }

    return true;
  }
}
