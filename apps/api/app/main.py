from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import engine, Base
from .routes import auth, combat, packs
from .models import Wrestler, Card

app = FastAPI(
    title="Wrestle Rumble API",
    version="0.1.0",
    description="Backend API for the Wrestle Rumble WWE-themed card game MVP.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(combat.router)
app.include_router(packs.router)


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


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
