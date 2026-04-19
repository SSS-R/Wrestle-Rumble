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


## 🎯 Project Features

The initial phase of the project focuses on the following core features:

### 1. User Authentication and Profiles
- **User Registration**: Ability for a Person to sign up and create an account.
- **Login/Logout**: Secure access to the platform.
- **User Profile**: A dedicated page where users can view their statistics and card collection.

### 2. Card Management
This involves managing the collection of WWE cards.
- **Card Catalog**: A public-facing page showcasing all available WWE cards, including their stats, rarity, and associated wrestler.
- **User Collection View**: A private section allowing a logged-in user to view the specific cards they own.
- **Card Data Model**: Each card will have attributes such as:
  - Wrestler Name
  - Attack/Defense Stats
  - Rarity (e.g., Common, Rare, Legendary)
  - Special Ability Text (signature + finisher)

### 3. Basic Trading/Acquisition
The MVP (Minimum Viable Product) will feature a straightforward method for users to acquire cards.
- **Daily Pack Opening**: A feature allowing users to open one free pack per day to receive a random set of cards. This will be recorded in the database.
- **Card Store (Buy/Sell)**: A feature where a user can sell and buy cards with coins.
- **Friend-Only Trading/Exchange**: Users can only trade if they are friends, with the exchange functionality accessed from the friends chat and dashboard. The interface will be presented as a modal.

### 4. Arena/Combat Feature
This feature allows users to engage in player-vs-player combat.
- **User Combat**: Users can fight with each other.
- **Rewards**: After winning a fight, users will receive a trophy and some coins.
- **Leaderboard**: A leaderboard will be maintained based on the number of trophies a user has acquired.
- **Coin Utility**: Earned coins can be used to open card packs or buy cards from the card shop.

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
