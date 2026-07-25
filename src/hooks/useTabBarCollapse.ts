import { useCallback } from 'react';
import {
  makeMutable,
  useAnimatedScrollHandler,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * 導航欄收合狀態。
 *
 * 用 module-level shared value 而非 React context：導航欄住在 `app/(tabs)/_layout.tsx`，
 * 捲動事件發生在各分頁裡，中間隔著 Expo Router 的整棵樹。走 context 要把 Provider
 * 塞在 layout 外層再逐層傳，而這個值每幀都會變 —— 一旦走 React state 就是每幀
 * re-render 整棵 tab 樹。shared value 全程待在 UI thread，不觸發任何 render。
 *
 * 代價是全域單例：同時存在兩個 tab 導航時會互相干擾。本 app 只有一組，可接受。
 */
const collapsed = makeMutable(false);

/** 捲動位移小於此值不視為方向改變，避免手指微顫造成反覆閃爍 */
const DIRECTION_THRESHOLD = 0.6;
/** 頂部這段距離內不收合，避免輕觸就縮 */
const COLLAPSE_AFTER = 50;
/** 回到接近頂端時強制展開 */
const EXPAND_BELOW = 6;

export function useTabBarCollapse(): SharedValue<boolean> {
  return collapsed;
}

/** 離開頁面或資料重載時把導航欄還原，避免停在收合狀態 */
export function useResetTabBarCollapse(): () => void {
  return useCallback(() => {
    collapsed.value = false;
  }, []);
}

/**
 * 產生驅動導航欄收合的捲動 handler。
 *
 * 依捲動「方向」而非絕對位置切換 —— 使用者往上滑代表想找導航，不該要求他們
 * 先捲到最頂端。方向判斷需要保存前一幀的 y，這個值必須放在 shared value，
 * 不能用 useState。
 */
export function useCollapsingScrollHandler(): ReturnType<typeof useAnimatedScrollHandler> {
  // useSharedValue 而非 makeMutable —— 後者每次 render 都會產生新的 mutable，
  // 前一幀的 y 會被重置，方向判斷永遠拿到 0
  const lastY = useSharedValue(0);

  return useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      const y = event.contentOffset.y;
      const delta = y - lastY.value;

      if (y <= EXPAND_BELOW) {
        collapsed.value = false;
      } else if (delta > DIRECTION_THRESHOLD && y > COLLAPSE_AFTER) {
        collapsed.value = true;
      } else if (delta < -DIRECTION_THRESHOLD) {
        collapsed.value = false;
      }

      lastY.value = y;
    },
  });
}
