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


## 🤖 Agent Architecture

DeepDaily is powered by a system of **custom-built AI agents developed from scratch**, each responsible for a specific part of the learning pipeline.  
These agents collaborate to transform a user-defined topic into a structured, level-adapted, multi-day learning experience.

---

### 🧠 Planner Agent

Designs the overall learning journey based on the **topic and user level**.

**Responsibilities:**
- Breaks down a topic into a structured multi-day curriculum
- Adapts roadmap complexity based on user level (beginner / intermediate / advanced)
- Defines daily learning objectives
- Ensures logical progression and concept coverage

**Output:**
- A personalized learning roadmap tailored to topic + level

---

### 📘 Lesson Generation Agent

Generates the core learning content for each day.

**Responsibilities:**
- Creates clear, structured explanations for the given topic
- Adapts depth and complexity to the user’s level
- Adds examples, analogies, and practical context
- Builds deep-dive sections for advanced understanding

**Output:**
- Full lesson content (streamed in real-time)

---

### 🔍 Resource Discovery Agent

Enriches lessons with high-quality external knowledge using **real web search**.

**Responsibilities:**
- Performs web search to find relevant learning materials
- Scores sources using a custom domain-ranking system  
  (e.g., official docs > trusted platforms > low-quality sites)
- Filters out noisy or low-value sources (e.g., forums, spam)
- Selects the most relevant resources based on topic and difficulty level

**Output:**
- Curated list of high-quality, context-aware resources

---

### 📅 Daily Curriculum Agent

Assembles each individual learning day into a cohesive experience.

**Responsibilities:**
- Combines:
  - Learning objectives (Planner)
  - Lesson content (Lesson Agent)
  - Resources (Resource Agent)
- Ensures consistency across all days
- Aligns content with topic scope and user level

**Output:**
- A complete, structured “Day” in the curriculum

---

### ✅ Evaluation & Refinement Agent

Ensures quality, clarity, and coherence across all generated content.

**Responsibilities:**
- Reviews outputs for clarity and completeness
- Detects gaps, inconsistencies, or redundancy
- Refines content when needed
- Ensures alignment with topic and difficulty level

**Output:**
- Validated and improved lesson content

---

## 🔄 How It All Works Together

1. User inputs a **topic** and selects a **difficulty level**  
2. Planner Agent creates a level-adapted multi-day roadmap  
3. For each day:
   - Lesson Agent generates the lesson (adapted to level)  
   - Resource Discovery Agent performs web search and curates resources  
   - Daily Agent assembles the final structured day  
4. Evaluation Agent reviews and refines the output  
5. Content is streamed to the frontend in real-time  

---

## 💡 Why This Matters

Unlike simple prompt-based systems, DeepDaily uses a **modular multi-agent architecture**, enabling:

- Level-adaptive learning (beginner → advanced)  
- Real web-based knowledge integration  
- Higher-quality and more structured outputs  
- Clear separation of responsibilities  
- Scalable and extensible system design  

> DeepDaily is not just generating content — it is orchestrating a full, adaptive learning system.

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
