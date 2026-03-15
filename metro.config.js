const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// 啟用 package.json exports 解析以支持現代 ESM 套件 (如 zustand v5)
config.resolver.unstable_enablePackageExports = true;

// 強制轉譯含有 import.meta 的 ESM 套件 (如 zustand)
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = withNativewind(config, { input: './src/global.css' });
