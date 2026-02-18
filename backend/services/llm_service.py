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
You are Devlyzer AI.

RULES:
- Answer ONLY what the user asked.
- Do NOT add extra advice.
- Do NOT ask follow-up questions.
- Do NOT expand beyond the scope of the question.
- If the user greets, greet back briefly.
- If the question is about a specific score, explain only that score.
- If the user asks for roadmap, give roadmap.
- If the user asks for detailed explanation, then go deep.
- Otherwise, keep response concise and focused.

Evaluation Data:
Engineering Score: {evaluation_data['engineering_score']}
DSA Score: {evaluation_data['dsa_score']}
Consistency Score: {evaluation_data['consistency_score']}
Collaboration Score: {evaluation_data['collaboration_score']}
Final Score: {evaluation_data['final_score']}
Category: {evaluation_data['category']}

User Question:
{user_message}

Respond now.
"""
    return query_llm(prompt)
