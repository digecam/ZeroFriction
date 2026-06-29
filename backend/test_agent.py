import os
import json
from dotenv import load_dotenv

# 1. New Imports
from google import genai
from google.genai import types

# Load env vars
load_dotenv()

# 2. Init the new Client (it automatically detects GEMINI_API_KEY from your .env!)
client = genai.Client()

# Core system prompt
sys_prompt = """
You are the core agentic engine of "Launchpad AI". Your objective is to take an intimidating user goal and break it down into an actionable, low-friction execution path.
You must strictly return a valid JSON object with the following structure:
{
  "goal_summary": "Short summary",
  "urgency_score": 5,
  "execution_steps": [
    {
      "step_number": 1,
      "title": "Micro-task title",
      "estimated_minutes": 15,
      "launchpad_resources": {
        "action_prompt": "Immediate instruction to begin",
        "inspiration_or_tip": "A tailored technical hint or tip"
      }
    }
  ]
}
"""

print("running test agent...")

# Dummy data
test_input = "I have a heavy linear algebra exam tomorrow morning. I haven't started studying matrices and determinants, and I'm freaking out."

try:
    # 3. Use the new syntax for generate_content
    res = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=test_input,
        config=types.GenerateContentConfig(
            system_instruction=sys_prompt,
            response_mime_type="application/json"
        )
    )

    print("--- SUCCESS ---")

    # Load it into a dict just to verify it didn't break JSON formatting
    parsed_data = json.loads(res.text)
    print(json.dumps(parsed_data, indent=2))

except Exception as e:
    print(f"API Error: {e}")
