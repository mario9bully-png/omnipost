'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { OrganizationSelector } from '@gitroom/frontend/components/layout/organization.selector';
import { LanguageComponent } from '@gitroom/frontend/components/layout/language.component';
import { AttachToFeedbackIcon } from '@gitroom/frontend/components/new-layout/sentry.feedback.component';
import dynamic from 'next/dynamic';
import { LogoTextComponent } from '@gitroom/frontend/components/ui/logo-text.component';
import { pricing } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/pricing';
import clsx from 'clsx';
import { Button } from '@gitroom/react/form/button';
import {
  FAQComponent,
} from '@gitroom/frontend/components/billing/faq.component';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { LogoutComponent } from '@gitroom/frontend/components/layout/logout.component';
import { DeveloperIconComponent } from '@gitroom/frontend/components/developer/developer.icon.component';
import { Features } from '@gitroom/frontend/components/billing/main.billing.component';

const ModeComponent = dynamic(
  () => import('@gitroom/frontend/components/layout/mode.component'),
  {
    ssr: false,
  }
);

const tierNames: Record<string, string> = {
  FREE: 'Бесплатный',
  STANDARD: 'Стандарт',
  PRO: 'Про',
  BUSINESS: 'Бизнес',
};

export const FirstBillingComponent = () => {
  const user = useUser();
  const fetch = useFetch();
  const toast = useToaster();
  const t = useT();
  const [period, setPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [loading, setLoading] = useState<string | null>(null);

  const paidTiers = useMemo(
    () => Object.entries(pricing).filter(([key]) => key !== 'FREE'),
    []
  );

  const handleUpgrade = useCallback(
    async (tier: string) => {
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
    [period, fetch]
  );

  return (
    <div className="blurMe flex flex-1 flex-col bg-newBgColorInner pb-[60px] mobile:pb-[100px]">
      <div className="h-[92px] px-[80px] tablet:px-[32px] mobile:!px-[16px] py-[20px] flex border-b border-newColColor">
        <div className="flex-1 flex items-center text-textColor">
          <LogoTextComponent />
        </div>
        <div className="flex items-center">
          <div className="flex gap-[20px] text-textItemBlur">
            <OrganizationSelector />
            <div className="hover:text-newTextColor">
              <ModeComponent />
            </div>
            <div className="w-[1px] h-[20px] bg-blockSeparator" />
            <LanguageComponent />
            <div className="w-[1px] h-[20px] bg-blockSeparator" />
            <AttachToFeedbackIcon />
            <DeveloperIconComponent />
            <div className="hover:text-newTextColor">
              {user?.tier?.current === 'FREE' && (
                <LogoutComponent isIcon={true} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center px-[80px] tablet:px-[32px] mobile:!px-[16px] py-[40px]">
        <div className="text-[36px] font-[600] leading-[110%] text-center mb-[8px]">
          {t('billing_choose_plan', 'Выберите тариф')}
        </div>
        <div className="text-[16px] text-gray-400 mb-[32px] text-center">
          Начните бесплатно, масштабируйтесь по мере роста
        </div>

        <div className="flex items-center gap-[8px] bg-newBgColorInner border border-newColColor rounded-[12px] p-[4px] mb-[32px]">
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

        <div className="grid grid-cols-3 gap-[16px] w-full max-w-[1000px] tablet:grid-cols-1">
          {paidTiers.map(([name, values]) => {
            const price =
              period === 'YEARLY' ? values.year_price : values.month_price;
            const isPopular = name === 'PRO';

            return (
              <div
                key={name}
                className={clsx(
                  'bg-sixth border rounded-[16px] p-[28px] gap-[20px] flex flex-col relative',
                  isPopular
                    ? 'border-[#1565C0] border-[2px]'
                    : 'border-customColor6'
                )}
              >
                {isPopular && (
                  <div className="absolute -top-[12px] left-1/2 -translate-x-1/2 bg-[#1565C0] text-white text-[12px] px-[12px] py-[3px] rounded-[6px]">
                    Популярный
                  </div>
                )}

                <div className="text-[20px] font-[600]">
                  {tierNames[name] || name}
                </div>

                <div className="flex items-baseline gap-[4px]">
                  <div className="text-[36px] font-[700]">
                    {price.toLocaleString('ru-RU')} ₽
                  </div>
                  <div className="text-[14px] text-customColor18">
                    /{period === 'YEARLY' ? 'год' : 'мес'}
                  </div>
                </div>

                <Button
                  loading={loading === name}
                  className={clsx(
                    'w-full',
                    isPopular ? '!bg-[#1565C0]' : ''
                  )}
                  onClick={() => handleUpgrade(name)}
                >
                  Подключить
                </Button>

                <Features pack={name} />
              </div>
            );
          })}
        </div>

        <FAQComponent />
      </div>
    </div>
  );
};
