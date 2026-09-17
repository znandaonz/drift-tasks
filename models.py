from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    done = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Due date for the task (nullable — not every task needs one)
    due_date = Column(DateTime(timezone=True), nullable=True)

    # Comma-separated tag names, e.g. "work,urgent". Kept simple (no join
    # table) since this is a single-user app with no need to query by tag.
    tags = Column(String, nullable=True, default="")

    # Manual sort order for drag-and-drop reordering. Lower = higher up the
    # list. New tasks get a position lower than everything else so they
    # land at the top, matching the existing "newest first" behavior.
    position = Column(Integer, nullable=False, default=0, index=True)
