---
schedule: "0 */4 * * *"
enabled: true
runAs: creator
---

# Competitor Sweep

Run a full competitive intelligence sweep.

1. Call the check-all-competitors action to scan all watched URLs
2. For any new signals with severity "high", post a brief alert to agent chat
3. Log a summary of what was checked and what changed
