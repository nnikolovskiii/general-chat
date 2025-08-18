from langgraph_sdk import get_client

client = get_client(url="http://localhost:2024")

async def create_thread(user_id: str):
    thread = await client.threads.create(
        metadata={"user_id": user_id},
        if_exists="raise"
    )


