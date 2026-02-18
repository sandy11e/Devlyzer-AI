import requests

LEETCODE_URL = "https://leetcode.com/graphql"

def get_leetcode_profile(username: str):
    query = """
    query getUserProfile($username: String!) {
        matchedUser(username: $username) {
            username
            profile {
                ranking
            }
            submitStats {
                acSubmissionNum {
                    difficulty
                    count
                }
                totalSubmissionNum {
                    difficulty
                    count
                }
            }
        }
    }
    """

    variables = {"username": username}

    response = requests.post(
        LEETCODE_URL,
        json={"query": query, "variables": variables}
    )

    if response.status_code != 200:
        return None

    return response.json()

def extract_leetcode_features(username: str):
    data = get_leetcode_profile(username)

    if not data or not data.get("data") or not data["data"]["matchedUser"]:
        return None

    user = data["data"]["matchedUser"]

    ac_stats = user["submitStats"]["acSubmissionNum"]
    total_stats = user["submitStats"]["totalSubmissionNum"]

    difficulty_map = {item["difficulty"]: item["count"] for item in ac_stats}
    total_map = {item["difficulty"]: item["count"] for item in total_stats}

    easy = difficulty_map.get("Easy", 0)
    medium = difficulty_map.get("Medium", 0)
    hard = difficulty_map.get("Hard", 0)

    total_solved = easy + medium + hard

    total_submissions = sum(total_map.values())
    total_accepted = total_solved

    acceptance_rate = (
        (total_accepted / total_submissions) * 100
        if total_submissions > 0 else 0
    )

    ranking = user["profile"].get("ranking", 0)

    return {
        "easy": easy,
        "medium": medium,
        "hard": hard,
        "total_solved": total_solved,
        "acceptance_rate": round(acceptance_rate, 2),
        "ranking": ranking
    }
