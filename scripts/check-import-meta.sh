#!/usr/bin/env bash
# 快速掃描 production dependencies 中可能被 Metro 解析到的 import.meta 來源
# 不需要 build，秒級完成。
# 用法：bash scripts/check-import-meta.sh

set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== 掃描 production dependencies 中含 import.meta 的 .js/.cjs 檔案 ==="
node scripts/scan-prod-deps.js
