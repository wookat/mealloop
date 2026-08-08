# R136b re-check: planner week-nav wrap at 375px (prod, commit 1132d97)

Code ref: src/index.js:551 week-nav toolbar div now `flex flex-wrap items-center gap-2` (diff 1132d97). Prior failure: standing /app at 375px measured scrollWidth 422/375 (culprit: this toolbar).

## T1 (standing household /app, DevTools device mode 375px, fresh reload)
1. In the incognito-safe DevTools console of the SAME emulated tab, run `document.documentElement.scrollWidth + '/' + document.documentElement.clientWidth`. PASS iff result is "375/375" (≤375). FAIL if >375 (e.g. 422/375 as before).
2. Screenshot showing wrapped toolbar (Print/Prev/Today/Next/Month/Snacks on multiple rows) + console result. Do NOT click "✨ Plan my week with AI". No mutations.
