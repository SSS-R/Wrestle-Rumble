from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class Rarity(str, Enum):
    COMMON = "Common"
    RARE = "Rare"
    EPIC = "Epic"
    LEGENDARY = "Legendary"


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    level: int
    coins: int
    trophies: int

    class Config:
        from_attributes = True


class CardBase(BaseModel):
    wrestler_id: int
    rarity: Rarity
    attack: int
    defense: int
    price: int = 100


class CardResponse(CardBase):
    id: int
    wrestler: "WrestlerResponse"

    class Config:
        from_attributes = True


class WrestlerBase(BaseModel):
    name: str
    signature_move: Optional[str] = None
    finisher: Optional[str] = None
    image_url: Optional[str] = None


class WrestlerResponse(WrestlerBase):
    id: int

    class Config:
        from_attributes = True


class UserCardResponse(BaseModel):
    id: int
    card_id: int
    quantity: int
    is_active: bool
    card: CardResponse

    class Config:
        from_attributes = True


class BattleCreate(BaseModel):
    opponent_id: Optional[int] = None
    user_card_id: int


class BattleResponse(BaseModel):
    id: int
    user_id: int
    opponent_id: Optional[int]
    user_card_id: int
    opponent_card_id: Optional[int]
    user_score: Optional[int]
    opponent_score: Optional[int]
    result: Optional[str]
    trophies_gained: int
    coins_gained: int
    created_at: datetime

    class Config:
        from_attributes = True


class BattleResult(BaseModel):
    battle_id: int
    user_won: bool
    user_score: int
    opponent_score: int
    trophies_gained: int
    coins_gained: int


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    trophies: int


class PackOpenResponse(BaseModel):
    cards: List[UserCardResponse]
    coins_gained: int = 0


WrestlerResponse.model_rebuild()
CardResponse.model_rebuild()
