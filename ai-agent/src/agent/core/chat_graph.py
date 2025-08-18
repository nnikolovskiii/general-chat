from __future__ import annotations

import os

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, AIMessage
from langchain_openai import ChatOpenAI

from .state import State
from ..prompts.chat_grap_prompts import generate_answer_instruction

load_dotenv()


def generate_answer(state: State):
    """Generate an answer using OpenRouter models"""
    user_task = state["user_task"]
    messages = state["messages"]
    ai_model = state.get("ai_model", "google/gemini-2.5-pro")

    context_list = []
    for message in messages:
        if isinstance(message, HumanMessage):
            # Append the user's message to the context list
            context_list.append(f"Human: {message.content}")
        elif isinstance(message, AIMessage):
            # Append the AI's response to the context list
            context_list.append(f"AI: {message.content}")

    # Join the list into a single string with newlines
    context = "\n".join(context_list)


    instruction = generate_answer_instruction.format(
        user_task=user_task,
        context=context,
    )

    open_router_model = ChatOpenAI(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
        model=ai_model
    )

    result = open_router_model.invoke(instruction)

    return {"messages": [HumanMessage(content=result.content), result], }
