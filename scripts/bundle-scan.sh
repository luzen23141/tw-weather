#!/usr/bin/env bash
# 本地 bundle scan，與 CI main.yml 的「Scan bundle for problematic ESM patterns」一致
# 用法：bash scripts/bundle-scan.sh
# 前提：已先執行 pnpm exec expo export --platform web

set -euo pipefail

BUNDLE=$(ls dist/_expo/static/js/web/*.js 2>/dev/null | head -1 || true)
if [ -z "$BUNDLE" ]; then
  echo "❌ dist/ 中沒有 bundle，請先執行："
  echo "   EXPO_PUBLIC_PROXY_URL=https://placeholder.example.com BASE_URL=/ pnpm exec expo export --platform web"
  exit 1
fi

echo "掃描 bundle: $BUNDLE"
FAIL=0

# 1. 檢查 import.meta
if grep -q "import\.meta" "$BUNDLE"; then
  echo "❌ Found 'import.meta' in bundle — SyntaxError in non-ESM browsers"
  echo "   Fix: check metro.config.js unstable_enablePackageExports setting"
  # 列出來自哪個套件（grep 前後文）
  echo "   Context:"
  grep -o ".\{0,60\}import\.meta.\{0,60\}" "$BUNDLE" | head -5
  FAIL=1
fi

# 2. 檢查 react/react-dom 版本一致性
REACT_VER=$(node -p "require('./node_modules/react/package.json').version" 2>/dev/null)
REACTDOM_VER=$(node -p "require('./node_modules/react-dom/package.json').version" 2>/dev/null)
if [ "$REACT_VER" != "$REACTDOM_VER" ]; then
  echo "❌ React version mismatch: react@$REACT_VER vs react-dom@$REACTDOM_VER"
  echo "   Fix: add pnpm.overrides.react-dom in package.json"
  FAIL=1
fi

if [ $FAIL -eq 0 ]; then
  echo "✅ Bundle scan passed (react@$REACT_VER, no import.meta)"
else
  exit 1
fi
