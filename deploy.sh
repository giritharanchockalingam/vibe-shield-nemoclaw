#!/bin/bash
# VibeShield NemoClaw — One-command Vercel Deployment
# Run from: vibe-shield-nemoclaw/
set -e

echo "🚀 VibeShield NemoClaw — Deploying to Vercel..."

# Ensure we're in the frontend directory
cd "$(dirname "$0")/frontend"

# Install deps if needed
[ -d node_modules ] || npm install

# Build
echo "📦 Building production bundle..."
npm run build

# Deploy to Vercel
echo "☁️  Deploying to Vercel..."
npx vercel deploy --prod --yes

echo ""
echo "✅ Deployment complete!"
echo ""
echo "⚠️  Don't forget to set these environment variables in Vercel Dashboard → Settings → Environment Variables:"
echo "   VITE_SUPABASE_URL = https://sxobexkdfoegpvbzedig.supabase.co"
echo "   VITE_SUPABASE_ANON_KEY = (your anon key from .env)"
echo ""
echo "Then redeploy: npx vercel deploy --prod"
