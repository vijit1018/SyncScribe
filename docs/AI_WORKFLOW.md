# AI Workflow Note

## AI Tools Used

- Cursor agent for architecture planning, scaffolding, implementation, and iterative fixes
- Built-in terminal and file editing tools for package installation, test execution, and code generation
- Web search to confirm current free-tier viability for MongoDB Atlas, Render, and Vercel

## Where AI Materially Helped

AI sped up work most in three places:

1. Turning the assignment prompt into a concrete product slice and implementation plan.
2. Scaffolding repetitive full stack structure quickly across routes, schemas, stores, and UI files.
3. Iterating on errors after the first verification pass, especially TypeScript build issues and Python dependency compatibility.

## What I Changed Or Rejected

I did not accept generated output blindly. Examples of changes and corrections:

- Reworked the frontend scaffold after the Vite generator produced a plain TypeScript template instead of React.
- Replaced the original password hashing approach when `passlib` + `bcrypt` hit a Python 3.13 compatibility problem during test execution.
- Added a `mongomock` fallback for local review so the app could run without forcing Atlas setup immediately.
- Kept sharing intentionally view-only for recipients instead of stretching into a half-finished multi-editor permission model.

## How I Verified Correctness

### Backend

- Ran `python -m pytest`
- Verified sharing permissions end to end with an automated test
- Verified Markdown import behavior with an automated test

### Frontend

- Ran `npm run build`
- Reviewed lints after substantive edits

### UX And Reliability

- Ensured the UI clearly states the supported import types
- Made the owned/shared distinction visible in the dashboard
- Added save-state feedback in the editor
- Added error handling for failed auth, share failures, and unsupported uploads

## Where AI Was Not Allowed To Replace Judgment

The biggest judgment calls were around scoping:

- choosing durable Mongo-backed persistence without overbuilding the data model
- keeping the editor coherent instead of chasing advanced document features
- limiting imports to `.txt` and `.md`
- deferring real-time collaboration and edit permissions for shared recipients

Those decisions were made to maximize end-to-end product quality inside the assignment timebox rather than to maximize feature count.
