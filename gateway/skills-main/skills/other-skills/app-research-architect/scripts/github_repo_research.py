#!/usr/bin/env python3
"""Search GitHub repositories and emit a Markdown inspiration table.

Uses GitHub's public REST API. Set GITHUB_TOKEN for higher rate limits.
"""
import argparse
import datetime as dt
import os
import sys
import urllib.parse
import urllib.request
import json


def request(url):
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "app-research-architect"}
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    p = argparse.ArgumentParser(description="Search GitHub repos for app research")
    p.add_argument("query", help="GitHub search query, e.g. 'voice agent stars:>100 pushed:>2025-01-01'")
    p.add_argument("--limit", type=int, default=10)
    p.add_argument("--sort", default="stars", choices=["stars", "updated", "forks", "help-wanted-issues"])
    p.add_argument("--order", default="desc", choices=["asc", "desc"])
    args = p.parse_args()

    q = urllib.parse.quote(args.query)
    url = f"https://api.github.com/search/repositories?q={q}&sort={args.sort}&order={args.order}&per_page={min(args.limit, 50)}"
    try:
        data = request(url)
    except Exception as e:
        print(f"Error querying GitHub: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"# GitHub repo research: `{args.query}`\n")
    print(f"Generated: {dt.datetime.utcnow().isoformat()}Z\n")
    print("| Repo | Stars | Updated | Language | Description | Why inspect |")
    print("| --- | ---: | --- | --- | --- | --- |")
    for repo in data.get("items", []):
        name = repo.get("full_name", "")
        html = repo.get("html_url", "")
        stars = repo.get("stargazers_count", 0)
        updated = repo.get("pushed_at") or repo.get("updated_at", "")
        lang = repo.get("language") or ""
        desc = (repo.get("description") or "").replace("|", "\\|").replace("\n", " ")
        topics = ", ".join(repo.get("topics") or [])
        why = topics or "Study architecture, docs, examples, and UI patterns."
        print(f"| [{name}]({html}) | {stars} | {updated[:10]} | {lang} | {desc} | {why} |")


if __name__ == "__main__":
    main()
