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

  // loading 且有自訂骨架屏時直接回傳
  if (type === 'loading' && skeleton) {
    return <>{skeleton}</>;
  }

  return (
    <View className={`px-4 py-16 ${className}`.trim()}>
      <Card
        variant="filled"
        className="items-center gap-4 px-6 py-9"
        style={
          Platform.OS === 'web' ? { alignSelf: 'center', width: '100%', maxWidth: 420 } : undefined
        }
      >
        <View className="h-14 w-14 items-center justify-center rounded-[20px] border border-glass-border bg-md-surface-variant">
          <AppIcon name={config.icon} size={28} color={config.iconColor} />
        </View>
        <Text className="text-lg font-semibold text-md-on-surface text-center">
          {title ?? config.defaultTitle}
        </Text>
        <Text className="text-sm leading-5 text-md-on-surface-variant text-center">
          {description ?? config.defaultDescription}
        </Text>
        {actionLabel || secondaryActionLabel ? (
          <View className="mt-2 flex-row flex-wrap items-center justify-center gap-3">
            {secondaryActionLabel && onSecondaryAction ? (
              <Button
                variant="outlined"
                size="sm"
                label={secondaryActionLabel}
                onPress={onSecondaryAction}
              />
            ) : null}
            {actionLabel && onActionPress ? (
              <Button variant="tonal" size="sm" label={actionLabel} onPress={onActionPress} />
            ) : null}
          </View>
        ) : null}
      </Card>
    </View>
  );
}
