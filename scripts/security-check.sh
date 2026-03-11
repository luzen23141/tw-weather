#!/bin/bash

# 資安檢查腳本
# 用途：掃描程式碼與編譯產物中的安全問題
# 用法：./scripts/security-check.sh [--fix] [--strict]

set -euo pipefail

# 色彩定義（非 TTY 時停用）
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  NC='\033[0m'
else
  RED=''
  GREEN=''
  YELLOW=''
  BLUE=''
  NC=''
fi

STRICT_MODE=false
FIX_MODE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --fix)
      FIX_MODE=true
      shift
      ;;
    --strict)
      STRICT_MODE=true
      shift
      ;;
    *)
      echo "未知選項: $1"
      exit 1
      ;;
  esac
done

total_checks=0
passed_checks=0
failed_checks=0
warnings=0

check_status() {
  total_checks=$((total_checks + 1))
  local result="$1"
  local message="$2"

  if [ "$result" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $message"
    passed_checks=$((passed_checks + 1))
  else
    echo -e "${RED}✗${NC} $message"
    failed_checks=$((failed_checks + 1))
  fi
}

warn_status() {
  local message="$1"
  echo -e "${YELLOW}⚠${NC} $message"
  warnings=$((warnings + 1))
}

info_status() {
  local message="$1"
  echo -e "${BLUE}ℹ${NC} $message"
}

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}    安全檢查腳本 - Security Audit${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

if [ "$FIX_MODE" = true ]; then
  info_status "--fix 模式目前無自動修復步驟，僅執行檢查"
  echo ""
fi

# ============= 檢查 1：依賴漏洞審計（合併） =============
echo -e "${BLUE}[1/6]${NC} 檢查依賴漏洞..."
if command -v pnpm >/dev/null 2>&1 && [ -f "pnpm-lock.yaml" ]; then
  set +e
  audit_output=$(pnpm audit --production 2>&1)
  audit_exit=$?
  set -e

  if [ "$audit_exit" -eq 0 ]; then
    check_status 0 "pnpm audit 檢查"
  else
    warn_status "pnpm audit 發現潛在漏洞（請檢查輸出）"
    echo "$audit_output"
  fi
elif command -v npm >/dev/null 2>&1 && [ -f "package-lock.json" ]; then
  set +e
  audit_output=$(npm audit --production 2>&1)
  audit_exit=$?
  set -e

  if [ "$audit_exit" -eq 0 ]; then
    check_status 0 "npm audit 檢查"
  else
    warn_status "npm audit 發現潛在漏洞（請檢查輸出）"
    echo "$audit_output"
  fi
else
  warn_status "未檢測到可用 lockfile（pnpm-lock.yaml / package-lock.json）"
fi
echo ""

# ============= 檢查 2：編譯產物中的敏感內容 =============
echo -e "${BLUE}[2/6]${NC} 掃描編譯產物中的敏感內容..."
if [ ! -d "dist" ]; then
  info_status "dist 目錄不存在，跳過"
else
  local_failures=0

  if grep -R "EXPO_PUBLIC_" dist/ >/dev/null 2>&1; then
    warn_status "編譯產物中包含 EXPO_PUBLIC_* 字串（請確認是否為必要公開設定）"
    local_failures=$((local_failures + 1))
  fi

  # 只把「可執行的直連呼叫」視為失敗，避免因註解/文件字串誤判
  direct_call_pattern='fetch\(("|\x27)https://(api\.weatherapi\.com|api\.openweathermap\.org|opendata\.cwa\.gov\.tw)|new URL\(("|\x27)https://(api\.weatherapi\.com|api\.openweathermap\.org|opendata\.cwa\.gov\.tw)'

  if grep -R -E "$direct_call_pattern" dist/ >/dev/null 2>&1; then
    check_status 1 "偵測到直連上游天氣 API 呼叫"
    local_failures=$((local_failures + 1))
  else
    check_status 0 "偵測直連上游天氣 API 呼叫"
  fi

  if [ "$STRICT_MODE" = true ] && [ "$local_failures" -gt 0 ]; then
    echo -e "${RED}❌ 嚴格模式：編譯產物檢查未通過${NC}"
    exit 1
  fi
fi
echo ""

# ============= 檢查 3：.env 文件追蹤狀態 =============
echo -e "${BLUE}[3/6]${NC} 檢查 .env 文件..."
if [ -f ".env" ]; then
  info_status ".env 文件存在於工作目錄（不應被 Git 追蹤）"
fi

if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  check_status 1 ".env 文件追蹤狀態"
  warn_status ".env 文件被 Git 追蹤，請立即移除"
else
  check_status 0 ".env 文件追蹤狀態"
fi

env_extra_count=$(find . -maxdepth 1 -type f -name '.env.*' ! -name '.env.example' | wc -l | tr -d ' ')
if [ "$env_extra_count" -gt 0 ]; then
  warn_status "檢測到 .env.* 文件（請確認都已加入 .gitignore）"
fi
echo ""

# ============= 檢查 4：ESLint 安全規則 =============
echo -e "${BLUE}[4/6]${NC} 執行 ESLint 檢查..."
if command -v pnpm >/dev/null 2>&1; then
  set +e
  pnpm lint >/dev/null 2>&1
  lint_exit=$?
  set -e
  check_status "$lint_exit" "ESLint 檢查"
elif command -v npx >/dev/null 2>&1; then
  set +e
  npx eslint src --quiet >/dev/null 2>&1
  lint_exit=$?
  set -e
  check_status "$lint_exit" "ESLint 檢查"
else
  warn_status "未檢測到 pnpm / npx，跳過 ESLint 檢查"
fi
echo ""

# ============= 檢查 5：測試覆蓋率資訊 =============
echo -e "${BLUE}[5/6]${NC} 檢查測試覆蓋率..."
if [ -f "coverage/coverage-summary.json" ]; then
  if command -v node >/dev/null 2>&1; then
    coverage_percent=$(node -e "const fs=require('fs');const p='coverage/coverage-summary.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));const v=j?.total?.lines?.pct;process.stdout.write(v===undefined?'':String(v));")
    if [ -n "$coverage_percent" ]; then
      info_status "當前測試覆蓋率：${coverage_percent}%"
      check_status 0 "覆蓋率報告解析"
    else
      warn_status "coverage-summary.json 缺少 total.lines.pct"
    fi
  else
    warn_status "未檢測到 node，無法解析 coverage-summary.json"
  fi
else
  info_status "覆蓋率報告不存在，請執行 'pnpm test:coverage'"
fi
echo ""

# ============= 檢查 6：依賴更新狀態 =============
echo -e "${BLUE}[6/6]${NC} 檢查過期依賴..."
if command -v pnpm >/dev/null 2>&1; then
  set +e
  outdated_output=$(pnpm outdated --depth=0 2>/dev/null)
  outdated_exit=$?
  set -e
  # pnpm outdated 有更新時通常 exit code 非 0，故以輸出是否為空判斷
  if [ -n "$(echo "$outdated_output" | sed '/^\s*$/d')" ]; then
    warn_status "檢測到過期依賴，建議更新"
  else
    check_status 0 "依賴更新檢查"
  fi
elif command -v npm >/dev/null 2>&1; then
  set +e
  outdated_output=$(npm outdated --depth=0 2>/dev/null)
  outdated_exit=$?
  set -e
  if [ -n "$(echo "$outdated_output" | sed '/^\s*$/d')" ]; then
    warn_status "檢測到過期依賴，建議更新"
  else
    check_status 0 "依賴更新檢查"
  fi
else
  warn_status "未檢測到 npm/pnpm，跳過依賴更新檢查"
fi
echo ""

# ============= 總結 =============
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}              檢查總結${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "  總檢查數：$total_checks"
echo -e "  ${GREEN}✓ 通過${NC}：$passed_checks"
echo -e "  ${RED}✗ 失敗${NC}：$failed_checks"
echo -e "  ${YELLOW}⚠ 警告${NC}：$warnings"
echo ""

if [ "$failed_checks" -gt 0 ]; then
  echo -e "${RED}❌ 安全檢查失敗${NC}"
  exit 1
fi

if [ "$STRICT_MODE" = true ] && [ "$warnings" -gt 0 ]; then
  echo -e "${RED}❌ 嚴格模式：有未處理警告${NC}"
  exit 1
fi

echo -e "${GREEN}✅ 所有必要檢查通過${NC}"
if [ "$warnings" -gt 0 ]; then
  echo -e "${YELLOW}⚠ 有 $warnings 個警告，建議檢查${NC}"
fi
