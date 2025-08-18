import asyncio
import os
from pprint import pprint

# Make sure to install the SDK first: pip install langgraph-sdk
from langgraph_sdk import get_client
from langgraph_sdk.schema import Assistant, Thread

# --- Client Setup ---
# Assumes your LangGraph API URL and Key are in environment variables
# You can also pass them directly: get_client(url="...", api_key="...")
client = get_client(url="http://localhost:8123")


# --- Helper Functions for Pagination ---

async def get_all_assistants() -> list[Assistant]:
    """
    Fetches all assistants by paginating through the search results.
    """
    all_assistants = []
    offset = 0
    limit = 100  # Fetch in batches of 100 for efficiency

    while True:
        # Search for a page of assistants
        assistants_page = await client.assistants.search(limit=limit, offset=offset)

        if not assistants_page:
            # If the page is empty, we've fetched all assistants
            break

        all_assistants.extend(assistants_page)
        offset += limit

    return all_assistants


async def get_threads_for_assistant(assistant_id: str) -> list[Thread]:
    """
    Fetches all threads for a specific assistant ID by filtering on metadata.
    This assumes threads have a metadata field like: {"assistant_id": "..."}
    """
    all_threads = []
    offset = 0
    limit = 100

    # Define the metadata filter
    metadata_filter = {"assistant_id": assistant_id}

    while True:
        # Search for a page of threads matching the metadata
        threads_page = await client.threads.search(
            metadata=metadata_filter,
            limit=limit,
            offset=offset
        )

        if not threads_page:
            # If the page is empty, we've fetched all matching threads
            break

        all_threads.extend(threads_page)
        offset += limit

    return all_threads


# --- Main Execution Logic ---

async def main():
    """
    Main function to get all assistants and then find all threads for each one.
    """
    print("Step 1: Fetching all available assistants...")
    try:
        assistants = await get_all_assistants()
    except Exception as e:
        print(f"Error fetching assistants: {e}")
        print("Please ensure your LangGraph API server is running and credentials are correct.")
        return

    if not assistants:
        print("No assistants found.")
        return

    print(f"Found {len(assistants)} assistants.")

    threads_by_assistant = {}

    print("\nStep 2: Fetching threads for each assistant...")
    for assistant in assistants:
        assistant_id = assistant["assistant_id"]
        assistant_name = assistant.get("name", "Untitled Assistant")

        print(f"  -> Searching for threads for assistant '{assistant_name}' ({assistant_id})")

        try:
            threads = await get_threads_for_assistant(assistant_id)
            threads_by_assistant[assistant_id] = threads
            print(f"     Found {len(threads)} associated threads.")
        except Exception as e:
            print(f"     Could not fetch threads for assistant {assistant_id}: {e}")
            threads_by_assistant[assistant_id] = []  # Record that the search was attempted

    print("\n--- Results ---")
    # Using pprint for cleaner dictionary output
    pprint(threads_by_assistant)

    return threads_by_assistant


if __name__ == "__main__":
    # To run this async script
    asyncio.run(main())