from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg
from ..database import get_db
import bcrypt

router = APIRouter(prefix="/api/auth", tags=["authentication"])

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, conn: asyncpg.Connection = Depends(get_db)):
    existing = await conn.fetchrow(
        "SELECT id FROM users WHERE username = $1 OR email = $2",
        user_data.username, user_data.email
    )
    
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    hashed = hash_password(user_data.password)
    user = await conn.fetchrow(
        """
        INSERT INTO users (username, email, hashed_password)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, level, coins, trophies, created_at
        """,
        user_data.username, user_data.email, hashed
    )
    
    return dict(user)

@router.post("/login", response_model=UserResponse)
async def login(login_data: UserLogin, conn: asyncpg.Connection = Depends(get_db)):
    user = await conn.fetchrow(
        "SELECT * FROM users WHERE username = $1",
        login_data.username
    )
    
    if not user or not verify_password(login_data.password, user['hashed_password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return dict(user)

@router.get("/user/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, conn: asyncpg.Connection = Depends(get_db)):
    user = await conn.fetchrow(
        "SELECT id, username, email, level, coins, trophies, created_at FROM users WHERE id = $1",
        user_id
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return dict(user)