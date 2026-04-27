from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg
from ..database import get_db
from .. import crud
from ..schemas import UserCreate, UserResponse, UserLogin, AuthResponse, PlayerResponse
import bcrypt

router = APIRouter(prefix="/api/auth", tags=["authentication"])

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserCreate, conn: asyncpg.Connection = Depends(get_db)):
    existing = await conn.fetchrow(
        "SELECT id FROM users WHERE name = $1 OR email = $2",
        user_data.name, user_data.email
    )
    
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    hashed = hash_password(user_data.password)
    
        user_dict, player_dict, coins = await crud.create_user_with_player_inventory(conn, user_data, hashed)
        
    return AuthResponse(
        user=UserResponse.model_validate(user_dict),
        player=PlayerResponse.model_validate(player_dict),
        coins=coins
    )

@router.post("/login", response_model=AuthResponse)
async def login(login_data: UserLogin, conn: asyncpg.Connection = Depends(get_db)):
    user = await conn.fetchrow(
        "SELECT * FROM users WHERE name = $1",
        login_data.name
    )
    
    if not user or not verify_password(login_data.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    player = await conn.fetchrow("SELECT * FROM players WHERE id = $1", user['id'])
    inventory = await conn.fetchrow("SELECT * FROM inventories WHERE player_id = $1", player['id'])
    
    return AuthResponse(
        user=UserResponse.model_validate(dict(user)),
        player=PlayerResponse.model_validate(dict(player)),
        coins=inventory['coins'] if inventory else 0
    )

@router.get("/user/{user_id}", response_model=AuthResponse)
async def get_user(user_id: int, conn: asyncpg.Connection = Depends(get_db)):
    user = await conn.fetchrow(
        "SELECT id, name, email FROM users WHERE id = $1",
        user_id
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    player = await conn.fetchrow("SELECT * FROM players WHERE id = $1", user['id'])
    inventory = await conn.fetchrow("SELECT * FROM inventories WHERE player_id = $1", player['id'])
    
    return AuthResponse(
        user=UserResponse.model_validate(dict(user)),
        player=PlayerResponse.model_validate(dict(player)),
        coins=inventory['coins'] if inventory else 0
    )