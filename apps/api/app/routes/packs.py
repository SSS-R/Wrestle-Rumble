from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db import get_db
from ..models import User, UserCard, DailyPack
from ..schemas import UserCardResponse, PackOpenResponse
from ..services.packs import open_pack, can_claim_daily

router = APIRouter(prefix="/api/packs", tags=["packs"])


@router.get("/daily/available")
def check_daily_pack(user_id: int, db: Session = Depends(get_db)):
    can_claim, next_available = can_claim_daily(db, user_id)
    return {
        "available": can_claim,
        "next_available": next_available.isoformat() if next_available else None
    }


@router.post("/daily/claim", response_model=PackOpenResponse)
def claim_daily_pack(user_id: int, db: Session = Depends(get_db)):
    can_claim, next_available = can_claim_daily(db, user_id)
    
    if not can_claim:
        raise HTTPException(
            status_code=400, 
            detail=f"Daily pack already claimed. Next available at {next_available}"
        )
    
    cards = open_pack(db, user_id, 'basic')
    
    return PackOpenResponse(
        cards=[UserCardResponse.model_validate(c) for c in cards],
        coins_gained=0
    )


@router.get("/user/{user_id}/cards", response_model=List[UserCardResponse])
def get_user_cards(user_id: int, db: Session = Depends(get_db)):
    user_cards = db.query(UserCard).filter(UserCard.user_id == user_id).all()
    return [UserCardResponse.model_validate(uc) for uc in user_cards]
