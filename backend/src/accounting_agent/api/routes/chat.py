import asyncio
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from langgraph_sdk import get_client
from pydantic import BaseModel

from accounting_agent.models import User
from accounting_agent.models.chat import Chat
from accounting_agent.api.routes.auth import get_current_user
from accounting_agent.container import container
from accounting_agent.services.chat import ChatService

router = APIRouter()


class ChatResponse(BaseModel):
    chat_id: str
    user_id: str
    thread_id: str
    created_at: str
    updated_at: str


class MessageResponse(BaseModel):
    content: str
    type: str
    additional_kwargs: Optional[Dict[str, Any]] = None


class SendMessageRequest(BaseModel):
    message: Optional[str] = None
    audio_path: Optional[str] = None
    ai_model: Optional[str] = None



class CreateThreadRequest(BaseModel):
    title: str


@router.get("/get-all", response_model=List[ChatResponse])
async def get_chats(
        current_user: User = Depends(get_current_user),
):
    """
    Get all chats for the current user.
    """
    try:
        # Get the PostgreSQL database instance
        postgres_db = container.postgres_db()

        # Create chat service with the database
        chat_service = ChatService(postgres_db)

        # Get chats for the current user
        chats = await chat_service.get_chats_for_user(str(current_user.user_id))

        # Convert to response format
        chat_responses = []
        for chat in chats:
            chat_responses.append(ChatResponse(
                chat_id=str(chat.chat_id),
                user_id=chat.user_id,
                thread_id=str(chat.thread_id),
                created_at=chat.created_at.isoformat() if chat.created_at else "",
                updated_at=chat.updated_at.isoformat() if chat.updated_at else ""
            ))

        return chat_responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving chats: {str(e)}")


@router.get("/{thread_id}/messages", response_model=List[MessageResponse])
async def get_thread_messages(
    thread_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get messages from a langgraph thread for the current user.
    """
    try:
        # Initialize langgraph client
        client = get_client(url="http://localhost:8123")

        # Get the thread state
        thread_state = await client.threads.get_state(thread_id=thread_id)

        # Extract messages from the thread state
        messages = thread_state.get('values', {}).get('messages', [])

        # Convert to response format
        message_responses = []
        for message in messages:
            message_responses.append(MessageResponse(
                content=message.get('content', ''),
                type=message.get('type', ''),
                additional_kwargs=message.get('additional_kwargs', {})
            ))

        return message_responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving messages: {str(e)}")


@router.post("/{thread_id}/send")
async def send_message_to_thread(
    thread_id: str,
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send a message to a langgraph thread and get AI response.
    """
    try:
        # Initialize langgraph client
        client = get_client(url="http://localhost:8123")

        # Prepare the input
        run_input = {}

        if request.message:
            run_input["text_input"] = request.message

        if request.audio_path:
            run_input["audio_path"] = request.audio_path

        if request.ai_model:
            run_input["ai_model"] = request.ai_model

        # Validate that at least one input is provided
        if not request.message and not request.audio_path:
            raise HTTPException(status_code=400, detail="Either message or audio_path must be provided")

        # Use a default assistant_id - this should be configurable
        assistant_id = "fe096781-5601-53d2-b2f6-0d3403f7e9ca"

        # Send the message and wait for response
        await client.runs.wait(
            thread_id=thread_id,
            assistant_id=assistant_id,
            input=run_input,
        )

        return {"status": "success", "message": "Message sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending message: {str(e)}")

@router.post("/create-thread")
async def create_new_thread(
    request: CreateThreadRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new langgraph thread and chat session.
    """
    try:
        # Get the PostgreSQL database instance
        postgres_db = container.postgres_db()

        # Create chat service with the database
        chat_service = ChatService(postgres_db)

        # Initialize langgraph client
        client = get_client(url="http://localhost:8123")

        # Create a new thread in langgraph
        thread = await client.threads.create()
        thread_id = thread['thread_id']

        # Create a corresponding thread record in our database
        try:
            db_thread = await chat_service.create_thread(thread_id=thread_id)
        except Exception as db_thread_error:
            # If we can't create the thread in our database, we should still proceed
            # but log the error for debugging
            print(f"Warning: Could not create thread record in database: {str(db_thread_error)}")

        # Create a new chat in the database
        new_chat = await chat_service.create_chat(
            user_id=str(current_user.user_id),
            thread_id=thread_id,
            title=request.title
        )

        return {
            "chat_id": str(new_chat.chat_id),
            "thread_id": thread_id,
            "title": request.title,
            "created_at": new_chat.created_at.isoformat() if new_chat.created_at else ""
        }
    except Exception as e:
        # More detailed error handling
        error_message = f"Error creating thread: {str(e)}"
        print(f"Thread creation error: {error_message}")
        raise HTTPException(status_code=500, detail=error_message)


async def send_message(thread_id: str, assistant_id: str, text_input: str):
    client = get_client(url="http://localhost:8123")

    run_input = {
        # "audio_path": "https://files.nikolanikolovski.com/test/download/test_audio.ogg",
        "text_input": text_input
    }

    await client.runs.wait(
        thread_id=thread_id,
        assistant_id=assistant_id,
        input=run_input,
    )

# Keep the example call but comment it out to avoid execution on import
# asyncio.run(send_message("c336a4c2-6260-4e93-8d6a-c946d9239b75",
#                          "fe096781-5601-53d2-b2f6-0d3403f7e9ca",
#                          "Hello"))
