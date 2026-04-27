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
        wrestlers_data = [
            ("Roman Reigns", "Superman Punch", "Spear", None),
            ("John Cena", "Five Knuckle Shuffle", "Attitude Adjustment", None),
            ("Rhea Ripley", "Prism Trap", "Riptide", None),
            ("Seth Rollins", "Sling Blade", "Curb Stomp", None),
            ("AJ Styles", "Pele Kick", "Styles Clash", None),
            ("Rey Mysterio", "619", "Frog Splash", None),
            ("The Miz", "It Kicks", "Skull Crushing Finale", None),
            ("Gunther", "Powerbomb", "Symphony", None),
            ("Cody Rhodes", "Disaster Kick", "Cross Rhodes", None),
            ("Sami Zayn", "Blue Thunder Bomb", "Helluva Kick", None),
        ]
        
        # Clear existing data first so seed can be run multiple times
        await conn.execute("DELETE FROM cards;")
        await conn.execute("DELETE FROM wrestlers;")
        await conn.execute("DELETE FROM users;")

        await conn.executemany('''
            INSERT INTO wrestlers (name, signature_move, finisher, image_url)
            VALUES ($1, $2, $3, $4)
        ''', wrestlers_data)

        # Get inserted wrestlers to map IDs
        wrestlers = await conn.fetch('SELECT id, name FROM wrestlers ORDER BY id ASC LIMIT 10')
        wrestler_ids = [w['id'] for w in wrestlers]

        if not wrestler_ids:
            print("No wrestlers inserted.")
            return

        cards_data = [
            (wrestler_ids[0], "Legendary", 95, 90, 1500),
            (wrestler_ids[1], "Epic", 88, 85, 800),
            (wrestler_ids[2], "Epic", 86, 89, 750),
            (wrestler_ids[3], "Legendary", 92, 88, 1400),
            (wrestler_ids[4], "Epic", 87, 82, 650),
            (wrestler_ids[5], "Rare", 78, 70, 300),
            (wrestler_ids[6], "Common", 70, 72, 100),
            (wrestler_ids[7], "Epic", 90, 92, 900),
            (wrestler_ids[8], "Legendary", 91, 87, 1450),
            (wrestler_ids[9], "Rare", 80, 78, 350),
        ]

        await conn.executemany('''
            INSERT INTO cards (wrestler_id, rarity, attack, defense, price)
            VALUES ($1, $2, $3, $4, $5)
        ''', cards_data)

        await conn.execute('''
            INSERT INTO users (username, email, hashed_password, level, coins, trophies)
            VALUES ($1, $2, $3, $4, $5, $6)
        ''', "demo", "demo@wrestlerumble.com", hash_password("demo123"), 27, 2450, 318)

        print("Database seeded successfully!")
        print(f"Created {len(wrestlers_data)} wrestlers")
        print(f"Created {len(cards_data)} cards")
        print("Demo user: demo / demo123")

    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(seed_db())