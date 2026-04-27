from fastapi import APIRouter, Depends, HTTPException
import asyncpg
from typing import List
from ..database import get_db
from ..schemas import UserCardResponse, PackOpenResponse
from ..services.packs import open_pack, can_claim_daily

router = APIRouter(prefix="/api/packs", tags=["packs"])

@router.get("/daily/available")
async def check_daily_pack(user_id: int, conn: asyncpg.Connection = Depends(get_db)):
    can_claim, next_available = await can_claim_daily(conn, user_id)
    return {
        "available": can_claim,
        "next_available": next_available.isoformat() if next_available else None
    }

@router.post("/daily/claim", response_model=PackOpenResponse)
async def claim_daily_pack(user_id: int, conn: asyncpg.Connection = Depends(get_db)):
    can_claim, next_available = await can_claim_daily(conn, user_id)
    
    if not can_claim:
        raise HTTPException(
            status_code=400, 
            detail=f"Daily pack already claimed. Next available at {next_available}"
        )
    
    cards = await open_pack(conn, user_id, 'basic')
    
    return PackOpenResponse(
        cards=[UserCardResponse.model_validate(c) for c in cards],
        coins_gained=0
    )

@router.get("/user/{user_id}/cards", response_model=List[UserCardResponse])
async def get_user_cards(user_id: int, conn: asyncpg.Connection = Depends(get_db)):
    user_cards = await conn.fetch("""
        SELECT uc.*, 
               c.id as c_id, c.wrestler_id, c.rarity, c.attack, c.defense, c.price,
               w.id as w_id, w.name, w.signature_move, w.finisher, w.image_url
        FROM user_cards uc
        JOIN cards c ON uc.card_id = c.id
        JOIN wrestlers w ON c.wrestler_id = w.id
        WHERE uc.user_id = $1
    """, user_id)
    
    result = []
    for uc in user_cards:
        d = dict(uc)
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
        result.append(UserCardResponse.model_validate(d))
    return result