# Submission Inventory

## Included

- Full source code for the FastAPI backend in `backend/`
- Full source code for the React + Vite frontend in `frontend/`
- Local setup and run instructions in `README.md`
- Architecture note in `docs/ARCHITECTURE.md`
- AI workflow note in `docs/AI_WORKFLOW.md`
- Walkthrough placeholder in `WALKTHROUGH_URL.txt`
- Deployment configuration in `backend/render.yaml` and `frontend/vercel.json`
- Backend automated tests in `backend/tests/test_document_sharing.py`
- Environment variable template in `.env.example`

## Current Feature Status

### Working

- User registration and login
- Document creation
- Document rename
- Rich-text editing with headings, bold, italic, underline, bullet lists, and numbered lists
- Save and reopen flow
- File import for `.txt` and `.md`
- Share by registered user email with `editor` and `viewer` roles
- Owned vs shared document separation
- Automated backend tests

### Partial Or Intentionally Scoped

- Live cloud deployment configuration is included, but an actual hosted URL still needs to be created from a connected Vercel/Render/Atlas account
- Walkthrough video link still needs to be added after recording

## Reviewer Credentials

If `python scripts/seed_demo_data.py` has been run:

- `ava@example.com` / `Password123!`
- `ben@example.com` / `Password123!`
- `cara@example.com` / `Password123!`

## What I Would Build Next With Another 2-4 Hours

1. Add collaborator removal and role downgrade/upgrade controls inline from the access list.
2. Deploy the full stack to Vercel + Render + Atlas and add the live URLs.
3. Add a frontend integration test around auth and dashboard behavior.
4. Lazy-load the editor route to reduce the initial frontend bundle size.
