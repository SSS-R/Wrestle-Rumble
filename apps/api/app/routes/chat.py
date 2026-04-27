from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
from collections import deque
import json
from datetime import datetime

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Global Chat Memory Cache
GLOBAL_CHAT_HISTORY = deque(maxlen=50)
global_connections: List[WebSocket] = []

# Private Chat active connections
private_connections: Dict[int, WebSocket] = {}

@router.websocket("/ws/global")
async def global_chat(websocket: WebSocket):
    await websocket.accept()
    global_connections.append(websocket)
    
    # Push history to new user
    for msg in GLOBAL_CHAT_HISTORY:
        await websocket.send_text(msg)
        
    try:
        while True:
            data = await websocket.receive_text()
            GLOBAL_CHAT_HISTORY.append(data)
            
            # Broadcast to everyone else
            for connection in global_connections:
                if connection != websocket:
                    await connection.send_text(data)
    except WebSocketDisconnect:
        global_connections.remove(websocket)


@router.websocket("/ws/private/{player_id}")
async def private_chat(websocket: WebSocket, player_id: int):
    await websocket.accept()
    private_connections[player_id] = websocket
    
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            receiver_id = payload.get("receiver_id")
            content = payload.get("content")
            
            if receiver_id and content:
                # Briefly acquire DB connection to save message without holding it forever
                pool = websocket.app.state.db_pool
                async with pool.acquire() as conn:
                    await conn.execute(
                        "INSERT INTO private_messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)",
                        player_id, receiver_id, content
                    )
                
                # Deliver real-time to online friend
                if receiver_id in private_connections:
                    msg = json.dumps({
                        "sender_id": player_id,
                        "content": content,
                        "timestamp": datetime.now().isoformat()
                    })
                    await private_connections[receiver_id].send_text(msg)
                    
    except WebSocketDisconnect:
        if player_id in private_connections:
            del private_connections[player_id]
