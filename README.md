# 🏆 Wrestle Rumble

> **Wrestle Rumble is an MVP-focused full-stack WWE-themed card game platform.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwind-css)](https://tailwindcss.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org)

---

## 🎮 Live Demo

**👉 [View Live Demo](https://sss-r.github.io/Wrestle-Rumble)**

A frontend showcase of the Wrestle Rumble card battle platform.

---


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
