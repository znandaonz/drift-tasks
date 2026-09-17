# Drift — Tasks

A minimal task tracker with a React (Vite) frontend and a FastAPI + SQLAlchemy backend.

## Project structure

```
.
├── src/               # React frontend (Vite)
│   ├── App.jsx
│   ├── TaskItem.jsx
│   ├── api.js
│   ├── index.css
│   └── main.jsx
├── index.html
├── vite.config.js
├── package.json
├── main.py            # FastAPI app
├── models.py           # SQLAlchemy models
├── schemas.py           # Pydantic schemas
├── database.py           # DB engine/session setup
└── requirements.txt
```

## Frontend

```sh
npm install
npm run dev
```

Runs at http://localhost:5173.

The frontend talks to the API URL hardcoded in `src/api.js` — update `BASE_URL`
there if you're running the backend somewhere other than the deployed Railway URL.

## Backend

```sh
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Runs at http://localhost:8000. Uses a local SQLite database (`tasks.db`, created
automatically on first run — not committed to git).

CORS is currently configured in `main.py` to allow `http://localhost:5173` and
a GitHub Pages origin; update `allow_origins` if you deploy the frontend elsewhere.

## API

| Method | Path         | Description       |
|--------|--------------|--------------------|
| GET    | /tasks       | List all tasks     |
| POST   | /tasks       | Create a task      |
| PUT    | /tasks/{id}  | Update a task      |
| DELETE | /tasks/{id}  | Delete a task       |
