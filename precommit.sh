#!/usr/bin/env bash
#
# precommit.sh — run the same checks CI runs, locally, before you push.
# Mirrors the `lint` and `build` jobs in .github/workflows/ci.yml.
#
# Usage:
#   ./precommit.sh          # run all checks
#   ./precommit.sh --fix    # auto-fix lint issues, then run checks
#
set -uo pipefail

cd "$(dirname "$0")"

if [ -t 1 ]; then
  BOLD=$'\033[1m'; RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RESET=$'\033[0m'
else
  BOLD=""; RED=""; GREEN=""; YELLOW=""; RESET=""
fi

FAILED=()

step() {
  local name="$1"; shift
  printf '%s\n' "${BOLD}▶ ${name}${RESET}"
  if "$@"; then
    printf '%s\n\n' "${GREEN}✓ ${name} passed${RESET}"
  else
    printf '%s\n\n' "${RED}✗ ${name} failed${RESET}"
    FAILED+=("$name")
  fi
}

FIX=0
if [ "${1:-}" = "--fix" ]; then
  FIX=1
fi

if [ ! -d node_modules ]; then
  printf '%s\n' "${YELLOW}node_modules missing — running npm ci...${RESET}"
  npm ci || { printf '%s\n' "${RED}npm ci failed${RESET}"; exit 1; }
  printf '\n'
fi

if [ "$FIX" -eq 1 ]; then
  step "ESLint (auto-fix)" npm run lint:fix
else
  step "ESLint" npm run lint
fi

step "TypeScript build (tsc)" npm run build

if [ ${#FAILED[@]} -eq 0 ]; then
  printf '%s\n' "${GREEN}${BOLD}All checks passed.${RESET}"
  exit 0
fi

printf '%s\n' "${RED}${BOLD}The following checks failed:${RESET}"
for f in "${FAILED[@]}"; do
  printf '  %s- %s%s\n' "$RED" "$f" "$RESET"
done
exit 1
