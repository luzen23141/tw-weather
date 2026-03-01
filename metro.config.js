const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// 停用 package.json exports 解析，強制使用 main 字段（CJS 版本），
// 避免 zustand/middleware 等套件的 ESM 版本含有 import.meta.env 造成瀏覽器 SyntaxError。
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: './global.css' });
