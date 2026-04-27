import asyncpg
import random

def get_pack_contents(pack_type: str) -> tuple[int, dict, int]:
    packs = {
        'basic': {'count': 3, 'weights': {'Legendary': 0.01, 'Epic': 0.05, 'Rare': 0.2}, 'price': 100},
        'silver': {'count': 5, 'weights': {'Legendary': 0.02, 'Epic': 0.1, 'Rare': 0.4}, 'price': 250},
        'gold': {'count': 5, 'weights': {'Legendary': 0.05, 'Epic': 0.3, 'Rare': 0.5}, 'price': 500},
        'legends': {'count': 5, 'weights': {'Legendary': 0.2, 'Epic': 0.4, 'Rare': 0.4}, 'price': 1000},
    }
    pack = packs.get(pack_type, packs['basic'])
    return pack['count'], pack['weights'], pack['price']

def get_pack_cards_rarity(weights: dict) -> list[str]:
    rarities = []
    roll = random.random()
    if roll < weights.get('Legendary', 0):
        rarities.append('Legendary')
    elif roll < weights.get('Legendary', 0) + weights.get('Epic', 0):
        rarities.append('Epic')
    elif roll < weights.get('Legendary', 0) + weights.get('Epic', 0) + weights.get('Rare', 0):
        rarities.append('Rare')
    else:
        rarities.append('Common')
    return rarities

async def open_pack(conn: asyncpg.Connection, player_id: int, pack_type: str = 'basic') -> list[dict]:
    count, weights, price = get_pack_contents(pack_type)
    
    inventory = await conn.fetchrow("SELECT id, coins FROM inventories WHERE player_id = $1", player_id)
    if not inventory:
        raise Exception("Inventory not found")
        
    if inventory['coins'] < price:
        raise Exception(f"Not enough coins. Need {price}")
        
    await conn.execute("UPDATE inventories SET coins = coins - $1 WHERE id = $2", price, inventory['id'])
    
    rarities = []
    for _ in range(count):
        rarities.extend(get_pack_cards_rarity(weights))
        
    new_cards = []
    for rarity in rarities:
        cards = await conn.fetch("SELECT id FROM cards WHERE rarity = $1", rarity)
        if not cards:
            cards = await conn.fetch("SELECT id FROM cards WHERE rarity = 'Common'")
            
        if not cards:
            continue
            
        card = random.choice(cards)
        
        existing = await conn.fetchrow(
            "SELECT inventory_id, card_id, quantity FROM inventory_cards WHERE inventory_id = $1 AND card_id = $2",
            inventory['id'], card['id']
        )
        
        if existing:
            await conn.execute(
                "UPDATE inventory_cards SET quantity = quantity + 1 WHERE inventory_id = $1 AND card_id = $2",
                inventory['id'], card['id']
            )
        else:
            await conn.execute(
                "INSERT INTO inventory_cards (inventory_id, card_id, quantity) VALUES ($1, $2, 1)",
                inventory['id'], card['id']
            )
            
        ic_full = await conn.fetchrow("""
            SELECT ic.*, 
                   c.id as c_id, c.name, c.att, c.def as defense, c.finisher, c.signature, c.image, c.rarity, c.price
            FROM inventory_cards ic
            JOIN cards c ON ic.card_id = c.id
            WHERE ic.inventory_id = $1 AND ic.card_id = $2
        """, inventory['id'], card['id'])
        
        d = dict(ic_full)
        d['card'] = {
            'id': d['c_id'],
            'name': d['name'],
            'att': d['att'],
            'def': d['defense'],
            'finisher': d['finisher'],
            'signature': d['signature'],
            'image': d['image'],
            'rarity': d['rarity'],
            'price': d['price']
        }
        new_cards.append(d)
        
    return new_cards