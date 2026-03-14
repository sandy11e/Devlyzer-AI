# Devlyzer

Devlyzer is a full-stack developer readiness analysis platform.
It evaluates a candidate profile using GitHub activity + LeetCode performance, computes multi-dimensional scores, stores historical evaluations, and provides AI-assisted feedback chat.

This README is designed to be both:
1. Project onboarding documentation.
2. A living template you can keep updating as the project grows.

## Table of Contents

1. Project Overview
2. Core Features
3. Tech Stack
4. System Architecture
5. Repository Structure
6. Local Setup
7. Environment Variables
8. Running the Project
9. API Reference
10. Scoring Logic Summary
11. Data Storage
12. Frontend Routes and Flow
13. Documentation Workflow (How to Keep Docs Updated)
14. Troubleshooting
15. Roadmap Notes
16. License

## 1. Project Overview

Devlyzer analyzes a developer profile across four dimensions:
1. Engineering quality (GitHub project signals).
2. DSA/problem-solving strength (LeetCode).
3. Consistency over time.
4. Collaboration/public footprint.

It combines these into a final readiness score and category, then provides recommendations and chat-based guidance.

## 2. Core Features

1. GitHub profile and repository feature extraction.
2. LeetCode stats extraction through GraphQL.
3. Multi-factor scoring engine:
- Engineering
- DSA
- Consistency
- Collaboration
- Final readiness
4. Evaluation history saved in MongoDB.
5. Dashboard visualizations (charts and score cards).
6. Rule-based recommendation generation.
7. AI chat endpoint using local Ollama model (`phi3:mini`).
8. PDF report export from frontend dashboard.

## 3. Tech Stack

Backend:
1. Python
2. FastAPI
3. PyMongo
4. Requests
5. python-dotenv

Frontend:
1. React (Vite)
2. React Router
3. Axios
4. Recharts
5. html2canvas + jsPDF
6. Tailwind (present in project config)

External Services:
1. GitHub REST API
2. LeetCode GraphQL API
3. MongoDB
4. Ollama (`http://localhost:11434`)

## 4. System Architecture

High-level flow:
1. User enters GitHub + LeetCode usernames in frontend.
2. Frontend calls backend `GET /devlens-evaluate/{github}/{leetcode}`.
3. Backend fetches GitHub and LeetCode raw data.
4. Feature extraction and scoring engines compute sub-scores.
5. Final readiness score/category is computed.
6. Recommendations are generated.
7. Evaluation summary is stored in MongoDB (`evaluations` collection).
8. Frontend renders charts, cards, recommendations, and history.
9. Chat page sends question to `POST /chat/{github}/{leetcode}` for AI response.

## 5. Repository Structure

```text
backend/
  database.py
  main.py
  requirements.txt
  models/
    candidate_model.py
  services/
    feature_engine.py
    github_service.py
    leetcode_service.py
    llm_service.py
    recommender.py
    scoring_engine.py

frontend/
  package.json
  vite.config.js
  src/
    App.jsx
    pages/
      Landing.jsx
      Dashboard.jsx
      Chat.jsx
    components/
      ScoreCard.jsx
```

## 6. Local Setup

Prerequisites:
1. Python 3.10+ recommended
2. Node.js 18+ recommended
3. MongoDB instance (local or cloud)
4. Ollama installed (optional but required for chat feature)

### Backend setup

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Frontend setup

```bash
cd frontend
npm install
```

## 7. Environment Variables

Create `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/devlyzer
```

Notes:
1. `database.py` reads `MONGO_URI` and connects to default database from URI.
2. Chat endpoint calls Ollama at `http://localhost:11434/api/generate`.
3. If Ollama is not running, chat may return `LLM Error`.

## 8. Running the Project

Start backend:

```bash
cd backend
uvicorn main:app --reload
```

Start frontend in another terminal:

```bash
cd frontend
npm run dev
```

Default local URLs:
1. Frontend: `http://localhost:5173`
2. Backend: `http://127.0.0.1:8000`
3. Backend docs: `http://127.0.0.1:8000/docs`

## 9. API Reference

Base URL: `http://127.0.0.1:8000`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/test-db` | Lists MongoDB collections |
| GET | `/github/{username}` | Raw GitHub profile/repo data |
| GET | `/github-features/{username}` | Derived engineering features |
| GET | `/engineering-score/{username}` | Engineering score + features |
| GET | `/leetcode/{username}` | LeetCode extracted metrics |
| GET | `/dsa-score/{username}` | DSA scoring breakdown |
| GET | `/collaboration-score/{username}` | Collaboration scoring breakdown |
| GET | `/consistency-score/{github}/{leetcode}` | Consistency scoring breakdown |
| GET | `/devlens-evaluate/{github}/{leetcode}` | Full evaluation payload |
| GET | `/evaluations/{github}` | Evaluation history by GitHub username |
| POST | `/chat/{github}/{leetcode}` | AI chat response using evaluation context |

### Example: Full evaluation

```bash
curl http://127.0.0.1:8000/devlens-evaluate/octocat/someleetcodeuser
```

### Example: Chat request

```bash
curl -X POST http://127.0.0.1:8000/chat/octocat/someleetcodeuser \
  -H "Content-Type: application/json" \
  -d '{"message":"How can I improve my DSA score?"}'
```

## 10. Scoring Logic Summary

Engineering score weights:
1. Language entropy: 20%
2. Project depth: 20%
3. Popularity score: 20%
4. Activity score: 15%
5. Documentation score: 15%
6. Professional signal: 10%

DSA score weights:
1. Hard ratio score: 30%
2. Volume score: 25%
3. Acceptance score: 20%
4. Ranking score: 25%

Consistency score weights:
1. GitHub activity score: 35%
2. Repo spread score: 25%
3. Submission intensity: 25%
4. Acceptance stability: 15%

Final readiness weights:
1. Engineering: 30%
2. DSA: 30%
3. Consistency: 20%
4. Collaboration: 20%

Category mapping:
1. `>= 85`: Product Company Ready
2. `>= 70`: Interview Ready
3. `>= 55`: Needs Structured Improvement
4. `< 55`: Early Stage

## 11. Data Storage

MongoDB collection: `evaluations`

Stored fields include:
1. `github_username`
2. `leetcode_username`
3. `engineering_score`
4. `dsa_score`
5. `consistency_score`
6. `collaboration_score`
7. `final_score`
8. `category`
9. `recommendations`
10. `created_at`

## 12. Frontend Routes and Flow

Routes:
1. `/` -> Landing page
2. `/dashboard` -> Main analysis dashboard
3. `/chat` -> Chat assistant view

Frontend API calls currently point to:
1. `http://127.0.0.1:8000/devlens-evaluate/{github}/{leetcode}`
2. `http://127.0.0.1:8000/evaluations/{github}`
3. `http://127.0.0.1:8000/chat/{github}/{leetcode}`

## 13. Documentation Workflow (How to Keep Docs Updated)

Use this checklist every time you add a feature.

### Step 1: Update feature summary

In section "Core Features", add one line describing the new capability.

Template:

```md
- <Feature name>: <what it does in one sentence>
```

### Step 2: Update architecture flow

In section "System Architecture", add where this feature fits in request/response flow.

Template:

```md
N. <Service/component> performs <specific responsibility>
```

### Step 3: Update API reference

If backend endpoint changes, update section "API Reference".

Template:

```md
| <METHOD> | `<path>` | <purpose> |
```

Also add one request example if payload is non-trivial.

### Step 4: Update data model section

If MongoDB schema changes, add or modify fields under "Data Storage".

Template:

```md
- `<field_name>`: <type and meaning>
```

### Step 5: Add operational notes

If new environment variables or dependencies are required, update:
1. "Environment Variables"
2. "Local Setup"
3. "Running the Project"

### Step 6: Add a changelog entry (recommended)

Create or maintain a simple `CHANGELOG.md` at root.

Template:

```md
## <version or date>
- Added: <feature>
- Changed: <behavior>
- Fixed: <bug>
```

## 14. Troubleshooting

1. Backend starts but DB errors occur:
- Verify `MONGO_URI` in `backend/.env`.
- Confirm MongoDB is reachable.

2. Frontend cannot fetch backend:
- Confirm backend is running on `127.0.0.1:8000`.
- Check CORS allows frontend origin `http://localhost:5173`.

3. Chat endpoint fails:
- Ensure Ollama is running on `localhost:11434`.
- Ensure model `phi3:mini` exists locally.

4. LeetCode or GitHub data missing:
- Validate usernames.
- Check public profile availability and API rate limits.

## 15. Roadmap Notes

Potential improvements:
1. Move hardcoded frontend API URLs into environment config.
2. Add Pydantic request/response schemas for strict API contracts.
3. Add backend test suite for scoring and endpoint responses.
4. Add authentication and user-level saved sessions.
5. Add CI pipeline and deployment docs.

## 16. License

No license file is currently present. Add a `LICENSE` file (for example MIT) if you plan to publish or share this project.
