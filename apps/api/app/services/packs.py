import asyncpg
from datetime import datetime, timedelta
import random
import json

def get_pack_contents(pack_type: str) -> tuple[int, dict]:
    packs = {
        'basic': {'count': 3, 'weights': {'legendary': 0.01, 'epic': 0.05, 'rare': 0.2}},
        'silver': {'count': 5, 'weights': {'legendary': 0.02, 'epic': 0.1, 'rare': 0.4}},
        'gold': {'count': 5, 'weights': {'legendary': 0.05, 'epic': 0.3, 'rare': 0.5}},
        'legends': {'count': 5, 'weights': {'legendary': 0.2, 'epic': 0.4, 'rare': 0.4}},
    }
    pack = packs.get(pack_type, packs['basic'])
    return pack['count'], pack['weights']

def get_daily_pack_cards(weights: dict) -> list[str]:
    rarities = []
    roll = random.random()
    if roll < weights.get('legendary', 0):
        rarities.append('Legendary')
    elif roll < weights.get('legendary', 0) + weights.get('epic', 0):
        rarities.append('Epic')
    elif roll < weights.get('legendary', 0) + weights.get('epic', 0) + weights.get('rare', 0):
        rarities.append('Rare')
    else:
        rarities.append('Common')
    return rarities

async def can_claim_daily(conn: asyncpg.Connection, user_id: int) -> tuple[bool, datetime | None]:
    last_claim = await conn.fetchrow(
        "SELECT claimed_at FROM daily_packs WHERE user_id = $1 ORDER BY claimed_at DESC LIMIT 1",
        user_id
    )
    
    if not last_claim:
        return True, None
    
    next_claim = last_claim['claimed_at'] + timedelta(hours=24)
    if datetime.now().astimezone() >= next_claim:
        return True, None
    
    return False, next_claim

async def open_pack(conn: asyncpg.Connection, user_id: int, pack_type: str = 'basic') -> list[dict]:
    count, weights = get_pack_contents(pack_type)
    
    rarities = []
    for _ in range(count):
        rarities.extend(get_daily_pack_cards(weights))
        
    new_cards = []
    new_card_ids = []
    for rarity in rarities:
        cards = await conn.fetch("SELECT id FROM cards WHERE rarity = $1", rarity)
        if not cards:
            cards = await conn.fetch("SELECT id FROM cards WHERE rarity = 'Common'")
            
        if not cards:
            continue
            
        card = random.choice(cards)
        
        existing = await conn.fetchrow(
            "SELECT id, quantity FROM user_cards WHERE user_id = $1 AND card_id = $2",
            user_id, card['id']
        )
        
        if existing:
            await conn.execute(
                "UPDATE user_cards SET quantity = quantity + 1 WHERE id = $1",
                existing['id']
            )
            uc_id = existing['id']
        else:
            uc_id = await conn.fetchval(
                "INSERT INTO user_cards (user_id, card_id, quantity) VALUES ($1, $2, 1) RETURNING id",
                user_id, card['id']
            )
            
        uc_full = await conn.fetchrow("""
            SELECT uc.*, 
                   c.id as c_id, c.wrestler_id, c.rarity, c.attack, c.defense, c.price,
                   w.id as w_id, w.name, w.signature_move, w.finisher, w.image_url
            FROM user_cards uc
            JOIN cards c ON uc.card_id = c.id
            JOIN wrestlers w ON c.wrestler_id = w.id
            WHERE uc.id = $1
        """, uc_id)
        
        d = dict(uc_full)
        d['card'] = {
            'id': d['c_id'],
            'wrestler_id': d['wrestler_id'],
            'rarity': d['rarity'],
            'attack': d['attack'],
            'defense': d['defense'],
            'price': d['price'],
            'wrestler': {
                'id': d['w_id'],
                'name': d['name'],
                'signature_move': d['signature_move'],
                'finisher': d['finisher'],
                'image_url': d['image_url']
            }
        }
        new_cards.append(d)
            
        new_card_ids.append(card['id'])
        
    await conn.execute(
        "INSERT INTO daily_packs (user_id, pack_type, cards_received) VALUES ($1, $2, $3)",
        user_id, pack_type, json.dumps(new_card_ids)
    )
    
    return new_cards