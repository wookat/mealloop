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

## Round 6 — 2026-08-06

**Findings (by driver):**
- ④ Competitor deep-dive (real logged-in session, Samsung Food web app): their shopping list "Add item" input offers instant autocomplete suggestions ("mil" → Milk, Milk 1%, Milk 2%…); MealLoop's add-item was a bare text field. Their other extras (multiple named lists, online cart ordering) noted for backlog.
- ①/②/③/⑤: no new findings beyond rounds 4–5 regression; traffic still internal-only.

**Fixes shipped:**
- Add-item autocomplete on /app/list via native `<datalist>`: household staples first, then ~29 common grocery items; no JS, works with keyboard and mobile.

**Evidence:** Samsung Food screenshots (`ss_c773c378.png`, `ss_1b447bae.png`); live regression PASSED for autocomplete (dropdown, staples-first, add works), print checked-row hiding, RUM/CSP console clean — see `test-report-iter5.md` + recording.

## Round 7 — 2026-08-06

**Findings (by driver):**
- ① QA regression (P2, introduced in round 5): `whitespace-nowrap` action buttons sat in a non-wrapping flex row — at 375px the row overflowed the viewport, adding page-level horizontal scroll ("Clear checked" off-screen, header clipped).
- ① QA (P3): printing a list where an entire category is checked still printed the empty category heading.

**Fixes shipped:**
- `flex-wrap` on the list action-button row (buttons wrap as whole units at 375px, no overflow).
- Sections whose items are all checked get `print:hidden` (no empty headings in print).
- Follow-up (regression run measured scrollWidth 407 vs 375 — pre-existing header nav overflow): header paddings/gaps tightened at small widths (`px-2 sm:px-4` container, `px-2 sm:px-3` nav links, smaller logo) for a truly scroll-free 375px.

**Evidence:** `test-report-iter6.md` + recording (button wrap, print headings, list tidy-up all passed); header fix re-verified live: scrollWidth/clientWidth/scrollX = 375/375/0 (`test-report-iter7.md` + recording), desktop header unaffected.

## Round 8 — 2026-08-06

**Findings (by driver):**
- ② UX / ④ competitor (P2, backlog item "清单条目菜谱归属"): grocery items didn't say which recipe needed them — in the store you can't tell if "2 red chillis" is skippable without opening every recipe (Plan to Eat shows per-item recipe attribution).

**Fixes shipped:**
- Migration 0005: `shopping_items.sources` column; to-list records contributing recipe titles per normalized ingredient key (merged items list all recipes, comma-separated, updated in place on re-add).
- List + share page render a subdued "for <recipe(s)>" subtext under attributed items; Copy list strips the subtext (labels only). Manual adds/staples show no attribution.

**Evidence:** remote D1 migration applied; live regression via testing agent (`test-report-iter8.md` + recording): shared items list all contributing recipes, staples/manual items unattributed, copy output plain, share-page sync intact, 375px scroll-free.

## Round 9 — 2026-08-06

**Findings (by driver):**
- ⑤ data (P2): driver ⑤ mandates search-term analysis but nothing recorded what users search for on /app/recipes — a blind spot for content/pSEO prioritization.
- ① QA (P3, from round 8 test notes): recipe attribution order was merge-insertion order, not deliberate.

**Fixes shipped:**
- Migration 0006: `search_terms(day, term, count)` — first-party, cookie-free aggregate recipe-search-term counts (lowercased, ≤60 chars, no user/household attribution, written via `waitUntil`); privacy policy updated to disclose it.
- Attribution recipe titles now sorted alphabetically (`localeCompare`).

**Evidence:** remote migration applied; live verification (`test-report-iter9.md` + recording): searches "stew"/"STEW "/"onion" produced exactly `{stew: 2, onion: 1}` in D1 with no user data; in-place re-sort to "for Test Soup, Test Stew"; /privacy wording live; console clean, 375/375.

## Round 10 — 2026-08-06

**Findings (by driver):**
- ① QA / ② UX (P2, from round 8 test notes): removing a recipe from the week left stale "for <recipe>" attribution on unchecked items even after re-running "Add week's ingredients".
- ③ visual/compliance (P3): privacy Retention section didn't state a period for the new search terms.

**Fixes shipped:**
- to-list now clears `sources` on unchecked items whose ingredient key is absent from the current generation run (checked items intentionally untouched).
- Retention bullet: "Aggregate page counts and search terms: 24 months".

**Evidence:** live verification (`test-report-iter10.md` + recording): unplanning Test Onion Salad cleared "1 red onion" attribution, shared items updated to remaining recipe only, checked item preserved, re-planning restored alphabetical attribution; /privacy live; console clean, 375/375.

## Round 11 — 2026-08-06

**Findings (by driver):**
- ④ competitor (P2, backlog "公制/英制切换"): Plan to Eat/Samsung Food both offer a unit preference; MealLoop always showed labels as imported — a real friction for mixed-unit households.

**Fixes shipped:**
- Migration 0007: `households.units` ('' as-written / 'metric' / 'imperial'); "Units:" select in the list action row (auto-submit, no-JS fallback), `POST /app/settings/units`.
- Display-only `convertUnits()` — imperial: g→oz (lb ≥454g), ml→fl oz; metric: oz→g, lb→g/kg; cups/tbsp/counts/unparsed labels pass through; stored labels never mutated. Applied on /app/list, recipe detail, and share pages (share follows household setting, no toggle for anonymous viewers).

**Evidence:** remote migration applied; live verification (`test-report-iter11.md` + recording): 1500g→3.31 lb, 8 oz→227g, round-trip back to "as written" restores originals exactly, share page follows setting and live-syncs on change, console clean, 375/375. P3 noted: composite "2 x 400g cans" labels intentionally unconverted.

## Round 12 — 2026-08-06

**Findings (by driver):**
- ⑤ data (P1 growth): analytics remain internal-only (top paths /s 132, /app/list 103, /, /app/recipes; intents 0); guides — the only organic acquisition surface — get single-digit views. More indexable content is the highest-leverage lever.

**Fixes shipped:**
- Two new pSEO guides (total 10): `metric-imperial-recipe-conversion` (rides the Round 11 feature) and `shared-grocery-list-without-an-app` (core differentiator query); auto-included in /guides + sitemap (now 14 URLs).
- IndexNow submitted for both guides + /guides + sitemap (HTTP 200).

**Evidence:** both live with HTTP 200 on production; sitemap `<loc>` count 12→14; IndexNow 200; rendering verified live (`test-report-iter13.md`).

## Round 13 — 2026-08-06

**Findings (by driver):**
- ① QA (P3 from round 11 testing): composite labels ("2 x 400g cans chopped tomatoes") weren't converted by the units preference — common in imported UK recipes.

**Fixes shipped:**
- `convertUnits` converts the inner amount of composite "N x amount" labels, keeping prefix/trailing text ("2 x 400g cans …" → imperial "2 x 14.11 oz cans …"; "3 x 8 oz packs …" → metric "3 x 227g packs …"); regression tests added (12/12).

**Evidence:** live verification (`test-report-iter13.md` + recording): composite conversion both ways, as-written restores originals exactly, share sync follows units changes, console clean, 375/375; test items cleaned up.

## Round 14 — 2026-08-06

**Findings (by driver):**
- ② UX (P2): "Add to your week plan" on a recipe page dropped users on the bare planner — they had to find the same recipe again in each day's dropdown (two redundant steps for the most common flow).

**Fixes shipped:**
- Recipe page now links to `/app?recipe=<id>`: the planner shows a banner ("<title> is preselected — open '+ add' on a day below and click Add") and preselects that recipe in every day/meal "+ add" select; unknown ids fall back silently.

**Evidence:** live verification (`test-report-iter14.md` + recording): full flow recipe page → banner → preselected select → Add plans the entry; plain /app and `?recipe=bogus` unchanged; week nav, console, 375/375 all clean.

## Round 15 — 2026-08-06

**Findings (by driver):**
- ④ competitor: Plan to Eat blog reviewed (July/June updates) — no major product moves (content/podcast only); their positioning pushes "multiple store lists" (kept on backlog).
- ③ visual / ⑤ data (P2 growth): landing page ("/" = 3rd most-viewed path) had no FAQ or structured data — missed conversion + rich-result opportunity, intents still 0.

**Fixes shipped:**
- 6-question FAQ section on "/" (native `<details>` accordions; free/no-signup/share/import/units/privacy) + FAQPage JSON-LD (inline data block — CSP-safe, verified) + cross-link to /guides.

**Evidence:** live verification (`test-report-iter15.md` + recording): FAQ renders desktop + 375/375, valid JSON-LD with 6 Questions in page source, console clean (no CSP violation), login/planner/list smoke passed.

## Round 16 — 2026-08-06

**Findings (by driver):**
- ② UX / ⑤ data (P2): the landing signup blurb promises "meal rotation" but nothing delivered it; an empty week required picking each dinner by hand — the highest-friction moment of the weekly loop.

**Fixes shipped:**
- "Fill dinners from recipe box" button on empty weeks: `POST /app/plan/fill-week` fills one dinner per day Mon–Sun from up to 100 recipes (favorites first), preferring recipes not planned in the previous two weeks (rotation; falls back to full pool when fresh <4), crypto-shuffled, cycling if fewer than 7; guards against non-empty weeks.

**Evidence:** live verification (`test-report-iter16.md` + 2 recordings): fill/hide/no-duplicate/share-sync/cleanup all passed; rotation branch proven deterministically (Test Soup/Stew planned in prior week were excluded from the fill; with a broken filter each would have appeared); console clean, 375/375.
