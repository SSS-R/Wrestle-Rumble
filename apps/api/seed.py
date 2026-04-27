import asyncio
import asyncpg
import sys
import os
import bcrypt

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.config import settings

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed_db():
    conn = await asyncpg.connect(settings.DATABASE_URL)
    try:
        # Clear existing data for a fresh seed
        await conn.execute("TRUNCATE TABLE users CASCADE")
        await conn.execute("TRUNCATE TABLE cards CASCADE")

        # 1. Seed Cards (Combined Wrestler + Stats)
        cards_data = [
            ("John Cena", 85, 90, "Attitude Adjustment", "Five Knuckle Shuffle", "/images/cena.jpg", "Legendary", "Base", 1000),
            ("Roman Reigns", 95, 88, "Spear", "Superman Punch", "/images/roman.jpg", "Legendary", "Base", 1000),
            ("Seth Rollins", 88, 82, "Curb Stomp", "Slingblade", "/images/seth.jpg", "Gold", "Base", 500),
            ("Cody Rhodes", 86, 85, "Cross Rhodes", "Disaster Kick", "/images/cody.jpg", "Gold", "Base", 500),
            ("Drew McIntyre", 92, 85, "Claymore", "Future Shock DDT", "/images/drew.jpg", "Rare", "Base", 250),
            ("Sami Zayn", 78, 80, "Helluva Kick", "Blue Thunder Bomb", "/images/sami.jpg", "Rare", "Base", 250),
            ("Kevin Owens", 84, 86, "Stunner", "Pop-up Powerbomb", "/images/ko.jpg", "Rare", "Base", 250),
            ("LA Knight", 82, 79, "BFT", "Blunt Force Trauma", "/images/la_knight.jpg", "Common", "Base", 100),
            ("Jey Uso", 80, 81, "Uso Splash", "Superkick", "/images/jey.jpg", "Common", "Base", 100),
            ("Jimmy Uso", 79, 82, "Uso Splash", "Superkick", "/images/jimmy.jpg", "Common", "Base", 100),
        ]
        
        for c in cards_data:
            await conn.execute(
                """
                INSERT INTO cards (name, att, def, finisher, signature, image, rarity, type, price)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """,
                *c
            )
        print("Seeded cards")

        # 2. Seed Demo User
        hashed_pw = hash_password("demo123")
        user_id = await conn.fetchval(
            """
            INSERT INTO users (name, email, password)
            VALUES ($1, $2, $3)
            RETURNING id
            """,
            "demo", "demo@example.com", hashed_pw
        )
        
        # 3. Seed Player for Demo User
        await conn.execute(
            """
            INSERT INTO players (id, age, trophy)
            VALUES ($1, $2, $3)
            """,
            user_id, 25, 100
        )
        
        # 4. Seed Inventory for Demo Player
        inv_id = await conn.fetchval(
            """
            INSERT INTO inventories (player_id, coins)
            VALUES ($1, $2)
            RETURNING id
            """,
            user_id, 1000
        )
        
        # Give demo user a random card
        card_id = await conn.fetchval("SELECT id FROM cards LIMIT 1")
        await conn.execute(
            """
            INSERT INTO inventory_cards (inventory_id, card_id, quantity, is_active)
            VALUES ($1, $2, $3, $4)
            """,
            inv_id, card_id, 1, True
        )
        
        print("Database seeded successfully with new schema!")
        print("Demo user: demo / demo123")

    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(seed_db())