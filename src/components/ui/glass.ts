import { Platform, ViewStyle } from 'react-native';

/**
 * 跨平台 backdrop-filter blur style 工具。
 * Web 回傳 CSS backdrop-filter；Native 回傳空物件（降級為半透明背景）。
 */
export function getGlassStyle(blur = 20): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    // @ts-expect-error -- Web-only CSS properties, RN type 不認得但 Web 可正常渲染
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
  };
}
