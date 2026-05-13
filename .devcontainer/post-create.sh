#!/bin/bash
set -e

echo "🚀 Setting up Leish development environment..."

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Verify environment
echo "🔍 Verifying environment..."
npm run verify-env || echo "⚠️  Some environment variables may be missing. Check .env.local"

# Setup git hooks (optional)
if [ -d ".git" ]; then
    echo "🔧 Setting up git hooks..."
    git config --local core.hooksPath .githooks || true
fi

# Display helpful info
echo ""
echo "✅ Dev container setup complete!"
echo ""
echo "📝 Available commands:"
echo "   npm run dev      - Start development server"
echo "   npm run build    - Build for production"
echo "   npm run test     - Run tests"
echo "   npm run lint     - Run ESLint"
echo "   npm run typecheck - Run TypeScript checks"
echo ""
echo "🔗 Useful URLs:"
echo "   App: http://localhost:3000"
echo ""
