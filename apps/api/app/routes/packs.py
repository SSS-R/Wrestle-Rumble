from fastapi import APIRouter, Depends, HTTPException
import asyncpg
from typing import List
from ..database import get_db
from ..schemas import InventoryCardResponse, PackOpenResponse
from ..services.packs import open_pack

router = APIRouter(prefix="/api/packs", tags=["packs"])

@router.post("/open", response_model=PackOpenResponse)
async def open_pack_route(player_id: int, pack_type: str = 'Basic', conn: asyncpg.Connection = Depends(get_db)):
    try:
        res = await open_pack(conn, player_id, pack_type)
        return PackOpenResponse(
            cards=[InventoryCardResponse.model_validate(c) for c in res['cards']],
            coins_gained=res['coins_gained']
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/player/{player_id}/cards", response_model=List[InventoryCardResponse])
async def get_player_cards(player_id: int, conn: asyncpg.Connection = Depends(get_db)):
    inventory = await conn.fetchrow("SELECT id FROM inventories WHERE player_id = $1", player_id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
        
    user_cards = await conn.fetch("""
        SELECT ic.*, 
               c.id as c_id, c.name, c.att, c.def as defense, c.finisher, c.signature, c.image, c.rarity, c.price
        FROM inventory_cards ic
        JOIN cards c ON ic.card_id = c.id
        WHERE ic.inventory_id = $1
    """, inventory['id'])
    
    result = []
    for ic in user_cards:
        d = dict(ic)
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
        result.append(InventoryCardResponse.model_validate(d))
    return result