from sqlalchemy.orm import Session
from app.db import SessionLocal, engine, Base
from app.models import Wrestler, Card, Rarity, User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password[:72])

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    wrestlers_data = [
        {"name": "Roman Reigns", "signature_move": "Superman Punch", "finisher": "Spear"},
        {"name": "John Cena", "signature_move": "Five Knuckle Shuffle", "finisher": "Attitude Adjustment"},
        {"name": "Rhea Ripley", "signature_move": "Prism Trap", "finisher": "Riptide"},
        {"name": "Seth Rollins", "signature_move": "Sling Blade", "finisher": "Curb Stomp"},
        {"name": "AJ Styles", "signature_move": "Pele Kick", "finisher": "Styles Clash"},
        {"name": "Rey Mysterio", "signature_move": "619", "finisher": "Frog Splash"},
        {"name": "The Miz", "signature_move": "It Kicks", "finisher": "Skull Crushing Finale"},
        {"name": "Gunther", "signature_move": "Powerbomb", "finisher": "Symphony"},
        {"name": "Cody Rhodes", "signature_move": "Disaster Kick", "finisher": "Cross Rhodes"},
        {"name": "Sami Zayn", "signature_move": "Blue Thunder Bomb", "finisher": "Helluva Kick"},
    ]
    
    for w_data in wrestlers_data:
        wrestler = Wrestler(**w_data)
        db.add(wrestler)
    
    db.commit()
    
    wrestlers = db.query(Wrestler).all()
    
    cards_data = [
        {"wrestler_idx": 0, "rarity": Rarity.LEGENDARY, "attack": 95, "defense": 90, "price": 1500},
        {"wrestler_idx": 1, "rarity": Rarity.EPIC, "attack": 88, "defense": 85, "price": 800},
        {"wrestler_idx": 2, "rarity": Rarity.EPIC, "attack": 86, "defense": 89, "price": 750},
        {"wrestler_idx": 3, "rarity": Rarity.LEGENDARY, "attack": 92, "defense": 88, "price": 1400},
        {"wrestler_idx": 4, "rarity": Rarity.EPIC, "attack": 87, "defense": 82, "price": 650},
        {"wrestler_idx": 5, "rarity": Rarity.RARE, "attack": 78, "defense": 70, "price": 300},
        {"wrestler_idx": 6, "rarity": Rarity.COMMON, "attack": 70, "defense": 72, "price": 100},
        {"wrestler_idx": 7, "rarity": Rarity.EPIC, "attack": 90, "defense": 92, "price": 900},
        {"wrestler_idx": 8, "rarity": Rarity.LEGENDARY, "attack": 91, "defense": 87, "price": 1450},
        {"wrestler_idx": 9, "rarity": Rarity.RARE, "attack": 80, "defense": 78, "price": 350},
    ]
    
    for c_data in cards_data:
        card = Card(
            wrestler_id=wrestlers[c_data["wrestler_idx"]].id,
            rarity=c_data["rarity"],
            attack=c_data["attack"],
            defense=c_data["defense"],
            price=c_data["price"]
        )
        db.add(card)
    
    db.commit()
    
    demo_user = User(
        username="demo",
        email="demo@wrestlerumble.com",
        hashed_password=hash_password("demo123"),
        level=27,
        coins=2450,
        trophies=318
    )
    db.add(demo_user)
    db.commit()
    
    print("Database seeded successfully!")
    print(f"Created {len(wrestlers)} wrestlers")
    print(f"Created {len(cards_data)} cards")
    print("Demo user: demo / demo123")
    
except Exception as e:
    db.rollback()
    print(f"Error seeding database: {e}")
finally:
    db.close()