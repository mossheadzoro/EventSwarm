# 🚀 EventSwarm

### *Autonomous AI Event Logistics Platform*

![EventSwarm Banner](https://img.shields.io/badge/EventSwarm-AI%20Event%20Logistics-purple?style=for-the-badge)
![NextJS](https://img.shields.io/badge/Next.js-Frontend-black?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-AI%20Backend-green?style=flat-square)
![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-blue?style=flat-square)

> **EventSwarm is an AI-driven event logistics system where autonomous agents coordinate event planning like a swarm of satellites orbiting a mission.**

Instead of manually managing scheduling, emails, logistics, and participants — **EventSwarm deploys intelligent agents that collaborate in real time to organize your event.**

---

# 🌌 Overview

EventSwarm simulates a **mission control system for events**.

Each AI agent is responsible for a specific task:

| Agent              | Responsibility                              |
| ------------------ | ------------------------------------------- |
| 🧠 Supervisor      | Coordinates the swarm                       |
| 📅 Scheduler       | Manages event timeline & calendar conflicts |
| 📧 Communications  | Sends emails & notifications                |
| 📊 Data Processor  | Reads CSV participant data                  |
| 🎤 Voice Interface | Accepts voice commands                      |

These agents **communicate through a real-time swarm engine** to execute tasks autonomously.

---
## 🌐 Live Demo

You can explore the **EventSwarm frontend interface** here:

🚀 **Frontend Deployment**
👉 https://event-swarm.vercel.app/

The backend services (AI agents, scheduling engine, and APIs) are **currently not deployed publicly yet**.

🙏 *Sorry for the inconvenience — the backend  will be deployed soon.*

Once deployed, the live demo will support:

* 🤖 Full AI swarm execution
* 📅 Calendar conflict detection
* 📊 CSV schedule timeline generation
* 🎤 Voice command event control

Stay tuned for the **complete autonomous event management experience.**

---

# 🛰️ Features

### 🤖 Autonomous AI Agents

Multiple AI agents collaborate to manage event logistics.

### 🎤 Voice Command Interface

Users can control the platform through **natural language voice commands**.

### 📅 Smart Calendar Conflict Detection

Automatically checks the official event calendar and detects scheduling conflicts.

### 📊 CSV Event Timeline Generation

Upload a CSV schedule and EventSwarm instantly converts it into a visual timeline.

### ⚡ Real-time Swarm Communication

Agents communicate through **Socket.IO** for instant updates.

### 🌌 Mission Control Dashboard

A futuristic UI inspired by **space mission control systems**.

---

# 🛠️ Tech Stack

### Frontend

* **Next.js (App Router)**
* **TypeScript**
* **TailwindCSS**
* **shadcn/ui**
* **React Query**
* **Socket.IO**
* **Recharts**
* **TanStack Table**
* **React Flow**

### Backend

* **FastAPI**
* **Python AI agents**
* **LangChain / AI orchestration**
* **WebSockets**
* **MongoDB**

---

# 🧭 System Architecture

```
User Interface
      │
      ▼
Mission Control Dashboard (Next.js)
      │
      ▼
Real-Time Swarm Engine (Socket.IO)
      │
      ▼
AI Agent Network
 ├ Supervisor Agent
 ├ Scheduler Agent
 ├ Communication Agent
 ├ Data Processing Agent
 └ Voice Interface
      │
      ▼
External Services
 ├ Calendar API
 ├ Email Services
 └ Event Data Storage
```

---

# 📂 Project Structure

```
EventSwarm
│
├ frontend
│   ├ app
│   ├ components
│   ├ hooks
│   └ lib
│
├ backend
│   ├ agents
│   ├ api
│   ├ services
│   └ main.py
│
├ README.md
└ docker-compose.yml
```

---

# 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-repo/EventSwarm.git
cd EventSwarm
```

---

### 2️⃣ Install Frontend

```
cd frontend
npm install
npm run dev
```

---

### 3️⃣ Run Backend

```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

---

# 🎯 Example Workflow

1️⃣ User uploads **event schedule CSV**

```
10:00,11:00,Registration
11:00,12:00,Opening Ceremony
12:00,13:00,Workshop
```

2️⃣ AI agents process the data

3️⃣ Scheduler checks **calendar conflicts**

4️⃣ Timeline appears automatically in the dashboard

5️⃣ Communication agent sends **participant notifications**

---

# 🌠 Vision

EventSwarm aims to become the **mission control system for real-world events**.

Instead of managing events manually, organizers deploy **AI swarms that autonomously plan, coordinate, and execute event logistics.**

---

# 🤝 Contributors

* **Ankan Das** – Frontend & System Architecture
* **Collaborators** – Backend & AI Agents

---

# 📜 License

MIT License

---

# ⭐ Support the Mission

If you like this project:

⭐ Star the repository
🚀 Share with developers
🌌 Help build the future of AI-driven event logistics

---

**EventSwarm — Where AI Agents Coordinate Events Like Satellites in Orbit.**
