---
schedule: "0 7 * * 1-5"
enabled: true
runAs: creator
---

# Morning Competitive Briefing

Generate the daily competitive intelligence briefing for weekday mornings.

1. Call generate-briefing --hours 24
2. If 3 or more unread signals exist, surface the most important one in agent chat
3. Mark yesterday's signals as read
