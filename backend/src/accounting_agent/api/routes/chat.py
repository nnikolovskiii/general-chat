from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from accounting_agent.models import User
from accounting_agent.models.chat import Chat
from accounting_agent.models.code import Code
from accounting_agent.api.routes.auth import get_current_user
from accounting_agent.container import container

router = APIRouter()


class CodeCreate(BaseModel):
    url: str
    code: int
    description: str


class CodeUpdate(BaseModel):
    url: Optional[str] = None
    code: Optional[int] = None
    description: Optional[str] = None


@router.get("/get-all")
async def get_chats(
        current_user: User = Depends(get_current_user),
):
    """
    Get all chats for the current user.
    """
    try:
        mdb = container.mdb()

        # Build the filter
        doc_filter = {"user_id": current_user.email}

        chats = await mdb.get_entries(
            class_type=Chat,
            doc_filter=doc_filter
        )

        return {
            "status": "success",
            "message": "Codes retrieved successfully",
            "data": chats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving codes: {str(e)}")
