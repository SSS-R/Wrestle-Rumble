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
    ranked: bool = False

class BattleEvent(BaseModel):
    timestamp: float
    event_type: str
    actor: str
    description: str
    damage: Optional[int] = None
    effect: Optional[str] = None

class BattleResult(BaseModel):
    match_id: int
    user_won: bool
    user_score: int
    opponent_score: int
    trophies_gained: int
    coins_gained: int
    duration: int = 15
    events: List[BattleEvent] = []
    opponent_card_id: int
    opponent_card_name: str
    opponent_card_rarity: str
    opponent_card_att: int
    opponent_card_def: int
    opponent_card_signature: Optional[str] = None
    opponent_card_finisher: Optional[str] = None

class LeaderboardEntry(BaseModel):
    rank: int
    player_id: int
    name: str
    trophy: int

class PackOpenResponse(BaseModel):
    cards: List[InventoryCardResponse]
    coins_gained: int = 0

<<<<<<< ours

class QueueStatus(BaseModel):
    queued: bool
    waiting_time: int
    match_found: bool = False
    opponent_id: Optional[int] = None


class MatchmakingResult(BaseModel):
    match_id: int
    player1_id: int
    player2_id: int
    player1_card: dict
    player2_card: dict
=======
class UpdateCoinsRequest(BaseModel):
    coins: int

class PackCreate(BaseModel):
    type: str
    price: int
    store_id: int = 1
    min_coin: int
    max_coin: int
    cards_config: List[dict]
    is_event: bool = False
    event_name: Optional[str] = None

class PackResponse(PackCreate):
    id: int
    class Config:
        from_attributes = True

class EventCreate(BaseModel):
    name: str
    entry_trophy: int
    start_time: datetime
    end_time: datetime

class EventResponse(BaseModel):
    id: int
    name: str
    entry_trophy: int
    start_time: datetime
    end_time: datetime
>>>>>>> theirs
