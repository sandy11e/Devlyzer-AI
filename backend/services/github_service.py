import requests

GITHUB_API = "https://api.github.com/users/"

def get_github_profile(username: str):
    url = f"{GITHUB_API}{username}"
    response = requests.get(url)

    if response.status_code != 200:
        return None

    return response.json()

def get_user_repos(username: str):
    url = f"{GITHUB_API}{username}/repos?per_page=100"
    response = requests.get(url)

    if response.status_code != 200:
        return []

    return response.json()

def extract_github_raw(username: str):
    profile = get_github_profile(username)
    repos = get_user_repos(username)

    if not profile:
        return None

    return {
        "public_repos": profile.get("public_repos", 0),
        "followers": profile.get("followers", 0),
        "following": profile.get("following", 0),
        "repos": repos
    }
