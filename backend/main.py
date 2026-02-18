from fastapi import FastAPI
from database import connect_db, get_db
from services.github_service import extract_github_raw
from services.feature_engine import extract_engineering_features
from services.scoring_engine import calculate_engineering_score
from services.leetcode_service import extract_leetcode_features
from services.scoring_engine import calculate_dsa_score
from services.scoring_engine import calculate_collaboration_score
from services.scoring_engine import calculate_consistency_score
from services.scoring_engine import calculate_final_readiness
from database import get_db
from datetime import datetime
from services.llm_service import generate_chat_response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    connect_db()

@app.get("/")
def health():
    return {"status": "DevLens Backend Running"}

@app.get("/test-db")
def test_db():
    db = get_db()
    return {"collections": db.list_collection_names()}

@app.get("/github/{username}")
def github_data(username: str):
    data = extract_github_raw(username)

    if not data:
        return {"error": "User not found"}

    return data

@app.get("/github-features/{username}")
def github_features(username: str):
    raw = extract_github_raw(username)
    if not raw:
        return {"error": "User not found"}

    features = extract_engineering_features(raw)
    return features

@app.get("/engineering-score/{username}")
def engineering_score(username: str):
    raw = extract_github_raw(username)
    if not raw:
        return {"error": "User not found"}

    features = extract_engineering_features(raw)
    score = calculate_engineering_score(features)

    return {
        "features": features,
        "engineering_score": score
    }

@app.get("/leetcode/{username}")
def leetcode_data(username: str):
    data = extract_leetcode_features(username)

    if not data:
        return {"error": "User not found or private"}

    return data

@app.get("/dsa-score/{username}")
def dsa_score(username: str):
    data = extract_leetcode_features(username)

    if not data:
        return {"error": "User not found"}

    score_data = calculate_dsa_score(data)

    return {
        "features": data,
        "scores": score_data
    }

@app.get("/collaboration-score/{username}")
def collaboration_score(username: str):
    raw = extract_github_raw(username)

    if not raw:
        return {"error": "User not found"}

    score_data = calculate_collaboration_score(raw)

    return score_data

@app.get("/consistency-score/{github}/{leetcode}")
def consistency_score(github: str, leetcode: str):
    github_raw = extract_github_raw(github)
    leetcode_data = extract_leetcode_features(leetcode)

    if not github_raw or not leetcode_data:
        return {"error": "Invalid usernames"}

    score_data = calculate_consistency_score(
        github_raw,
        leetcode_data
    )

    return score_data

@app.get("/devlens-evaluate/{github}/{leetcode}")
def devlens_evaluate(github: str, leetcode: str):

    github_raw = extract_github_raw(github)
    leetcode_data = extract_leetcode_features(leetcode)

    if not github_raw or not leetcode_data:
        return {"error": "Invalid usernames"}

    # ---------------- Engineering ----------------
    eng_features = extract_engineering_features(github_raw)
    engineering_score = calculate_engineering_score(eng_features)

    # ---------------- DSA ----------------
    dsa_data = calculate_dsa_score(leetcode_data)
    dsa_score = dsa_data["dsa_score"]

    # ---------------- Collaboration ----------------
    collab_data = calculate_collaboration_score(github_raw)
    collaboration_score = collab_data["collaboration_score"]

    # ---------------- Consistency ----------------
    consistency_data = calculate_consistency_score(
        github_raw,
        leetcode_data
    )
    consistency_score = consistency_data["consistency_score"]

    # ---------------- Final ----------------
    final = calculate_final_readiness(
        engineering_score,
        dsa_score,
        consistency_score,
        collaboration_score
    )

    # ---------------- Extra Dashboard Data ----------------

    # Cleaned repositories
    repositories = [
        {
            "name": repo.get("name"),
            "language": repo.get("language"),
            "stars": repo.get("stargazers_count"),
            "size": repo.get("size"),
            "description": repo.get("description")
        }
        for repo in github_raw.get("repos", [])
    ]

    # Extract skills from languages
    skills = list(
        set([
            repo.get("language")
            for repo in github_raw.get("repos", [])
            if repo.get("language")
        ])
    )

    # LeetCode breakdown
    leetcode_breakdown = {
        "easy": leetcode_data.get("easy", 0),
        "medium": leetcode_data.get("medium", 0),
        "hard": leetcode_data.get("hard", 0)
    }

    # ---------------- Store in DB ----------------
    result_document = {
        "github_username": github,
        "leetcode_username": leetcode,
        "engineering_score": engineering_score,
        "dsa_score": dsa_score,
        "consistency_score": consistency_score,
        "collaboration_score": collaboration_score,
        "final_score": final["final_score"],
        "category": final["category"],
        "created_at": datetime.utcnow()
    }

    db = get_db()
    db.evaluations.insert_one(result_document)

    # ---------------- Return to Frontend ----------------
    return {
        "github_username": github,
        "leetcode_username": leetcode,
        "engineering_score": engineering_score,
        "dsa_score": dsa_score,
        "consistency_score": consistency_score,
        "collaboration_score": collaboration_score,
        "final_score": final["final_score"],
        "category": final["category"],
        "leetcode_breakdown": leetcode_breakdown,
        "repositories": repositories,
        "skills": skills
    }




@app.get("/evaluations/{github}")
def get_evaluations(github: str):
    db = get_db()
    records = list(db.evaluations.find(
        {"github_username": github},
        {"_id": 0}
    ))

    return records

@app.post("/chat/{github}/{leetcode}")
def chat(github: str, leetcode: str, payload: dict):

    user_message = payload.get("message", "")

    if not user_message:
        return {"error": "Message required"}

    evaluation = devlens_evaluate(github, leetcode)

    response = generate_chat_response(evaluation, user_message)

    return {
        "reply": response
    }