import asyncio
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from langgraph.types import Command
from pydantic import BaseModel
# Import the Command object
from langgraph_sdk import get_client

from accounting_agent.models import User
from accounting_agent.models.chat import Chat
from accounting_agent.api.routes.auth import get_current_user
from accounting_agent.container import container
from accounting_agent.services.chat import ChatService

router = APIRouter()


# --- Your existing models ---
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


# --- NEW/MODIFIED Models for Interrupt/Resume ---
class ResumeRequest(BaseModel):
    edited_text: str
    # You might also want to pass the interrupt_id to be specific
    # interrupt_id: str


class SendMessageResponse(BaseModel):
    status: str  # e.g., "success" or "interrupted"
    data: Optional[Dict[str, Any]] = None


# --- Your existing routes (get_chats, get_thread_messages) remain the same ---
@router.get("/get-all", response_model=List[ChatResponse])
async def get_chats(
        current_user: User = Depends(get_current_user),
):
    # ... (no changes needed here) ...
    try:
        postgres_db = container.postgres_db()
        chat_service = ChatService(postgres_db)
        chats = await chat_service.get_chats_for_user(str(current_user.user_id))
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
    # ... (no changes needed here) ...
    try:
        client = get_client(url="http://localhost:8123")
        thread_state = await client.threads.get_state(thread_id=thread_id)
        messages = thread_state.get('values', {}).get('messages', [])
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


# MODIFIED: send_message_to_thread endpoint
@router.post("/{thread_id}/send", response_model=SendMessageResponse)
async def send_message_to_thread(
        thread_id: str,
        request: SendMessageRequest,
        current_user: User = Depends(get_current_user)
):
    """
    Send a message to a langgraph thread.
    This can result in a completed run or an interruption.
    """
    try:
        client = get_client(url="http://localhost:8123")

        run_input = {}
        if request.message:
            run_input["text_input"] = request.message
        if request.audio_path:
            run_input["audio_path"] = request.audio_path
        if request.ai_model:
            run_input["ai_model"] = request.ai_model

        if not request.message and not request.audio_path:
            raise HTTPException(status_code=400, detail="Either message or audio_path must be provided")

        assistant_id = "fe096781-5601-53d2-b2f6-0d3403f7e9ca"

        # CHANGE: Use stream() instead of wait() to handle interruptions
        final_state = {}
        async for event in client.runs.stream(
                thread_id=thread_id,
                assistant_id=assistant_id,
                input=run_input,
                stream_mode="values"  # We only need the state values
        ):
            if event['event'] == 'values':
                final_state = event['data']

        # After the stream finishes, check if there are any interrupts
        if final_state.get("interrupts"):
            # The graph is paused. Return the interruption data to the client.
            interrupt_data = final_state["interrupts"][0]
            print(f"Run interrupted on thread {thread_id}. Data: {interrupt_data}")
            return SendMessageResponse(status="interrupted", data=interrupt_data)

        # If we reach here, the graph finished without interruption
        return SendMessageResponse(status="success", data={"message": "Message processed successfully"})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending message: {str(e)}")


# NEW: resume_thread endpoint
@router.post("/{thread_id}/resume")
async def resume_thread(
        thread_id: str,
        request: ResumeRequest,
        current_user: User = Depends(get_current_user)
):
    """
    Resume a paused graph execution with the user's input.
    """
    try:
        client = get_client(url="http://localhost:8123")
        assistant_id = "fe096781-5601-53d2-b2f6-0d3403f7e9ca"  # Should be the same assistant

        # The data passed to 'resume' becomes the return value of the `interrupt()`
        # call in your graph. It MUST be a dictionary with the key your node expects.
        resume_payload = {"edited_text": request.edited_text}

        # Create a Command object to resume the execution
        resume_command = Command(resume=resume_payload)

        # Call stream (or wait) with the command. The first argument (input) is None.
        await client.runs.wait(
            thread_id=thread_id,
            assistant_id=assistant_id,
            input=resume_command,
        )

        return {"status": "success", "message": "Thread resumed and completed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resuming thread: {str(e)}")


@router.post("/create-thread")
async def create_new_thread(
        request: CreateThreadRequest,
        current_user: User = Depends(get_current_user)
):
    # ... (no changes needed here) ...
    try:
        postgres_db = container.postgres_db()
        chat_service = ChatService(postgres_db)
        client = get_client(url="http://localhost:8123")
        thread = await client.threads.create()
        thread_id = thread['thread_id']

        try:
            db_thread = await chat_service.create_thread(thread_id=thread_id)
        except Exception as db_thread_error:
            print(f"Warning: Could not create thread record in database: {str(db_thread_error)}")

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
        error_message = f"Error creating thread: {str(e)}"
        print(f"Thread creation error: {error_message}")
        raise HTTPException(status_code=500, detail=error_message)