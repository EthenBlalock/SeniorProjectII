
# Senior Project — Student Finance & Investing Web App

This repository contains a full-stack web application built as a senior project. The app provides finance/investing learning tools for students and is implemented with a Python/Flask backend and a JavaScript/React frontend (Vite).

## Tech stack
- Backend: Python + Flask
- Frontend: React (Vite)
- Tooling: Node.js, npm, optional Python virtual environment

## Prerequisites
- Python 3.8+ (python3)
- Node.js 16+ and npm


## Local development — quickstart

Follow these steps from the repository root.

1) Backend

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate
# install dependencies
install -r requirements.txt
# run the server
python3 server.py
```

By default the backend listens on http://localhost:5000/ (unless `server.py` is configured otherwise).

2) Frontend

```bash
cd frontend/senior-project
# install node deps (first time)
npm install
# start dev server
npm run dev
```

The Vite dev server is exposed at http://localhost:5173/ by default.
