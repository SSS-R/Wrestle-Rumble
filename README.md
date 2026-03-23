# Wrestle Rumble

Wrestle Rumble is an MVP-focused full-stack WWE-themed card game platform.

## Planned stack

- Frontend: Next.js + React + Tailwind CSS
- Backend: FastAPI
- Database: PostgreSQL

## MVP features

- User authentication and profiles
- Card catalog and player collections
- Daily pack opening and coin economy
- Friend-only trading flow
- PvP arena battles and leaderboard

## Repository structure

```text
Wrestle-Rumble/
├─ apps/
│  ├─ api/              # FastAPI backend
│  └─ web/              # Next.js frontend
├─ docs/                # Product, design, and planning docs
├─ intro video/         # Source brand/video assets
├─ .env.example         # Shared environment variable template
├─ .gitignore
├─ package.json         # Frontend workspace scripts
└─ README.md
```

## Getting started

### Frontend

```bash
npm install
npm run dev:web
```

### Backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r apps/api/requirements.txt
uvicorn app.main:app --reload --app-dir apps/api
```

## Current status

This repository is now scaffolded for the first implementation phase. The next recommended step is wiring the authentication, core domain models, and PostgreSQL configuration.
