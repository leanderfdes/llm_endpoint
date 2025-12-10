# 🧠 LLM Playground – FastAPI + Gemini + React

A sleek, minimal **LLM playground** built with:

- ⚙️ **FastAPI** backend
- 🤖 **Google Gemini** LLM
- ⚛️ **React (Vite)** frontend
- 🎨 **Tailwind CSS** for styling

This project is designed to look and feel like a **real production LLM client**, perfect for showcasing **AI application engineering** skills to recruiters and hiring managers.

---

## ✨ Features

### Backend (FastAPI + Gemini)
- ✅ `/api/v1/ask` endpoint to query the LLM
- ✅ Clean, versioned API structure (`/api/v1/...`)
- ✅ Gemini integration via `google-generativeai`
- ✅ Configurable `max_tokens` per request (up to 100,000 in the UI)
- ✅ Strong logging & error handling:
  - Centralized logging config
  - Custom `LLMServiceError`
  - Clean JSON error responses
- ✅ Environment-based configuration with `.env` (no keys in code)

### Frontend (React + Vite + Tailwind)
- ✅ Minimal, **industry-style** LLM playground UI
- ✅ Prompt textarea with helper examples
- ✅ Max Tokens slider with live token display
- ✅ Loading state (“Thinking…” with spinner)
- ✅ Response panel with:
  - Model name
  - Token usage
- ✅ “Recent prompts” sidebar with quick reuse
- ✅ Clean bottom meta line:

  > **Built with FastAPI · Gemini · React · Tailwind CSS**  
  > LLM Playground · Industry-ready LLM client UI

---

## 🧱 Tech Stack

**Backend**
- Python 3.10+
- FastAPI
- Uvicorn
- `google-generativeai` (Gemini)
- `pydantic-settings` for config
- `python-dotenv` for env loading

**Frontend**
- React (Vite)
- Tailwind CSS
- PostCSS + Autoprefixer

---

## 🏗️ Architecture & Folder Structure

```bash
.
├── app/                     # FastAPI application package
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── routes/
│   │           └── ask.py   # /api/v1/ask endpoint
│   ├── core/
│   │   ├── config.py        # Settings (env + Pydantic)
│   │   └── logging_config.py
│   ├── models/
│   │   └── schemas.py       # AskRequest, AskResponse
│   ├── services/
│   │   └── llm_client.py    # Gemini LLM client
│   ├── utils/
│   │   └── errors.py        # LLMServiceError, error helpers
│   └── main.py              # FastAPI app factory, CORS, routers
├── llm-frontend/
│   ├── src/
│   │   ├── App.jsx          # LLM playground UI
│   │   ├── main.jsx
│   │   └── index.css        # Tailwind entry
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── index.html
├── .env                     # Local env vars (NOT committed)
├── requirements.txt
└── README.md

🚀 Getting Started
1️⃣ Prerequisites

Python 3.10+

Node.js 16+ and npm

A Gemini API key from Google AI Studio

2️⃣ Backend Setup (FastAPI + Gemini)

From project root:

# create virtual env (optional but recommended)
python -m venv venv
venv\Scripts\activate  # on Windows
# source venv/bin/activate  # on macOS/Linux

# install dependencies
pip install -r requirements.txt

🔐 Configure environment variables

Create a .env file in the project root (same level as app/):

GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXX   # your real Gemini key


⚠️ Never commit .env to GitHub.
You can add .env to your .gitignore.

▶️ Run the backend

From the project root:

uvicorn app.main:app --reload


Backend will be available at:

Swagger docs: http://127.0.0.1:8000/docs

/api/v1/ask: POST endpoint

3️⃣ Frontend Setup (React + Vite + Tailwind)

From the llm-frontend directory:

cd llm-frontend

# install frontend dependencies
npm install

# run dev server
npm run dev


Frontend will usually be at:

http://127.0.0.1:5173
 or http://localhost:5173

The frontend expects the backend at http://127.0.0.1:8000.
CORS is enabled on the FastAPI side.

📡 API Reference
POST /api/v1/ask

Send a prompt to the LLM and receive a generated response.

Request body
{
  "prompt": "Explain what an API is in simple terms for a beginner.",
  "max_tokens": 300
}


prompt (string, required) – user’s question or instruction

max_tokens (int, optional) – maximum tokens to generate (UI supports up to 100,000; backend passes this to Gemini)

Successful response
{
  "answer": "An API is like a waiter in a restaurant...",
  "model": "models/gemini-2.5-flash",
  "usage_tokens": 1234
}

Error response (example)
{
  "detail": "Gemini API error: 400 API key not valid. Please pass a valid API key."
}


Errors are handled centrally and surfaced in a clean JSON format.

🖥️ Frontend UI Overview

The React frontend provides:

📝 Prompt input with placeholder & helper examples

🎚️ Max tokens slider (50 → 100,000 tokens)

🔄 Loading state (“Thinking…” + spinner)

📥 Response panel showing:

Answer text

Model name

Total tokens used

🕒 Recent prompts list (last 5)

Click any past prompt to re-use it instantly

ℹ️ Bottom meta info for a clean portfolio touch:

Built with FastAPI · Gemini · React · Tailwind CSS
LLM Playground · Industry-ready LLM client UI
