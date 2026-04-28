import asyncio
import asyncpg
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../..')
from app.config import settings

async def migrate():
    conn = await asyncpg.connect(settings.DATABASE_URL)
    try:
        await conn.execute("ALTER TABLE players ADD COLUMN IF NOT EXISTS gift_claimed BOOLEAN DEFAULT FALSE")
        print("Migration applied: gift_claimed column added to players table.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
