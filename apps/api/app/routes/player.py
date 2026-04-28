from fastapi import APIRouter, Depends, HTTPException
import asyncpg
from pydantic import BaseModel
from typing import Optional
from ..database import get_db

router = APIRouter(prefix="/api/player", tags=["player"])

class ProfileCard(BaseModel):
    id: int
    name: str
    att: int
    def_: int
    finisher: Optional[str]
    signature: Optional[str]
    image: Optional[str]
    rarity: str
    type: str
    price: int
    total_played: int
    total_wins: int

class ProfileResponse(BaseModel):
    id: int
    username: str
    age: int
    trophy: int
    highest_trophy: int
    coins: int
    total_matches: int
    total_wins: int
    win_rate: float
    best_card: Optional[ProfileCard]

@router.get("/{player_id}/profile", response_model=ProfileResponse)
async def get_player_profile(player_id: int, conn: asyncpg.Connection = Depends(get_db)):
    # 1. Fetch User and Player basic info
    user_data = await conn.fetchrow(
        """
        SELECT u.id, u.name as username, p.age, p.trophy, p.highest_trophy 
        FROM users u
        JOIN players p ON u.id = p.id
        WHERE u.id = $1
        """,
        player_id
    )
    
    if not user_data:
        raise HTTPException(status_code=404, detail="Player not found")
        
    # 2. Fetch Inventory Coins
    inventory = await conn.fetchrow(
        "SELECT coins FROM inventories WHERE player_id = $1",
        player_id
    )
    coins = inventory['coins'] if inventory else 0
        
    # 3. Calculate Win Rate & Matches
    match_stats = await conn.fetchrow(
        """
        SELECT 
            COUNT(m.id) as total_matches,
            SUM(CASE WHEN m.winner_id = $1 THEN 1 ELSE 0 END) as total_wins
        FROM player_matches pm
        JOIN matches m ON pm.match_id = m.id
        WHERE pm.player_id = $1
        """,
        player_id
    )
    
    total_matches = match_stats['total_matches'] or 0
    total_wins = match_stats['total_wins'] or 0
    win_rate = (total_wins / total_matches * 100) if total_matches > 0 else 0.0

    # 4. Fetch Best Card
    best_card_row = await conn.fetchrow(
        """
        SELECT c.id, c.name, c.att, c.def as def_, c.finisher, c.signature, c.image, c.rarity, c.type, c.price,
               COUNT(m.id) as total_played,
               SUM(CASE WHEN m.winner_id = $1 THEN 1 ELSE 0 END) as total_wins
        FROM player_matches pm
        JOIN matches m ON pm.match_id = m.id
        JOIN cards c ON pm.card_id = c.id
        WHERE pm.player_id = $1 AND pm.card_id IS NOT NULL
        GROUP BY c.id
        ORDER BY (SUM(CASE WHEN m.winner_id = $1 THEN 1 ELSE 0 END)::float / NULLIF(COUNT(m.id), 0)) DESC, SUM(CASE WHEN m.winner_id = $1 THEN 1 ELSE 0 END) DESC
        LIMIT 1
        """,
        player_id
    )
    
    best_card = dict(best_card_row) if best_card_row else None
    
    return {
        "id": user_data['id'],
        "username": user_data['username'],
        "age": user_data['age'],
        "trophy": user_data['trophy'],
        "highest_trophy": user_data['highest_trophy'],
        "coins": coins,
        "total_matches": total_matches,
        "total_wins": total_wins,
        "win_rate": round(win_rate, 1),
        "best_card": best_card
    }
