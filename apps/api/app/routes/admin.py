from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import asyncpg
from typing import List
from ..database import get_db
from ..schemas import BaseCardCreate, CardCreate, CardResponse
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
