# VibeShield — NemoClaw Governance Platform

Enterprise AI agent governance platform powered by NVIDIA NemoClaw. Governs AI agents across your entire SDLC with kernel-level isolation, immutable audit trails, and real-time compliance mapping.

**Live:** [vibeshield.vercel.app](https://vibeshield.vercel.app)

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, Framer Motion, Recharts
- Backend: FastAPI, Pydantic v2, Anthropic SDK, Supabase
- Auth: Supabase Auth (email/password, OAuth, demo credentials)
- Theme: Dark-first UI (`#08090f`), Inter/DM Sans, DM Serif Display, JetBrains Mono

## Key Features

- **Public Landing Page** — Hero, animated terminal preview, feature grid, architecture visualization
- **Dashboard** — Post-login overview with live governance metrics, threat pulse, sandbox status
- **Demo Console** — 20 scenarios across 4 verticals with real-time agent streaming
- **SDLC Agents** — Code completion, security scan, quality review, test generation, reverse engineering
- **Governance Agent** — Conversational AI with 14 built-in governance tools
- **Immutable Audit Trail** — Event log with SOC 2 compliance mapping and evidence export
- **CISO Command Center** — Policy enforcement, SIEM, compliance dashboards
- **Integrations Hub** — 30+ connectors (GitHub, Jira, Slack, Datadog, etc.)
- **ROI Calculator** — Citation-backed projections (McKinsey, DORA, Forrester)

## NemoClaw 4-Layer Isolation

1. **Landlock** — Filesystem isolation (writes confined to `/sandbox/` and `/tmp/`)
2. **Seccomp** — Syscall filtering (blocks ptrace, mount, unshare, setns)
3. **NetNS** — Network namespacing (deny-all egress, allowlist only)
4. **OpenShell** — Policy engine (prompt injection detection, credential scanning, rate limiting)

## Verticals

- EdTech, Retail, Manufacturing, Travel, Healthcare, Finance, Logistics, Energy, Government, Defense (5 prompts each × 3 agent types)

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Environment Setup

- Copy `frontend/.env.example` to `frontend/.env`
- Copy `backend/.env.example` to `backend/.env`
- Fill in Supabase and Anthropic credentials

## Deployment

```bash
# Push to GitHub (triggers Vercel auto-deploy)
git add -A && git commit -m "your message" && git push

# Or deploy directly
bash deploy.sh
```
