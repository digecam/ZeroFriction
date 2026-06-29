import json
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# 1. Load the .env file
load_dotenv()

# 2. Get the key securely
api_key = os.getenv("MY_API_KEY")
genai.configure(api_key=api_key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Initialize the model
model = genai.GenerativeModel('gemini-2.5-flash')


class TaskRequest(BaseModel):
    task: str
    time_remaining: str
    is_emergency: bool


class PivotRequest(BaseModel):
    step_title: str
    action_prompt: str


@app.post("/api/demolish")
async def demolish_task(req: TaskRequest):
    # UPDATED PROMPT: Now includes Autonomous Planning and Personalized Recommendations
    system_instruction = """You are an elite autonomous execution engine. 
    AUTONOMOUS PLANNING: Break the user's task into actionable steps, prioritizing the hardest/most critical thing first.
    PERSONALIZATION: Provide a 'personalized_recommendation' tailored to their specific task and time constraint (e.g., "Use the Pomodoro technique", "Switch to high-bpm music").
    Return ONLY a JSON object:
    {"goal_summary": "string", "personalized_recommendation": "string", "urgency_score": int, "is_emergency": boolean, "execution_steps": [{"step_number": int, "title": "string", "estimated_minutes": int, "launchpad_resources": {"action_prompt": "string", "inspiration_or_tip": "string"}}]}"""

    prompt = f"{system_instruction}\n\nContext: Emergency={req.is_emergency}, Time={req.time_remaining}. Task={req.task}"

    try:
        response = model.generate_content(prompt)
        text = response.text
        start = text.find('{')
        end = text.rfind('}') + 1
        data = json.loads(text[start:end])
        return {"status": "success", "data": data}
    except Exception as e:
        print("CRASH DETAILS (Demolish):", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pivot")
async def pivot_task(req: PivotRequest):
    prompt = f"Break this into a 2-minute micro-step. Task: '{req.step_title}'. Return JSON: {{'new_title': '...', 'action_prompt': '...', 'inspiration_or_tip': '...'}}"
    try:
        response = model.generate_content(prompt)
        text = response.text
        start = text.find('{')
        end = text.rfind('}') + 1
        data = json.loads(text[start:end])
        return {"status": "success", "data": data}
    except Exception as e:
        print("CRASH DETAILS (Pivot):", str(e))
        raise HTTPException(status_code=500, detail=str(e))
