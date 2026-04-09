# 🏆 Wrestle Rumble

> **WWE-Inspired Card Battle Platform**

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

## 📋 About

Wrestle Rumble is a **WWE-themed card battle game** where players:

- 🃏 Collect wrestler cards with unique stats and abilities
- 📦 Open daily packs to build their collection
- ⚔️ Battle friends in PvP arena matches
- 🏆 Climb the leaderboard for rewards
- 💰 Manage coins and economy

**Built with:** Next.js 14 + React 18 + Tailwind CSS + FastAPI + PostgreSQL

---

## 🚀 Quick Start

### Frontend (Next.js)

```bash
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Backend (FastAPI)

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or: .venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open [http://localhost:8000](http://localhost:8000)

---

## 📁 Project Structure

```
Wrestle-Rumble/
├── apps/
│   ├── web/              # Next.js frontend
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   ├── public/       # Static assets
│   │   └── package.json
│   └── api/              # FastAPI backend
│       ├── app/          # API routes
│       ├── models/       # SQLAlchemy models
│       └── requirements.txt
├── Database-architecture/
│   └── schema.sql        # Database schema
├── .env.example          # Environment variables template
├── .gitignore
├── package.json          # Root workspace
└── README.md
```

---

## 🎯 Features (Planned)

### MVP Phase 1
- [ ] User authentication (JWT)
- [ ] Wrestler card catalog
- [ ] Player profiles & collections
- [ ] Daily pack opening
- [ ] Coin economy system

### MVP Phase 2
- [ ] Friend system
- [ ] Trading flow (friend-only)
- [ ] PvP arena battles
- [ ] Leaderboard
- [ ] Match history

### Future
- [ ] Tournament mode
- [ ] Seasonal events
- [ ] NFT integration (optional)
- [ ] Mobile app (React Native)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend** | FastAPI, SQLAlchemy, Pydantic |
| **Database** | PostgreSQL 15 |
| **Auth** | JWT, bcrypt |
| **Deployment** | Vercel (frontend), Railway/Render (backend) |

---

## 📦 Environment Variables

Copy `.env.example` to `.env` in each app folder:

### Frontend (`apps/web/.env`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (`apps/api/.env`)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/wrestle_rumble
JWT_SECRET=your-secret-key
```

---

## 🎨 Design

**Fonts:**
- Inter (body text)
- Oswald (headings)
- Russo One (display/accent)

**Colors:** WWE-inspired (black, red, gold, white)

**Assets:**
- Intro video in `/intro video/`
- Game music in `/game musics/`

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Contact

**Developer:** Rafi (SSS-R)  
**GitHub:** [@SSS-R](https://github.com/SSS-R)

---

**Built with ❤️ for WWE fans and card game enthusiasts**
