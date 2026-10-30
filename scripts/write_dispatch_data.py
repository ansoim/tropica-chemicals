"""Validate and save a Power Automate repository_dispatch payload."""
import json
import os
from pathlib import Path

payload = os.environ.get("DASHBOARD_JSON", "")
if not payload:
    raise SystemExit("The dashboardJson payload is missing.")
try:
    feed = json.loads(payload)
except json.JSONDecodeError as exc:
    raise SystemExit(f"The dashboardJson payload is not valid JSON: {exc}") from exc
if not isinstance(feed.get("salespeople"), list) or not feed["salespeople"]:
    raise SystemExit("The feed needs a non-empty salespeople list.")
if not isinstance(feed.get("totals"), dict) or "target" not in feed["totals"]:
    raise SystemExit("The feed needs totals.target.")
for person in feed["salespeople"]:
    if not person.get("name"):
        raise SystemExit("Every salesperson row needs a name.")

Path("data/sales.json").write_text(
    json.dumps(feed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
print(f"Prepared {len(feed['salespeople'])} salesperson rows for the dashboard.")