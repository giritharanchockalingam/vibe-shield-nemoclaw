#!/bin/bash
# ============================================================
# VibeShield NemoClaw — GitHub Repository Setup
# Run this from the vibe-shield-nemoclaw/ directory on your machine
# ============================================================

set -e

REPO_NAME="vibe-shield-nemoclaw"
OWNER="giritharanchockalingam"

echo "🔧 Creating GitHub repo: $OWNER/$REPO_NAME"
gh repo create "$OWNER/$REPO_NAME" --public --description "VibeShield — Enterprise AI Agent Governance Platform powered by NemoClaw" --source=. --push

echo ""
echo "✅ Repository created and pushed!"
echo "   https://github.com/$OWNER/$REPO_NAME"
echo ""
echo "Next steps:"
echo "  1. Connect to Vercel: vercel link --project vibeshield"
echo "  2. Set branch protection: Settings → Branches → main"
echo "  3. Set Vercel env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, ANTHROPIC_API_KEY"
