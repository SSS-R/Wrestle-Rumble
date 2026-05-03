import asyncpg

async def create_base_cards(conn: asyncpg.Connection, card_data):
    cards = []
    async with conn.transaction():
        for variant in card_data.variants:
            card = await conn.fetchrow(
                """
                INSERT INTO cards (name, att, def, finisher, signature, image, rarity, type, price)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
                """,
                variant.name, 
                variant.att, 
                variant.defense, 
                variant.finisher, 
                variant.signature, 
                variant.image, 
                variant.rarity, 
                "Base", 
                variant.price
            )
            cards.append(dict(card))
    return cards

async def create_event_card(conn: asyncpg.Connection, card_data):
    card = await conn.fetchrow(
        """
        INSERT INTO cards (name, att, def, finisher, signature, image, rarity, type, price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        """,
        card_data.name,
        card_data.att,
        card_data.defense,
        card_data.finisher,
        card_data.signature,
        card_data.image,
        card_data.rarity,
        card_data.type,
        card_data.price
    )
    return dict(card)

async def get_grouped_cards(conn: asyncpg.Connection):
    rows = await conn.fetch("SELECT * FROM cards ORDER BY name, rarity")
    
    grouped = {}
    for row in rows:
        card = dict(row)
        name = card['name']
        if name not in grouped:
            grouped[name] = []
        grouped[name].append(card)
        
    return [{"name": name, "cards": cards} for name, cards in grouped.items()]

async def delete_card(conn: asyncpg.Connection, card_id: int):
    await conn.execute("DELETE FROM cards WHERE id = $1", card_id)

async def delete_wrestler_cards(conn: asyncpg.Connection, wrestler_name: str):
    await conn.execute("DELETE FROM cards WHERE name = $1", wrestler_name)

async def delete_all_cards(conn: asyncpg.Connection):
    await conn.execute("DELETE FROM cards")

async def get_all_players_with_coins(conn: asyncpg.Connection):
    rows = await conn.fetch("""
        SELECT u.id, u.name, u.email, p.age, p.trophy, COALESCE(i.coins, 0) as coins 
        FROM users u
        JOIN players p ON u.id = p.id
        LEFT JOIN inventories i ON p.id = i.player_id
        ORDER BY u.id
    """)
    return [dict(r) for r in rows]

async def update_player_coins(conn: asyncpg.Connection, player_id: int, coins: int):
    await conn.execute("UPDATE inventories SET coins = $1 WHERE player_id = $2", coins, player_id)
