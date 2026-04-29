from fastapi import APIRouter, Depends, HTTPException
import asyncpg
from typing import List
import random
from datetime import datetime
from ..database import get_db
from .. import crud
from ..schemas import BattleCreate, BattleResult, LeaderboardEntry
from ..services.combat import calculate_battle_score, calculate_rewards, generate_battle_events

router = APIRouter(prefix="/api/combat", tags=["combat"])

@router.post("/battle", response_model=BattleResult)
async def start_battle(battle_data: BattleCreate, conn: asyncpg.Connection = Depends(get_db)):
    # 1. Fetch User's active card from inventory
    user_inventory = await conn.fetchrow("SELECT id FROM inventories WHERE player_id = $1", battle_data.player_id)
    if not user_inventory:
        raise HTTPException(status_code=404, detail="Player inventory not found")
        
    user_card_entry = await conn.fetchrow(
        "SELECT ic.*, c.att, c.def as defense FROM inventory_cards ic JOIN cards c ON ic.card_id = c.id WHERE ic.inventory_id = $1 AND ic.card_id = $2",
        user_inventory['id'], battle_data.user_card_id
    )
    if not user_card_entry:
        raise HTTPException(status_code=404, detail="Card not found in inventory")
        
    # 2. Fetch Opponent Card
    opponent_card_entry = None
    if battle_data.opponent_id:
        opp_inventory = await conn.fetchrow("SELECT id FROM inventories WHERE player_id = $1", battle_data.opponent_id)
        if opp_inventory:
            opponent_card_entry = await conn.fetchrow(
                "SELECT ic.*, c.att, c.def as defense FROM inventory_cards ic JOIN cards c ON ic.card_id = c.id WHERE ic.inventory_id = $1 AND ic.card_id = $2",
                opp_inventory['id'], battle_data.opponent_card_id
            )
            if not opponent_card_entry:
                raise HTTPException(status_code=404, detail="Opponent card not found")
    else:
        opponent_cards = await conn.fetch(
            "SELECT ic.*, c.att, c.def as defense, inv.player_id FROM inventory_cards ic JOIN cards c ON ic.card_id = c.id JOIN inventories inv ON ic.inventory_id = inv.id WHERE inv.player_id != $1 AND ic.is_active = TRUE",
            battle_data.player_id
        )
        if not opponent_cards:
            opponent_cards = await conn.fetch(
                "SELECT ic.*, c.att, c.def as defense, inv.player_id FROM inventory_cards ic JOIN cards c ON ic.card_id = c.id JOIN inventories inv ON ic.inventory_id = inv.id WHERE inv.player_id != $1",
                battle_data.player_id
            )
        if not opponent_cards:
            raise HTTPException(status_code=404, detail="No opponents available")
        opponent_card_entry = random.choice(opponent_cards)

    # 3. Generate battle events (15 second duration)
    battle_events = generate_battle_events(dict(user_card_entry), dict(opponent_card_entry), duration=15)

    # 4. Calculate Score
    user_score, opponent_score = calculate_battle_score(dict(user_card_entry), dict(opponent_card_entry), battle_events)
    user_won = user_score > opponent_score

    user_player = await conn.fetchrow("SELECT * FROM players WHERE id = $1", battle_data.player_id)
    opp_player_id = opponent_card_entry.get('player_id') or battle_data.opponent_id
    opponent_player = await conn.fetchrow("SELECT * FROM players WHERE id = $1", opp_player_id) if opp_player_id else None

    # 5. Calculate Rewards (ranked gives more)
    trophies_gained, coins_gained = calculate_rewards(
        user_won,
        user_player['age'],
        opponent_player['trophy'] if opponent_player else None,
        battle_data.ranked
    )

    # 6. Apply Rewards & Record Match
    async with conn.transaction():
        await crud.apply_combat_rewards(conn, user_player['id'], trophies_gained, coins_gained, user_won)
        match_id = await crud.record_match(conn, "1v1", 15, user_player['id'] if user_won else (opponent_player['id'] if opponent_player else None), user_player['id'], opponent_player['id'] if opponent_player else None)

    return BattleResult(
        match_id=match_id,
        user_won=user_won,
        user_score=user_score,
        opponent_score=opponent_score,
        trophies_gained=trophies_gained if user_won else 0,
        coins_gained=coins_gained if user_won else 0,
        duration=15,
        events=battle_events
    )

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(limit: int = 10, conn: asyncpg.Connection = Depends(get_db)):
    players = await conn.fetch("SELECT p.id, u.name, p.trophy FROM players p JOIN users u ON p.id = u.id ORDER BY p.trophy DESC LIMIT $1", limit)
    return [
        LeaderboardEntry(rank=i + 1, player_id=p['id'], name=p['name'], trophy=p['trophy'])
        for i, p in enumerate(players)
    ]