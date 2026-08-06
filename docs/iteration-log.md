# Iteration log — continuous improvement loop (100-round mode)

Each round: five drivers (① QA/tests ② UX walkthrough ③ frontend visual/a11y ④ competitor research ⑤ user/data analytics) → P0/P1/P2 triage → fix & deploy → live regression → log here.

## Round 1 — 2026-08-06

**Findings (by driver):**
- ⑤ Data (P1): 12 legacy `analytics_daily` rows still contained raw share tokens (`/s/<token>`) from before the round-2 redaction fix — privacy hygiene gap in stored data (code already redacts).
- ③ Visual/a11y (P2): no skip-to-content link; nav lacked `aria-current`/active state; logged-in users couldn't see which section they were in.
- ③ SEO/growth (P2): no Open Graph / Twitter Card meta on indexable pages — shared links rendered bare.
- ① QA: `npm test` 8/8 green; no regressions found.
- ④ Competitor: no material change since benchmark-round-6 (same day).
- ⑤ Traffic snapshot: PV 353 (nearly all internal QA), intents 0, users 4, households 4. First organic-looking day-2 hits on `/` (10 views 2026-08-06).

**Fixes shipped:**
- Purged/aggregated legacy token analytics rows into `/s` in remote D1 (leftover count = 0).
- `src/layout.js`: skip link (`sr-only focus:not-sr-only`), `aria-current="page"` + active nav styling, `og:*` + `twitter:card` meta on indexable pages, `id="main"`.

**Evidence:** curl header/meta checks post-deploy; D1 query shows 0 `/s/%` rows.

## Round 2 — 2026-08-06

**Findings (by driver):**
- ② UX walkthrough (P1): scaling a real *imported* recipe garbled grocery lines — the round-6 pluralizer appended "s" to whole descriptive names ("…finely choppeds") and range quantities mis-scaled ("2-3 sprigs" ×2 → "4 -3 sprigs"). Manual test recipes had hidden this.
- ② UX (P2): import error surfaced raw "HTTP 404" jargon and cleared the pasted URL.
- ③ Visual (P2): "Log out" wrapped mid-word in the 375px header.
- ② UX (P2, deferred): scaled/unscaled duplicate lines coexist (exact-label dedupe); share page always shows current week while list may be for a future week.
- Regression of round 1 (skip link, aria-current, OG meta, console): all passed.

**Fixes shipped:**
- `parseIngredient`: range quantities (`2-3`, `1–2`) now parse as unquantified → never scaled/merged.
- `formatIngredient`: plurality adjustment restricted to names of ≤2 words; long descriptive names pass through untouched.
- Import errors: friendly copy (blocked/no-recipe cases) + pasted URL preserved in the input.
- Header logout button `whitespace-nowrap`.
- Tests extended to 9 (imported-recipe descriptive names + ranges).

**Evidence:** `test-report-iter2.md` + recording; unit tests 9/9; live regression PASSED (clean grocery lines at ×2, range unscaled, friendly import error with URL preserved, 375px header intact, console clean).

## Round 3 — 2026-08-06

**Findings (by driver):**
- ② UX (P2, carried): share page always showed the current week — family members couldn't see a future week the planner had prepared.
- ① QA / ② UX (P2, carried): "Add week's ingredients" deduped by exact label, so changing a recipe's scale between clicks left both "3 cups flour" and "4 cups flour" on the list.
- ⑤ Data: PV growing slowly, all internal traffic; intents still 0 — no data-driven priority shift this round.
- ④ Competitor: Plan to Eat / Samsung Food blogs return 403/empty to plain fetch (not bypassing); deep competitor session rotated to a later round.

**Fixes shipped:**
- Share page `/s/:token?week=YYYY-MM-DD`: prev/next-week navigation + "week of …" heading; token never in analytics (query ignored).
- New `ingredientKey()` normalized dedupe: to-list now updates the existing *unchecked* item's label when quantities change (idempotent at any scale), keeps checked items, and never duplicates scaled/unscaled variants.
- Unit tests 10/10 (new key-matching cases).

**Evidence:** `test-report-iter3.md` + recording; unit tests 10/10; live regression PASSED (week nav incl. invalid-param fallback, in-place label update on rescale with "Added 0", checked item untouched, share sync ~10s, console clean).

## Round 4 — 2026-08-06

**Findings (by driver):**
- ③ Visual/a11y (P2): 16 placeholder-only inputs/selects across login, planner, recipes, list, staples and share pages had no accessible name (screen readers announce nothing).
- ⑤ Data/growth (P2): guides section unchanged since launch — maintenance-period weekly content due; intents still 0.
- ①/② regression of rounds 2–3 passed (previous round); ④ competitor deep-dive still queued (blogs 403 to plain fetch, not bypassing).

**Fixes shipped:**
- `aria-label` added to all 16 placeholder-only form controls (email, code, menu name/select, recipe/scale selects, note, search, import URL, manual-recipe fields, tags, list/staple add, share URL).
- Two new pSEO guides: `/guides/scaling-recipes-for-family-size`, `/guides/weekly-grocery-list-with-staples`; sitemap now 12 URLs.
- IndexNow ping submitted for the 2 new guides + /guides + sitemap (HTTP 200).

**Evidence:** live curl shows new guide titles served; unit tests 10/10; `npm run check` clean.

## Round 5 — 2026-08-06

**Findings (by driver):**
- ④ Competitor (P2): Plan to Eat offers grocery-list print/export; MealLoop had no way to get the list out of the browser (print produced a page cluttered with header/nav/forms; no copy-as-text).
- ② UX (P2): shoppers who prefer paper or pasting the list into a chat had no path.
- ③ Visual: print output unstyled for purpose.

**Fixes shipped:**
- "Copy list" button: copies unchecked items as text grouped by aisle (clipboard, "Copied!" feedback) — works on /app/list and the family share page.
- "Print" button + print stylesheet: header, footer, add-item form, action buttons and category selects hidden in print (`print:hidden`), leaving a clean aisle-grouped checklist.

**Fixes shipped (post-regression):**
- Cloudflare zone RUM (Web Analytics auto-injection) turned OFF via API — the auto-injected beacon.min.js was blocked by our strict CSP and violated the first-party-only analytics stance; live page no longer references beacon.min.js.
- Checked rows hidden in print output; action buttons `whitespace-nowrap` at 375px.

**Evidence:** `test-report-iter4.md` + recording; live regression PASSED (guides + 12-URL sitemap, aria-labels, copy-list content/feedback, clean print preview, share sync, 375px header); RUM setting API response `"value":"off"`.
