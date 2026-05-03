# CommSolve — AI-Powered Community Problem Solver

> **Bridging the digital divide with a 4-level Help Ladder: from instant AI solutions to community-driven knowledge reuse.**

CommSolve is a full-stack platform that helps non-technical (and technical) users solve digital problems through a structured escalation system — Templates, Build Paths, AI + Community Q&A, and reusable knowledge.

---

## The Help Ladder

| Level | Feature | Description |
|-------|---------|-------------|
| **0** | Templates | Ready-made solutions users can launch in minutes |
| **1** | Build Paths | Step-by-step guided recipes with progress tracking |
| **2** | AI + Community Q&A | AI answers instantly, community answers verified by AI |
| **3** | Knowledge Reuse | Every answer helps the next person |

---

## Key Features

### AI-Powered
- **AI Auto-Answers** — Every question gets an instant AI response (OpenRouter / Nvidia Nemotron)
- **AI Spam Verification** — Community answers are analyzed by AI before publishing
- **AI Question Structuring** — Messy input → structured goal/attempted/error format
- **AI Intent Analysis** — Understands what the user is trying to achieve

### Community & Social
- **LinkedIn-style Connections** — Send/accept/reject connection requests
- **Real-time DMs** — Chat with connected users (polling-based)
- **Telegram-style Groups** — Create/join channels, group messaging, emoji icons
- **User Profiles** — Bio, domains, skills, tech/non-tech badge, social links

### Core Platform
- **Google OAuth 2.0** — Secure popup-based login with backend token exchange
- **Role-based Access** — Admin panel hidden from regular members
- **Admin Dashboard** — Overview, member management, moderation, analytics
- **Template Marketplace** — Browse, create, and use templates with difficulty badges
- **Build Paths** — Interactive step-by-step guides with localStorage progress persistence
- **Global Search** — Search across templates, build paths, questions, and groups
- **Notifications** — Real-time alerts for connection requests, answers, and group activity

---

## Tech Stack

```
Frontend          Backend           Database        AI
─────────────     ──────────────    ─────────────   ──────────────
React 18          FastAPI           Turso (libSQL)  OpenRouter API
React Router v6   Pydantic v2       Edge SQLite     Nvidia Nemotron
TailwindCSS       Uvicorn           Auto-replicated
Vite              HTTPX
Axios             Python-dotenv
Lucide Icons
react-markdown
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                       │
│  Landing → Dashboard → Templates → Build Paths → Q&A    │
│  AI Assistant → Community → Groups → Profile → Admin     │
├─────────────────────────────────────────────────────────┤
│                   Vite Dev Proxy (/api)                   │
├─────────────────────────────────────────────────────────┤
│                   Backend (FastAPI)                       │
│  Auth │ AI │ Questions │ Templates │ Build Paths         │
│  Community │ Profiles │ Groups │ Notifications           │
├─────────────────────────────────────────────────────────┤
│  Turso (Edge SQLite)     │    OpenRouter AI API          │
│  10 tables               │    Spam check + Q&A + NLP     │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Turso account (free tier: https://turso.tech)
- OpenRouter API key (https://openrouter.ai)
- Google OAuth credentials (https://console.cloud.google.com)

### 1. Clone & Setup Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual keys:
```

```env
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your_token_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

### 3. Seed Database

```bash
python seed_data.py
```

### 4. Start Backend

```bash
uvicorn app.main:app --reload --port 8000
```

### 5. Setup & Start Frontend

```bash
cd ../frontend
npm install
npm run dev
```

### 6. Open

Visit `http://localhost:3000` and sign in with Google.

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Base user records |
| `profiles` | Extended profile: bio, domains, skills, links |
| `templates` | Level 0 instant solutions |
| `build_paths` | Level 1 step-by-step guides |
| `questions` | Level 2 community questions |
| `answers` | AI + community answers with spam verification |
| `connections` | LinkedIn-style user connections |
| `messages` | Direct messages between connected users |
| `groups` | Telegram-style community channels |
| `group_members` | Group membership tracking |
| `group_messages` | Channel messages |
| `notifications` | User notification feed |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/google/url` | Get Google OAuth URL |
| `POST` | `/api/auth/google/callback` | Exchange code for user |
| `GET/POST` | `/api/templates/` | List / create templates |
| `GET/POST` | `/api/build-paths/` | List / create build paths |
| `GET/POST` | `/api/questions/` | List / create questions |
| `POST` | `/api/questions/{id}/answers` | Submit AI-verified answer |
| `POST` | `/api/ai/ask-ai` | Get AI answer |
| `POST` | `/api/ai/analyze` | Analyze user intent |
| `GET/PUT` | `/api/profiles/{id}` | Get / update profile |
| `POST` | `/api/community/connect` | Send connection request |
| `GET` | `/api/community/connections/{id}` | List connections |
| `POST/GET` | `/api/community/messages` | Send / get DMs |
| `GET/POST` | `/api/groups/` | List / create groups |
| `POST` | `/api/groups/{id}/join` | Join group |
| `GET/POST` | `/api/groups/{id}/messages` | Group chat |
| `GET` | `/api/notifications/{id}` | Get notifications |

---

## Project Structure

```
AGENTIC HACKATHOn/
├── backend/
│   ├── app/
│   │   ├── config.py          # Environment settings
│   │   ├── main.py            # FastAPI app + CORS + routers
│   │   ├── db/connection.py   # Turso DB connection + schema
│   │   ├── models/schemas.py  # Pydantic request/response models
│   │   ├── routes/            # API route handlers
│   │   │   ├── auth.py        # Google OAuth
│   │   │   ├── ai.py          # AI endpoints
│   │   │   ├── questions.py   # Q&A + AI spam check
│   │   │   ├── templates.py   # Template CRUD
│   │   │   ├── build_paths.py # Build path CRUD
│   │   │   ├── community.py   # Connections + DMs
│   │   │   ├── profiles.py    # User profiles
│   │   │   └── groups.py      # Group channels
│   │   └── services/
│   │       └── ai_service.py  # OpenRouter AI integration
│   ├── seed_data.py           # Database seeder
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api.js             # Axios API client
│   │   ├── App.jsx            # Routes + layout
│   │   ├── context/AuthContext.jsx  # Google OAuth + role mgmt
│   │   ├── components/Navbar.jsx    # Sidebar + topbar
│   │   └── pages/             # 11 pages
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Team

Built for the Agentic Hackathon.

---

## License

MIT
