#!/usr/bin/env bash
#
# PIIMS smoke test — verifies critical endpoints after deployment.
# Exit 0 = all pass, exit 1 = any failure.

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
USERNAME="${SMOKE_USER:-mowe.admin}"
PASSWORD="${SMOKE_PASS:-demo1234}"

PASS=0
FAIL=0
FAILED_TESTS=()

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"

  if [ "$expected" = "$actual" ]; then
    echo "  ✓ $name"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $name — expected $expected, got $actual"
    FAIL=$((FAIL + 1))
    FAILED_TESTS+=("$name")
  fi
}

echo "═══════════════════════════════════════════════════════════════"
echo "  PIIMS Smoke Test"
echo "  Target: $BASE_URL"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ─── 1. Health checks ────────────────────────────────────────────
echo "1. Health checks"
HEALTH_STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/healthz")
check "GET /healthz" "200" "$HEALTH_STATUS"

READY_STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/readyz")
check "GET /readyz" "200" "$READY_STATUS"

echo ""

# ─── 2. Authentication ───────────────────────────────────────────
echo "2. Authentication"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -n "$TOKEN" ]; then
  echo "  ✓ POST /v1/auth/login returns access token"
  PASS=$((PASS + 1))
else
  echo "  ✗ POST /v1/auth/login failed"
  echo "  Response: $LOGIN_RESPONSE"
  FAIL=$((FAIL + 1))
  FAILED_TESTS+=("login")
fi

echo ""

# ─── 3. Authenticated endpoints ──────────────────────────────────
if [ -n "$TOKEN" ]; then
  echo "3. Authenticated endpoints"

  ME_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BASE_URL/v1/auth/me")
  check "GET /v1/auth/me" "200" "$ME_STATUS"

  PIPELINE_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BASE_URL/v1/pipeline")
  check "GET /v1/pipeline" "200" "$PIPELINE_STATUS"

  PROJECTS_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BASE_URL/v1/projects?limit=1")
  check "GET /v1/projects" "200" "$PROJECTS_STATUS"

  AUDIT_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BASE_URL/v1/audit?limit=1")
  check "GET /v1/audit" "200" "$AUDIT_STATUS"

  USERS_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BASE_URL/v1/admin/users?limit=1")
  check "GET /v1/admin/users" "200" "$USERS_STATUS"

  INTEGRATIONS_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BASE_URL/v1/admin/integrations/status")
  check "GET /v1/admin/integrations/status" "200" "$INTEGRATIONS_STATUS"

  REPORTS_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BASE_URL/v1/reports/catalogue")
  check "GET /v1/reports/catalogue" "200" "$REPORTS_STATUS"

  METRICS_STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/metrics")
  check "GET /metrics" "200" "$METRICS_STATUS"

  echo ""
fi

# ─── 4. RBAC ─────────────────────────────────────────────────────
echo "4. RBAC enforcement"
UNAUTH_STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/v1/projects")
check "GET /v1/projects without token → 401" "401" "$UNAUTH_STATUS"

echo ""

# ─── Summary ─────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════════════════════════"

if [ $FAIL -gt 0 ]; then
  echo ""
  echo "Failed tests:"
  for t in "${FAILED_TESTS[@]}"; do
    echo "  - $t"
  done
  exit 1
fi

echo ""
echo "✓ All smoke tests passed"
exit 0