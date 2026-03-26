#!/bin/bash
# ============================================================
# ACL Vibe Demo — GitHub Repository Setup
# Run this from the acl-vibe-demo/ directory on your machine
# ============================================================

set -e

REPO_NAME="acl-vibe-demo"
ORG="acldigital"  # Change to your GitHub org or username

echo "🔧 Creating GitHub repo: $ORG/$REPO_NAME"
gh repo create "$ORG/$REPO_NAME" --private --description "ACL Vibe — Enterprise AI Governance Platform with NemoClaw SDLC Agents" --source=. --push

echo ""
echo "✅ Repository created and pushed!"
echo "   https://github.com/$ORG/$REPO_NAME"
echo ""
echo "Next steps:"
echo "  1. Add collaborators: gh repo edit $ORG/$REPO_NAME --add-team <team>"
echo "  2. Set branch protection: Settings → Branches → main"
echo "  3. Connect to Vercel: vercel link --project acl-vibe-demo"
