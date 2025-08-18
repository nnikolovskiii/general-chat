from __future__ import annotations

from typing import Annotated, TypedDict, List, Dict

from langgraph.graph import add_messages

from ..models.task_models import Task


# Graph state
class State(TypedDict):
    messages: Annotated[list, add_messages]
    project_path: str
    context: str
    user_task: str
    all_file_paths: Annotated[set, lambda x, y: x.union(y)]
    project_structure: str
    plan: str
    tasks: List[Task]
    current_task_index: int
    task_message_indices: Dict[int, int]
    input_type: str
    answer: str
    agent_metadata: str
    ai_model: str
