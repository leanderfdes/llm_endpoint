# 🚀 LLM Playground — FastAPI × Gemini × React

**Industry-ready LLM Playground** built with a **FastAPI backend**, **Google Gemini**, and a **sleek React + Tailwind UI**.  
Designed to showcase **real-world LLM integration, clean architecture, and production deployment**.

## 🖥️ Live Demo
👉 https://llm-playground-fastapi-gemini-nffi-ou4twwlmk.vercel.app?_vercel_share=XqykOxvDnZV4Ovitr3Xpg8nqipf37LFH

![LLM Playground Screenshot](assets/ui-main.png)


---

## ✨ What This Project Demonstrates

This project is intentionally built to reflect **how LLM-powered applications are designed in production**, not just a demo script.

✔️ API-first backend with versioning  
✔️ Clean separation of concerns  
✔️ Safe environment-based configuration  
✔️ Production-ready deployment  
✔️ Thoughtful frontend UX for LLM interaction  

---

## 🧠 Key Features

### 🔹 Backend (FastAPI + Gemini)
- `/api/v1/ask` endpoint for LLM inference
- Google **Gemini** integration (server-side only)
- Token usage tracking
- Centralized error handling
- Structured logging
- Pydantic v2 + `pydantic-settings`
- Environment-based configuration
- CORS configured for production & local dev
- Deployed on **Render**

### 🔹 Frontend (React + Tailwind)
- Minimal, modern UI (industry style)
- Animated typewriter response reveal
- Markdown-rendered LLM responses
- Copy-to-clipboard support
- Token slider (up to 100k)
- Dynamic prompt examples (changes every session)
- Prompt history panel
- Fully responsive layout
- Deployed on **Vercel**

---

🛠️ Tech Stack
| Layer      | Technology                |
| ---------- | ------------------------- |
| Backend    | FastAPI, Python 3.13      |
| LLM        | Google Gemini             |
| Frontend   | React, Vite               |
| Styling    | Tailwind CSS              |
| Config     | Pydantic Settings         |
| Logging    | Python logging            |
| Deployment | Render (API), Vercel (UI) |


## 🏗️ Architecture Overview

```txt
┌────────────┐        HTTP        ┌────────────────────┐
│  Frontend  │ ───────────────▶ │   FastAPI Backend   │
│  (Vercel)  │                  │   (Render)          │
│ React + UI │ ◀─────────────── │ Gemini LLM Client   │
└────────────┘     JSON Response └────────────────────┘

