'use client';

import React, { FC, useCallback, useMemo, useState } from 'react';
import { Button } from '@gitroom/react/form/button';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { Subscription } from '@prisma/client';
import clsx from 'clsx';
import { pricing } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/pricing';
import { FAQComponent } from '@gitroom/frontend/components/billing/faq.component';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { useRouter } from 'next/navigation';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { LogoutComponent } from '@gitroom/frontend/components/layout/logout.component';

const tierNames: Record<string, string> = {
  FREE: 'Бесплатный',
  STANDARD: 'Стандарт',
  PRO: 'Про',
  BUSINESS: 'Бизнес',
};

export const Features: FC<{
  pack: string;
}> = (props) => {
  const { pack } = props;
  const features = useMemo(() => {
    const currentPricing = pricing[pack];
    if (!currentPricing) return [];
    const channelsOr = currentPricing.channel;
    const list: string[] = [];
    list.push(`${channelsOr} ${channelsOr === 1 ? 'канал' : channelsOr! <= 4 ? 'канала' : 'каналов'}`);
    list.push(
      `${
        currentPricing.posts_per_month > 10000
          ? 'Безлимит'
          : currentPricing.posts_per_month
      } постов/мес`
    );
    if (currentPricing.team_members) {
      list.push('Команда (безлимит)');
    }
    if (currentPricing?.ai) {
      list.push('AI автодополнение');
      list.push('AI копилот');
    }
    list.push('Редактор изображений');
    if (currentPricing?.image_generator) {
      list.push(`${currentPricing?.image_generation_count} AI изображений/мес`);
    }
    if (currentPricing?.generate_videos) {
      list.push(`${currentPricing?.generate_videos} AI видео/мес`);
    }
    if (currentPricing?.autoPost) {
      list.push('Автопостинг');
    }
    if (currentPricing?.public_api) {
      list.push('Public API');
    }
    if (currentPricing?.webhooks) {
      list.push(`${currentPricing.webhooks} вебхуков`);
    }
    return list;
  }, [pack]);

  return (
    <div className="flex flex-col gap-[10px] justify-center text-[14px] text-customColor18">
      {features.map((feature) => (
        <div key={feature} className="flex gap-[8px] items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="17"
            viewBox="0 0 17 17"
            fill="none"
          >
            <path
              d="M11.825 0H4.84167C1.80833 0 0 1.80833 0 4.84167V11.8167C0 14.8583 1.80833 16.6667 4.84167 16.6667H11.8167C14.85 16.6667 16.6583 14.8583 16.6583 11.825V4.84167C16.6667 1.80833 14.8583 0 11.825 0ZM12.3167 6.41667L7.59167 11.1417C7.475 11.2583 7.31667 11.325 7.15 11.325C6.98333 11.325 6.825 11.2583 6.70833 11.1417L4.35 8.78333C4.10833 8.54167 4.10833 8.14167 4.35 7.9C4.59167 7.65833 4.99167 7.65833 5.23333 7.9L7.15 9.81667L11.4333 5.53333C11.675 5.29167 12.075 5.29167 12.3167 5.53333C12.5583 5.775 12.5583 6.16667 12.3167 6.41667Z"
              fill="currentColor"
            />
          </svg>
          <div>{feature}</div>
        </div>
      ))}
    </div>
  );
};

export const MainBillingComponent: FC<{
  sub?: Subscription;
}> = (props) => {
  const { sub } = props;
  const fetch = useFetch();
  const user = useUser();
  const router = useRouter();
  const toast = useToaster();
  const t = useT();
  const [loading, setLoading] = useState<string | null>(null);
  const [period, setPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  const currentTier = useMemo(() => {
    return sub?.subscriptionTier || user?.tier?.current || user?.tier || 'FREE';
  }, [sub, user]);

  const handleUpgrade = useCallback(
    async (tier: string) => {
      if (tier === 'FREE' || tier === currentTier) return;

      setLoading(tier);
      try {
        const res = await fetch('/billing/tpay/create', {
          method: 'POST',
          body: JSON.stringify({ tier, period }),
        });

        const data = await res.json();
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          toast.show('Ошибка создания платежа', 'warning');
        }
      } catch {
        toast.show('Ошибка создания платежа', 'warning');
      } finally {
        setLoading(null);
      }
    },
    [period, currentTier, fetch]
  );

  if (user?.isLifetime) {
    router.replace('/');
    return null;
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-row items-center">
        <div className="flex-1 text-[20px] font-[600]">
          {t('plans', 'Тарифы')}
        </div>
        <div className="flex items-center gap-[8px] bg-newBgColorInner border border-newColColor rounded-[12px] p-[4px]">
          <div
            className={clsx(
              'px-[16px] py-[6px] rounded-[8px] cursor-pointer text-[14px]',
              period === 'MONTHLY'
                ? 'bg-boxFocused text-textItemFocused'
                : ''
            )}
            onClick={() => setPeriod('MONTHLY')}
          >
            Месяц
          </div>
          <div
            className={clsx(
              'px-[16px] py-[6px] rounded-[8px] cursor-pointer text-[14px] flex gap-[6px] items-center',
              period === 'YEARLY'
                ? 'bg-boxFocused text-textItemFocused'
                : ''
            )}
            onClick={() => setPeriod('YEARLY')}
          >
            Год
            <span className="bg-[#1565C0] text-white text-[11px] px-[6px] py-[1px] rounded-[4px]">
              -20%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-[12px] [@media(max-width:1024px)]:grid-cols-2 [@media(max-width:640px)]:grid-cols-1">
        {Object.entries(pricing).map(([name, values]) => {
          const isCurrent = currentTier === name;
          const isFree = name === 'FREE';
          const price = period === 'YEARLY' ? values.year_price : values.month_price;

          return (
            <div
              key={name}
              className={clsx(
                'bg-sixth border rounded-[12px] p-[24px] gap-[16px] flex flex-col',
                isCurrent
                  ? 'border-[#1565C0] border-[2px]'
                  : 'border-customColor6'
              )}
            >
              <div className="flex items-center gap-[8px]">
                <div className="text-[18px] font-[600]">
                  {tierNames[name] || name}
                </div>
                {isCurrent && (
                  <span className="bg-[#1565C0] text-white text-[11px] px-[8px] py-[2px] rounded-[4px]">
                    Текущий
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-[4px]">
                {isFree ? (
                  <div className="text-[32px] font-[700]">0 ₽</div>
                ) : (
                  <>
                    <div className="text-[32px] font-[700]">
                      {price.toLocaleString('ru-RU')} ₽
                    </div>
                    <div className="text-[14px] text-customColor18">
                      /{period === 'YEARLY' ? 'год' : 'мес'}
                    </div>
                  </>
                )}
              </div>

              <div>
                {isCurrent ? (
                  <Button disabled className="w-full">
                    Текущий тариф
                  </Button>
                ) : isFree ? (
                  <Button disabled className="w-full opacity-50">
                    Бесплатный
                  </Button>
                ) : (
                  <Button
                    loading={loading === name}
                    className="w-full !bg-[#1565C0]"
                    onClick={() => handleUpgrade(name)}
                  >
                    {currentTier === 'FREE' ? 'Подключить' : 'Перейти'}
                  </Button>
                )}
              </div>

              <Features pack={name} />
            </div>
          );
        })}
      </div>

      <FAQComponent />

      <div className="flex justify-center mt-[20px]">
        <LogoutComponent />
      </div>
    </div>
  );
};
