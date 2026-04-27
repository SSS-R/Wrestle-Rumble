from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db import get_db
from ..models import User, Battle, UserCard, Card
from ..schemas import BattleCreate, BattleResponse, BattleResult, LeaderboardEntry
from ..services.combat import calculate_battle_score, calculate_rewards
import random

router = APIRouter(prefix="/api/combat", tags=["combat"])


@router.post("/battle", response_model=BattleResult)
def start_battle(battle_data: BattleCreate, db: Session = Depends(get_db)):
    user_card = db.query(UserCard).filter(
        UserCard.id == battle_data.user_card_id
    ).first()
    
    if not user_card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if battle_data.opponent_id:
        opponent_card = db.query(UserCard).filter(
            UserCard.id == battle_data.opponent_card_id,
            UserCard.user_id == battle_data.opponent_id
        ).first()
        if not opponent_card:
            raise HTTPException(status_code=404, detail="Opponent card not found")
    else:
        opponent_cards = db.query(UserCard).join(Card).filter(
            UserCard.user_id != user_card.user_id,
            UserCard.is_active == True
        ).all()
        
        if not opponent_cards:
            opponent_cards = db.query(UserCard).filter(
                UserCard.user_id != user_card.user_id
            ).all()
        
        if not opponent_cards:
            raise HTTPException(status_code=404, detail="No opponents available")
        
        opponent_card = random.choice(opponent_cards)
    
    user_score, opponent_score = calculate_battle_score(user_card.card, opponent_card.card)
    
    user_won = user_score > opponent_score
    user = db.query(User).filter(User.id == user_card.user_id).first()
    opponent = db.query(User).filter(User.id == opponent_card.user_id).first() if opponent_card else None
    
    trophies_gained, coins_gained = calculate_rewards(
        user_won, 
        user.level, 
        opponent.trophies if opponent else None
    )
    
    if user_won:
        user.trophies += trophies_gained
        user.coins += coins_gained
        result = "win"
    else:
        user.trophies = max(0, user.trophies - trophies_gained)
        result = "loss"
    
    battle = Battle(
        user_id=user_card.user_id,
        opponent_id=opponent_card.user_id if opponent_card else None,
        user_card_id=user_card.id,
        opponent_card_id=opponent_card.id if opponent_card else None,
        user_score=user_score,
        opponent_score=opponent_score,
        result=result,
        trophies_gained=trophies_gained if user_won else -trophies_gained,
        coins_gained=coins_gained if user_won else 0
    )
    
    db.add(battle)
    db.commit()
    db.refresh(battle)
    
    return BattleResult(
        battle_id=battle.id,
        user_won=user_won,
        user_score=user_score,
        opponent_score=opponent_score,
        trophies_gained=trophies_gained if user_won else 0,
        coins_gained=coins_gained if user_won else 0
    )


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(limit: int = 10, db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.trophies.desc()).limit(limit).all()
    
    return [
        LeaderboardEntry(rank=i + 1, user_id=user.id, username=user.username, trophies=user.trophies)
        for i, user in enumerate(users)
    ]


@router.get("/history", response_model=List[BattleResponse])
def get_battle_history(user_id: int, limit: int = 20, db: Session = Depends(get_db)):
    battles = db.query(Battle).filter(
        Battle.user_id == user_id
    ).order_by(Battle.created_at.desc()).limit(limit).all()
    
    return battles
