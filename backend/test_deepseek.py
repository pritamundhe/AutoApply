import os
import asyncio
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()
deepseek = AsyncOpenAI(base_url='https://api.deepseek.com', api_key=os.getenv('DEEPSEEK_API_KEY'))

async def test():
    system_prompt = """You are AutoApply AI, a helpful assistant helping the user update their professional profile.
You will be provided with:
1. The user's CURRENT profile data (JSON)
2. The user's chat message requesting an update.

Analyze the user's message and determine what fields in the profile need to be updated.
Return a JSON object with exactly two keys:
1. "updates": A JSON object containing ONLY the fields that should be updated, with their new values. (e.g. {"skills": "React, Python", "yearsOfExperience": "5"})
2. "reply": A friendly, conversational message back to the user confirming what you updated. (e.g. "I've added Python to your skills and updated your experience to 5 years!")

Rules for updates:
- If they want to add a skill, append it to their existing skills.
- If they want to change their title, overwrite it.
- Only include fields in "updates" that actually changed.
- If the user's message is unclear or unrelated to the profile, leave "updates" empty and ask them for clarification in "reply".
"""
    req_currentProfile = {}
    req_message = "passing year 2026"
    
    try:
        res = await deepseek.chat.completions.create(
            model='deepseek-chat',
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Current Profile:\n{json.dumps(req_currentProfile)}\n\nUser Message:\n{req_message}"}
            ],
            response_format={"type": "json_object"}
        )
        print('SUCCESS:', res.choices[0].message.content)
    except Exception as e:
        print('ERROR:', e)

asyncio.run(test())
