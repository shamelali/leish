#!/bin/bash
set -e

echo "=== Local CI Pipeline ==="
echo ""

export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"
export CI="true"

cd "$(dirname "$0")/.."

echo "1/4 Typecheck..."
npm run typecheck 2>&1 || exit 1

echo ""
echo "2/4 Lint..."
npm run lint 2>&1 || exit 1

echo ""
echo "3/4 Test..."
npx vitest run --exclude '**/booking*.test.ts' --exclude '**/registration.test.ts' --exclude '**/*.load.test.ts' 2>&1 || exit 1

echo ""
echo "4/4 Build..."
npm run build 2>&1 || exit 1

echo ""
echo "=== All checks passed ==="
