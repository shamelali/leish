#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✅ PASS${NC} $1"; }
fail() { echo -e "${RED}❌ FAIL${NC} $1"; }
warn() { echo -e "${YELLOW}⚠️  WARN${NC} $1"; }

SCORE=0
TOTAL=0

echo "=========================================="
echo "   Leish! Launch Verification Script"
echo "=========================================="
echo ""

# ─── 1. Server Running ───
echo "--- 1. Server Status ---"
TOTAL=$((TOTAL+1))
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q 200; then
  pass "Local server (port 3000) responding"
  SCORE=$((SCORE+1))
else
  fail "Local server not responding"
fi

# ─── 2. PM2 Status ───
TOTAL=$((TOTAL+1))
if pm2 list 2>/dev/null | grep -q "leish-prod.*online"; then
  pass "PM2 leish-prod process online"
  SCORE=$((SCORE+1))
else
  fail "PM2 leish-prod not running"
fi

# ─── 3. Database Connection ───
TOTAL=$((TOTAL+1))
DB_OK=$(python3 -c "
import urllib.request, json
try:
  r = urllib.request.urlopen('http://localhost:3000/api/health', timeout=5)
  d = json.loads(r.read())
  print('ok' if d.get('ok') else 'fail')
except: print('fail')
" 2>/dev/null)
if [ "$DB_OK" = "ok" ]; then
  pass "Database connection (health endpoint)"
  SCORE=$((SCORE+1))
else
  fail "Database connection"
fi

# ─── 4. PostgreSQL Tables ───
TOTAL=$((TOTAL+1))
TABLES=$(PGPASSWORD=leishpassword123 psql -h localhost -U leishuser -d leish -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null | tr -d ' ')
if [ -n "$TABLES" ] && [ "$TABLES" -gt 0 ] 2>/dev/null; then
  pass "PostgreSQL has $TABLES tables"
  SCORE=$((SCORE+1))
else
  fail "No PostgreSQL tables found"
fi

# ─── 5. Env Vars Check ───
TOTAL=$((TOTAL+1))
ENV_FILE="$HOME/Project/theleish/.env.local"
if [ -f "$ENV_FILE" ]; then
  HAS_URL=$(grep -c "NEXT_PUBLIC_SUPABASE_URL=" "$ENV_FILE" 2>/dev/null || true)
  if [ "$HAS_URL" -gt 0 ]; then
    pass ".env.local has Supabase URL"
    SCORE=$((SCORE+1))
  else
    fail ".env.local missing Supabase URL"
  fi
else
  fail ".env.local not found"
fi

# ─── 6. All Pages Load ───
TOTAL=$((TOTAL+1))
ALL_OK=true
for page in "/" "/register" "/sign-in" "/artists" "/booking" "/pricing" "/about" "/privacy" "/terms"; do
  STATUS=$(python3 -c "
import urllib.request
try:
  r = urllib.request.urlopen('http://localhost:3000$page', timeout=5)
  print(r.status)
except: print('fail')
" 2>/dev/null)
  if [ "$STATUS" != "200" ]; then ALL_OK=false; break; fi
done
if $ALL_OK; then
  pass "All 9 pages return 200"
  SCORE=$((SCORE+1))
else
  fail "Some pages not returning 200"
fi

# ─── 7. API Routes ───
TOTAL=$((TOTAL+1))
API_OK=true
for api in "/api/health" "/api/providers"; do
  STATUS=$(python3 -c "
import urllib.request
try:
  r = urllib.request.urlopen('http://localhost:3000$api', timeout=5)
  print(r.status)
except: print('fail')
" 2>/dev/null)
  if [ "$STATUS" != "200" ]; then API_OK=false; break; fi
done
if $API_OK; then
  pass "API routes (health, providers)"
  SCORE=$((SCORE+1))
else
  fail "API routes failing"
fi

# ─── 8. Sitemap & Robots ───
TOTAL=$((TOTAL+1))
SEO_OK=true
for route in "/api/sitemap" "/api/robots"; do
  STATUS=$(python3 -c "
import urllib.request
try:
  r = urllib.request.urlopen('http://localhost:3000$route', timeout=5)
  print(r.status)
except: print('fail')
" 2>/dev/null)
  if [ "$STATUS" != "200" ]; then SEO_OK=false; break; fi
done
if $SEO_OK; then
  pass "Sitemap & robots.txt"
  SCORE=$((SCORE+1))
else
  fail "Sitemap/robots not serving"
fi

# ─── 9. Nginx Check ───
TOTAL=$((TOTAL+1))
if which nginx >/dev/null 2>&1; then
  if ss -tln 2>/dev/null | grep -q ":80 "; then
    pass "Nginx installed and running on port 80"
    SCORE=$((SCORE+1))
  else
    warn "Nginx installed but not running"
  fi
else
  warn "Nginx not installed (needed for production)"
fi

# ─── 10. PM2 Startup ───
TOTAL=$((TOTAL+1))
if systemctl is-enabled pm2-shamelali 2>/dev/null | grep -q enabled; then
  pass "PM2 startup configured"
  SCORE=$((SCORE+1))
else
  warn "PM2 startup not configured (run: sudo pm2 startup)"
fi

# ─── 11. Providers API Returns Data ───
TOTAL=$((TOTAL+1))
COUNT=$(python3 -c "
import urllib.request, json
try:
  r = urllib.request.urlopen('http://localhost:3000/api/providers', timeout=5)
  d = json.loads(r.read())
  print(len(d))
except: print('error')
" 2>/dev/null)
if [ "$COUNT" != "error" ]; then
  if [ "$COUNT" -gt 0 ] 2>/dev/null; then
    pass "Providers API returns $COUNT artist(s)"
    SCORE=$((SCORE+1))
  else
    warn "Providers API returns empty (no seed data)"
  fi
else
  fail "Providers API error"
fi

# ─── 12. Git Status ───
TOTAL=$((TOTAL+1))
UNCOMMITTED=$(git -C "$HOME/Project/theleish" status --porcelain 2>/dev/null | grep -v "leish_fixes" | grep -v "package-lock.json" | head -5)
if [ -z "$UNCOMMITTED" ]; then
  pass "Git working tree clean"
  SCORE=$((SCORE+1))
else
  warn "Uncommitted changes: $UNCOMMITTED"
fi

echo ""
echo "=========================================="
echo -e "   Score: ${GREEN}$SCORE/$TOTAL${NC} checks passing"
echo "=========================================="

if [ "$SCORE" -lt "$TOTAL" ]; then
  echo ""
  echo "Issues to fix:"
  for page in "/" "/register" "/sign-in" "/artists" "/booking" "/pricing" "/about" "/privacy" "/terms"; do
    STATUS=$(python3 -c "
import urllib.request
try:
  r = urllib.request.urlopen('http://localhost:3000$page', timeout=5)
  print(r.status)
except: print('fail')
" 2>/dev/null)
    [ "$STATUS" != "200" ] && fail "$page = $STATUS"
  done
fi
