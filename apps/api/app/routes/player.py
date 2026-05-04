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


class RecentMatch(BaseModel):
    match_id: int
    result: str  # 'W' or 'L'
    opponent_name: str
    user_score: int
    opponent_score: int
    date_label: str

class LobbyStatsResponse(BaseModel):
    username: str
    trophy: int
    coins: int
    total_matches: int
    total_wins: int
    recent_matches: list[RecentMatch]

@router.get("/{player_id}/lobby", response_model=LobbyStatsResponse)
async def get_lobby_stats(player_id: int, conn: asyncpg.Connection = Depends(get_db)):
    # 1. Basic player info
    user_data = await conn.fetchrow(
        """
        SELECT u.name as username, p.trophy
        FROM users u JOIN players p ON u.id = p.id
        WHERE u.id = $1
        """,
        player_id
    )
    if not user_data:
        raise HTTPException(status_code=404, detail="Player not found")

    # 2. Coins
    inventory = await conn.fetchrow("SELECT coins FROM inventories WHERE player_id = $1", player_id)
    coins = inventory['coins'] if inventory else 0

    # 3. Total match stats (multiplayer only)
    match_stats = await conn.fetchrow(
        """
        SELECT COUNT(m.id) as total_matches,
               SUM(CASE WHEN m.winner_id = $1 THEN 1 ELSE 0 END) as total_wins
        FROM player_matches pm
        JOIN matches m ON pm.match_id = m.id
        WHERE pm.player_id = $1 AND m.match_type = '1v1'
        """,
        player_id
    )
    total_matches = match_stats['total_matches'] or 0
    total_wins = match_stats['total_wins'] or 0

    # 4. Last 3 matches with opponent name + score (multiplayer only)
    recent_rows = await conn.fetch(
        """
        SELECT
            m.id as match_id,
            m.winner_id,
            m.start_time,
            opp_u.name as opponent_name,
            pm_self.card_id as self_card_id,
            pm_opp.card_id as opp_card_id,
            self_c.att + self_c.def as user_score,
            opp_c.att + opp_c.def as opponent_score
        FROM player_matches pm_self
        JOIN matches m ON pm_self.match_id = m.id
        -- find the opponent in the same match
        LEFT JOIN player_matches pm_opp ON pm_opp.match_id = m.id AND pm_opp.player_id != $1
        LEFT JOIN users opp_u ON pm_opp.player_id = opp_u.id
        -- card scores (rough display score from card stats)
        LEFT JOIN cards self_c ON pm_self.card_id = self_c.id
        LEFT JOIN cards opp_c ON pm_opp.card_id = opp_c.id
        WHERE pm_self.player_id = $1 AND m.match_type = '1v1'
        ORDER BY m.start_time DESC
        LIMIT 3
        """,
        player_id
    )

    from datetime import datetime, timezone

    def date_label(ts):
        if ts is None:
            return "Unknown"
        now = datetime.now(timezone.utc)
        delta = now - ts.replace(tzinfo=timezone.utc) if ts.tzinfo is None else now - ts
        days = delta.days
        if days == 0:
            return "Today"
        elif days == 1:
            return "Yesterday"
        else:
            return f"{days} days ago"

    recent_matches = []
    for row in recent_rows:
        recent_matches.append({
            "match_id": row['match_id'],
            "result": "W" if row['winner_id'] == player_id else "L",
            "opponent_name": row['opponent_name'] or "CPU",
            "user_score": row['user_score'] or 0,
            "opponent_score": row['opponent_score'] or 0,
            "date_label": date_label(row['start_time']),
        })

    return {
        "username": user_data['username'],
        "trophy": user_data['trophy'],
        "coins": coins,
        "total_matches": total_matches,
        "total_wins": total_wins,
        "recent_matches": recent_matches,
    }


class InventoryCard(BaseModel):
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
    quantity: int
    is_active: bool

class InventoryResponse(BaseModel):
    total: int
    cards: list[InventoryCard]

@router.get("/{player_id}/inventory", response_model=InventoryResponse)
async def get_player_inventory(player_id: int, conn: asyncpg.Connection = Depends(get_db)):
    inventory = await conn.fetchrow("SELECT id FROM inventories WHERE player_id = $1", player_id)
    if not inventory:
        return {"total": 0, "cards": []}

    rows = await conn.fetch(
        """
        SELECT c.id, c.name, c.att, c.def as def_, c.finisher, c.signature, c.image,
               c.rarity, c.type, c.price,
               ic.quantity, ic.is_active
        FROM inventory_cards ic
        JOIN cards c ON ic.card_id = c.id
        WHERE ic.inventory_id = $1
        ORDER BY
            CASE c.rarity
                WHEN 'Legendary' THEN 1
                WHEN 'Gold' THEN 2
                WHEN 'Rare' THEN 3
                ELSE 4
            END,
            c.name ASC
        """,
        inventory['id']
    )

    cards = [dict(r) for r in rows]
    return {"total": len(cards), "cards": cards}


import random as _random

class GiftCard(BaseModel):
    id: int
    name: str
    att: int
    def_: int
    rarity: str
    type: str
    image: Optional[str]

class GiftStatusResponse(BaseModel):
    gift_available: bool
    gift_claimed: bool

class GiftClaimResponse(BaseModel):
    coins_awarded: int
    cards: list[GiftCard]
    message: str

@router.get("/{player_id}/gift-status", response_model=GiftStatusResponse)
async def get_gift_status(player_id: int, conn: asyncpg.Connection = Depends(get_db)):
    player = await conn.fetchrow("SELECT gift_claimed FROM players WHERE id = $1", player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return {
        "gift_available": not player['gift_claimed'],
        "gift_claimed": player['gift_claimed'],
    }

@router.post("/{player_id}/claim-gift", response_model=GiftClaimResponse)
async def claim_gift(player_id: int, conn: asyncpg.Connection = Depends(get_db)):
    # Check eligibility
    player = await conn.fetchrow("SELECT gift_claimed FROM players WHERE id = $1", player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    if player['gift_claimed']:
        raise HTTPException(status_code=400, detail="Gift already claimed")

    # Pick 2 random cards from the DB
    all_cards = await conn.fetch("SELECT id, name, att, def as def_, rarity, type, image FROM cards ORDER BY RANDOM() LIMIT 2")
    if not all_cards:
        raise HTTPException(status_code=404, detail="No cards available in database")

    coins_awarded = _random.randint(200, 1000)

    # Get or create inventory
    inventory = await conn.fetchrow("SELECT id FROM inventories WHERE player_id = $1", player_id)

    async with conn.transaction():
        if not inventory:
            inventory = await conn.fetchrow(
                "INSERT INTO inventories (player_id, coins) VALUES ($1, $2) RETURNING id",
                player_id, coins_awarded
            )
        else:
            await conn.execute(
                "UPDATE inventories SET coins = coins + $1 WHERE player_id = $2",
                coins_awarded, player_id
            )
            inventory = await conn.fetchrow("SELECT id FROM inventories WHERE player_id = $1", player_id)

        # Add the 2 random cards to inventory
        for card in all_cards:
            existing = await conn.fetchrow(
                "SELECT quantity FROM inventory_cards WHERE inventory_id = $1 AND card_id = $2",
                inventory['id'], card['id']
            )
            if existing:
                await conn.execute(
                    "UPDATE inventory_cards SET quantity = quantity + 1 WHERE inventory_id = $1 AND card_id = $2",
                    inventory['id'], card['id']
                )
            else:
                await conn.execute(
                    "INSERT INTO inventory_cards (inventory_id, card_id, quantity, is_active) VALUES ($1, $2, 1, FALSE)",
                    inventory['id'], card['id']
                )

        # Mark gift as claimed
        await conn.execute("UPDATE players SET gift_claimed = TRUE WHERE id = $1", player_id)

    awarded_cards = [dict(c) for c in all_cards]
    return {
        "coins_awarded": coins_awarded,
        "cards": awarded_cards,
        "message": f"Welcome to the arena! You've received {coins_awarded} coins and 2 cards!"
    }
