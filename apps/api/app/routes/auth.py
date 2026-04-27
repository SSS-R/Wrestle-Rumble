from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg
from ..database import get_db
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
    role = "player"
    
    async with conn.transaction():
        user = await conn.fetchrow(
            """
            INSERT INTO users (name, email, password)
            VALUES ($1, $2, $3)
            RETURNING id, name, email
            """,
            user_data.name, user_data.email, hashed
        )
        
        if role == "admin":
            await conn.execute("INSERT INTO admins (id) VALUES ($1)", user['id'])
            player_data = None
            coins = 0
        else:
            player = await conn.fetchrow(
                """
                INSERT INTO players (id, age, trophy)
                VALUES ($1, $2, $3)
                RETURNING id, age, trophy
                """,
                user['id'], 18, 0
            )
            inventory = await conn.fetchrow(
                """
                INSERT INTO inventories (player_id, coins)
                VALUES ($1, $2)
                RETURNING id, coins
                """,
                player['id'], 500
            )
            player_data = PlayerResponse.model_validate(dict(player))
            coins = inventory['coins']
        
    return AuthResponse(
        user=UserResponse.model_validate(dict(user)),
        player=player_data,
        role=role,
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
        
    admin = await conn.fetchrow("SELECT id FROM admins WHERE id = $1", user['id'])
    if admin:
        return AuthResponse(
            user=UserResponse.model_validate(dict(user)),
            player=None,
            role="admin",
            coins=0
        )
        
    player = await conn.fetchrow("SELECT * FROM players WHERE id = $1", user['id'])
    if player:
        inventory = await conn.fetchrow("SELECT * FROM inventories WHERE player_id = $1", player['id'])
        return AuthResponse(
            user=UserResponse.model_validate(dict(user)),
            player=PlayerResponse.model_validate(dict(player)),
            role="player",
            coins=inventory['coins'] if inventory else 0
        )
        
    raise HTTPException(status_code=500, detail="User role could not be determined")