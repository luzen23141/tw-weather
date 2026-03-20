import { useRouter } from 'expo-router';

import { PageState } from '@/components/ui/PageState';

export interface NoLocationStateProps {
  scope: string;
  locationError?: unknown;
}

export function NoLocationState({ scope, locationError }: NoLocationStateProps) {
  const router = useRouter();

  return (
    <PageState
      type="empty"
      title="請先選擇地點"
      description={
        locationError
          ? `目前無法取得你的定位，請先手動選擇地點，再查看${scope}。`
          : `前往地點管理選擇城市後，即可查看${scope}。`
      }
      {...(locationError
        ? {
            secondaryActionLabel: '稍後再試',
            onSecondaryAction: () => router.replace('/(tabs)'),
          }
        : {})}
      actionLabel="前往選擇地點"
      onActionPress={() => router.push('/locations')}
    />
  );
}
