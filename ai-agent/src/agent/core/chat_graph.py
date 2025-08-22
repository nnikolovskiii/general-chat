from __future__ import annotations
import os

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from .chat_graph_state import ChatGraphState
from ..prompts.chat_grap_prompts import generate_answer_instruction

load_dotenv()

import requests
import tempfile

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from ..tools.audio_utils import transcribe_audio


class RestructuredText(BaseModel):
    text: str = Field(..., description="Restructured text")


load_dotenv()


def _transcribe_and_enhance_audio(audio_path: str, model: str) -> str:
    """
    Helper to chain transcription and enhancement.
    Handles both local file paths and remote URLs.
    """
    local_audio_path = audio_path
    temp_file_handle = None

    if audio_path.startswith(('http://', 'https://')):
        print(f"   > URL detected. Downloading audio from {audio_path}...")
        try:
            response = requests.get(audio_path, stream=True)
            response.raise_for_status()

            temp_file_handle = tempfile.NamedTemporaryFile(delete=False, suffix=".ogg")

            with temp_file_handle as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            local_audio_path = temp_file_handle.name
            print(f"   > Audio downloaded to temporary file: {local_audio_path}")

        except requests.exceptions.RequestException as e:
            raise ConnectionError(f"Failed to download audio from {audio_path}. Error: {e}")

    try:
        if not os.path.exists(local_audio_path):
            raise FileNotFoundError(f"Audio file not found: {local_audio_path}")

        transcript = transcribe_audio(local_audio_path)
        print(f"   > Raw Transcript: '{transcript[:100]}...'")

        prompt = f"""I want you restructure the information below better. Restructure it the way you find it best. Change some information if you think it is better.
    Regardless of the input write it in English.

    Text:
    "{transcript}"
    """
        open_router_model = ChatOpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1",
            model=model
        )

        structured_llm = open_router_model.with_structured_output(RestructuredText)

        response: RestructuredText = structured_llm.invoke(prompt)
        enhanced_text = response.text
        print(f"   > Enhanced Transcript: '{enhanced_text[:100]}...'")
        return enhanced_text

    finally:
        if temp_file_handle:
            os.unlink(local_audio_path)
            print(f"   > Cleaned up temporary file: {local_audio_path}")


def prepare_inputs_node(state: ChatGraphState):
    """
    Prepares the final input string by processing audio and/or text.
    This node handles all three cases: audio-only, text-only, and both.
    """
    print("---NODE: Preparing Inputs---")
    text_input = state.get("text_input")
    audio_path = state.get("audio_path")
    ai_model = state.get("ai_model", "google/gemini-flash-1.5")

    if ai_model is None:
        ai_model = "google/gemini-flash-1.5"

    if not text_input and not audio_path:
        raise ValueError("Either text_input or audio_path must be provided.")

    processed_parts = []
    enhanced_transcript = None

    if text_input:
        print("   > Text input detected.")
        processed_parts.append(f"{text_input}")

    if audio_path:
        print("   > Audio path detected. Processing audio...")
        enhanced_transcript = _transcribe_and_enhance_audio(audio_path, ai_model)
        processed_parts.append(f"{enhanced_transcript}")

    final_input = "\n\n".join(processed_parts)
    print(f"   > Final Processed Input: '{final_input[:150]}...'")

    return {
        "processed_input": final_input,
        "enhanced_transcript": enhanced_transcript
    }


def generate_answer_node(state: ChatGraphState):
    """Generates the final answer and attaches the audio_path as metadata."""
    print("---NODE: Generating Answer---")
    user_task = state["processed_input"]
    messages = state["messages"]
    ai_model = state.get("ai_model", "google/gemini-2.5-pro")

    if ai_model is None:
        ai_model = "google/gemini-flash-1.5"

    audio_path = state.get("audio_path")

    context = "\n".join(
        f"Human: {m.content}" if isinstance(m, HumanMessage) else f"AI: {m.content}"
        for m in messages
    )

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

    human_message_kwargs = {}
    if audio_path:
        human_message_kwargs["file_url"] = audio_path

    human_msg = HumanMessage(
        content=user_task,
        additional_kwargs=human_message_kwargs
    )

    return {
        "messages": [human_msg, result],
        "processed_input": None,
        "enhanced_transcript": None,
        "audio_path": None,
        "ai_model": None,
        "text_input": None,
    }
