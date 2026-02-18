import requests
import json

OLLAMA_URL = "http://localhost:11434/api/generate"

def query_llm(prompt: str):
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": "phi3:mini",
            "prompt": prompt,
            "stream": False
        }
    )

    if response.status_code != 200:
        return "LLM Error"

    return response.json()["response"]

def generate_chat_response(evaluation_data, user_message):
    prompt = f"""
You are DevLens AI.

STRICT RULES:
- Never ask follow-up questions unless explicitly requested.
- Never invent scenarios.
- Never add extra discussion.
- Keep responses under 3 sentences unless user asks for detail.
- If message is casual (hi, hello), respond briefly.
- If question is about evaluation, answer only what is asked.
- Elaborate ONLY if user says: explain, elaborate, detail, deep dive.

Evaluation Data:
Engineering: {evaluation_data['engineering_score']}
DSA: {evaluation_data['dsa_score']}
Consistency: {evaluation_data['consistency_score']}
Collaboration: {evaluation_data['collaboration_score']}
Final: {evaluation_data['final_score']}
Category: {evaluation_data['category']}

User Message:
{user_message}

Respond now.
"""
    return query_llm(prompt)
