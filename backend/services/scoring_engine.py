from datetime import datetime
from services.feature_engine import calculate_activity_score


def calculate_engineering_score(features):
    score = (
        0.20 * features["language_entropy"] +
        0.20 * features["project_depth"] +
        0.20 * features["popularity_score"] +
        0.15 * features["activity_score"] +
        0.15 * features["documentation_score"] +
        0.10 * features["professional_signal"]
    )

    return round(score, 2)
def calculate_hard_ratio(easy, medium, hard):
    total = easy + medium + hard
    if total == 0:
        return 0

    hard_ratio = hard / total

    # normalize assuming 30% hard is elite
    normalized = min(hard_ratio / 0.30, 1)

    return round(normalized * 100, 2)
def calculate_volume_score(total_solved):
    # assume 300 solved is strong benchmark
    normalized = min(total_solved / 300, 1)

    return round(normalized * 100, 2)
def calculate_acceptance_score(rate):
    # 70% considered strong
    normalized = min(rate / 70, 1)

    return round(normalized * 100, 2)
def calculate_ranking_score(ranking):
    if ranking == 0:
        return 0

    # assume 100k is strong
    normalized = min(100000 / ranking, 1)

    return round(normalized * 100, 2)
def calculate_dsa_score(data):
    easy = data["easy"]
    medium = data["medium"]
    hard = data["hard"]
    total_solved = data["total_solved"]
    acceptance = data["acceptance_rate"]
    ranking = data["ranking"]

    hard_score = calculate_hard_ratio(easy, medium, hard)
    volume_score = calculate_volume_score(total_solved)
    acceptance_score = calculate_acceptance_score(acceptance)
    ranking_score = calculate_ranking_score(ranking)

    final_score = (
        0.30 * hard_score +
        0.25 * volume_score +
        0.20 * acceptance_score +
        0.25 * ranking_score
    )

    return {
        "hard_score": hard_score,
        "volume_score": volume_score,
        "acceptance_score": acceptance_score,
        "ranking_score": ranking_score,
        "dsa_score": round(final_score, 2)
    }

def calculate_network_score(followers):
    # 100 followers = strong early-career benchmark
    normalized = min(followers / 100, 1)
    return round(normalized * 100, 2)

def calculate_fork_score(repos):
    if not repos:
        return 0

    total_forks = sum(repo.get("forks_count", 0) for repo in repos)

    normalized = min(total_forks / 50, 1)
    return round(normalized * 100, 2)

def calculate_issue_score(repos):
    if not repos:
        return 0

    total_issues = sum(repo.get("open_issues_count", 0) for repo in repos)

    normalized = min(total_issues / 20, 1)
    return round(normalized * 100, 2)

def calculate_repo_scale_score(repo_count):
    normalized = min(repo_count / 20, 1)
    return round(normalized * 100, 2)

def calculate_collaboration_score(raw_github_data):
    repos = raw_github_data.get("repos", [])
    followers = raw_github_data.get("followers", 0)
    repo_count = raw_github_data.get("public_repos", 0)

    network_score = calculate_network_score(followers)
    fork_score = calculate_fork_score(repos)
    issue_score = calculate_issue_score(repos)
    repo_scale_score = calculate_repo_scale_score(repo_count)

    final_score = (
        0.30 * network_score +
        0.25 * fork_score +
        0.20 * issue_score +
        0.25 * repo_scale_score
    )

    return {
        "network_score": network_score,
        "fork_score": fork_score,
        "issue_score": issue_score,
        "repo_scale_score": repo_scale_score,
        "collaboration_score": round(final_score, 2)
    }

def calculate_repo_spread_score(repos):
    if not repos:
        return 0

    creation_months = set()

    for repo in repos:
        created_at = repo.get("created_at")
        if created_at:
            dt = datetime.strptime(created_at, "%Y-%m-%dT%H:%M:%SZ")
            creation_months.add((dt.year, dt.month))

    # more spread across months = better
    spread = len(creation_months)

    normalized = min(spread / 12, 1)

    return round(normalized * 100, 2)

def calculate_submission_intensity(total_solved, acceptance_rate):
    if total_solved == 0:
        return 0

    # derive approximate total submissions
    # acceptance_rate = solved / submissions
    if acceptance_rate == 0:
        return 0

    total_submissions = total_solved / (acceptance_rate / 100)

    intensity_ratio = total_submissions / total_solved

    # ideal range around 1.5 to 3 (not too low, not spammy)
    normalized = min(intensity_ratio / 3, 1)

    return round(normalized * 100, 2)

def calculate_consistency_score(github_raw, leetcode_data):
    repos = github_raw.get("repos", [])

    activity_score = calculate_activity_score(repos)
    repo_spread_score = calculate_repo_spread_score(repos)

    total_solved = leetcode_data["total_solved"]
    acceptance_rate = leetcode_data["acceptance_rate"]

    submission_intensity = calculate_submission_intensity(
        total_solved,
        acceptance_rate
    )

    acceptance_stability = min(acceptance_rate / 70, 1) * 100

    final_score = (
        0.35 * activity_score +
        0.25 * repo_spread_score +
        0.25 * submission_intensity +
        0.15 * acceptance_stability
    )

    return {
        "activity_score": activity_score,
        "repo_spread_score": repo_spread_score,
        "submission_intensity": submission_intensity,
        "acceptance_stability": round(acceptance_stability, 2),
        "consistency_score": round(final_score, 2)
    }

def calculate_final_readiness(engineering, dsa, consistency, collaboration):
    final_score = (
        0.30 * engineering +
        0.30 * dsa +
        0.20 * consistency +
        0.20 * collaboration
    )

    # Category mapping
    if final_score >= 85:
        category = "Product Company Ready"
    elif final_score >= 70:
        category = "Interview Ready"
    elif final_score >= 55:
        category = "Needs Structured Improvement"
    else:
        category = "Early Stage"

    return {
        "final_score": round(final_score, 2),
        "category": category
    }
