from sqlalchemy.orm import Session
from ..models import User, UserCard, Card, Battle
from datetime import datetime, timedelta
import random


def calculate_battle_score(card: Card, opponent_card: Card) -> tuple[int, int]:
    """Calculate battle scores with randomness factor"""
    user_base = card.attack * 0.7 + card.defense * 0.3
    opponent_base = opponent_card.attack * 0.7 + opponent_card.defense * 0.3
    
    user_random = random.uniform(0.85, 1.15)
    opponent_random = random.uniform(0.85, 1.15)
    
    user_score = int(user_base * user_random)
    opponent_score = int(opponent_base * opponent_random)
    
    return user_score, opponent_score


def calculate_rewards(user_won: bool, user_level: int, opponent_trophies: int = None) -> tuple[int, int]:
    """Calculate trophy and coin rewards based on battle outcome"""
    base_trophies = 15 if user_won else -5
    base_coins = 100 if user_won else 25
    
    level_multiplier = 1 + (user_level * 0.05)
    
    if opponent_trophies and user_won:
        trophy_diff = max(0, opponent_trophies - base_trophies)
        base_trophies += int(trophy_diff * 0.1)
    
    trophies = int(base_trophies * level_multiplier)
    coins = int(base_coins * level_multiplier)
    
    if not user_won:
        trophies = max(0, trophies)
    
    return trophies, coins


def get_daily_pack_cards(rarity_weights: dict) -> list[int]:
    """Generate random card IDs based on rarity weights"""
    cards = []
    for _ in range(5):
        rand = random.random()
        if rand < rarity_weights.get('legendary', 0.02):
            rarity = 'Legendary'
        elif rand < rarity_weights.get('epic', 0.1):
            rarity = 'Epic'
        elif rand < rarity_weights.get('rare', 0.3):
            rarity = 'Rare'
        else:
            rarity = 'Common'
        cards.append(rarity)
    return cards


def can_claim_daily_pack(db: Session, user_id: int) -> bool:
    """Check if user can claim daily pack"""
    last_claim = db.query(Battle).filter(
        Battle.user_id == user_id
    ).order_by(Battle.created_at.desc()).first()
    
    if not last_claim:
        return True
    
    return datetime.now() - last_claim.created_at > timedelta(hours=24)
