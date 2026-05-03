from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import asyncpg
from typing import List, Optional
import random
from datetime import datetime, timedelta, timezone
from ..database import get_db
from .. import crud
from ..schemas import BattleCreate, BattleResult, LeaderboardEntry, QueueStatus, MatchmakingResult
from ..services.combat import calculate_battle_score, calculate_rewards, generate_battle_events

router = APIRouter(prefix="/api/combat", tags=["combat"])

QUEUE_TIMEOUT_SECONDS = 30

@router.post("/battle", response_model=BattleResult)
async def start_battle(battle_data: BattleCreate, conn: asyncpg.Connection = Depends(get_db)):
    # 1. Fetch User's active card from inventory
    user_inventory = await conn.fetchrow("SELECT id FROM inventories WHERE player_id = $1", battle_data.player_id)
    if not user_inventory:
        raise HTTPException(status_code=404, detail="Player inventory not found")
        
    user_card_entry = await conn.fetchrow(
        "SELECT ic.*, c.name, c.att, c.def as defense, c.rarity, c.signature, c.finisher FROM inventory_cards ic JOIN cards c ON ic.card_id = c.id WHERE ic.inventory_id = $1 AND ic.card_id = $2",
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
                "SELECT ic.*, c.name, c.att, c.def as defense, c.rarity, c.signature, c.finisher FROM inventory_cards ic JOIN cards c ON ic.card_id = c.id WHERE ic.inventory_id = $1 AND ic.card_id = $2",
                opp_inventory['id'], battle_data.opponent_card_id
            )
            if not opponent_card_entry:
                raise HTTPException(status_code=404, detail="Opponent card not found")
    else:
        # Multiplayer: pick random card from ANY other player's inventory
        opponent_cards = await conn.fetch(
            """
            SELECT ic.*, c.name, c.att, c.def as defense, c.rarity, c.signature, c.finisher, inv.player_id
            FROM inventory_cards ic
            JOIN cards c ON ic.card_id = c.id
            JOIN inventories inv ON ic.inventory_id = inv.id
            WHERE inv.player_id != $1
            ORDER BY RANDOM()
            LIMIT 1
            """,
            battle_data.player_id
        )
        if not opponent_cards:
            raise HTTPException(status_code=404, detail="No opponents available")
        opponent_card_entry = opponent_cards[0]

    # 3. Generate battle events (15 second duration)
    battle_events = generate_battle_events(dict(user_card_entry), dict(opponent_card_entry), duration=15)

    # 4. Calculate Score
    user_score, opponent_score = calculate_battle_score(dict(user_card_entry), dict(opponent_card_entry), battle_events)
    user_won = user_score > opponent_score
    
    # Add conclusion event
    battle_events.append({
        "timestamp": float(15),
        "event_type": "conclusion",
        "actor": "referee",
        "description": f"{user_card_entry['name'] if user_won else opponent_card_entry['name']} WINS!",
        "damage": None,
        "effect": None
    })

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
        events=battle_events,
        opponent_card_id=opponent_card_entry['card_id'],
        opponent_card_name=opponent_card_entry['name'],
        opponent_card_rarity=opponent_card_entry['rarity'],
        opponent_card_att=opponent_card_entry['att'],
        opponent_card_def=opponent_card_entry['defense'],
        opponent_card_signature=opponent_card_entry.get('signature'),
        opponent_card_finisher=opponent_card_entry.get('finisher'),
    )


@router.get("/opponent/random")
async def get_random_opponent(player_id: int, conn: asyncpg.Connection = Depends(get_db)):
    """Get a random opponent card from other players' inventories"""
    opponent_cards = await conn.fetch(
        """
        SELECT ic.card_id, c.name, c.att, c.def, c.rarity, c.signature, c.finisher, c.image, inv.player_id
        FROM inventory_cards ic
        JOIN cards c ON ic.card_id = c.id
        JOIN inventories inv ON ic.inventory_id = inv.id
        WHERE inv.player_id != $1
        ORDER BY RANDOM()
        LIMIT 1
        """,
        player_id
    )
    if not opponent_cards:
        raise HTTPException(status_code=404, detail="No opponents available")
    
    card = opponent_cards[0]
    return {
        "card_id": card['card_id'],
        "name": card['name'],
        "att": card['att'],
        "def": card['def'],
        "rarity": card['rarity'],
        "signature": card['signature'],
        "finisher": card['finisher'],
        "image": card['image'],
        "player_id": card['player_id'],
    }


class BattleResultInput(BaseModel):
    player_id: int
    user_card_id: int
    opponent_card_id: int
    user_won: bool
    user_score: int
    opponent_score: int


@router.post("/battle/result")
async def record_battle_result(data: BattleResultInput, conn: asyncpg.Connection = Depends(get_db)):
    """Record battle result and apply rewards (for client-side battles)"""
    # Get player data
    user_player = await conn.fetchrow("SELECT * FROM players WHERE id = $1", data.player_id)
    if not user_player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Get opponent card owner
    opp_card = await conn.fetchrow(
        "SELECT inv.player_id FROM inventory_cards ic JOIN inventories inv ON ic.inventory_id = inv.id WHERE ic.card_id = $1",
        data.opponent_card_id
    )
    opponent_player = await conn.fetchrow("SELECT * FROM players WHERE id = $1", opp_card['player_id']) if opp_card else None
    
    # Calculate rewards
    trophies_gained, coins_gained = calculate_rewards(data.user_won, user_player['age'], opponent_player['trophy'] if opponent_player else None, False)
    
    # Apply rewards & record match
    async with conn.transaction():
        await crud.apply_combat_rewards(conn, user_player['id'], trophies_gained, coins_gained, data.user_won)
        await crud.record_match(conn, "1v1", 15, user_player['id'] if data.user_won else (opponent_player['id'] if opponent_player else None), user_player['id'], opponent_player['id'] if opponent_player else None)
    
    return {
        "trophies_gained": trophies_gained if data.user_won else 0,
        "coins_gained": coins_gained if data.user_won else 0,
        "user_won": data.user_won,
    }

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(limit: int = 10, conn: asyncpg.Connection = Depends(get_db)):
    players = await conn.fetch("SELECT p.id, u.name, p.trophy FROM players p JOIN users u ON p.id = u.id ORDER BY p.trophy DESC LIMIT $1", limit)
    return [
        LeaderboardEntry(rank=i + 1, player_id=p['id'], name=p['name'], trophy=p['trophy'])
        for i, p in enumerate(players)
    ]


@router.post("/queue/join", response_model=QueueStatus)
async def join_queue(player_id: int, conn: asyncpg.Connection = Depends(get_db)):
    """Player joins matchmaking queue"""
    # Check player exists and get trophy
    player = await conn.fetchrow("SELECT id, trophy FROM players WHERE id = $1", player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Check if already in queue
    existing = await conn.fetchrow("SELECT * FROM matchmaking_queue WHERE player_id = $1", player_id)
    if existing:
        return QueueStatus(queued=True, waiting_time=0, match_found=False)
    
    # Add to queue
    await conn.execute(
        "INSERT INTO matchmaking_queue (player_id, trophy, joined_at) VALUES ($1, $2, $3)",
        player_id, player['trophy'], datetime.now(timezone.utc)
    )
    
    return QueueStatus(queued=True, waiting_time=0, match_found=False)


@router.post("/queue/leave")
async def leave_queue(player_id: int, conn: asyncpg.Connection = Depends(get_db)):
    """Player leaves matchmaking queue"""
    await conn.execute("DELETE FROM matchmaking_queue WHERE player_id = $1", player_id)
    return {"status": "left_queue"}


@router.get("/queue/status", response_model=QueueStatus)
async def get_queue_status(player_id: int, conn: asyncpg.Connection = Depends(get_db)):
    """Check if player is in queue and if match found"""
    # Clean up stale entries
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=QUEUE_TIMEOUT_SECONDS)
    await conn.execute("DELETE FROM matchmaking_queue WHERE joined_at < $1", cutoff)
    
    # Check player's queue status
    player_entry = await conn.fetchrow(
        "SELECT * FROM matchmaking_queue WHERE player_id = $1",
        player_id
    )
    
    if not player_entry:
        return QueueStatus(queued=False, waiting_time=0, match_found=False)
    
    # Calculate waiting time
    wait_seconds = (datetime.now(timezone.utc) - player_entry['joined_at']).total_seconds()
    
    # Check if match was found (matched_with is set)
    if player_entry['matched_with']:
        return QueueStatus(queued=True, waiting_time=int(wait_seconds), match_found=True, opponent_id=player_entry['matched_with'])
    
    return QueueStatus(queued=True, waiting_time=int(wait_seconds), match_found=False)


@router.post("/queue/find-match", response_model=Optional[MatchmakingResult])
async def find_match(player_id: int, conn: asyncpg.Connection = Depends(get_db)):
    """Try to find a match for the queued player"""
    # Clean up stale entries first
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=QUEUE_TIMEOUT_SECONDS)
    await conn.execute("DELETE FROM matchmaking_queue WHERE joined_at < $1", cutoff)
    
    # Get current player's queue entry
    player_entry = await conn.fetchrow(
        "SELECT * FROM matchmaking_queue WHERE player_id = $1 AND matched_with IS NULL",
        player_id
    )
    
    if not player_entry:
        return None  # Not in queue or already matched
    
    player_trophy = player_entry['trophy']
    
    # Find potential opponents (similar trophy range, not already matched)
    # Trophy range: ±50 trophies, expand if no match found
    trophy_range = 50
    max_attempts = 3
    
    for attempt in range(max_attempts):
        opponents = await conn.fetch(
            """
            SELECT mq.player_id, mq.trophy, mq.joined_at
            FROM matchmaking_queue mq
            WHERE mq.player_id != $1 
              AND mq.matched_with IS NULL
              AND mq.trophy >= $2 
              AND mq.trophy <= $3
            ORDER BY mq.joined_at ASC
            LIMIT 1
            """,
            player_id,
            player_trophy - trophy_range,
            player_trophy + trophy_range
        )
        
        if opponents:
            opponent = opponents[0]
            opponent_id = opponent['player_id']
            
            # Mark both players as matched with each other
            async with conn.transaction():
                await conn.execute(
                    "UPDATE matchmaking_queue SET matched_with = $1, matched_at = $2 WHERE player_id = $3",
                    opponent_id, datetime.now(timezone.utc), player_id
                )
                await conn.execute(
                    "UPDATE matchmaking_queue SET matched_with = $1, matched_at = $2 WHERE player_id = $3",
                    player_id, datetime.now(timezone.utc), opponent_id
                )
            
            # Get both players' active cards
            user_inventory = await conn.fetchrow("SELECT id FROM inventories WHERE player_id = $1", player_id)
            opp_inventory = await conn.fetchrow("SELECT id FROM inventories WHERE player_id = $1", opponent_id)
            
            user_card = await conn.fetchrow(
                """
                SELECT ic.card_id, c.name, c.att, c.def, c.signature, c.finisher, c.rarity, c.type, c.price, ic.is_active, ic.quantity
                FROM inventory_cards ic 
                JOIN cards c ON ic.card_id = c.id 
                WHERE ic.inventory_id = $1 AND ic.is_active = TRUE 
                LIMIT 1
                """,
                user_inventory['id'] if user_inventory else 0
            )
            
            opp_card = await conn.fetchrow(
                """
                SELECT ic.card_id, c.name, c.att, c.def, c.signature, c.finisher, c.rarity, c.type, c.price, ic.is_active, ic.quantity
                FROM inventory_cards ic 
                JOIN cards c ON ic.card_id = c.id 
                WHERE ic.inventory_id = $1 AND ic.is_active = TRUE 
                LIMIT 1
                """,
                opp_inventory['id'] if opp_inventory else 0
            )
            
            if not user_card or not opp_card:
                # No active cards, can't battle
                await conn.execute("DELETE FROM matchmaking_queue WHERE player_id = $1 OR player_id = $2", player_id, opponent_id)
                return None
            
            return MatchmakingResult(
                match_id=0,  # Will be set after battle
                player1_id=player_id,
                player2_id=opponent_id,
                player1_card=dict(user_card),
                player2_card=dict(opp_card)
            )
        
        # Expand trophy range for next attempt
        trophy_range += 50
    
    return None  # No match found


@router.post("/battle/multiplayer", response_model=BattleResult)
async def start_multiplayer_battle(
    player1_id: int,
    player2_id: int,
    player1_card_id: int,
    player2_card_id: int,
    conn: asyncpg.Connection = Depends(get_db)
):
    """Start a multiplayer battle between two matched players"""
    # Verify both players are matched
    p1_queue = await conn.fetchrow("SELECT * FROM matchmaking_queue WHERE player_id = $1", player1_id)
    p2_queue = await conn.fetchrow("SELECT * FROM matchmaking_queue WHERE player_id = $1", player2_id)
    
    if not p1_queue or not p2_queue:
        raise HTTPException(status_code=400, detail="Players not in matchmaking queue")
    
    if p1_queue['matched_with'] != player2_id or p2_queue['matched_with'] != player1_id:
        raise HTTPException(status_code=400, detail="Players not matched with each other")
    
    # Fetch both cards
    user_card_entry = await conn.fetchrow(
        "SELECT ic.*, c.name, c.att, c.def as defense, c.signature, c.finisher, c.rarity, c.type, c.price FROM inventory_cards ic JOIN cards c ON ic.card_id = c.id WHERE ic.inventory_id = (SELECT id FROM inventories WHERE player_id = $1) AND ic.card_id = $2",
        player1_id, player1_card_id
    )
    
    opp_card_entry = await conn.fetchrow(
        "SELECT ic.*, c.name, c.att, c.def as defense, c.signature, c.finisher, c.rarity, c.type, c.price FROM inventory_cards ic JOIN cards c ON ic.card_id = c.id WHERE ic.inventory_id = (SELECT id FROM inventories WHERE player_id = $1) AND ic.card_id = $2",
        player2_id, player2_card_id
    )
    
    if not user_card_entry or not opp_card_entry:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Generate battle events
    battle_events = generate_battle_events(dict(user_card_entry), dict(opp_card_entry), duration=15)
    
    # Calculate score
    user_score, opponent_score = calculate_battle_score(dict(user_card_entry), dict(opp_card_entry), battle_events)
    user_won = user_score > opponent_score
    
    # Get player data
    user_player = await conn.fetchrow("SELECT * FROM players WHERE id = $1", player1_id)
    opponent_player = await conn.fetchrow("SELECT * FROM players WHERE id = $1", player2_id)
    
    # Calculate rewards (ranked = True for multiplayer)
    trophies_gained, coins_gained = calculate_rewards(user_won, user_player['age'], opponent_player['trophy'], ranked=True)
    
    # Apply rewards & record match
    async with conn.transaction():
        await crud.apply_combat_rewards(conn, user_player['id'], trophies_gained, coins_gained, user_won)
        # Also give participation rewards to loser
        await crud.apply_combat_rewards(conn, opponent_player['id'], 0, 50, False)
        match_id = await crud.record_match(conn, "1v1", 15, user_player['id'] if user_won else opponent_player['id'], user_player['id'], opponent_player['id'])
        
        # Clean up queue
        await conn.execute("DELETE FROM matchmaking_queue WHERE player_id = $1 OR player_id = $2", player1_id, player2_id)
    
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