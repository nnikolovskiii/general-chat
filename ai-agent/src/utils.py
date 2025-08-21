import asyncio
from pprint import pprint

# Make sure to install the SDK first: pip install langgraph-sdk
from langgraph_sdk import get_client


# --- Main Execution Logic ---

async def main():
    """
    Main function to:
    1. Get the first available assistant.
    2. Create a new thread.
    3. Run the assistant statefully on the thread with a given input and wait for the result.
    """
    try:
        # --- Client Setup ---
        # Assumes your LangGraph API URL and Key are in environment variables
        # You can also pass them directly: get_client(url="...")
        client = get_client(url="http://localhost:8123")
        print("Successfully connected to LangGraph API.")
    except Exception as e:
        print(f"Error connecting to LangGraph client: {e}")
        print("Please ensure your LangGraph API server is running at http://localhost:8123.")
        return

    # --- 1. Get the first assistant ---
    print("\nStep 1: Fetching the first available assistant...")
    try:
        # Search for assistants, we only need the first one, so we limit the result to 1
        assistants = await client.assistants.search(limit=1)
        if not assistants:
            print("No assistants found. Please deploy a graph to your LangGraph server first.")
            return

        # Extract the first assistant's ID
        first_assistant = assistants[0]
        assistant_id = first_assistant["assistant_id"]
        assistant_name = first_assistant.get("name", "Untitled Assistant")
        print(f"   -> Found assistant: '{assistant_name}' (ID: {assistant_id})")

    except Exception as e:
        print(f"Error fetching assistants: {e}")
        return

    # --- 2. Create a new thread ---
    print("\nStep 2: Creating a new thread...")
    try:
        # A thread stores the state of the conversation.
        thread = await client.threads.create()
        thread_id = thread["thread_id"]
        print(f"   -> Successfully created thread (ID: {thread_id})")
    except Exception as e:
        print(f"Error creating thread: {e}")
        return

    # --- 3. Run the assistant on the thread ---
    # Define the input for the run as specified in the request
    run_input = {
        "audio_path": "https://files.nikolanikolovski.com/test/download/test_audio.ogg",
        "text_input": "Tell me is this type of thinking good?"
    }

    print("\nStep 3: Running the assistant on the new thread with the following input:")
    pprint(run_input)

    try:
        # Use client.runs.wait to execute the run and wait for its completion.
        # This is a "stateful" run because we provide a `thread_id`.
        # The state will be saved to this thread for future interactions.
        final_state = await client.runs.wait(
            thread_id=thread_id,
            assistant_id=assistant_id,
            input=run_input,
        )

        print("\n--- Run Complete ---")
        print("Final state of the thread after the run:")
        pprint(final_state)

    except Exception as e:
        print(f"An error occurred during the run: {e}")
        return


if __name__ == "__main__":
    # Run the asynchronous main function
    asyncio.run(main())