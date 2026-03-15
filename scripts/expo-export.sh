#!/usr/bin/env bash
# CI 用 Expo Web export wrapper
# 背景執行 expo export，偵測 bundle 產生後主動終止 Metro worker，避免 event loop 卡住。
#
# 用法（main.yml / deploy-pages.yml 共用）：
#   bash scripts/expo-export.sh [--log-file <path>]
#
# 環境變數（呼叫端設定）：
#   EXPO_PUBLIC_PROXY_URL, EXPO_PUBLIC_PROXY_SECRET, BASE_URL, CI

set -euo pipefail

LOG_FILE="${1:-}"
MAX_WAIT=180   # 最多等 15 分鐘（180 × 5s）

if [ -n "$LOG_FILE" ]; then
  npx expo export -c --platform web > "$LOG_FILE" 2>&1 &
else
  pnpm exec expo export -c --platform web &
fi

EXPO_PID=$!
echo "expo PID: $EXPO_PID"

for i in $(seq 1 $MAX_WAIT); do
  sleep 5

  # 偵測方式 1：log 檔出現 "Exported: dist"（deploy-pages 模式）
  if [ -n "$LOG_FILE" ] && [ -f "$LOG_FILE" ] && grep -q 'Exported: dist' "$LOG_FILE"; then
    test -f dist/index.html
    ls dist/_expo/static/js/web/entry-*.js >/dev/null 2>&1
    grep -q '/_expo/static/js/web/entry-' dist/index.html
    kill "$EXPO_PID" 2>/dev/null || true
    wait "$EXPO_PID" 2>/dev/null || true
    [ -n "$LOG_FILE" ] && cat "$LOG_FILE"
    echo "✅ Expo export 完成"
    exit 0
  fi

  # 偵測方式 2：bundle glob 存在（main.yml 模式）
  if [ -z "$LOG_FILE" ] && ls dist/_expo/static/js/web/*.js >/dev/null 2>&1; then
    echo "✅ Bundle 已生成，終止 Metro worker"
    kill "$EXPO_PID" 2>/dev/null || true
    wait "$EXPO_PID" 2>/dev/null || true
    exit 0
  fi

  # 偵測方式 3：process 已自行結束
  if ! kill -0 "$EXPO_PID" 2>/dev/null; then
    wait "$EXPO_PID"; EC=$?
    [ -n "$LOG_FILE" ] && cat "$LOG_FILE" 2>/dev/null || true
    if [ $EC -ne 0 ]; then
      echo "❌ expo export 失敗 (exit $EC)"
      exit $EC
    fi
    test -f dist/index.html
    ls dist/_expo/static/js/web/*.js >/dev/null 2>&1
    echo "✅ Expo export 完成"
    exit 0
  fi
done

[ -n "$LOG_FILE" ] && cat "$LOG_FILE" 2>/dev/null || true
echo "❌ expo export 逾時（$((MAX_WAIT * 5 / 60)) 分鐘）"
kill -9 "$EXPO_PID" 2>/dev/null || true
exit 1
