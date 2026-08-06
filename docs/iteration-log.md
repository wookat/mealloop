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

## Round 17 — 2026-08-06

**Findings (by driver):**
- ④ competitor / ② UX (P2): Plan to Eat supports per-item notes ("get the big pack"); MealLoop had none — the most-requested small convenience for shared shopping.
- ① QA / ② UX (P2): "Clear checked" irreversibly deleted items with no confirmation, unlike every other destructive action.
- ① QA (P3): "Copy list" only stripped the first sub-span, so a second sub-line would have leaked into the clipboard.

**Fixes shipped:**
- Per-item notes: ✎ toggle on each list row opens a popup form (`POST /app/list/note`, ≤140 chars, empty save clears); notes render as an amber "✎ …" sub-line, read-only on the share page, synced via version polling. Migration `0008_item_notes.sql`.
- `data-confirm` on Clear checked; Copy list now strips all sub-spans (sources + notes).

**Evidence:** live verification (`test-report-iter17.md` + recording): note add/edit/clear, share-page read-only display + ~10s poll sync, confirm cancel/OK paths, clipboard clean of notes/sources, console clean, 375/375 with popup open, full cleanup.

## Round 18 — 2026-08-06

**Findings (by driver):**
- ④ competitor / ② UX (P2): Samsung Food and Plan to Eat both offer a cooking view; MealLoop's recipe steps were small text with nothing keeping the phone screen awake at the stove.

**Fixes shipped:**
- Cook mode on recipe detail (app + anonymous share view): button next to the Steps heading (only when steps exist) enlarges steps/ingredients, makes steps tap-to-mark-done (client-only), and holds a Screen Wake Lock while active (re-acquired on tab return; failures silently ignored).

**Evidence:** live verification (`test-report-iter18.md` + recording): toggle/mark-done/inert-outside-mode on app and share pages, stepless recipe shows no button, console clean, 375/375 in cook mode, recipe-detail regression (favorite/tags/plan CTA) passed, fixtures cleaned.

## Round 19 — 2026-08-06

**Findings (by driver):**
- ⑤ data / growth (P2): traffic remains internal QA; the two newest features (fill-week rotation, cook mode) had no matching pSEO content, and both map to real search intents ("dinner rotation", "keep phone screen on while cooking").

**Fixes shipped:**
- 2 new guides: `dinner-rotation-two-weeks` and `cook-from-your-phone-without-screen-lock`; auto-included in `/guides` and sitemap (14→16 locs); IndexNow submitted (200).

**Evidence:** live verification (`test-report-iter19.md` + recording): both pages styled correctly (no raw HTML), listed on /guides, canonical/og:url/description correct via curl, console clean, 375/375.

## Round 20 — 2026-08-06

**Findings (by driver):**
- ② UX / ④ competitor (P2): family members on the share link could only check items off — the classic "we're also out of milk" moment forced a text message to the owner. Competitors solve this with per-member accounts; MealLoop's no-signup model should solve it on the link itself.

**Fixes shipped:**
- Anonymous add on the share page: the same Add item form (COMMON_ITEMS suggestions) now renders on `/s/<token>` and POSTs to `/s/<token>/add` (≤200 chars, auto-categorized, version bump for sync; silently ignored past a 500-item household cap). Share page stays otherwise read-only (no clear/units/note/category controls).

**Evidence:** live verification (`test-report-iter20.md` + recording): anonymous add categorized correctly and synced to an already-open owner tab without reload, owner add regression, read-only controls intact, console clean, 375/375, cleanup done. 500-item cap verified in code only (not exercised against production).

## Round 21 — 2026-08-06

**Findings (by driver):**
- ④ competitor (P1 backlog item): multiple store lists is Plan to Eat's headline capability MealLoop lacked entirely.
- ① QA (found during this round's testing, fixed same round): the third row control pushed /app/list to 380px at a 375px viewport; store/category changes dropped the active store filter.

**Fixes shipped:**
- Multiple stores (lean model): `households.stores` (≤10 names) + `shopping_items.store` (default "Any store"), migration `0009_stores.sql`. Per-row store select with "New store…" prompt (`POST /app/list/store`; new names auto-registered). With ≥1 store, pill tabs (All stores + each store) filter the list on `/app/list` and the share page; filtered tabs show that store's items plus unassigned ones.
- Same-round fixes: shrunk row selects (375/375 restored) and hidden `back` input so store/category changes preserve the active `?store=` filter.

**Evidence:** live verification (`test-report-iter21.md` incl. 21b addendum + recording): store creation/tabs/filtering/Any-store reassignment/share-page tabs/regressions passed; both 21b fixes re-verified (375/375; filter preserved). Known limitation: no store-removal UI yet (store names persist) — queued for a future round.

## Round 22 — 2026-08-06

**Findings (by driver):**
- ② UX / ① QA (P1, Round 21's known limitation): no way to remove a registered store — test/typo names persisted forever and cluttered the tab row.
- ① QA (found during this round's testing, fixed same round): the Edit stores popup (`left-0 w-56`) overflowed a 375px viewport to 425px when open.

**Fixes shipped:**
- Store removal: an "Edit stores…" `<details>` toggle at the end of the pill row (app only, never on the share page) lists each store with a ✕ button; `POST /app/stores/delete` (native confirm via data-confirm) drops the name from `households.stores`, resets matching `shopping_items.store` to '' (items go back to "Any store"), and bumps the sync version. Removing the last store hides the whole tab row.
- Same-round fix: popup anchored `right-0` instead of `left-0` (375/375 restored with the popup open).

**Evidence:** live verification (`test-report-iter22.md` incl. 22b addendum + recording): cancel path preserved the store; removing Costco removed its tab, kept the assigned item, and reset its select to "Any store"; removing the last store (Aldi) hid the tab row; share page shows no edit UI; 22b re-verified 375/375 with popup open (was 425/375); console clean; production restored to zero stores.

## Round 23 — 2026-08-06

**Findings (by driver):**
- ② UX / ④ competitor (P1): rescheduling a planned meal required delete + re-add (re-picking recipe and scale). Plan to Eat solves this with drag-and-drop; MealLoop had no reschedule path at all.
- ① QA (found during this round's testing, fixed same round, 2 passes): (23b) the new controls made the ✕ overflow the day card on wide desktop — clicks landed on the adjacent card (elementFromPoint proof); (23c) the 23b fix squeezed labels to one char per line in xl 7-col cards.

**Fixes shipped:**
- Move planned entries: each planner entry row gets a compact "Move…" select (other 6 days of the visible week, autosubmit) → `POST /app/plan/move` updates the entry's date (scale/meal preserved), bumps sync version, redirect keeps `?week=`.
- Same-round layout fixes: entry row `flex flex-wrap`, label `min-w-[4rem] break-words`, controls `shrink-0` — controls wrap to a second line on narrow cards; ✕ verified clickable at all widths.

**Evidence:** live verification (`test-report-iter23.md` incl. 23b/23c addenda + recording): recipe (scale ×2 preserved) and note entries moved across days on a non-current week with `?week=` preserved; ✕ elementFromPoint returns the button at 1600px 7-col; labels horizontal; 375/375; console clean; fixtures cleaned (week 2026-12-14 empty).

## Round 24 — 2026-08-06

**Findings (by driver):**
- ③ visual/a11y (P2): DevTools Issues panel flagged missing `autocomplete` attributes on form fields since early rounds; the login code input also missed the OS-level one-time-code autofill affordance.

**Fixes shipped:**
- `autocomplete="email"` on the landing subscribe and /login email inputs; `autocomplete="one-time-code"` on the 6-digit code input (enables OS code autofill on mobile); `autocomplete="off"` on the staples add input (matching the list add form).

**Evidence:** live verification (`test-report-iter24.md` + recording): all four attributes present in production DOM; Issues panel now "No issues detected" on / and /login (hint gone); full magic-code login and staple add/remove regressions passed; 375/375 on /login; console clean; fixtures cleaned.

## Round 25 — 2026-08-06

**Findings (by driver):**
- ④ competitor / ② UX (P1): the landing page has promised "leftovers tracking" since launch and Plan to Eat schedules leftovers natively; MealLoop's only path was manually typing a note the next day.
- ③ visual/a11y (found during this round's testing, fixed same round): the Issues panel autocomplete hint survived Round 24 on the planner — the state-dependent "Save this week as menu…" input (renders only on weeks with entries) had no autocomplete attribute.

**Fixes shipped:**
- Leftovers quick-add: recipe entries' Move… select gains a final "+ Leftovers next day" option → `POST /app/plan/move` inserts a note entry "Leftovers: <recipe title>" on the next day, same meal (original entry unchanged; note entries don't get the option).
- Same-round fix (25b): `autocomplete="off"` on the Save-menu and day-card note inputs — every user-facing input now carries an explicit autocomplete attribute.

**Evidence:** live verification (`test-report-iter25.md` incl. 25b addendum + recording): leftovers note created next day/same meal with original untouched; leftovers option absent on note entries; Sunday leftovers land on next week's Monday; normal moves regression passed; 375/375; console clean; Issues panel "No issues detected" on an entry-bearing week after 25b; fixtures cleaned (weeks 2026-12-14/21 empty).

## Round 26 — 2026-08-06

**Findings (by driver):**
- ② UX / ① QA (P1, long-standing gap): imported recipes with bad source data (e.g. BBC's "2 olive oil" JSON-LD) could not be corrected — the only options were living with the error or deleting and re-typing the whole recipe manually.

**Fixes shipped:**
- Recipe editing: owner recipe detail gains an "Edit recipe" link → `GET/POST /app/recipes/:id/edit` with a pre-filled form (title input; ingredients and steps as one-per-line textareas with adaptive rows). POST trims lines, filters blanks, updates title/ingredients/steps, bumps sync version; empty title redirects back; Cancel discards.

**Evidence:** live verification (`test-report-iter26.md` + recording): fixture with "2 olive oil" corrected to "2 tbsp olive oil" plus title change and appended step, all reflected on detail; Cancel discards; empty title blocked client-side and (forced) server-side; share view has zero edit/delete controls; display-unit conversion still applies to edited ingredients; 375/375; console + Issues clean; fixtures deleted.

## Round 27 — 2026-08-06

**Findings (by driver):**
- ① QA / ② UX (P2, same class as the Round 21b filter-drop): several grocery-list mutations still dropped the active context on redirect — add/note/toggle-fallback lost `?store=` on /app/list, and the share page lost both `?week=` and `?store=` on anonymous add and on store tab clicks.

**Fixes shipped:**
- `listBody` gains `extraQuery` (share page passes `week=<date>`) and computes a single validated `back` URL; hidden `back` inputs added to the add, toggle (non-JS fallback), and note forms; store tab links preserve the week param. Routes `/app/list/add|toggle|note` and `/s/:token/add|toggle` redirect only to prefix-validated back values (open-redirect safe).

**Evidence:** live verification (`test-report-iter27.md` + recording): add/note on a filtered tab keep `?store=`; share tabs and anonymous add keep `week=` + `store=`; tampered back values (external URL, cross-page path) fall back to the plain page; JS toggle sync regression passed; 375/375; console + Issues clean; cleanup to zero stores.
