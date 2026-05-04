from fastapi import APIRouter, Depends, HTTPException
import asyncpg
from pydantic import BaseModel
from typing import List, Optional
from ..database import get_db

router = APIRouter(prefix="/api/social", tags=["social"])

class AddFriendRequest(BaseModel):
    friend_name: str

class TradeOffer(BaseModel):
    card_ids: List[int]
    coins: int = 0

class TradeProposal(BaseModel):
    friend_id: int
    offer: TradeOffer
    request: TradeOffer

class FriendEntry(BaseModel):
    id: int
    name: str
    trophy: int
    is_online: bool = False

class FriendRequestEntry(BaseModel):
    id: int
    sender_id: int
    sender_name: str
    sender_trophy: int

@router.get("/{player_id}/friends", response_model=List[FriendEntry])
async def get_friends(player_id: int, conn: asyncpg.Connection = Depends(get_db)):
    """Get player's friends list"""
    friends = await conn.fetch("""
        SELECT p.id, u.name, p.trophy
        FROM socials s
        JOIN players p ON p.id = s.player_id
        JOIN users u ON u.id = p.id
        WHERE s.player_id = $1 AND s.friends > 0
        ORDER BY p.trophy DESC
    """, player_id)
    
    return [
        FriendEntry(
            id=f['id'],
            name=f['name'],
            trophy=f['trophy'],
            is_online=False  # Could be enhanced with WebSocket presence
        )
        for f in friends
    ]

@router.get("/{player_id}/requests", response_model=List[FriendRequestEntry])
async def get_friend_requests(player_id: int, conn: asyncpg.Connection = Depends(get_db)):
    """Get pending friend requests"""
    requests = await conn.fetch("""
        SELECT fr.id, fr.sender_id, u.name as sender_name, p.trophy as sender_trophy
        FROM friend_requests fr
        JOIN players p ON p.id = fr.sender_id
        JOIN users u ON u.id = fr.sender_id
        WHERE fr.receiver_id = $1 AND fr.status = 'pending'
        ORDER BY fr.created_at DESC
    """, player_id)
    
    return [
        FriendRequestEntry(
            id=r['id'],
            sender_id=r['sender_id'],
            sender_name=r['sender_name'],
            sender_trophy=r['sender_trophy']
        )
        for r in requests
    ]

@router.post("/{player_id}/add")
async def add_friend(player_id: int, data: AddFriendRequest, conn: asyncpg.Connection = Depends(get_db)):
    """Send friend request"""
    # Find the user
    target = await conn.fetchrow(
        "SELECT p.id FROM players p JOIN users u ON p.id = u.id WHERE u.name = $1",
        data.friend_name
    )
    
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target['id'] == player_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself")
    
    # Check if already friends
    existing = await conn.fetchrow(
        "SELECT id FROM socials WHERE player_id = $1 AND friends > 0",
        target['id']
    )
    
    if existing:
        raise HTTPException(status_code=400, detail="Already friends")
    
    # Check if request already exists
    existing_request = await conn.fetchrow(
        "SELECT id FROM friend_requests WHERE sender_id = $1 AND receiver_id = $2 AND status = 'pending'",
        player_id, target['id']
    )
    
    if existing_request:
        raise HTTPException(status_code=400, detail="Request already sent")
    
    # Create friend request
    await conn.execute("""
        INSERT INTO friend_requests (sender_id, receiver_id, status)
        VALUES ($1, $2, 'pending')
    """, player_id, target['id'])
    
    return {"status": "request_sent"}

@router.post("/{player_id}/requests/{sender_id}/accept")
async def accept_friend_request(player_id: int, sender_id: int, conn: asyncpg.Connection = Depends(get_db)):
    """Accept friend request"""
    async with conn.transaction():
        # Update request status
        await conn.execute("""
            UPDATE friend_requests SET status = 'accepted'
            WHERE sender_id = $1 AND receiver_id = $2 AND status = 'pending'
        """, sender_id, player_id)
        
        # Add/update socials for both players
        await conn.execute("""
            INSERT INTO socials (player_id, friends)
            VALUES ($1, 1)
            ON CONFLICT (player_id) DO UPDATE SET friends = socials.friends + 1
        """, player_id)
        
        await conn.execute("""
            INSERT INTO socials (player_id, friends)
            VALUES ($1, 1)
            ON CONFLICT (player_id) DO UPDATE SET friends = socials.friends + 1
        """, sender_id)
    
    return {"status": "accepted"}

@router.post("/{player_id}/requests/{sender_id}/reject")
async def reject_friend_request(player_id: int, sender_id: int, conn: asyncpg.Connection = Depends(get_db)):
    """Reject friend request"""
    await conn.execute("""
        UPDATE friend_requests SET status = 'rejected'
        WHERE sender_id = $1 AND receiver_id = $2 AND status = 'pending'
    """, sender_id, player_id)
    
    return {"status": "rejected"}

@router.delete("/{player_id}/friends/{friend_id}")
async def remove_friend(player_id: int, friend_id: int, conn: asyncpg.Connection = Depends(get_db)):
    """Remove friend"""
    async with conn.transaction():
        # Decrement friend count for both players
        await conn.execute("""
            UPDATE socials SET friends = GREATEST(0, friends - 1)
            WHERE player_id = $1
        """, player_id)
        
        await conn.execute("""
            UPDATE socials SET friends = GREATEST(0, friends - 1)
            WHERE player_id = $1
        """, friend_id)
    
    return {"status": "removed"}


@router.post("/{player_id}/trade")
async def propose_trade(player_id: int, data: TradeProposal, conn: asyncpg.Connection = Depends(get_db)):
    """Propose a trade to a friend"""
    # Skip friendship check for demo user (id=1)
    if data.friend_id != 1:
        # Verify friendship
        friend_social = await conn.fetchrow(
            "SELECT id FROM socials WHERE player_id = $1 AND friends > 0",
            data.friend_id
        )
        
        if not friend_social:
            raise HTTPException(status_code=400, detail="Not friends with this player")
    
    # Verify player owns the offered cards
    inventory = await conn.fetchrow("SELECT id FROM inventories WHERE player_id = $1", player_id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    for card_id in data.offer.card_ids:
        card = await conn.fetchrow(
            "SELECT card_id FROM inventory_cards WHERE inventory_id = $1 AND card_id = $2",
            inventory['id'], card_id
        )
        if not card:
            raise HTTPException(status_code=400, detail=f"You don't own card {card_id}")
    
    # Verify player has enough coins
    inv_data = await conn.fetchrow("SELECT coins FROM inventories WHERE player_id = $1", player_id)
    if inv_data['coins'] < data.offer.coins:
        raise HTTPException(status_code=400, detail="Not enough coins")
    
    # Create trade proposal (basic schema - just stores sender/receiver for now)
    async with conn.transaction():
        trade_id = await conn.fetchval("""
            INSERT INTO trades (sender_id, receiver_id)
            VALUES ($1, $2)
            RETURNING id
        """, player_id, data.friend_id)
    
    return {"status": "trade_proposed", "trade_id": trade_id}


class ChallengeRequest(BaseModel):
    challenger_name: str
    challenger_trophy: int

@router.get("/{player_id}/challenges")
async def get_challenges(player_id: int, conn: asyncpg.Connection = Depends(get_db)):
    """Get pending challenge requests for a player"""
    challenges = await conn.fetch("""
        SELECT cr.id, cr.challenger_id, u.name as challenger_name, p.trophy as challenger_trophy, cr.created_at
        FROM challenge_requests cr
        JOIN users u ON u.id = cr.challenger_id
        JOIN players p ON p.id = cr.challenger_id
        WHERE cr.receiver_id = $1 AND cr.status = 'pending'
        ORDER BY cr.created_at DESC
    """, player_id)
    
    return [
        {
            "id": c['id'],
            "challenger_id": c['challenger_id'],
            "challenger_name": c['challenger_name'],
            "challenger_trophy": c['challenger_trophy'],
        }
        for c in challenges
    ]


@router.post("/{player_id}/challenge")
async def send_challenge(player_id: int, data: dict, conn: asyncpg.Connection = Depends(get_db)):
    """Send a challenge request to a friend"""
    friend_id = data.get('friend_id')
    
    if not friend_id:
        raise HTTPException(status_code=400, detail="friend_id required")
    
    # Verify friendship
    friend_social = await conn.fetchrow(
        "SELECT id FROM socials WHERE player_id = $1 AND friends > 0",
        friend_id
    )
    
    if not friend_social:
        raise HTTPException(status_code=400, detail="Not friends with this player")
    
    # Check if challenge already exists
    existing = await conn.fetchrow(
        "SELECT id FROM challenge_requests WHERE challenger_id = $1 AND receiver_id = $2 AND status = 'pending'",
        player_id, friend_id
    )
    
    if existing:
        raise HTTPException(status_code=400, detail="Challenge already sent")
    
    # Create challenge request
    async with conn.transaction():
        await conn.execute("""
            INSERT INTO challenge_requests (challenger_id, receiver_id, status)
            VALUES ($1, $2, 'pending')
        """, player_id, friend_id)
    
    return {"status": "challenge_sent"}


@router.post("/{player_id}/challenges/{challenge_id}/accept")
async def accept_challenge(player_id: int, challenge_id: int, conn: asyncpg.Connection = Depends(get_db)):
    """Accept a challenge request"""
    # Verify the challenge is for this player
    challenge = await conn.fetchrow(
        "SELECT * FROM challenge_requests WHERE id = $1 AND receiver_id = $2 AND status = 'pending'",
        challenge_id, player_id
    )
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    # Update challenge status to accepted
    async with conn.transaction():
        await conn.execute("""
            UPDATE challenge_requests SET status = 'accepted'
            WHERE id = $1
        """, challenge_id)
    
    return {
        "status": "accepted",
        "challenger_id": challenge['challenger_id'],
        "challenge_id": challenge_id,
    }


@router.post("/{player_id}/challenges/{challenge_id}/reject")
async def reject_challenge(player_id: int, challenge_id: int, conn: asyncpg.Connection = Depends(get_db)):
    """Reject a challenge request"""
    # Verify the challenge is for this player
    challenge = await conn.fetchrow(
        "SELECT * FROM challenge_requests WHERE id = $1 AND receiver_id = $2 AND status = 'pending'",
        challenge_id, player_id
    )
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    # Update challenge status to rejected
    async with conn.transaction():
        await conn.execute("""
            UPDATE challenge_requests SET status = 'rejected'
            WHERE id = $1
        """, challenge_id)
    
    return {"status": "rejected"}
