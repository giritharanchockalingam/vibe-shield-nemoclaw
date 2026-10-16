# VibeShield — AI Agent Governance for the SDLC

[![CI](https://github.com/giritharanchockalingam/vibe-shield-nemoclaw/actions/workflows/ci.yml/badge.svg)](https://github.com/giritharanchockalingam/vibe-shield-nemoclaw/actions/workflows/ci.yml)

**See, control and prove what AI coding agents do before they touch your code.**
A governance console for AI agents across the software lifecycle: streaming SDLC agents,
a security scan on generated code, an audit trail mapped to SOC 2 controls,
a CISO policy view and FinOps tracking, modeled on NVIDIA NemoClaw's isolation layers.

**Live demo:** [vibeshield.vercel.app](https://vibeshield.vercel.app)

| What is real | What is demonstrated |
|---|---|
| Streaming agents (Anthropic), 20-rule OWASP-mapped code scan, audit trail and metrics in Supabase, Supabase auth | Kernel isolation layers (Landlock, seccomp, network namespaces) run as scripted scenarios behind `DEMO_MODE`; the API refuses to fake enforcement outside it |

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, Framer Motion, Recharts
- Backend: FastAPI, Pydantic v2, Anthropic SDK, Supabase
- Auth: Supabase Auth (email/password, OAuth, demo login set by `VITE_DEMO_EMAIL` / `VITE_DEMO_PASSWORD`)
- Tests and CI: pytest on the backend governance paths, frontend type-check and build, on every push
- Theme: Dark-first UI (`#08090f`), Inter/DM Sans, DM Serif Display, JetBrains Mono

## Key Features

- **Public Landing Page** — Hero, animated terminal preview, feature grid, architecture visualization
- **Dashboard** — Post-login overview with live governance metrics, threat pulse, sandbox status
- **Demo Console** — 20 scenarios across 4 verticals with real-time agent streaming
- **SDLC Agents** — Code completion, security scan, quality review, test generation, reverse engineering
- **Governance Agent** — Conversational AI with 14 built-in governance tools
- **Audit Trail** — Event log with SOC 2 compliance mapping and evidence export
- **CISO Command Center** — Policy enforcement, SIEM, compliance dashboards
- **Integrations Hub** — 30+ connectors (GitHub, Jira, Slack, Datadog, etc.)
- **ROI Calculator** — Citation-backed projections (McKinsey, DORA, Forrester)

## NemoClaw 4-Layer Isolation (modeled; scripted in demo mode)

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

Frontend and backend deploy to Vercel from `main`. Set the variables in each `.env.example`
in the Vercel project settings; never commit them.

## Design notes

See [`docs/`](docs/): enterprise-readiness review, hardening plan and the demo-experience PRD.
