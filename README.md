# Ajaia Collaborative Editor

A lightweight full stack collaborative document editor built using FastAPI, React, Vite, TypeScript, Zustand, Tiptap, and MongoDB-compatible persistence.

## What Works

- Register and log in with lightweight JWT auth.
- Seed demo users for quick sharing review.
- Create, rename, edit, save, and reopen rich-text documents.
- Apply bold, italic, underline, headings, bullet lists, and numbered lists.
- Import `.txt` and `.md` files into editable documents.
- Share a document with another registered user by email as either an `editor` or `viewer`.
- See a clear split between `Owned documents` and `Shared with me`.
- Persist document content and sharing data in MongoDB Atlas when configured.
- Run locally without external setup by using an in-memory Mongo mock fallback.

## Intentional Scope Cuts

- No real-time multiplayer cursors, CRDT/OT syncing, comments, or version history.
- File upload is intentionally limited to `.txt` and `.md`.
- The bundled frontend is heavier than ideal because Tiptap is included in the main chunk.

## Sharing Roles

- `owner`: can edit and share
- `editor`: can edit and share with the same practical power as the owner for this build
- `viewer`: can open shared documents but cannot edit or share

## Tech Stack

- Frontend: React, Vite, TypeScript, Zustand, React Router, Tiptap
- Backend: FastAPI, PyJWT, Pydantic Settings, PyMongo
- Database: MongoDB Atlas M0 for durable persistence, `mongomock` fallback for quick local evaluation
- Testing: `pytest`, FastAPI `TestClient`, `mongomock`
- Deployment targets: Vercel for frontend, Render for backend, MongoDB Atlas for database

## Project Structure

```text
backend/   FastAPI API, auth, document logic, upload parsing, tests
frontend/  React SPA, state management, editor UI, sharing/import UX
docs/      Architecture note and AI workflow note
```

## Local Setup

### 1. Install dependencies

Backend:

```bash
cd backend
python -m pip install -r requirements.txt
```

Frontend:

```bash
cd frontend
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` at the repository root and adjust values if needed.

Default local behavior:

- If you leave `MONGODB_URI` unset, the backend uses `mongomock://localhost`.
- That makes local review easy, but data is only kept while the backend process is running.
- For durable persistence, point `MONGODB_URI` to a free MongoDB Atlas M0 cluster.

### 3. Start the backend

```bash
cd backend
uvicorn app.main:app --reload
```

Optional demo seeding:

```bash
cd backend
python scripts/seed_demo_data.py
```

### 4. Start the frontend

```bash
cd frontend
npm run dev
```

The app runs at `http://localhost:5173` and expects the API at `http://localhost:8000` unless `VITE_API_BASE_URL` is overridden.

## Demo Accounts

If you run the seed script, these accounts are available:

- `ava@example.com` / `Password123!`
- `ben@example.com` / `Password123!`
- `cara@example.com` / `Password123!`

## Supported File Types

- `.txt`
- `.md`

Unsupported file types are rejected with a visible error message.

## Testing

Backend tests:

```bash
cd backend
python -m pytest
```

Frontend production build:

```bash
cd frontend
npm run build
```

## Deployment

### Frontend

- Target: Vercel Hobby
- Build command: `npm run build`
- Output directory: `dist`
- Config file: `frontend/vercel.json`

### Backend

- Target: Render free web service
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Config file: `backend/render.yaml`

### Database

- Target: MongoDB Atlas M0 free cluster
- Set `MONGODB_URI` to the Atlas connection string
- Set `MONGODB_DB_NAME` to your preferred database name

## Review Notes

- Render free tier cold starts are expected after inactivity.
- Atlas-backed persistence is the intended durable setup for reviewers.
- Local mock mode is included only to reduce setup friction during code review.

## Deliverables Included

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/AI_WORKFLOW.md`
- `SUBMISSION.md`
- `WALKTHROUGH_URL.txt`
- Backend and frontend source code
- Deployment configuration files
