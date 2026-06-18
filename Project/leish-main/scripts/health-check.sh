#!/bin/bash
# health-check.sh - Verify deployment

BASE_URL="${1:-https://leish.my}"

echo "🏥 Health Check: $BASE_URL"
echo "================================"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

pass=0
fail=0

check() {
    local url=$1
    local expected=$2
    local desc=$3
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    if [ "$status" = "$expected" ]; then
        echo -e "${GREEN}✅${NC} $desc"
        ((pass++))
    else
        echo -e "${RED}❌${NC} $desc (HTTP $status)"
        ((fail++))
    fi
}

check "$BASE_URL/" "200" "Homepage"
check "$BASE_URL/sign-up" "200" "Sign-up page"
check "$BASE_URL/sign-in" "200" "Sign-in page"
check "$BASE_URL/book" "200" "Booking page"
check "$BASE_URL/artists" "200" "Artists page"
check "$BASE_URL/api/debug/env" "200" "API health"

echo ""
echo "================================"
if [ "$fail" -eq 0 ]; then
    echo -e "${GREEN}🚀 ALL SYSTEMS GO${NC} - $pass checks passed"
else
    echo -e "${RED}🔧 ISSUES FOUND${NC} - $fail checks failed"
fi
