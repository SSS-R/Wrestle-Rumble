from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .db import Base


class Rarity(enum.Enum):
    COMMON = "Common"
    RARE = "Rare"
    EPIC = "Epic"
    LEGENDARY = "Legendary"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    level = Column(Integer, default=1)
    coins = Column(Integer, default=500)
    trophies = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cards = relationship("UserCard", back_populates="user")
    battles = relationship("Battle", foreign_keys="Battle.user_id", back_populates="user")
    daily_packs = relationship("DailyPack", back_populates="user")


class Wrestler(Base):
    __tablename__ = "wrestlers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    signature_move = Column(String)
    finisher = Column(String)
    image_url = Column(String)

    cards = relationship("Card", back_populates="wrestler")


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    wrestler_id = Column(Integer, ForeignKey("wrestlers.id"), nullable=False)
    rarity = Column(Enum(Rarity), nullable=False)
    attack = Column(Integer, nullable=False)
    defense = Column(Integer, nullable=False)
    price = Column(Integer, default=100)

    wrestler = relationship("Wrestler", back_populates="cards")
    user_cards = relationship("UserCard", back_populates="card")


class UserCard(Base):
    __tablename__ = "user_cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    card_id = Column(Integer, ForeignKey("cards.id"), nullable=False)
    quantity = Column(Integer, default=1)
    is_active = Column(Boolean, default=False)
    acquired_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="cards")
    card = relationship("Card", back_populates="user_cards")


class Battle(Base):
    __tablename__ = "battles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    opponent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_card_id = Column(Integer, ForeignKey("user_cards.id"), nullable=False)
    opponent_card_id = Column(Integer, ForeignKey("user_cards.id"), nullable=True)
    user_score = Column(Integer)
    opponent_score = Column(Integer)
    result = Column(String)
    trophies_gained = Column(Integer, default=0)
    coins_gained = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id], back_populates="battles")
    user_card = relationship("UserCard", foreign_keys=[user_card_id])


class DailyPack(Base):
    __tablename__ = "daily_packs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pack_type = Column(String, nullable=False)
    cards_received = Column(String)
    claimed_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="daily_packs")


class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    friend_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
