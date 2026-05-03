from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import asyncpg
from typing import List
from ..database import get_db
from ..schemas import BaseCardCreate, CardCreate, CardResponse, UpdateCoinsRequest
from .. import crud, file_handler

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.post("/cards/base", response_model=List[CardResponse])
async def add_base_cards(card_data: BaseCardCreate, conn: asyncpg.Connection = Depends(get_db)):
    try:
        cards = await crud.create_base_cards(conn, card_data)
        return [CardResponse.model_validate(c) for c in cards]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/cards/event", response_model=CardResponse)
async def add_event_card(card_data: CardCreate, conn: asyncpg.Connection = Depends(get_db)):
    try:
        card = await crud.create_event_card(conn, card_data)
        return CardResponse.model_validate(card)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload")
async def upload_card_image(file: UploadFile = File(...)):
    url = await file_handler.save_card_photo(file)
    if not url:
        raise HTTPException(status_code=500, detail="Failed to save image")
    return {"url": url}

@router.get("/cards/grouped")
async def get_grouped_cards(conn: asyncpg.Connection = Depends(get_db)):
    try:
        grouped = await crud.get_grouped_cards(conn)
        return grouped
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/cards/{card_id}")
async def delete_card(card_id: int, conn: asyncpg.Connection = Depends(get_db)):
    try:
        await crud.delete_card(conn, card_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/wrestlers/{wrestler_name}")
async def delete_wrestler_cards(wrestler_name: str, conn: asyncpg.Connection = Depends(get_db)):
    try:
        await crud.delete_wrestler_cards(conn, wrestler_name)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/cards")
async def delete_all_cards(conn: asyncpg.Connection = Depends(get_db)):
    try:
        await crud.delete_all_cards(conn)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/users")
async def get_all_users(conn: asyncpg.Connection = Depends(get_db)):
    try:
        users = await crud.get_all_players_with_coins(conn)
        return users
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/users/{user_id}/coins")
async def update_user_coins(user_id: int, req: UpdateCoinsRequest, conn: asyncpg.Connection = Depends(get_db)):
    try:
        await crud.update_player_coins(conn, user_id, req.coins)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

from ..schemas import PackCreate, PackResponse

@router.get("/packs", response_model=List[PackResponse])
async def get_packs(conn: asyncpg.Connection = Depends(get_db)):
    try:
        packs = await crud.get_packs(conn)
        return packs
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/packs", response_model=PackResponse)
async def create_pack(pack: PackCreate, conn: asyncpg.Connection = Depends(get_db)):
    try:
        saved = await crud.save_pack(conn, pack)
        return saved
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/packs/{pack_id}", response_model=PackResponse)
async def update_pack(pack_id: int, pack: PackCreate, conn: asyncpg.Connection = Depends(get_db)):
    try:
        saved = await crud.save_pack(conn, pack, pack_id)
        return saved
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

