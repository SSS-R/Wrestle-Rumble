from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncpg
from .config import settings
from .routes import auth, combat, packs, chat, admin, player

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create connection pool
    try:
        app.state.db_pool = await asyncpg.create_pool(settings.DATABASE_URL)
        print("Database connected")
    except Exception as e:
        print(f"Database connection failed: {e}")
        app.state.db_pool = None
    yield
    # Shutdown: close connection pool
    if app.state.db_pool:
        await app.state.db_pool.close()

app = FastAPI(
    title="Wrestle Rumble API",
    version="0.1.0",
    description="Backend API for the Wrestle Rumble WWE-themed card game MVP.",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(combat.router)
app.include_router(packs.router)
app.include_router(chat.router)
app.include_router(admin.router)
app.include_router(player.router)


@app.get("/")
def root():
    return {
        "message": "Wrestle Rumble API",
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/auth",
            "combat": "/api/combat",
            "packs": "/api/packs"
        }
    }


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "wrestle-rumble-api"}
