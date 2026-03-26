#!/bin/bash
# ============================================================
# Push ACL Vibe Demo to GitHub
# Run from: acl-vibe-demo/ directory
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
git commit -m "Initial commit — ACL Vibe Enterprise AI Governance Platform

Full-stack app with React/Vite frontend and FastAPI backend:
- NemoClaw Governance Agent with real LLM integration (Claude, GPT-4o, Groq, Gemini)
- 5 SDLC Agents: Code Completion, Security Scan, QA Review, Test Gen, Reverse Engineer
- VS Code-like IDE workspace with file tree, GitHub actions, Jira, test suite
- Kernel-level 4-layer isolation: Landlock, seccomp, netns, OpenShell
- Dynamic governance scoring from live Supabase data
- Supabase Auth with protected routes, demo credentials
- Immutable audit trail with SOC 2 compliance mapping
- DORA metrics, citation-backed ROI analytics

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

# Set remote and push
git remote add origin https://github.com/giritharanchockalingam/acl-vibe-demo.git 2>/dev/null || true
git branch -M main
git push -u origin main

echo ""
echo "✅ Pushed to https://github.com/giritharanchockalingam/acl-vibe-demo"
