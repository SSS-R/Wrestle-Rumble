import asyncio
import asyncpg
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import settings

async def create_tables():
    conn = await asyncpg.connect(settings.DATABASE_URL)
    try:
        # Drop all tables cleanly if they exist to start fresh
        await conn.execute('''
            DROP TABLE IF EXISTS trade_cards CASCADE;
            DROP TABLE IF EXISTS trades CASCADE;
            DROP TABLE IF EXISTS event_cards CASCADE;
            DROP TABLE IF EXISTS events CASCADE;
            DROP TABLE IF EXISTS packs CASCADE;
            DROP TABLE IF EXISTS stores CASCADE;
            DROP TABLE IF EXISTS inventory_cards CASCADE;
            DROP TABLE IF EXISTS inventories CASCADE;
            DROP TABLE IF EXISTS player_matches CASCADE;
            DROP TABLE IF EXISTS matches CASCADE;
            DROP TABLE IF EXISTS leaderboards CASCADE;
            DROP TABLE IF EXISTS private_messages CASCADE;
            DROP TABLE IF EXISTS socials CASCADE;
            DROP TABLE IF EXISTS admins CASCADE;
            DROP TABLE IF EXISTS players CASCADE;
            DROP TABLE IF EXISTS cards CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
            
            -- Old tables from previous iteration
            DROP TABLE IF EXISTS daily_packs CASCADE;
            DROP TABLE IF EXISTS battles CASCADE;
            DROP TABLE IF EXISTS friendships CASCADE;
            DROP TABLE IF EXISTS user_cards CASCADE;
            DROP TABLE IF EXISTS wrestlers CASCADE;
        ''')

        await conn.execute('''
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        );

        CREATE TABLE players (
            id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            age INTEGER DEFAULT 18,
            trophy INTEGER DEFAULT 0,
            highest_trophy INTEGER DEFAULT 0
        );

        CREATE TABLE admins (
            id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE socials (
            id SERIAL PRIMARY KEY,
            player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
            friends INTEGER DEFAULT 0
        );

        CREATE TABLE private_messages (
            id SERIAL PRIMARY KEY,
            sender_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
            receiver_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE leaderboards (
            id SERIAL PRIMARY KEY,
            type VARCHAR(50) NOT NULL
        );

        CREATE TABLE matches (
            id SERIAL PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            end_time TIMESTAMP WITH TIME ZONE,
            duration INTEGER,
            winner_id INTEGER REFERENCES players(id) ON DELETE SET NULL
        );

        CREATE TABLE player_matches (
            player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
            match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
            card_id INTEGER,
            PRIMARY KEY (player_id, match_id)
        );

        CREATE TABLE cards (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            att INTEGER NOT NULL,
            def INTEGER NOT NULL,
            finisher VARCHAR(255),
            signature VARCHAR(255),
            image VARCHAR(255),
            rarity VARCHAR(50) DEFAULT 'Common',
            type VARCHAR(255) DEFAULT 'Base',
            price INTEGER DEFAULT 100
        );

        CREATE TABLE inventories (
            id SERIAL PRIMARY KEY,
            player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
            coins INTEGER DEFAULT 500
        );

        CREATE TABLE inventory_cards (
            inventory_id INTEGER REFERENCES inventories(id) ON DELETE CASCADE,
            card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
            quantity INTEGER DEFAULT 1,
            is_active BOOLEAN DEFAULT FALSE,
            PRIMARY KEY (inventory_id, card_id)
        );

        CREATE TABLE stores (
            id SERIAL PRIMARY KEY
        );

        CREATE TABLE packs (
            id SERIAL PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            price INTEGER NOT NULL,
            store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE
        );

        CREATE TABLE events (
            id SERIAL PRIMARY KEY,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE NOT NULL,
            entry_trophy INTEGER DEFAULT 0
        );

        CREATE TABLE event_cards (
            event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
            card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
            PRIMARY KEY (event_id, card_id)
        );

        CREATE TABLE trades (
            id SERIAL PRIMARY KEY,
            sender_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
            receiver_id INTEGER REFERENCES players(id) ON DELETE CASCADE
        );

        CREATE TABLE trade_cards (
            trade_id INTEGER REFERENCES trades(id) ON DELETE CASCADE,
            card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
            PRIMARY KEY (trade_id, card_id)
        );
        ''')
        print("New DBML tables created successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(create_tables())
