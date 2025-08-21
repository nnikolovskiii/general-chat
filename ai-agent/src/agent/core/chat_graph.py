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
            response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)

            # Create a temporary file to store the audio content
            # delete=False is important so we can use its name after the 'with' block
            temp_file_handle = tempfile.NamedTemporaryFile(delete=False, suffix=".ogg")

            with temp_file_handle as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            local_audio_path = temp_file_handle.name
            print(f"   > Audio downloaded to temporary file: {local_audio_path}")

        except requests.exceptions.RequestException as e:
            raise ConnectionError(f"Failed to download audio from {audio_path}. Error: {e}")
    # --- END: New logic to handle URLs ---

    try:
        # Now, check for the existence of the *local* file path
        if not os.path.exists(local_audio_path):
            raise FileNotFoundError(f"Audio file not found: {local_audio_path}")

        # 1. Transcribe using the guaranteed local path
        transcript = transcribe_audio(local_audio_path)
        print(f"   > Raw Transcript: '{transcript[:100]}...'")

        # 2. Enhance
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
        # --- START: Cleanup logic ---
        # Ensure the temporary file is deleted after we're done with it
        if temp_file_handle:
            os.unlink(local_audio_path)
            print(f"   > Cleaned up temporary file: {local_audio_path}")
        # --- END: Cleanup logic ---


# --- 1. DEFINE NODES for the simplified workflow ---

def prepare_inputs_node(state: ChatGraphState):
    """
    Prepares the final input string by processing audio and/or text.
    This node handles all three cases: audio-only, text-only, and both.
    """
    print("---NODE: Preparing Inputs---")
    text_input = state.get("text_input")
    audio_path = state.get("audio_path")
    ai_model = state.get("ai_model", "google/gemini-flash-1.5")

    if not text_input and not audio_path:
        raise ValueError("Either text_input or audio_path must be provided.")

    processed_parts = []
    enhanced_transcript = None

    if text_input:
        print("   > Text input detected.")
        # Add a clear label for the LLM
        processed_parts.append(f"{text_input}")

    # Step 1: Process audio if it exists
    if audio_path:
        print("   > Audio path detected. Processing audio...")
        enhanced_transcript = _transcribe_and_enhance_audio(audio_path, ai_model)
        # Add a clear label for the LLM
        processed_parts.append(
            f"{enhanced_transcript}")

    # Step 3: Combine them into a single input
    final_input = "\n\n".join(processed_parts)
    print(f"   > Final Processed Input: '{final_input[:150]}...'")

    return {
        "processed_input": final_input,
        "enhanced_transcript": enhanced_transcript
    }


def generate_answer_node(state: ChatGraphState):
    """Generates the final answer using the single, consolidated input."""
    print("---NODE: Generating Answer---")
    # This node is now simpler: it only cares about 'processed_input'
    user_task = state["processed_input"]
    messages = state["messages"]
    ai_model = state.get("ai_model", "google/gemini-2.5-pro")

    context = "\n".join(
        f"Human: {m.content}" if isinstance(m, HumanMessage) else f"AI: {m.content}"
        for m in messages
    )

    # The prompt might need to be adjusted slightly to mention multiple sources
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

    return {"messages": [HumanMessage(content=user_task), result]}
