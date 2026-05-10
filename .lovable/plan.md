## What's happening

Your challenge ("My tip for today!") is saved on the Edexcel Economics trainer project, but the dates are inverted:

- start: **2026-05-10** (today)
- end:   **2026-04-11** (about a month *before* the start)

The chatbot checks `now >= start AND now <= end`. Since today is already past April 11, the challenge is treated as expired, so:
- the profile button never gets the red notification dot
- the daily challenge popup never auto-opens

The data path itself is working — RAGChat does read `active_challenge` from `trainer_projects` for this product. The only problem is the date range you saved.

## Fix (two parts)

### 1. Correct the saved dates
In Build → Edexcel Economics → Challenge section, set the **end date** to a date on or after **2026-05-10** (e.g. `2026-05-11` or however long you want it active for) and re-save. After this the popup + notification dot will fire on the next chat load.

### 2. Add validation in BuildPage so this can't happen again
In `src/pages/BuildPage.tsx`, around the challenge save (line ~757) and the date inputs (line ~2448):

- Before saving, if `challengeEnd < challengeStart`, block the save and show a toast: "Challenge end date must be on or after the start date."
- On the end-date `<input type="date">`, set `min={challengeStart}` so the picker prevents picking earlier dates.
- In the green confirmation banner (line ~2463), if dates are invalid, replace with a red warning instead of "will be active from … to …".

No schema, no RAGChat changes needed — purely a Build-side guard plus a one-off data correction.

## Want me to also…

I can optionally make RAGChat more forgiving — e.g. if `end < start`, treat it as "active from start indefinitely" or "single-day on start". Let me know if you want that fallback added, otherwise I'll just do the validation above.
