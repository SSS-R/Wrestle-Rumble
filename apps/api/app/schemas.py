from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "player"

class UserLogin(BaseModel):
    name: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

class PlayerResponse(BaseModel):
    id: int
    age: int
    trophy: int
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    user: UserResponse
    player: Optional[PlayerResponse] = None
    role: str
    coins: int = 0

class CardBase(BaseModel):
    name: str
    att: int
    defense: int = Field(alias="def")
    finisher: Optional[str] = None
    signature: Optional[str] = None
    image: Optional[str] = None
    rarity: Optional[str] = 'Common'
    type: Optional[str] = 'Base'
    price: int = 100

class VariantCreate(BaseModel):
    name: str
    att: int
    defense: int = Field(alias="def")
    finisher: Optional[str] = None
    signature: Optional[str] = None
    image: Optional[str] = None
    rarity: str
    price: int

class BaseCardCreate(BaseModel):
    variants: List[VariantCreate]

class CardCreate(CardBase):
    pass

class CardResponse(CardBase):
    id: int

    class Config:
        from_attributes = True
        populate_by_name = True

class InventoryCardResponse(BaseModel):
    inventory_id: int
    card_id: int
    quantity: int
    is_active: bool
    card: CardResponse

    class Config:
        from_attributes = True

class BattleCreate(BaseModel):
    player_id: int
    opponent_id: Optional[int] = None
    opponent_card_id: Optional[int] = None
    user_card_id: int

class BattleResult(BaseModel):
    match_id: int
    user_won: bool
    user_score: int
    opponent_score: int
    trophies_gained: int
    coins_gained: int

class LeaderboardEntry(BaseModel):
    rank: int
    player_id: int
    name: str
    trophy: int

class PackOpenResponse(BaseModel):
    cards: List[InventoryCardResponse]
    coins_gained: int = 0

class UpdateCoinsRequest(BaseModel):
    coins: int
