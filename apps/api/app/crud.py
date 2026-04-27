import asyncpg
from datetime import datetime
import random

# --- Auth ---

async def create_user_with_player_inventory(conn: asyncpg.Connection, user_data, hashed_password: str):
    async with conn.transaction():
        user = await conn.fetchrow(
            """
            INSERT INTO users (name, email, password)
            VALUES ($1, $2, $3)
            RETURNING id, name, email
            """,
            user_data.name, user_data.email, hashed_password
        )
        
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
    return dict(user), dict(player), inventory['coins']

# --- Chat ---

async def create_private_message(conn: asyncpg.Connection, sender_id: int, receiver_id: int, content: str):
    await conn.execute(
        "INSERT INTO private_messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)",
        sender_id, receiver_id, content
    )

# --- Combat ---

async def apply_combat_rewards(conn: asyncpg.Connection, user_player_id: int, trophies_gained: int, coins_gained: int, user_won: bool):
    if user_won:
        await conn.execute("UPDATE players SET trophy = trophy + $1 WHERE id = $2", trophies_gained, user_player_id)
        await conn.execute("UPDATE inventories SET coins = coins + $1 WHERE player_id = $2", coins_gained, user_player_id)
    else:
        await conn.execute("UPDATE players SET trophy = GREATEST(0, trophy - $1) WHERE id = $2", trophies_gained, user_player_id)

async def record_match(conn: asyncpg.Connection, match_type: str, duration: int, winner_id: int | None, user_player_id: int, opponent_player_id: int | None):
    match_id = await conn.fetchval(
        """
        INSERT INTO matches (type, start_time, duration, winner_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        """,
        match_type, datetime.now(), duration, winner_id
    )
    
    await conn.execute("INSERT INTO player_matches (player_id, match_id) VALUES ($1, $2)", user_player_id, match_id)
    if opponent_player_id:
        await conn.execute("INSERT INTO player_matches (player_id, match_id) VALUES ($1, $2)", opponent_player_id, match_id)
        
    return match_id

# --- Packs / Inventory ---

async def deduct_inventory_coins(conn: asyncpg.Connection, inventory_id: int, amount: int):
    await conn.execute("UPDATE inventories SET coins = coins - $1 WHERE id = $2", amount, inventory_id)

async def add_or_update_inventory_card(conn: asyncpg.Connection, inventory_id: int, card_id: int):
    existing = await conn.fetchrow(
        "SELECT inventory_id, card_id, quantity FROM inventory_cards WHERE inventory_id = $1 AND card_id = $2",
        inventory_id, card_id
    )
    
    if existing:
        await conn.execute(
            "UPDATE inventory_cards SET quantity = quantity + 1 WHERE inventory_id = $1 AND card_id = $2",
            inventory_id, card_id
        )
    else:
        await conn.execute(
            "INSERT INTO inventory_cards (inventory_id, card_id, quantity) VALUES ($1, $2, 1)",
            inventory_id, card_id
        )
