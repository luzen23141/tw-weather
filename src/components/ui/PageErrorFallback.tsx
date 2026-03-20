import { GlassBackground } from '@/components/ui/GlassBackground';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function PageErrorFallback() {
  return (
    <GlassBackground className="items-center justify-center">
      <LoadingSpinner label="頁面出錯，請重新整理" />
    </GlassBackground>
  );
}
