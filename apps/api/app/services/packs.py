import asyncpg
import random
import json

def get_weighted_rarity(weights: dict) -> str:
    total = sum(weights.values())
    roll = random.uniform(0, total)
    current = 0
    for rarity, weight in weights.items():
        current += weight
        if roll <= current:
            return rarity
    return "Common"

async def open_pack(conn: asyncpg.Connection, player_id: int, pack_type: str = 'Basic') -> dict:
    row = await conn.fetchrow("SELECT * FROM packs WHERE type = $1", pack_type)
    if not row:
        raise Exception(f"Pack {pack_type} not found")
        
    pack = dict(row)
    price = pack['price']
    
    inventory = await conn.fetchrow("SELECT id, coins FROM inventories WHERE player_id = $1", player_id)
    if not inventory:
        raise Exception("Inventory not found")
        
    if inventory['coins'] < price:
        raise Exception(f"Not enough coins. Need {price}")
        
    coins_gained = random.randint(pack['min_coin'], pack['max_coin'])
    
    await conn.execute("UPDATE inventories SET coins = coins - $1 + $2 WHERE id = $3", price, coins_gained, inventory['id'])
    
    cards_config = json.loads(pack['cards_config']) if isinstance(pack['cards_config'], str) else pack['cards_config']
    
    rarities = []
    for conf in cards_config:
        count = conf.get('count', 0)
        if conf['type'] == 'guaranteed':
            rarities.extend([conf['rarity']] * count)
        elif conf['type'] == 'random':
            for _ in range(count):
                rarities.append(get_weighted_rarity(conf['weights']))
                
    new_cards = []
    for rarity in rarities:
        if pack['is_event'] and pack['event_name']:
            cards = await conn.fetch("SELECT id FROM cards WHERE rarity = $1 AND type = $2", rarity, pack['event_name'])
            if not cards:
                cards = await conn.fetch("SELECT id FROM cards WHERE type = $1", pack['event_name'])
        else:
            cards = await conn.fetch("SELECT id FROM cards WHERE rarity = $1 AND type = 'Base'", rarity)
            if not cards:
                cards = await conn.fetch("SELECT id FROM cards WHERE rarity = 'Common' AND type = 'Base'")
            
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
        
    return {"cards": new_cards, "coins_gained": coins_gained}