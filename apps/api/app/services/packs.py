from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import User, Card, UserCard, DailyPack, Rarity
from .combat import get_daily_pack_cards
from datetime import datetime, timedelta
import random


def get_pack_contents(pack_type: str) -> tuple[int, dict]:
    packs = {
        'basic': {'count': 3, 'weights': {'legendary': 0.01, 'epic': 0.05, 'rare': 0.2}},
        'silver': {'count': 5, 'weights': {'legendary': 0.02, 'epic': 0.1, 'rare': 0.4}},
        'gold': {'count': 5, 'weights': {'legendary': 0.05, 'epic': 0.3, 'rare': 0.5}},
        'legends': {'count': 5, 'weights': {'legendary': 0.2, 'epic': 0.4, 'rare': 0.4}},
    }
    pack = packs.get(pack_type, packs['basic'])
    return pack['count'], pack['weights']


def can_claim_daily(db: Session, user_id: int) -> tuple[bool, datetime | None]:
    last_claim = db.query(DailyPack).filter(
        DailyPack.user_id == user_id
    ).order_by(DailyPack.created_at.desc()).first()
    
    if not last_claim:
        return True, None
    
    next_claim = last_claim.created_at + timedelta(hours=24)
    if datetime.now() >= next_claim:
        return True, None
    
    return False, next_claim


def open_pack(db: Session, user_id: int, pack_type: str = 'basic') -> list[UserCard]:
    count, weights = get_pack_contents(pack_type)
    rarities = get_daily_pack_cards(weights)
    
    new_cards = []
    for rarity in rarities:
        cards = db.query(Card).filter(Card.rarity == rarity).all()
        if not cards:
            cards = db.query(Card).filter(Card.rarity == Rarity.COMMON).all()
        
        card = random.choice(cards) if cards else None
        if not card:
            continue
        
        existing = db.query(UserCard).filter(
            UserCard.user_id == user_id,
            UserCard.card_id == card.id
        ).first()
        
        if existing:
            existing.quantity += 1
            new_cards.append(existing)
        else:
            user_card = UserCard(user_id=user_id, card_id=card.id, quantity=1)
            db.add(user_card)
            new_cards.append(user_card)
    
    daily_pack = DailyPack(user_id=user_id, pack_type=pack_type, cards_received=str([c.card_id for c in new_cards]))
    db.add(daily_pack)
    db.commit()
    
    return new_cards