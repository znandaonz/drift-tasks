from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    due_date: Optional[datetime] = None
    tags: Optional[str] = ""


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    done: Optional[bool] = None
    due_date: Optional[datetime] = None
    tags: Optional[str] = None
    # Explicit flags let the frontend clear a due date or tags entirely
    # (sending null for due_date/tags is ambiguous with "don't change it").
    clear_due_date: bool = False


class ReorderRequest(BaseModel):
    # Ordered list of task ids, top to bottom as displayed.
    order: list[int]


class TaskOut(BaseModel):
    id: int
    title: str
    done: bool
    created_at: datetime
    due_date: Optional[datetime] = None
    tags: Optional[str] = ""
    position: int

    class Config:
        from_attributes = True
