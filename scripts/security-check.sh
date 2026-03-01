#!/bin/bash

# 資安檢查腳本
# 用途：掃描代碼和編譯產物中的安全問題
# 用法：./scripts/security-check.sh [--fix] [--strict]

set -e

# 色彩定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 標誌
STRICT_MODE=false
FIX_MODE=false

# 解析命令行參數
while [[ $# -gt 0 ]]; do
  case $1 in
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

# 計數器
total_checks=0
passed_checks=0
failed_checks=0
warnings=0

# 函數：記錄檢查
check_status() {
  total_checks=$((total_checks + 1))
  local result=$1
  local message=$2

  if [ $result -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $message"
    passed_checks=$((passed_checks + 1))
  else
    echo -e "${RED}✗${NC} $message"
    failed_checks=$((failed_checks + 1))
  fi
}

# 函數：記錄警告
warn_status() {
  local message=$1
  echo -e "${YELLOW}⚠️${NC} $message"
  warnings=$((warnings + 1))
}

# 函數：記錄信息
info_status() {
  local message=$1
  echo -e "${BLUE}ℹ${NC} $message"
}

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}    安全檢查腳本 - Security Audit${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# ============= 檢查 1：npm 依賴漏洞 =============
echo -e "${BLUE}[1/8]${NC} 檢查 npm 依賴漏洞..."
if command -v npm &> /dev/null; then
  if npm audit --production 2>/dev/null | grep -q "found 0 vulnerabilities"; then
    check_status 0 "npm audit 檢查"
  else
    warn_status "npm audit 發現潛在漏洞 - 建議執行 npm audit --production"
  fi
else
  warn_status "npm 未安裝"
fi
echo ""

# ============= 檢查 2：pnpm 審計 =============
echo -e "${BLUE}[2/8]${NC} 檢查 pnpm 依賴安全性..."
if command -v pnpm &> /dev/null; then
  if pnpm audit --production 2>&1 | grep -q "No known vulnerabilities found"; then
    check_status 0 "pnpm audit 檢查"
  else
    pnpm audit --production || true
    warn_status "pnpm audit 檢查完成 - 查看上方輸出"
  fi
else
  warn_status "pnpm 未安裝"
fi
echo ""

# ============= 檢查 3：編譯產物中的 API 金鑰 =============
echo -e "${BLUE}[3/8]${NC} 掃描編譯產物中的 API 金鑰（P0 檢查）..."
if [ ! -d "dist" ]; then
  info_status "dist 目錄不存在，跳過"
else
  local_failures=0

  # 檢查 EXPO_PUBLIC_* 變數
  if grep -r "EXPO_PUBLIC_" dist/ 2>/dev/null | grep -v "node_modules" > /dev/null 2>&1; then
    warn_status "編譯產物中包含 EXPO_PUBLIC_* 引用"
    local_failures=$((local_failures + 1))
  fi

  # 檢查已知的洩露金鑰（舊金鑰）
  if grep -r "CWA-93F0E7E1-2BE9-4D52-A18F-948157E9CB56" dist/ 2>/dev/null; then
    check_status 1 "CWA 舊金鑰洩露檢測"
    local_failures=$((local_failures + 1))
  else
    check_status 0 "CWA 舊金鑰洩露檢測"
  fi

  if grep -r "5c1aae861f6448f8857151615262702" dist/ 2>/dev/null; then
    check_status 1 "WeatherAPI 舊金鑰洩露檢測"
    local_failures=$((local_failures + 1))
  else
    check_status 0 "WeatherAPI 舊金鑰洩露檢測"
  fi

  if [ $local_failures -gt 0 ]; then
    if [ "$STRICT_MODE" = true ]; then
      echo -e "${RED}❌ 嚴格模式：檢測到安全問題，退出${NC}"
      exit 1
    fi
  fi
fi
echo ""

# ============= 檢查 4：.env 文件 =============
echo -e "${BLUE}[4/8]${NC} 檢查 .env 文件..."
if [ -f ".env" ]; then
  info_status ".env 文件存在於工作目錄（已在 .gitignore 中）"
  # 檢查 .env 是否被追蹤
  if git ls-files | grep -q "^\.env$"; then
    check_status 1 ".env 文件追蹤狀態"
    warn_status ".env 文件被 Git 追蹤！應立即從 Git 移除"
  else
    check_status 0 ".env 文件追蹤狀態"
  fi
else
  info_status ".env 文件不存在（開發環境需要復制 .env.example）"
fi

# 檢查 .env.* 文件
if ls .env.* 2>/dev/null | grep -qv "\.example$"; then
  warn_status "檢測到 .env.* 文件（除了 .env.example），確保它們在 .gitignore 中"
fi
echo ""

# ============= 檢查 5：Git 歷史中的敏感信息 =============
echo -e "${BLUE}[5/8]${NC} 掃描 Git 歷史中的敏感信息..."
if command -v git &> /dev/null; then
  # 檢查最近 100 個提交
  if git log --all -100 --oneline | wc -l > /dev/null 2>&1; then
    local_git_issues=0

    # 簡單掃描（快速）
    if git log -p --all -100 | grep -iE "api.?key|password.*=|secret.*=" > /dev/null 2>&1; then
      warn_status "Git 歷史中可能包含敏感信息（已檢查最近 100 提交）"
      local_git_issues=$((local_git_issues + 1))
    else
      check_status 0 "Git 歷史檢查"
    fi

    if [ $local_git_issues -eq 0 ]; then
      check_status 0 "Git 歷史敏感信息掃描"
    fi
  fi
else
  info_status "git 未安裝"
fi
echo ""

# ============= 檢查 6：ESLint 安全規則 =============
echo -e "${BLUE}[6/8]${NC} 檢查 ESLint 安全規則..."
if command -v npx &> /dev/null; then
  if npx eslint src --quiet 2>&1 | grep -q "security\|dangerous"; then
    warn_status "ESLint 檢測到潛在的安全問題"
  else
    check_status 0 "ESLint 安全檢查"
  fi
else
  info_status "npx 未可用"
fi
echo ""

# ============= 檢查 7：代碼品質與覆蓋率 =============
echo -e "${BLUE}[7/8]${NC} 檢查測試覆蓋率..."
if [ -d "coverage" ]; then
  coverage_percent=$(grep -oP 'lines.*?\K[0-9]+\.[0-9]+' coverage/coverage-summary.json 2>/dev/null | head -1)
  if [ ! -z "$coverage_percent" ]; then
    info_status "當前測試覆蓋率：${coverage_percent}%"
  fi
else
  info_status "覆蓋率報告不存在，運行 'pnpm test:coverage' 生成"
fi
echo ""

# ============= 檢查 8：依賴更新 =============
echo -e "${BLUE}[8/8]${NC} 檢查過期依賴..."
if command -v npm &> /dev/null; then
  outdated=$(npm outdated --depth=0 2>/dev/null | tail -n +2 | wc -l)
  if [ $outdated -gt 0 ]; then
    warn_status "檢測到 $outdated 個過期依賴 - 運行 'npm update' 更新"
  else
    check_status 0 "依賴更新檢查"
  fi
fi
echo ""

# ============= 總結 =============
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}              檢查總結${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "  總檢查數：$total_checks"
echo -e "  ${GREEN}✓ 通過${NC}：$passed_checks"
echo -e "  ${RED}✗ 失敗${NC}：$failed_checks"
echo -e "  ${YELLOW}⚠️ 警告${NC}：$warnings"
echo ""

if [ $failed_checks -gt 0 ]; then
  echo -e "${RED}❌ 安全檢查失敗${NC}"
  if [ "$STRICT_MODE" = true ]; then
    exit 1
  fi
else
  echo -e "${GREEN}✅ 所有必要檢查通過${NC}"
  if [ $warnings -gt 0 ]; then
    echo -e "${YELLOW}⚠️ 有 $warnings 個警告，建議檢查${NC}"
  fi
fi
