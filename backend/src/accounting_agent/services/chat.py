from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
import uuid
from datetime import datetime

from accounting_agent.models.chat import Chat
from accounting_agent.models.thread import Thread
from accounting_agent.databases.postgres_db import AsyncPostgreSQLDatabase


class ChatService:
    def __init__(self, db: AsyncPostgreSQLDatabase):
        self.db = db

    async def get_chats_for_user(self, user_id: str) -> List[Chat]:
        """
        Get all chats for a given user from PostgreSQL database.
        
        Args:
            user_id (str): The ID of the user to get chats for
            
        Returns:
            List[Chat]: List of Chat objects for the user
        """
        async with self.db.get_session() as session:
            # Query chats for the specific user
            stmt = select(Chat).where(Chat.user_id == user_id)
            result = await session.execute(stmt)
            chats = result.scalars().all()
            return chats

    async def create_thread(self, thread_id: Optional[str] = None) -> Thread:
        """
        Create a new thread in the database.
        
        Args:
            thread_id (Optional[str]): Optional thread_id to use, will generate UUID if not provided
            
        Returns:
            Thread: The created Thread object
        """
        async with self.db.get_session() as session:
            # Create new thread
            if thread_id:
                try:
                    # Validate that the provided thread_id is a valid UUID
                    thread_uuid = uuid.UUID(thread_id)
                except ValueError:
                    # If invalid, generate a new UUID
                    thread_uuid = uuid.uuid4()
            else:
                thread_uuid = uuid.uuid4()
                
            new_thread = Thread(
                thread_id=thread_uuid,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            session.add(new_thread)
            await session.commit()
            await session.refresh(new_thread)
            
            return new_thread

    async def create_chat(self, user_id: str, thread_id: str, title: str) -> Chat:
        """
        Create a new chat in the database linked to a user and thread.
        
        Args:
            user_id (str): The ID of the user
            thread_id (str): The ID of the thread to link to
            title (str): The title of the chat
            
        Returns:
            Chat: The created Chat object
        """
        async with self.db.get_session() as session:
            # Create new chat
            new_chat = Chat(
                user_id=user_id,
                thread_id=uuid.UUID(thread_id),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            session.add(new_chat)
            await session.commit()
            await session.refresh(new_chat)
            
            return new_chat

    async def get_chats_with_threads_for_user(self, user_id: str) -> List[Chat]:
        """
        Get all chats with their associated threads for a given user.
        
        Args:
            user_id (str): The ID of the user to get chats for
            
        Returns:
            List[Chat]: List of Chat objects with loaded thread information
        """
        async with self.db.get_session() as session:
            # Query chats with their associated threads
            stmt = (
                select(Chat)
                .options(selectinload(Chat.thread))
                .where(Chat.user_id == user_id)
            )
            result = await session.execute(stmt)
            chats = result.scalars().all()
            return chats
