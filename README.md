# ZeroFriction
# Launchpad AI 🚀 : The ZeroFriction Execution Engine

**Hackathon:** Vibe2Ship by CodingNinjas x Google for Developers
**Problem Statement:** The Last-Minute Life Saver

## 📌 The Problem
Students and professionals constantly face "deadline paralysis"—the mental friction of starting a complex task. Standard to-do lists fail because they are passive and just remind you of how much work is left, adding to the overwhelm.

## 💡 The Solution
Launchpad AI is a proactive, AI-powered productivity companion. Instead of just listing tasks, our ZeroFriction Execution Engine autonomously breaks down overwhelming projects into highly actionable roadmaps. 

**Core Features:**
- **Autonomous Task Planning:** Instantly generates prioritized survival roadmaps based on your deadlines.
- **The "Pivot" Takeover:** When you hit a wall, click "I'm Stuck." The app triggers a cinematic pattern interrupt, forcing a focus shift by shrinking the project into one actionable 2-minute micro-step.
- **Gamification:** Habit streak tracking and dynamic title badges to keep you engaged.

## 🛠️ Tech Stack
- **Frontend:** React + Tailwind CSS + Vite
- **Backend:** FastAPI (Python)
- **AI Engine:** Google Gemini 2.5 Flash (via Google AI Studio)

## 🚀 How to Run Locally

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # (or venv/bin/activate on Mac)
pip install -r requirements.txt
# Create a .env file and add your GEMINI_API_KEY
uvicorn main:app --reload
