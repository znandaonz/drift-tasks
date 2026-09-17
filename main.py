from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import asc, func

import models
import schemas
from database import engine, SessionLocal, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Drift Tasks API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://znandaonz.github.io"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/tasks", response_model=list[schemas.TaskOut])
def list_tasks(db: Session = Depends(get_db)):
    return db.query(models.Task).order_by(asc(models.Task.position)).all()


@app.post("/tasks", response_model=schemas.TaskOut, status_code=201)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    # New tasks land at the top of the list, matching the existing UX.
    min_position = db.query(func.min(models.Task.position)).scalar() or 0

    new_task = models.Task(
        title=task.title.strip(),
        done=False,
        due_date=task.due_date,
        tags=task.tags or "",
        position=min_position - 1,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@app.put("/tasks/reorder", response_model=list[schemas.TaskOut])
def reorder_tasks(payload: schemas.ReorderRequest, db: Session = Depends(get_db)):
    tasks_by_id = {t.id: t for t in db.query(models.Task).filter(models.Task.id.in_(payload.order)).all()}
    for index, task_id in enumerate(payload.order):
        task = tasks_by_id.get(task_id)
        if task is not None:
            task.position = index
    db.commit()
    return db.query(models.Task).order_by(asc(models.Task.position)).all()


@app.put("/tasks/{task_id}", response_model=schemas.TaskOut)
def update_task(task_id: int, update: schemas.TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if update.title is not None:
        task.title = update.title.strip()
    if update.done is not None:
        task.done = update.done
    if update.clear_due_date:
        task.due_date = None
    elif update.due_date is not None:
        task.due_date = update.due_date
    if update.tags is not None:
        task.tags = update.tags

    db.commit()
    db.refresh(task)
    return task


@app.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return None
