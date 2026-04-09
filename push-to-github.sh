#!/bin/bash
# ============================================================
# Push VibeShield NemoClaw to GitHub
# Run from: vibe-shield-nemoclaw/ directory
# ============================================================
set -e

# Remove stale lock file if present
rm -f .git/index.lock

# Configure git
git config user.email "giritharan.chockalingam@gmail.com"
git config user.name "Giritharan Chockalingam"

# Stage everything
git add -A

# Create initial commit
git commit -m "Initial commit — VibeShield NemoClaw Governance Platform

Full-stack app with React/Vite frontend and FastAPI backend:
- Public landing page with hero, terminal preview, feature grid
- Post-login dashboard with live governance metrics
- NemoClaw Governance Agent with real LLM integration
- 5 SDLC Agents: Code Completion, Security Scan, QA Review, Test Gen, Reverse Engineer
- Kernel-level 4-layer isolation: Landlock, seccomp, netns, OpenShell
- Immutable audit trail with SOC 2 compliance mapping
- CISO Command Center with threat visualization
- DORA metrics, citation-backed ROI analytics
- Supabase Auth with protected routes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

# Set remote and push
git remote add origin https://github.com/giritharanchockalingam/vibe-shield-nemoclaw.git 2>/dev/null || true
git branch -M main
git push -u origin main

echo ""
echo "✅ Pushed to https://github.com/giritharanchockalingam/vibe-shield-nemoclaw"
