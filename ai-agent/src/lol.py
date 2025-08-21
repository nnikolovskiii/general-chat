import asyncio
import sys
from pprint import pprint

# Make sure to install the SDK first: pip install langgraph-sdk
from langgraph_sdk import get_client
from langgraph_sdk.schema import ThreadState


async def main(thread_id: str):
    """
    Main function to:
    1. Take a thread_id as an argument.
    2. Fetch the entire history of that thread.
    3. Print each checkpoint's state and metadata.

    Args:
        thread_id: The unique identifier of the thread to inspect.
    """
    try:
        # --- Client Setup ---
        client = get_client(url="http://localhost:8123")
        print(f"Successfully connected to LangGraph API.")
    except Exception as e:
        print(f"Error connecting to LangGraph client: {e}")
        print("Please ensure your LangGraph API server is running at http://localhost:8123.")
        return

    # --- Fetch Thread History ---
    print(f"\nFetching state history for thread_id: {thread_id}")
    try:
        # The get_history method retrieves a list of all checkpoints (states) for the thread.
        # We set a high limit to try and get all of them. For very long histories,
        # you might need to paginate using the 'before' parameter.
        history: list[ThreadState] = await client.threads.get_history(
            thread_id, limit=100
        )

        if not history:
            print(f"No history found for thread_id: {thread_id}")
            print("Ensure the ID is correct and that at least one run has been executed on it.")
            return

        print(f"\nFound {len(history)} checkpoints in the thread's history.")
        print("Displaying checkpoints in chronological order (oldest first):\n")

        # --- Print Each Checkpoint ---
        for i, state in enumerate(history):
            print("=" * 60)
            print(f"--- Checkpoint {i+1} ---")
            print("=" * 60)

            checkpoint_info = state.get("checkpoint", {})
            created_at = state.get("created_at")
            metadata = state.get("metadata", {})
            values = state.get("values", {})

            print(f"  Checkpoint ID: {checkpoint_info.get('checkpoint_id')}")
            print(f"  Created At:    {created_at}")

            print("\n  [Metadata]:")
            if metadata:
                pprint(metadata, indent=4)
            else:
                print("    (No metadata for this checkpoint)")

            print("\n  [State Values]:")
            if values:
                # The 'values' dictionary contains the actual state of your graph
                # at this point in time (e.g., the list of messages).
                pprint(values, indent=4)
            else:
                print("    (No state values for this checkpoint)")

            print("\n")

    except Exception as e:
        print(f"An error occurred while fetching history: {e}")
        return


if __name__ == "__main__":
    # --- Argument parsing is now handled here, outside of the main logic ---
    thread_id_from_cli = "c336a4c2-6260-4e93-8d6a-c946d9239b75"
    # Run the asynchronous main function, passing the thread_id as an argument
    asyncio.run(main(thread_id=thread_id_from_cli))