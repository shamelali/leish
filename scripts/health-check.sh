#!/usr/bin/env bash
# Health check script for all Leish apps
# Usage: ./scripts/health-check.sh [environment]
# Environment: dev (default), staging, production

set -euo pipefail

ENV="${1:-dev}"

case "$ENV" in
  dev)
    WEB_URL="http://localhost:3005"
    ARTIST_URL="http://localhost:3001"
    STUDIO_URL="http://localhost:3002"
    ;;
  staging|production)
    WEB_URL="https://www.leish.my"
    ARTIST_URL="https://artist.leish.my"
    STUDIO_URL="https://studio.leish.my"
    ;;
  *)
    echo "Usage: $0 [dev|staging|production]"
    exit 1
    ;;
esac

echo "=== Leish Health Check ($ENV) ==="
echo ""

check_endpoint() {
  local name="$1"
  local url="$2"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  if [ "$status" = "200" ]; then
    echo "✓ $name: $url (HTTP $status)"
  else
    echo "✗ $name: $url (HTTP $status)"
    return 1
  fi
}

errors=0

check_endpoint "Web Health" "$WEB_URL/api/health" || ((errors++))
check_endpoint "Web Auth" "$WEB_URL/api/auth/credential-stuffing" || ((errors++))
check_endpoint "Artist" "$ARTIST_URL" || ((errors++))
check_endpoint "Studio" "$STUDIO_URL" || ((errors++))

echo ""
if [ "$errors" -gt 0 ]; then
  echo "FAILED: $errors endpoint(s) unhealthy"
  exit 1
else
  echo "ALL OK"
fi
