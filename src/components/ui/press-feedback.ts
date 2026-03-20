import type { PressableStateCallbackType, ViewStyle } from 'react-native';

export function getPressFeedbackStyle(
  state: PressableStateCallbackType,
  options?: {
    disabled?: boolean;
    pressedOpacity?: number;
    pressedScale?: number;
  },
): ViewStyle {
  const disabled = options?.disabled ?? false;
  const pressedOpacity = options?.pressedOpacity ?? 0.84;
  const pressedScale = options?.pressedScale ?? 0.98;

  return {
    opacity: disabled ? 0.5 : state.pressed ? pressedOpacity : 1,
    transform: [{ scale: state.pressed ? pressedScale : 1 }],
  };
}
