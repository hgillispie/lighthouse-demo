---
name: add-competitor
description: >-
  How to add a new competitor to Lighthouse. Use when the user wants to track
  a new company, or when they mention a competitor by name.
---

# Add Competitor

## Flow

1. Ask the user for the competitor name and any URLs they have (website, pricing page, GitHub repo, hiring page).
2. If the user only provides a name, use web search to find the company's website, pricing page, GitHub repo, and careers page.
3. Call the action:
   ```
   add-competitor --name "Acme" --website "https://acme.com" --pricing "https://acme.com/pricing" --github "acme/acme-repo" --hiring "https://acme.com/careers"
   ```
4. Navigate to the competitor page: `navigate --view competitor --competitorSlug acme`
5. Tell the user the competitor was added and that the first sweep will check all URLs during the next recurring sweep (every 4 hours) or they can click "Run Sweep" on the dashboard.

## URL inference

- `--website` → creates a `webpage` watch config
- `--pricing` → creates a `pricing` watch config
- `--github` → creates a `github_releases` watch config (provide as `org/repo` format)
- `--hiring` → creates a `hiring` watch config

## Tips

- You can add a competitor with just a name and no URLs. The user can add watch configs later.
- GitHub repos should be in `org/repo` format, not full URLs.
- The slug is auto-generated from the name (lowercase, hyphens).
