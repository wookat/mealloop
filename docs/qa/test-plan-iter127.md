# R127–130 (prod, branch devin/1786179546-r127-batch, commits fa78a96+b3edc9b)

Code refs: /ops/stats src/index.js:2172-2187 (Bearer ADMIN_STATS_KEY; else c.notFound(); JSON {days, paths, search_terms, email_intents}); search ranking src/index.js:1104 (`ORDER BY (title LIKE ?) DESC, favorite DESC, created_at DESC`); new guide src/guides.js:456 slug freezer-meals-for-family-weeknights, added to GUIDE_TOPICS "Meal planning basics" (now 12) src/index.js:352. Key file /home/ubuntu/.mealloop-ops-stats-key (read, works locally). Sitemap already curl-counted: 34 locs.

Standing household READ-ONLY: search only (GET), no mutations. Baseline 35 to buy · 0 checked.

## T1 R127 /ops/stats (curl only, no recording)
- No auth → HTTP 404, HTML body (not JSON).
- `Authorization: Bearer wrongkey` → 404.
- Correct key → 200 JSON containing keys days/paths/search_terms/email_intents; paths array has path+views rows. Redact nothing (aggregates only) but don't paste full dump — first few rows.

## T2 R128 title-first search (standing household, recorded)
Adversarial: term "onion" — "Test Onion Salad" (title match, NOT favourite) vs ★ bolognese + lasagne (onion in ingredients only). Old order (favorite DESC, created_at DESC) would list ★ bolognese first; new order must list Test Onion Salad first.
- /app/recipes → type "onion" in search box → Search. PASS iff first card is "Test Onion Salad" and ingredient-only matches (★ spaghetti bolognese / Easy classic lasagne) appear after it. No data mutated (GET only).

## T3 R129 freezer guide (recorded)
- /guides: "Meal planning basics" chip count 12; card "freezer meals" visible in that section.
- /guides/freezer-meals-for-family-weeknights renders h1 + h2s; at 375px scrollWidth 375/375.
- curl: Article + BreadcrumbList JSON-LD in source; sitemap 34 locs incl. new URL (done: 34).

## T4 R130 CWV spot-check (Lighthouse CLI, shell)
- Run lighthouse on / and the new guide page (mobile defaults). Report LCP + CLS; flag if LCP > 2.5s or CLS > 0.1.

## T5 Regression (recorded)
- Standing /app/list heading exactly "35 to buy", no Checked-off section.
