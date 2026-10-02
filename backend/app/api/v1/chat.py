from datetime import datetime, timezone
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from app.core.database import get_db
from app.models.entities import ChatMessage, User
from app.schemas.chat import ChatMessageCreate, ChatMessageRead, ChatConversationSummary
from app.schemas.api_schemas import UserRead
from app.api.deps import get_current_user

router = APIRouter(prefix="/chat", tags=["Direct Chat & Messaging"])

# WebSocket Connection Manager for live messaging
class ConnectionManager:
    def __init__(self):
        # Map user_id -> set of WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get total unread messages count for current user"""
    count = db.query(ChatMessage).filter(
        ChatMessage.receiver_id == current_user.id,
        ChatMessage.is_read == False
    ).count()
    return {"unread_count": count}

@router.get("/conversations", response_model=List[ChatConversationSummary])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all active team members and latest conversation stats with current user.
    """
    # Get all active users except current user
    team_members = db.query(User).filter(
        User.id != current_user.id,
        User.is_active == True
    ).all()

    conversations = []
    for member in team_members:
        # Find latest message between current_user and member
        last_msg = db.query(ChatMessage).filter(
            or_(
                and_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == member.id),
                and_(ChatMessage.sender_id == member.id, ChatMessage.receiver_id == current_user.id)
            )
        ).order_by(desc(ChatMessage.created_at)).first()

        # Count unread messages from this member to current_user
        unread_count = db.query(ChatMessage).filter(
            ChatMessage.sender_id == member.id,
            ChatMessage.receiver_id == current_user.id,
            ChatMessage.is_read == False
        ).count()

        conversations.append(ChatConversationSummary(
            user=UserRead.model_validate(member),
            last_message=last_msg.message if last_msg else None,
            last_message_at=last_msg.created_at if last_msg else None,
            unread_count=unread_count
        ))

    # Sort conversations: those with messages first by recent time, then alphabetically
    conversations.sort(
        key=lambda c: (
            1 if c.last_message_at else 0,
            c.last_message_at or datetime.min.replace(tzinfo=timezone.utc)
        ),
        reverse=True
    )
    return conversations

@router.get("/messages/{other_user_id}", response_model=List[ChatMessageRead])
def get_messages_with_user(
    other_user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get message history between current user and other_user_id.
    Automatically marks incoming messages from other_user_id as read.
    """
    messages = db.query(ChatMessage).filter(
        or_(
            and_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == other_user_id),
            and_(ChatMessage.sender_id == other_user_id, ChatMessage.receiver_id == current_user.id)
        )
    ).order_by(ChatMessage.created_at.asc()).all()

    # Mark incoming messages as read
    unreads = [m for m in messages if m.sender_id == other_user_id and not m.is_read]
    if unreads:
        for m in unreads:
            m.is_read = True
        db.commit()

    return [ChatMessageRead.model_validate(m) for m in messages]

@router.post("/messages", response_model=ChatMessageRead, status_code=status.HTTP_201_CREATED)
async def send_message(
    msg_in: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a direct message to a coworker or manager.
    """
    if not msg_in.receiver_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="receiver_id is required for direct messaging"
        )

    # Validate receiver exists
    receiver = db.query(User).filter(User.id == msg_in.receiver_id).first()
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient user not found"
        )

    new_msg = ChatMessage(
        sender_id=current_user.id,
        receiver_id=msg_in.receiver_id,
        channel=msg_in.channel or "direct",
        message=msg_in.message.strip(),
        attachment_url=msg_in.attachment_url,
        is_read=False
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    msg_read = ChatMessageRead.model_validate(new_msg)

    # Broadcast live via WebSocket if receiver is connected
    payload = {
        "event": "new_message",
        "message": {
            "id": new_msg.id,
            "sender_id": new_msg.sender_id,
            "receiver_id": new_msg.receiver_id,
            "message": new_msg.message,
            "attachment_url": new_msg.attachment_url,
            "is_read": new_msg.is_read,
            "created_at": new_msg.created_at.isoformat() if new_msg.created_at else None,
            "sender_name": current_user.full_name,
            "sender_avatar": current_user.avatar_url
        }
    }
    await manager.send_personal_message(payload, msg_in.receiver_id)

    return msg_read

@router.post("/messages/{message_id}/read")
def mark_message_as_read(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    msg = db.query(ChatMessage).filter(
        ChatMessage.id == message_id,
        ChatMessage.receiver_id == current_user.id
    ).first()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    msg.is_read = True
    db.commit()
    return {"status": "success", "id": message_id}

@router.websocket("/ws/{user_id}")
async def websocket_chat_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            # Keep socket alive and receive any pings/typing indicators
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
    except Exception:
        manager.disconnect(user_id, websocket)
