#!/bin/bash
# deploy.sh - Manual deployment fallback
set -e

APP_DIR="/home/shamelali/Project/leish"
PM2_APP="leish-prod"

echo "🚀 Starting deployment..."

cd "$APP_DIR"

echo "📦 Pulling latest code..."
git pull origin main

echo "🧹 Cleaning old build..."
rm -rf .next node_modules/.cache

echo "📥 Installing dependencies..."
npm ci

echo "🔨 Building for production..."
npm run build

echo "🔄 Restarting PM2..."
pm2 restart "$PM2_APP" || pm2 start npm --name "$PM2_APP" -- run start
pm2 save

echo "✅ Deployment complete!"
echo ""
echo "Health check:"
curl -s http://localhost:3000/api/debug/env | head -c 100
echo ""
pm2 status
