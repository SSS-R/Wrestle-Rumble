from fastapi import APIRouter, Depends, HTTPException
import asyncpg
from typing import List
import random
from ..database import get_db
from ..schemas import BattleCreate, BattleResponse, BattleResult, LeaderboardEntry
from ..services.combat import calculate_battle_score, calculate_rewards

router = APIRouter(prefix="/api/combat", tags=["combat"])

@router.post("/battle", response_model=BattleResult)
async def start_battle(battle_data: BattleCreate, conn: asyncpg.Connection = Depends(get_db)):
    user_card_entry = await conn.fetchrow(
        "SELECT uc.*, c.attack, c.defense FROM user_cards uc JOIN cards c ON uc.card_id = c.id WHERE uc.id = $1",
        battle_data.user_card_id
    )
    if not user_card_entry:
        raise HTTPException(status_code=404, detail="Card not found")
        
    opponent_card_entry = None
    if battle_data.opponent_id:
        opponent_card_entry = await conn.fetchrow(
            "SELECT uc.*, c.attack, c.defense FROM user_cards uc JOIN cards c ON uc.card_id = c.id WHERE uc.id = $1 AND uc.user_id = $2",
            battle_data.opponent_card_id, battle_data.opponent_id
        )
        if not opponent_card_entry:
            raise HTTPException(status_code=404, detail="Opponent card not found")
    else:
        opponent_cards = await conn.fetch(
            "SELECT uc.*, c.attack, c.defense FROM user_cards uc JOIN cards c ON uc.card_id = c.id WHERE uc.user_id != $1 AND uc.is_active = TRUE",
            user_card_entry['user_id']
        )
        if not opponent_cards:
            opponent_cards = await conn.fetch(
                "SELECT uc.*, c.attack, c.defense FROM user_cards uc JOIN cards c ON uc.card_id = c.id WHERE uc.user_id != $1",
                user_card_entry['user_id']
            )
        if not opponent_cards:
            raise HTTPException(status_code=404, detail="No opponents available")
        opponent_card_entry = random.choice(opponent_cards)

    user_score, opponent_score = calculate_battle_score(dict(user_card_entry), dict(opponent_card_entry))
    user_won = user_score > opponent_score

    user = await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_card_entry['user_id'])
    opponent = await conn.fetchrow("SELECT * FROM users WHERE id = $1", opponent_card_entry['user_id']) if opponent_card_entry else None

    trophies_gained, coins_gained = calculate_rewards(
        user_won,
        user['level'],
        opponent['trophies'] if opponent else None
    )

    if user_won:
        await conn.execute(
            "UPDATE users SET trophies = trophies + $1, coins = coins + $2 WHERE id = $3",
            trophies_gained, coins_gained, user['id']
        )
        result_status = "win"
    else:
        await conn.execute(
            "UPDATE users SET trophies = GREATEST(0, trophies - $1) WHERE id = $2",
            trophies_gained, user['id']
        )
        result_status = "loss"

    battle_id = await conn.fetchval(
        """
        INSERT INTO battles (user_id, opponent_id, user_card_id, opponent_card_id, user_score, opponent_score, result, trophies_gained, coins_gained)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
        """,
        user['id'], opponent['id'] if opponent else None, user_card_entry['id'], opponent_card_entry['id'] if opponent_card_entry else None,
        user_score, opponent_score, result_status, trophies_gained if user_won else -trophies_gained, coins_gained if user_won else 0
    )

    return BattleResult(
        battle_id=battle_id,
        user_won=user_won,
        user_score=user_score,
        opponent_score=opponent_score,
        trophies_gained=trophies_gained if user_won else 0,
        coins_gained=coins_gained if user_won else 0
    )

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(limit: int = 10, conn: asyncpg.Connection = Depends(get_db)):
    users = await conn.fetch("SELECT id, username, trophies FROM users ORDER BY trophies DESC LIMIT $1", limit)
    return [
        LeaderboardEntry(rank=i + 1, user_id=u['id'], username=u['username'], trophies=u['trophies'])
        for i, u in enumerate(users)
    ]

@router.get("/history", response_model=List[BattleResponse])
async def get_battle_history(user_id: int, limit: int = 20, conn: asyncpg.Connection = Depends(get_db)):
    battles = await conn.fetch("SELECT * FROM battles WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2", user_id, limit)
    return [dict(b) for b in battles]