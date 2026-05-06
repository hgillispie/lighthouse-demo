# Skill: Managing Tracked Competitors

## Overview

Competitors are tracked in the `competitors` table. Each competitor can have multiple `watch_configs` that define which URLs to monitor for changes. Signals are generated when those URLs change.

## Data Model

### `competitors` table
| Column | Notes |
|--------|-------|
| `id` | cuid primary key |
| `owner_email` | scoped to user |
| `name` | Display name (e.g. "Acme") |
| `slug` | URL-safe identifier, derived from name (e.g. "acme") |
| `website_url` | Main website |
| `pricing_url` | Pricing page |
| `github_repo` | **`org/repo` format only** (e.g. `acme/acme-app`) — NOT a full URL |
| `hiring_url` | Careers/jobs page |
| `description` | Short description |
| `is_active` | Soft-delete flag — 0 = deleted, 1 = active |

### `watch_configs` table
| Column | Notes |
|--------|-------|
| `watch_type` | One of: `webpage`, `pricing`, `github_releases`, `hiring` |
| `url` | Full URL to scrape. For GitHub: `https://api.github.com/repos/{org}/{repo}/releases` |
| `label` | Human-readable label |
| `is_enabled` | 1 = active, 0 = paused |

## Adding a Competitor

**Always use the `add-competitor` action** — never INSERT directly.

```bash
cd templates/starter && pnpm action add-competitor \
  --name "Acme" \
  --website "https://acme.com" \
  --pricing "https://acme.com/pricing" \
  --github "acme/acme-app" \
  --hiring "https://acme.com/careers"
```

### Critical Rules

1. **Check for duplicates FIRST** — Before calling `add-competitor`, query the DB:
   ```sql
   SELECT id, is_active FROM competitors WHERE slug = slugify(name) AND owner_email = ?
   ```
   The action now does this automatically and returns an error if a duplicate exists.

2. **GitHub format is `org/repo` only** — Never pass a full GitHub URL to `--github`.
   - ✅ `--github "acme/acme-app"`
   - ❌ `--github "https://github.com/acme/acme-app"`
   
   The action strips full URL prefixes automatically, but always pass the short form.

3. **One competitor per company** — If the user asks to add a competitor that already exists, update it instead of creating a new one.

## Updating a Competitor

To add or change URLs on an existing competitor, update the `competitors` table and upsert `watch_configs`:

```sql
-- Update URLs on the competitor record
UPDATE competitors SET website_url = ?, updated_at = ? WHERE id = ?;

-- Add a new watch config
INSERT INTO watch_configs (id, owner_email, competitor_id, watch_type, url, label, is_enabled, created_at)
VALUES (cuid(), ?, ?, ?, ?, ?, 1, ?);
```

## Deleting a Competitor

Use the action (soft-delete):
```bash
cd templates/starter && pnpm action delete-competitor --competitorId <id>
```

This sets `is_active = 0` on the competitor and disables all its watch configs.

## Diagnosing Issues

### Duplicate competitors
```sql
SELECT name, slug, COUNT(*) as count FROM competitors 
WHERE owner_email = ? GROUP BY slug HAVING count > 1;
```
Fix: soft-delete the duplicate with no watch configs, keep the one with watch configs.

### Malformed GitHub watch config URL
The URL in `watch_configs` for `github_releases` type should be:
`https://api.github.com/repos/{org}/{repo}/releases`

Check with:
```sql
SELECT id, url FROM watch_configs WHERE watch_type = 'github_releases';
```

### No signals after a sweep
- Verify watch configs exist and `is_enabled = 1`
- Check that URLs are reachable and correctly formed
- Run `check-competitor` manually and inspect output
