from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.api_schemas import UserRead

class ChatMessageCreate(BaseModel):
    receiver_id: Optional[str] = None
    channel: str = "direct"
    message: str
    attachment_url: Optional[str] = None

class ChatMessageRead(BaseModel):
    id: str
    sender_id: str
    receiver_id: Optional[str] = None
    channel: str
    message: str
    attachment_url: Optional[str] = None
    is_read: bool
    created_at: datetime
    sender: Optional[UserRead] = None

    class Config:
        from_attributes = True

class ChatConversationSummary(BaseModel):
    user: UserRead
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
