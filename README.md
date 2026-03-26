# ACL Vibe Demo Platform

A full-stack scaffold for building an ACL-driven multi-vertical demo platform.

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, Framer Motion, Recharts
- Backend: FastAPI, Pydantic v2, Anthropic SDK, Supabase
- Theme: Dark-first UI (`#0a0b14`), DM Sans, DM Serif Display, JetBrains Mono

## Verticals

- `edtech`
- `retail`
- `manufacturing`
- `travel`

## Project Structure

```txt
.
├── backend
│   ├── .env.example
│   ├── main.py
│   └── requirements.txt
├── frontend
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src
│       ├── App.tsx
│       ├── main.tsx
│       └── styles
│           └── globals.css
└── supabase
    ├── migrations
    └── seed
```

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

## Notes

- This repository is intentionally scaffold-only and ready for feature implementation.
- `supabase/migrations` and `supabase/seed` are prepared for SQL migration and seed scripts.
