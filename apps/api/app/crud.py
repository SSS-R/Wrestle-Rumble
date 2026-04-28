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

async def apply_combat_rewards(conn: asyncpg.Connection, player_id: int, trophies: int, coins: int, won: bool):
    async with conn.transaction():
        await conn.execute(
            "UPDATE players SET trophy = trophy + $1, highest_trophy = GREATEST(highest_trophy, trophy + $1) WHERE id = $2",
            trophies, player_id
        )
        await conn.execute(
            "UPDATE inventories SET coins = coins + $1 WHERE player_id = $2",
            coins, player_id
        )

async def record_match(conn: asyncpg.Connection, match_type: str, duration: int, winner_id: int | None, player1_id: int, player2_id: int | None):
    async with conn.transaction():
        result = await conn.fetchrow(
            """
            INSERT INTO matches (type, duration, winner_id)
            VALUES ($1, $2, $3)
            RETURNING id
            """,
            match_type, duration, winner_id
        )
        match_id = result['id']
        
        await conn.execute(
            "INSERT INTO player_matches (player_id, match_id) VALUES ($1, $2)",
            player1_id, match_id
        )
        
        if player2_id:
            await conn.execute(
                "INSERT INTO player_matches (player_id, match_id) VALUES ($1, $2)",
                player2_id, match_id
            )
        
        return match_id
