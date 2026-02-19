def generate_recommendations(evaluation: dict):
    """Generate intelligent rule-based recommendations from evaluation data.

    Returns a list of recommendations: {id, title, text, severity, impact, actionable_steps}
    """
    recs = []

    eng = evaluation.get("engineering_features", {})
    dsa = evaluation.get("dsa_features", {})
    consistency = evaluation.get("consistency_features", {})
    collab = evaluation.get("collaboration_features", {})
    repos = evaluation.get("repositories", [])

    def add(id, title, text, severity="info", impact=5, steps=None):
        recs.append({
            "id": id,
            "title": title,
            "text": text,
            "severity": severity,
            "impact": impact,
            "steps": steps or []
        })

    # ========== ENGINEERING SIGNALS ==========
    if eng:
        doc_score = eng.get("documentation_score", 100)
        if doc_score < 50:
            add(
                "doc-readme",
                "Comprehensive Documentation Gap",
                "Only {:.0f}% of repositories have descriptions. Strong documentation signals maturity and intent to reviewers.".format(doc_score),
                severity="high",
                impact=9,
                steps=[
                    "Add detailed README.md to your 3 most-starred repos with: project overview, installation, usage, API reference",
                    "Include code examples and badges (build status, test coverage, license)",
                    "Add CONTRIBUTING.md and CODE_OF_CONDUCT.md to flagship projects",
                    "Document architecture with diagrams (use Mermaid or similar)"
                ]
            )
        elif doc_score < 75:
            add(
                "doc-improve",
                "Enhance Documentation Quality",
                "While most repos have descriptions, deepening documentation signals professional project management.",
                severity="medium",
                impact=6,
                steps=[
                    "Convert basic descriptions into structured README sections",
                    "Add usage examples with code blocks and expected output",
                    "Include troubleshooting and FAQ sections"
                ]
            )

        depth = eng.get("project_depth", 100)
        if depth < 40:
            add(
                "deep-repo",
                "Demonstrate Project Depth",
                "Average repository size ({:.0f}) suggests modular but not deeply architected projects.".format(depth),
                severity="high",
                impact=8,
                steps=[
                    "Select one repo and add: multiple modules, utility packages, and clear separation of concerns",
                    "Implement comprehensive test suite (unit + integration) with >70% coverage",
                    "Add configuration management, logging, and error handling patterns",
                    "Document the architecture with a dedicated docs/ folder"
                ]
            )

        entropy = eng.get("language_entropy", 100)
        if entropy > 60:
            add(
                "focus-languages",
                "Consolidate Technical Depth",
                "High language diversity ({:.0f}) across repos may signal scattered focus. Employers value depth in 2-3 primary languages.".format(entropy),
                severity="medium",
                impact=7,
                steps=[
                    "Identify your top 2-3 languages by preference and industry demand",
                    "Concentrate 70%+ of new work in these languages",
                    "Refactor existing projects in secondary languages into primaries where feasible",
                    "Build 1-2 flagship projects showcasing deep expertise in each primary language"
                ]
            )

        activity = eng.get("activity_score", 100)
        if activity < 40:
            add(
                "recent-activity",
                "Demonstrate Ongoing Maintenance",
                "Recent activity score ({:.0f}) indicates inactive repositories. Current work signals engagement.".format(activity),
                severity="high",
                impact=8,
                steps=[
                    "Make 2-3 meaningful commits per week across active projects",
                    "Open pull requests to popular open-source projects monthly",
                    "Keep dependencies updated and address security vulnerabilities",
                    "Tag releases and announce updates in project changelogs"
                ]
            )

        pop = eng.get("popularity_score", 0)
        if pop < 30:
            add(
                "build-audience",
                "Grow Project Visibility",
                "Moderate popularity score ({:.0f}). Showcase work through talks, blogs, and community engagement.".format(pop),
                severity="info",
                impact=5,
                steps=[
                    "Write 2-3 technical blog posts explaining your projects",
                    "Share on social media (Twitter, LinkedIn, Dev.to) with clear value props",
                    "Contribute to trending discussions in your tech community",
                    "Create short demo videos showing key features"
                ]
            )

    # ========== DSA SIGNALS ==========
    if dsa:
        hard = dsa.get("hard_score", 100)
        if hard < 40:
            add(
                "practice-hard",
                "Master Advanced Problem Solving",
                "Hard problem ratio ({:.0f}%) is below competitive benchmark (50%+). This demonstrates advanced algorithm mastery.".format(hard),
                severity="high",
                impact=10,
                steps=[
                    "Solve 3-4 hard problems weekly, focusing on: dynamic programming, graphs, and tree algorithms",
                    "After solving, write a 100-word explanation of the approach and trade-offs",
                    "Track patterns: binary search, two-pointer, sliding window, etc.",
                    "Join weekly coding contests to apply strategies under pressure"
                ]
            )

        volume = dsa.get("volume_score", 100)
        if volume < 50:
            add(
                "increase-volume",
                "Build Consistency Through Daily Practice",
                "Current volume ({:.0f}) indicates sporadic practice. Daily habit compounds problem-solving intuition.".format(volume),
                severity="high",
                impact=7,
                steps=[
                    "Commit to 30 minutes of LeetCode daily (even weekends)",
                    "Alternate: 2 days hard, 3 days medium, 2 days easy for balanced growth",
                    "Aim for +5-7 solved problems per week initially, then +3-4 as difficulty increases",
                    "Track streaks; consistency matters more than volume long-term"
                ]
            )

        accept = dsa.get("acceptance_score", 100)
        if accept < 65:
            add(
                "quality-over-speed",
                "Improve First-Pass Acceptance Rate",
                "Acceptance rate ({:.0f}%) suggests rushing solutions. Verification = quality signal.".format(accept),
                severity="medium",
                impact=6,
                steps=[
                    "Before submitting: manually trace through 2-3 custom test cases",
                    "Identify edge cases: empty inputs, single elements, duplicates, large numbers",
                    "Use debug print statements in your local environment before submitting",
                    "Review similar problems to refine your approach before coding"
                ]
            )

    # ========== CONSISTENCY SIGNALS ==========
    if consistency:
        con_activity = consistency.get("activity_score", 100)
        if con_activity < 40:
            add(
                "steady-cadence",
                "Establish Predictable Contribution Cadence",
                "Contribution rhythm ({:.0f}%) shows bursts rather than steady growth. Consistency compounds perception.".format(con_activity),
                severity="medium",
                impact=6,
                steps=[
                    "Plan weekly: 3-4 GitHub commits + 3-4 LeetCode solves = consistent signal",
                    "Use calendar blocking for these activities (same time/day builds habit)",
                    "Distribute work evenly across months; avoid 'quiet seasons'",
                    "Monthly retrospective: did you hit your targets? Adjust next month"
                ]
            )

    # ========== COLLABORATION SIGNALS ==========
    if collab:
        network = collab.get("network_score", 100)
        if network < 40:
            add(
                "expand-network",
                "Amplify Collaboration Impact",
                "Collaboration score ({:.0f}%) shows limited public engagement. Open-source contribution amplifies reach.".format(network),
                severity="medium",
                impact=6,
                steps=[
                    "Contribute 1 PR/issue to open-source projects monthly (start with 'good first issue')",
                    "Engage meaningfully: add tests, documentation, or fixes—not just typos",
                    "Follow and collaborate with 5-10 developers in your field",
                    "Host or co-host a technical discussion, discussion section, or AMA on platforms like Twitter/LinkedIn"
                ]
            )

    # ========== SPECIAL: SHOWCASE REPOSITORIES ==========
    if repos:
        starred_repos = sorted(repos, key=lambda r: r.get("stars", 0), reverse=True)[:3]
        if starred_repos and any(r.get("stars", 0) > 0 for r in starred_repos):
            add(
                "showcase-flagships",
                "Featured Repositories",
                "Your top projects communicate your best work. Ensure they are polished and highlighted.",
                severity="info",
                impact=5,
                steps=[
                    "Ensure top 3 repos have: complete README, live demo link, and clear use case",
                    "Pin your top 3 repos on your GitHub profile",
                    "Add topics/tags to improve discoverability on GitHub search",
                    "Link to these repos in your resume, portfolio, and LinkedIn profile"
                ]
            )

    # Sort by impact desc, then by severity
    severity_map = {"high": 3, "medium": 2, "info": 1}
    recs.sort(
        key=lambda r: (r.get("impact", 0), severity_map.get(r.get("severity"), 0)),
        reverse=True
    )
    return recs
