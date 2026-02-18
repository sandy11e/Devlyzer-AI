import math
from collections import Counter

def calculate_language_entropy(repos):
    languages = [repo.get("language") for repo in repos if repo.get("language")]
    
    if not languages:
        return 0

    total = len(languages)
    counts = Counter(languages)

    entropy = 0
    for lang, count in counts.items():
        p = count / total
        entropy -= p * math.log2(p)

    # Normalize entropy (max possible = log2(unique_languages))
    max_entropy = math.log2(len(counts)) if len(counts) > 1 else 1
    normalized_entropy = entropy / max_entropy if max_entropy != 0 else 0

    return round(normalized_entropy * 100, 2)


def calculate_project_depth(repos):
    sizes = [repo.get("size", 0) for repo in repos]

    if not sizes:
        return 0

    avg_size = sum(sizes) / len(sizes)

    # Normalize with simple scaling
    normalized = min(avg_size / 5000, 1)  # adjust later

    return round(normalized * 100, 2)


def calculate_documentation_score(repos):
    score = 0
    for repo in repos:
        if repo.get("description"):
            score += 1

    if not repos:
        return 0

    return round((score / len(repos)) * 100, 2)

def calculate_popularity_score(repos):
    if not repos:
        return 0

    total_stars = sum(repo.get("stargazers_count", 0) for repo in repos)
    total_forks = sum(repo.get("forks_count", 0) for repo in repos)

    raw_score = total_stars * 2 + total_forks

    # Simple normalization
    normalized = min(raw_score / 50, 1)

    return round(normalized * 100, 2)

from datetime import datetime

def calculate_activity_score(repos):
    if not repos:
        return 0

    recent_count = 0
    now = datetime.utcnow()

    for repo in repos:
        pushed_at = repo.get("pushed_at")
        if pushed_at:
            pushed_date = datetime.strptime(pushed_at, "%Y-%m-%dT%H:%M:%SZ")
            days_diff = (now - pushed_date).days

            if days_diff < 30:
                recent_count += 1

    return round((recent_count / len(repos)) * 100, 2)

def calculate_professional_signal(repos):
    if not repos:
        return 0

    count = 0
    for repo in repos:
        if repo.get("has_pages") or repo.get("has_wiki"):
            count += 1

    return round((count / len(repos)) * 100, 2)


def extract_engineering_features(raw_data):
    repos = raw_data.get("repos", [])

    return {
        "language_entropy": calculate_language_entropy(repos),
        "project_depth": calculate_project_depth(repos),
        "documentation_score": calculate_documentation_score(repos),
        "popularity_score": calculate_popularity_score(repos),
        "activity_score": calculate_activity_score(repos),
        "professional_signal": calculate_professional_signal(repos),
    }

