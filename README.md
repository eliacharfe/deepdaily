# 🧠 DeepDaily

> Learn anything deeply — one day at a time.

DeepDaily is an AI-powered learning platform that generates structured, day-by-day learning experiences for any topic. It is powered by a system of custom-built AI agents developed from scratch, combining LLM-driven lesson generation, intelligent resource discovery, and personalized curricula into a seamless learning journey.

---

## ✨ Features

- 📚 **AI-Generated Lessons**
  - Structured lessons generated in real-time using LLMs
  - Clear explanations, examples, and exercises

- 🗺️ **Daily Curriculum System**
  - Multi-day learning paths
  - Progressive difficulty and topic breakdown
  - Resume where you left off

- 🔍 **Smart Resource Discovery**
  - Automatically curated learning resources per day
  - Domain scoring system (docs > tutorials > noise)
  - High-quality links (React docs, Python docs, etc.)

- 💾 **Save & Update Lessons**
  - Save generated lessons to your account
  - Update existing lessons seamlessly

- 🔐 **Authentication**
  - Firebase Authentication
  - Secure user-based data storage

- ⚡ **Streaming Experience**
  - Real-time lesson generation (SSE)
  - Smooth UX while content is being created

- 🎯 **Modern UI**
  - Built with TailwindCSS
  - Dark mode support
  - Responsive design (mobile-first)

---

## 🏗️ Tech Stack

### Frontend
- Next.js 16+ (App Router)
- React 19
- TypeScript
- TailwindCSS
- Sonner (toasts)

### Backend
- FastAPI
- Python 3.11+
- Async architecture
- SQLAlchemy (async)
- PostgreSQL / SQLite (dev)

### AI Layer
- Multi-LLM support (OpenAI, etc.)
- Structured JSON outputs
- Streaming responses

### Infrastructure
- Vercel (Frontend)
- Render (Backend)
- Firebase Auth
- Docker (optional)

---

## 📁 Project Structure

    deepdaily/
    │
    ├── apps/
    │   ├── web/                # Next.js frontend
    │   │   ├── app/
    │   │   ├── components/
    │   │   ├── lib/
    │   │   └── types/
    │   │
    │   └── api/                # FastAPI backend
    │       ├── app/
    │       │   ├── services/
    │       │   │   ├── agents/
    │       │   │   ├── curriculum_service.py
    │       │   │   └── ...
    │       │   ├── routers/
    │       │   ├── models/
    │       │   └── schemas/
    │       └── main.py
    │
    └── README.md

---

## 🚀 Getting Started

### 1. Clone the repo

    [git clone https://github.com/your-username/deepdaily.git](https://github.com/eliacharfe/deepdaily.git)
    cd deepdaily

---

### 2. Backend Setup (FastAPI)

    cd apps/api

    python -m venv .venv
    source .venv/bin/activate

    pip install -r requirements.txt

Run the server:

    python -m uvicorn app.main:app --reload

API will be available at:

    http://127.0.0.1:8000

---

### 3. Frontend Setup (Next.js)

    cd apps/web

    npm install
    npm run dev

App will run at:

    http://localhost:3000

---

## 🔑 Environment Variables

### Backend (`apps/api/.env`)

    OPENAI_API_KEY=your_key
    DATABASE_URL=your_db_url

---

### Frontend (`apps/web/.env.local`)

    NEXT_PUBLIC_API_URL=http://localhost:8000
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...

---

## 🧠 Core Concepts

### 1. Lesson Generation

- User inputs a topic
- Backend generates:
  - Summary
  - Structured lesson
  - Deep dive sections
- Streamed to frontend in real-time

---

### 2. Curriculum System

- Converts a topic into a multi-day roadmap
- Each day includes:
  - Learning objectives
  - Lesson content
  - Resources

---

### 3. Resource Discovery Agent

- Searches the web for relevant content
- Scores domains based on quality
- Filters low-value sources (Reddit, Quora, etc.)

---

## 🔄 API Overview

### Lessons

    POST /lessons
    GET /lessons
    GET /lessons/{id}

### Curricula

    POST /curricula
    POST /curricula/{id}/generate-day
    POST /curricula/{id}/complete-day

---

## 💡 Future Improvements

- [ ] Spaced repetition system
- [ ] Daily push notifications
- [ ] Mobile app (Flutter)
- [ ] Social / shared learning
- [ ] Offline mode
- [ ] Advanced personalization (AI tutor memory)

---

## 🧑‍💻 Author

Eliachar Feig

- https://www.eliacharfeig.com/
- https://www.linkedin.com/in/eliachar-feig/
- https://github.com/eliacharfe

---

## ⭐ Contributing

Pull requests are welcome!

If you have ideas for improvements, feel free to open an issue.

---

## 📄 License

MIT License

---

## ❤️ Philosophy

DeepDaily is built on one core belief:

> Consistent, structured daily learning compounds into mastery.
