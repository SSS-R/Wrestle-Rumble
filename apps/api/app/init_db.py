import asyncio
import asyncpg
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import settings

async def create_tables():
    conn = await asyncpg.connect(settings.DATABASE_URL)
    try:
        await conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            level INTEGER DEFAULT 1,
            coins INTEGER DEFAULT 500,
            trophies INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS wrestlers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            signature_move VARCHAR(255),
            finisher VARCHAR(255),
            image_url TEXT
        );

        CREATE TABLE IF NOT EXISTS cards (
            id SERIAL PRIMARY KEY,
            wrestler_id INTEGER REFERENCES wrestlers(id) NOT NULL,
            rarity VARCHAR(50) NOT NULL,
            attack INTEGER NOT NULL,
            defense INTEGER NOT NULL,
            price INTEGER DEFAULT 100
        );

        CREATE TABLE IF NOT EXISTS user_cards (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) NOT NULL,
            card_id INTEGER REFERENCES cards(id) NOT NULL,
            quantity INTEGER DEFAULT 1,
            is_active BOOLEAN DEFAULT FALSE,
            acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS battles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) NOT NULL,
            opponent_id INTEGER REFERENCES users(id),
            user_card_id INTEGER REFERENCES user_cards(id) NOT NULL,
            opponent_card_id INTEGER REFERENCES user_cards(id),
            user_score INTEGER,
            opponent_score INTEGER,
            result VARCHAR(50),
            trophies_gained INTEGER DEFAULT 0,
            coins_gained INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS daily_packs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) NOT NULL,
            pack_type VARCHAR(50) NOT NULL,
            cards_received TEXT,
            claimed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS friendships (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) NOT NULL,
            friend_id INTEGER REFERENCES users(id) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ''')
        print("Tables created successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(create_tables())
