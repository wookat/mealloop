# R132–133 AI week menu + Pantry (prod, branch devin/1786183076-ai-pantry, commit 2d5ae4e)

Code refs: AI button src/index.js:566-569 (shows when any dinner slot empty; data-busy-label "Drafting your week…"), POST /app/ai/generate :843-863 (KV draft 1h TTL, failure → /app?ai=err), draft page GET /app/ai :872-915 (badges: emerald "From your recipe box" / amber "New recipe — will be added to your box" with ingredients details; occupied days dimmed "Already planned — kept as-is"; ↻ Swap), apply :937-971 (inserts dinners only into unoccupied days; new recipes saved tagged ai-suggested), discard :931-935. Pantry /app/pantry :2104-2141 (add multi via splitListInput, level select data-autosubmit, Used up on stocked rows, delete, "Add N low/out items to grocery list"), stocked-skip in /app/plan/to-list :1117-1140 (skipped count → notice "Skipped N items you already have in the pantry.") and /app/list/staples :1839-1866; Pantry link in list header :2101. GDPR delete wipes pantry_items :2325. busy-label helper public/app.js:59-66.

Setup done: disposable household qa132ai41725@emalupe.com logged in (incognito), one manual recipe "A Chickpea Curry" (ingredients incl. "300g basmati rice", "1 red onion"); POST /ops/migrate no-auth → 404 already verified via curl. Standing household NOT touched by any of this.

## T1 Pantry stocked-skip (adversarial; disposable account, recorded)
1. Setup step: plan "A Chickpea Curry" into Mon Aug 3 dinner (via /app?recipe=… "+ add").
2. /app/list → click "Pantry" button (must exist in header). On /app/pantry add "basmati rice, pesto" (comma multi-add → 2 rows, both level Stocked).
3. Back to /app → "Add week's ingredients to grocery list". PASS iff list notice contains "Skipped 1 item you already have in the pantry.", added count = 4 (5 ingredients − 1 stocked), and NO "basmati rice" row on the list while "1 red onion" etc. are present.
4. Pantry row controls: change pesto level select to "Out" (autosubmits, row goes line-through); "Used up" on basmati rice → out; button "Add 2 low/out items to grocery list" → /app/pantry notice "Added N item(s) to the grocery list" (basmati rice now dedupe-aware: it is NOT yet on list → added; pesto added). Delete pesto row via ✕.

## T2 AI week draft (disposable account, recorded)
1. /app → click "✨ Plan my week with AI". Button label swaps to "Drafting your week…" (screenshot while pending if possible). Wait ≤60s.
2. Lands on /app/ai: 7 day cards; Mon (occupied by curry) dimmed "Already planned — kept as-is."; other cards have either emerald "From your recipe box" (only possible pick: A Chickpea Curry) or amber "New recipe — will be added to your box" with expandable "Ingredients (N)" details. If generate fails → /app?ai=err amber notice (retry once; if fails twice, report as failure/env issue).
3. Note Tue's card title, click its ↻ Swap → title changes to a different pick.
4. "Apply to my week" → redirected to /app; PASS iff every day Mon–Sun has a dinner entry, Mon still "A Chickpea Curry" (kept as-is, not duplicated), and /app/recipes now contains the AI-invented recipes with tag #ai-suggested visible.
5. 375px: re-generate is not needed — check /app/pantry and (before applying, i.e. do this at step 2-3) /app/ai scrollWidth 375/375.

## T3 axe + Issues (recorded lightly)
- Run axe-core (injected via console) on /app/pantry and /app/ai (logged-in incognito): PASS iff 0 violations of serious/critical impact (report any others). DevTools Issues panel clean on both.

## T4 Cleanup + regression
1. GDPR-delete disposable account via /app/share ("Delete household") native confirm; verify redirect + share/login invalid.
2. Regression (main profile): standing /app/list exactly "35 to buy", no Checked-off section; standing /app planner unchanged (Wed lasagne ×1, Fruit + yogurt note).
