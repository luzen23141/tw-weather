import { ReactNode } from 'react';
import { Platform, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/icons/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type StateType = 'loading' | 'error' | 'empty';

const stateConfig: Record<
  StateType,
  {
    icon: AppIconName;
    iconColor: string;
    defaultTitle: string;
    defaultDescription: string;
  }
> = {
  loading: {
    icon: 'cloud-outline',
    iconColor: 'var(--color-md-primary)',
    defaultTitle: '載入中',
    defaultDescription: '正在整理天氣資料，請稍候。',
  },
  error: {
    icon: 'alert-circle-outline',
    iconColor: 'var(--color-md-error)',
    defaultTitle: '發生錯誤',
    defaultDescription: '暫時無法取得資料，請稍後再試。',
  },
  empty: {
    icon: 'information-circle-outline',
    iconColor: 'var(--color-md-on-surface-variant)',
    defaultTitle: '目前沒有資料',
    defaultDescription: '請調整條件後再試一次。',
  },
};

export interface PageStateProps {
  type: StateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  /** 第二個動作按鈕（如「重試」） */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  /** loading 狀態可傳入自訂骨架屏取代預設 icon */
  skeleton?: ReactNode;
}

export function PageState({
  type,
  title,
  description,
  actionLabel,
  onActionPress,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
  skeleton,
}: PageStateProps) {
  const config = stateConfig[type];
  const toneLabel = type === 'error' ? '連線狀態' : type === 'empty' ? '尚未完成' : '資料整理中';

  // loading 且有自訂骨架屏時直接回傳
  if (type === 'loading' && skeleton) {
    return <>{skeleton}</>;
  }

  return (
    <View className={`px-4 py-10 ${className}`.trim()} style={{ minHeight: 420 }}>
      <Card
        variant="filled"
        className="items-center gap-5 px-6 py-10 shadow-glass-glow"
        style={
          Platform.OS === 'web' ? { alignSelf: 'center', width: '100%', maxWidth: 460 } : undefined
        }
      >
        <Text className="text-[11px] font-bold uppercase tracking-[2px] text-md-primary">
          {toneLabel}
        </Text>
        <View className="h-[72px] w-[72px] items-center justify-center rounded-[24px] border border-glass-border-strong bg-md-surface shadow-glass">
          <AppIcon name={config.icon} size={34} color={config.iconColor} />
        </View>
        <Text className="text-[28px] font-bold leading-9 text-md-on-surface text-center">
          {title ?? config.defaultTitle}
        </Text>
        <Text className="max-w-[320px] text-base leading-7 text-md-on-surface-variant text-center">
          {description ?? config.defaultDescription}
        </Text>
        {actionLabel || secondaryActionLabel ? (
          <View className="mt-1 flex-row flex-wrap items-center justify-center gap-3">
            {secondaryActionLabel && onSecondaryAction ? (
              <Button
                variant="outlined"
                size="md"
                label={secondaryActionLabel}
                onPress={onSecondaryAction}
              />
            ) : null}
            {actionLabel && onActionPress ? (
              <Button variant="filled" size="md" label={actionLabel} onPress={onActionPress} />
            ) : null}
          </View>
        ) : null}
      </Card>
    </View>
  );
}
