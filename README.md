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


## 🎯 Core Features (Backend & Logic)

Wrestle Rumble is built with a focus on robust backend systems and relational data integrity:

- **🔐 Authentication & User Management**: Secure registration and login flows with persistent user profile and statistics storage.
- **🎴 Relational Card Collection**: A comprehensive system for managing a WWE card catalog, including rarity tiers, attributes (Attack/Defense), and unique special abilities.
- **📦 Automated Acquisition Logic**: Backend-enforced constraints for daily pack rewards and randomized loot generation algorithms.
- **💰 Transaction-Safe Economy**: A coin-based ledger system for all buy/sell operations, ensuring ACID properties and data integrity.
- **🤝 Atomic Trading Protocol**: A secure exchange system allowing friends to trade cards and coins through a centralized transaction handler.
- **🏟️ Arena & Matchmaking**: A server-side engine for matchmaking, calculating PvP battle outcomes, and updating trophy/coin rewards.
- **📈 Persistent Leaderboard**: Dynamic aggregation and ranking of users based on trophy counts stored in the database.

## 🗄️ Database Architecture

The project features a highly normalized relational schema designed for scalability and performance.

- **[EER Diagram (Image)](file:///d:/Wrestle-Rumble/Database-architecture/EER%20Diagram.jpg)**
- **[EER Diagram (PDF)](file:///d:/Wrestle-Rumble/Database-architecture/EER.pdf)**
- **[Schema Map (Image)](file:///d:/Wrestle-Rumble/Database-architecture/schema%20map.png)**
- **[Schema Map (PDF)](file:///d:/Wrestle-Rumble/Database-architecture/Schema%20map.pdf)**

## 🛠️ Planned Tech Stack

- **Frontend**: Next.js + React + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL (Relational storage)

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
