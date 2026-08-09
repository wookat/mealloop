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

## Round 28 — 2026-08-06

**Findings (by driver):**
- ② UX / ④ competitor (P2): checked items stayed inline within their categories, cluttering long lists mid-shop; competitors (Samsung Food, AnyList pattern) group them at the bottom. ③ visual: item-note popup input lacked an explicit autocomplete attribute.

**Fixes shipped:**
- Checked items now render in one bottom "Checked off (N)" section (stone-50, print:hidden, same row markup so store/note/category controls stay functional); category sections render unchecked items only, so a fully-checked category's header disappears. Server-rendered — works on all devices. Note input gains `autocomplete="off"`.

**Evidence:** live verification (`test-report-iter28.md` + recording): check/uncheck moves rows between sections on the version-poll re-render; controls work on checked rows; share page shows the same grouping; Copy list excludes checked and print hides the section; Clear checked empties it; 375/375; console + Issues clean; fixtures cleaned.

## Round 29 — 2026-08-06

**Findings (by driver):**
- ② UX / ④ competitor (P1): grocery items could only flow from a planned week — cooking a single recipe ad hoc meant retyping its ingredients by hand (both Plan to Eat and Samsung Food support add-to-list from a recipe). ③ visual: tags input lacked an explicit autocomplete attribute. ⑤ data: analytics_daily shows QA-dominated traffic (615/332 PV last two days, guides single digits) — no organic conclusions drawn; competitor blog patrol skipped this round (plantoeat.com/samsungfood.com return 403 to plain fetch; not bypassed).

**Fixes shipped:**
- "Add ingredients to list" button on owner recipe detail → `POST /app/recipes/:id/to-list`: merges the recipe's ingredients, dedupes against existing items by normalized key (new keys inserted with sources=title; existing unchecked items get the title unioned into sources; checked untouched), redirects to `/app/list?added=N&src=recipe` with recipe-specific notice wording. Tags input gains `autocomplete="off"`.

**Evidence:** live verification (`test-report-iter29.md` + recording): 2 of 3 ingredients added (1 deduped into an existing item's sources); second click idempotent ("Everything from that recipe is already on the list."); share recipe view has no button; weekly add wording regression passed; Issues clean; 375/375; fixtures cleaned.

## Round 30 — 2026-08-06

**Findings (by driver):**
- ④ competitor (patrol via public release notes/blogs): Plan to Eat is pushing AI features (nutrition matching, Instagram reel import, ingredient substitutions — out of our v1 scope), plus menu printing/duplication; Samsung Food is pushing AI/health tracking. Web-scope gap we can close cheaply: printing the week plan (fridge-copy use case). ② UX (P2): the planner had no print path — printing /app included nav, buttons, forms and a 7-col layout unfit for paper.

**Fixes shipped:**
- Printable week plan: planner "Print" button (`data-print`, reuses the existing handler); nav row, action rows, menu forms, "+ add" details, preselect banner, and onboarding card are `print:hidden`; new `@media print` CSS renders `.planner-grid` as a compact 4-column grid with `break-inside: avoid` per day card.

**Evidence:** live verification (`test-report-iter30.md` + recording): print preview shows only title + 7 day cards (4-col, 1 page, entries readable) on filled and empty weeks; screen view regression (add/delete entry) passed; 375/375; console + Issues clean; fixtures cleaned. Onboarding card's print-hiding verified in source only (renders only for zero-recipe households).

## Round 31 — 2026-08-06

**Findings (by driver):**
- ① QA / compliance walk (P1): the privacy policy promised erasure rights but there was no self-serve way to delete an account — users (and every QA regression round) accumulate permanent accounts with no exit. GDPR Art. 17 expects erasure to be as easy as signup.
- ② UX: /app/share had no account context (who am I signed in as?).

**Fixes shipped:**
- Self-serve account deletion: /app/share is now "Share & account" with an Account card (signed-in email + "Delete account & all data", confirm-guarded) → `POST /app/account/delete`: for a sole-member household batch-deletes menu_entries, menus, staples, plan_entries, shopping_items, recipes, household_members, households, plus email_intents for that email and the users row; kills the session and redirects to /. Privacy Retention bullet updated to reference self-serve deletion.

**Evidence:** live verification (`test-report-iter31.md` + recording) with a throwaway account: fixtures across every deletion target → confirm-dialog cancel keeps data → delete redirects logged-out, /app→/login, old share token 404s, same-email re-signup gets a fresh empty account/new token; main-account regression untouched; privacy wording live; 375/375; Console + Issues clean; recreated throwaway deleted too (zero residue).

## Round 32 — 2026-08-06

**Findings (by driver):**
- ② UX (P2): when URL import fails (anti-bot sites like Allrecipes), the fallback was the manual 3-field form — retyping a recipe field-by-field is tedious; users typically have the whole recipe text on their clipboard.
- ④ competitor: Plan to Eat's clipper has a paste-text mode; Samsung Food pushes OCR/AI import. A no-AI heading-based text parser closes most of that gap in web scope.
- ⑤ data: analytics still QA-dominated (2026-08-06: 733 PV; search terms still internal stew/onion) — no organic signal to act on yet.

**Fixes shipped:**
- "Or paste a whole recipe" on /app/recipes → `POST /app/recipes/paste` with `parseRecipeText` (src/recipes.js): title = first non-empty line before an Ingredients-style heading; ingredients between Ingredients and Method/Steps-style headings; steps after; bullets/numbering stripped; parse failure redirects back with an error notice and the pasted text preserved (details re-opened). Manual title input gains autocomplete="off". Unit test added (13 passing).

**Evidence:** live verification (`test-report-iter32.md` + recording): pasted fixture parsed into correct title/3 ingredients/2 steps; "Add ingredients to list" flowed 3 items with attribution; failure path shows notice + preserved text; variant headings ("What you'll need:"/"Instructions:") parse; regression on URL import/manual form; Console/Issues clean; 375/375; fixtures cleaned. Coverage note: 1500-char paste-echo truncation verified in source only.

## Round 33 — 2026-08-06

**Findings (by driver):**
- ③ frontend visual/a11y (P2): informational grey text used `text-stone-400` (#a8a29e, ~2.7:1 on white) — fails WCAG AA 4.5:1 for small text: grocery "for <recipe>" sub-lines, "Checked off (N)" heading, staple category labels, Move…/store/category selects, ✕ buttons, account-deletion hint. Dynamic notices (list added-notice, recipes error) had no ARIA live-region roles.

**Fixes shipped:**
- All informational `text-stone-400` → `text-stone-500` (≈4.79:1 vs white, 4.58:1 vs stone-50); grocery green notice gains `role="status"`, recipes amber error notice `role="alert"`.

**Evidence:** live verification (`test-report-iter33.md` + recording): zero `text-stone-400` in served DOM; contrast measured 4.79:1/4.58:1 via WCAG luminance in DevTools; role attributes confirmed on both notices; toggle/category/store/staples/share regressions passed; Console + Issues clean; 375/375; fixtures cleaned. Planner Move… select colour source-verified only (no planner entries this round).

## Round 34 — 2026-08-06

**Findings (by driver):**
- ⑤ data/growth: still no organic traffic; pSEO is the main long-line acquisition lever. Round 32's paste-parsing is a differentiator vs anti-bot walls (Allrecipes-class sites) but had no landing/SEO surface.
- ② UX: URL-import error messages still pointed to the manual form instead of the (better) paste box.

**Fixes shipped:**
- New guide `/guides/save-recipes-from-sites-that-block-importers` (sitemap 16→17 locs, IndexNow 200); landing FAQ import answer now mentions paste-parsing (FAQPage JSON-LD updated with it); both URL-import error messages now direct to pasting the recipe text.

**Evidence:** live verification (`test-report-iter34.md` + recording): guide listed + renders, sitemap 17 locs with new URL, FAQ + JSON-LD (6 questions) contain new wording, failed import shows new message with role=alert and paste box below; Console/Issues clean; 375/375. Coverage note: the "no recipe found" error branch is source-verified only (needs a fetchable page without recipe data).

## Round 35 — 2026-08-06

**Findings (by driver):**
- ② UX / ④ competitor: grocery items imported from recipes often carry typos or awkward phrasing (upstream JSON-LD data) but could only be renamed by deleting + re-adding; Plan to Eat supports editing list items in place.

**Fixes shipped:**
- The ✎ note popover is now an "Edit item" popover: required Item name input (prefilled, maxlength 200) above the note input, both via POST /app/list/note; non-empty label renames the item (dedupe keys derive from label at runtime, so renames are safe).

**Evidence:** live verification (`test-report-iter35.md` + recording): rename+note, note-only, rename-only paths; rename persists after reload and on the read-only share page; store-filter back param preserved after edit; toggle/category/Copy list regressions; popover fits at 375px; Console/Issues clean; fixtures fully cleaned. Coverage note: the server's empty-label branch and the 200-char slice are source-verified only (UI enforces required + maxlength).

## Round 36 — 2026-08-06

**Findings (by driver):**
- ① QA (Round 35 testing finding): the grocery Add form inserted duplicate rows on repeated submits — no dedupe on manual insert, unlike the plan→list and recipe→list paths.

**Fixes shipped:**
- New `addListItem` helper used by both `POST /app/list/add` and the anonymous share-page `POST /s/:token/add`: match by `ingredientKey` — checked hit is unchecked with label replaced ("buy again"); unchecked hit merges labels via `mergeIngredients` ("2 lemons" + "1 lemon" → "3 lemons"); no hit inserts normally.

**Evidence:** live verification (`test-report-iter36.md` + recording): quantity merge, buy-again uncheck, share-page anonymous dedupe, non-matching fresh insert, store-filter back param, share version-poll; Console/Issues clean; fixtures cleaned. Notes: merging a quantified add into an unquantified existing label keeps the existing label (mergeIngredients semantics); the share add's 500-item cap is source-verified only.

## Round 37 — 2026-08-06

**Findings (by driver):**
- ② UX / ③ visual: floating `<details>` popovers (✎ Edit item, Edit stores…) stayed open until their summary was clicked again — unexpected vs standard menu/popover behavior and awkward on mobile.

**Fixes shipped:**
- `public/app.js`: any open `details.relative` popover closes on an outside click, and on Escape (which also refocuses its summary). Non-floating details blocks (planner "+ add", recipes paste/manual) are intentionally unaffected.

**Evidence:** live verification (`test-report-iter37.md` + recording): inside clicks keep the popover open and typable; outside click and Escape close both popovers (Escape refocus proven via `document.activeElement`); popover saves still persist; non-floating details stay open on outside clicks; Console/Issues clean; fixtures cleaned.

## Round 38 — 2026-08-06

**Findings (by driver):**
- ④ competitor patrol (Plan to Eat release notes): they added ingredient header rows; our sectioned recipes ("For the sauce:") rendered headers as bulleted ingredients and pushed them onto the grocery list. Also noted (out of v1 scope): PTE Instagram-reel AI import + nutrition, Samsung Food free calorie tracking — both AI/health directions we deliberately skip.

**Fixes shipped:**
- New `isIngredientHeading` (trimmed line ends ':', ≤60 chars, no digits): renders as a bold sub-heading (colon stripped, no bullet, no unit conversion) on app + share recipe pages; skipped by recipe→list and plan→list adds. Paste-import passes header lines through, so sectioned pastes now show sections. Unit tests 13→14.

**Evidence:** live verification (`test-report-iter38.md` + recording): sectioned paste fixture rendered headers correctly on app + incognito share pages; recipe→list added only the 2 real items with attribution; weekly add idempotent with no headers; imperial toggle converted normal lines (100g→3.53 oz) while headers stayed untouched; Console/Issues clean; 375/375; fixtures cleaned. Note: the digit-containing negative case is unit-test/source-verified only.

## Round 39 — 2026-08-06

**Findings (by driver):**
- ③ visual / ④ competitor: Plan to Eat is print-oriented; our recipe pages printed nav, buttons, tags form and the photo — no clean cook-from-paper output.

**Fixes shipped:**
- Recipe pages (app + share) gain a Print button next to Cook mode; on print, `print:hidden` hides the button group, action row, tags form, Edit/Delete row and the photo — printed output is title, meta, description, source link, sectioned ingredients, numbered steps.
- 39b: testing found the share recipe page's "← Back to …'s week" link still printed (prepended outside recipeBody) — fixed with `print:hidden` and re-verified.

**Evidence:** live verification (`test-report-iter39.md` incl. 39b addendum + recordings): clean Chrome Save-as-PDF previews on app and share pages, section headers bold in print, Cook mode and grocery/planner print regressions pass; Console/Issues clean; 375/375; fixtures cleaned. Notes: verified via print preview (no physical printer); photo hiding proven on the app page only (share fixture had no photo).

## Round 40 — 2026-08-06

**Findings (by driver):**
- ⑤ data/growth: pSEO remains the acquisition lever; Round 39's clean recipe printing addresses a widely-searched pain (cluttered recipe-site printouts) but had no landing/SEO surface.

**Fixes shipped:**
- New guide `/guides/print-a-recipe-without-ads-and-clutter` ("How to print a recipe without the ads, photos and life story") — sitemap 17→18 locs; IndexNow HTTP 200.

**Evidence:** live verification (`test-report-iter40.md` + recording): guide listed and renders (h1, both h2s, bullets, meta description = excerpt); sitemap has exactly 18 locs incl. the new URL; 375/375; Console/Issues clean; read-only round, no fixtures. Note: IndexNow 200 verified from shell, not re-verified by the testing agent.

## Round 41 — 2026-08-06

**Findings (by driver):**
- ④ competitor / ② UX: Plan to Eat's signature grocery feature is custom aisle (category) order matching how you walk your store; our list rendered categories alphabetically (SQL ORDER BY) — not even a sensible store-walk default.

**Fixes shipped:**
- Migration 0010 `households.category_order` (JSON array); `sortCategories` in `src/util.js` ranks saved order → store-walk default (Produce first, Other last) → customs alphabetically.
- `/app/list` gains an "Aisle order…" popover (per-category ↑/↓, edge arrows disabled, `?aisles=1` keeps it open across moves); list sections, per-row category selects, share page and print all follow the saved order; share page has no reorder UI. Unit tests 14→15.

**Evidence:** live verification (`test-report-iter41.md` + recording): default store-walk order replaces alphabetical; reorder moves both popover and sections; custom category reorderable to top; share page follows order without the button; store-filter + `?aisles=1` back param preserved; print uses custom order; Esc/outside-click dismissal; 375/375; Console/Issues clean; fixtures cleaned. Notes: live-poll propagation of an order change onto an already-open share tab not exercised; household `category_order` now stores an explicit default-equivalent JSON (renders identically).

## Round 42 — 2026-08-06

**Findings (by driver):**
- ② UX / ④ competitor: “Copy last week’s plan”, “Fill dinners” and “Apply menu” all vanished once a week had a single entry — an arbitrary empty-week-only limitation; Plan to Eat menus apply onto partially-planned weeks.

**Fixes shipped:**
- All three planner helpers now work on partially-filled weeks, filling only free slots: copy-week and menus/apply skip occupied `date|meal` slots; fill-week (renamed “Fill empty dinners from recipe box”) fills only dinner-less days and hides at 7/7; Apply menu shows whenever menus exist.

**Evidence:** live verification (`test-report-iter42.md` + recording): partial-week copy skips occupied Mon dinner while copying free Tue lunch; fill adds exactly the 5 empty dinners and hides at 7/7; menu apply refills only cleared days, skips a conflicting slot, and a second click is a no-op; empty-week behavior, print, share, menu save/delete regressions pass; 375/375; Console/Issues clean; fixtures cleaned. Notes: copy onto a fully-empty week proven via the same free-slot path (not standalone); fill-week’s 7/7 server no-op proven by button disappearance only.

## Round 43 — 2026-08-06

**Findings (by driver):**
- ⑤ growth / ③ visual: family share links (our main viral loop) are sent via WhatsApp/iMessage but produced bare link previews — share pages (noindex) emitted no Open Graph tags at all, and no page had an og:image.

**Fixes shipped:**
- New 1200×630 social card `public/og-card.png` (headline + CTA, brand colors).
- `src/layout.js` emits og:type/site_name/title/description/url, og:image (+width/height) and `twitter:card=summary_large_image` on every page, including noindex pages (share, /login, app) which keep `robots noindex`.

**Evidence:** live verification (`test-report-iter43.md` + recording): /og-card.png 200 image/png rendering the card; homepage og tags complete with zero noindex; share page has both noindex and og tags (og:url = share path) and renders normally; /login ditto; guide page canonical/description unchanged, no duplicate tags; Console/Issues clean; read-only round, no fixtures. Note: actual WhatsApp/iMessage scraper rendering not exercised — verified the tags and asset they consume.

## Round 44 — 2026-08-06

**Findings (by driver):**
- ① testing / ② UX: clearing a planned week required one ✕ per entry (surfaced repeatedly as a pain point during QA cleanup and equally real for users re-planning a week).

**Fixes shipped:**
- “Clear week” button on the planner (shown only when the week has entries) with a count-aware confirm (“Remove all N entries…”, singular for 1); `POST /app/plan/clear-week` deletes only that week’s entries and bumps the version.

**Evidence:** live verification (`test-report-iter44.md` + recording): button absent on empty weeks; confirm shows exact count, cancel preserves, confirm clears all and hides the button; singular wording at N=1; adjacent week untouched; already-open share tab self-updated within ~10s via the version poll (closing the R41 gap); Save-menu form hides after clearing; 375/375; Console/Issues clean; fixtures cleaned via the button itself. Notes: hover styling and invalid-week validation source-verified only.

## Round 45 — 2026-08-06

**Findings (by driver):**
- ⑤ growth: the R41 aisle-order feature had no acquisition surface; “grocery list by aisle / stop backtracking” is a searched pain with direct product fit.

**Fixes shipped:**
- New guide `/guides/organize-grocery-list-by-store-aisle` (“How to organize your grocery list by store aisle (and stop backtracking)”) — sitemap 18→19 locs; IndexNow HTTP 200.

**Evidence:** live verification (`test-report-iter45.md` + recording): guide listed with exact excerpt and navigates; h1 + both h2 steps + 3-bullet list + CTA render; title/meta exact; sitemap exactly 19 locs incl. the new URL; 375/375; Console/Issues clean; read-only round, no fixtures. Note: IndexNow 200 shell-verified only.

## Round 46 — 2026-08-06

**Findings (by driver):**
- ④ competitor: Plan to Eat supports per-recipe notes (“double the sauce”, “kids loved it”); MealLoop had nowhere to keep household cooking notes.
- ① testing (found during this round’s verification): the live version poll only ran on pages with `#list`, so open share *recipe* tabs never self-updated.

**Fixes shipped:**
- Household-shared recipe notes: migration 0011 (`recipes.notes`), Notes textarea on the edit form (maxlength 2000), amber callout on the app and read-only share recipe pages (escaped, `whitespace-pre-line`), version bump on save.
- 46b: version poll now also runs on any page with a `[data-poll data-version data-base]` marker; share recipe page carries it, so open share recipe tabs self-update.

**Evidence:** live verification (`test-report-iter46.md` + recording): no-note recipe clean; multi-line note renders with line breaks, XSS probe escaped; note visible on share view with no edit controls; clearing removes callout; open share recipe tab self-reloaded ~14s after app-side save and self-dropped the callout after clearing (46b); /app/list toggle+poll and share-planner poll regressions clean; 375/375; Console/Issues clean; fixtures reverted. Note: the note prints (accepted); initial deploy failed the share-tab check — fixed same round.

## Round 47 — 2026-08-06

**Findings (by driver):**
- ② UX: planning a recipe from the recipe box took two hops (open recipe → “Add to your week plan”); no way to browse only favourites despite the ★ toggle existing since R4.

**Fixes shipped:**
- “+ Plan this week” quick action on every recipe card (→ `/app?recipe=<id>` preselect flow from R14); cards restructured to an outer div with inner link so the action isn’t nested inside the card anchor.
- “★ Favourites” filter chip (shown only when ≥1 favourite exists; solid amber when active; `✕ Clear filter` covers tag and fav; fav-specific empty state).

**Evidence:** live verification (`test-report-iter47.md` + recording): quick action lands on the planner with banner + preselected dropdown and the entry adds end-to-end; card title/image still open the recipe; chip lifecycle proven in both directions (0 favourites → chip hidden + empty state; restored → filters exactly the favourites); tag chips and search regressions clean; 375/375; Console/Issues clean; fixtures restored.

## Round 48 — 2026-08-06

**Findings (by driver):**
- ③ visual / ④ competitor: competitors push native apps; MealLoop’s “no app needed” stance still benefits from Add-to-Home-Screen — the site had no web app manifest, icons, or theme-color.

**Fixes shipped:**
- PWA install metadata: `public/manifest.webmanifest` (id/start_url `/app`, standalone, theme `#059669`, 192/512 icons incl. maskable), new emerald plate-logo icons, and manifest/apple-touch-icon/theme-color tags in the layout head on every page. Intentionally no service worker (no offline claim).

**Evidence:** live verification (`test-report-iter48.md` + recording): manifest 200 `application/manifest+json` and parses in DevTools Application → Manifest with all 3 icon entries; icons 200 png at 192/512; exactly one manifest/theme-color/apple-touch-icon tag on `/`, `/login`, `/guides`, `/app/list`; no CSP violations; Chrome install icon appears in the omnibox; homepage//app/list visuals unchanged; 375/375; Console/Issues clean; read-only round. Notes: actual install not performed on the test box; `id` field added post-test to silence the DevTools note (curl-verified); Richer-Install-UI screenshot warnings accepted.

## Round 49 — 2026-08-06

**Findings (by driver):**
- ⑤ growth: food-waste / leftovers planning is a high-demand search topic with a direct product hook (R25’s “+ Leftovers next day”); no guide covered it.

**Fixes shipped:**
- New guide `/guides/plan-leftovers-nights-reduce-food-waste` (“Plan leftovers nights on purpose (and stop throwing food away)”) — sitemap 19→20 locs; IndexNow HTTP 200.

**Evidence:** live verification (`test-report-iter49.md` + recording): guide listed with exact title/excerpt and navigates; h1 + both h2 sections + 3-bullet list + CTA render; title/meta exact; sitemap exactly 20 locs incl. the new URL; 375/375; Console/Issues clean; read-only round, no fixtures. Note: card sits second-to-last on /guides (array order); IndexNow 200 shell-verified only.

## Round 50 — 2026-08-06

**Findings (by driver):**
- ⑤ growth / ③ visual: guide pages were dead ends — after the CTA there was nowhere to go, wasting internal-link equity and engagement across 16 guides.
- ① testing: guides had no unit coverage (slug collisions or missing metadata would ship silently).

**Fixes shipped:**
- “More guides” nav on every guide page (after the CTA): 3 deterministic links = next 3 guides in array order with wrap-around (`relatedGuides`).
- New `test/guides.test.js`: slug uniqueness/format + title/excerpt length bounds + body structure (suite 15→16 tests).

**Evidence:** live verification (`test-report-iter50.md` + recording): More guides section renders after the CTA with exactly 3 links in expected order on a mid-array guide; last guide wraps to the first 3; navigation works; /guides listing unchanged (16 cards, no section there); 375/375; Console/Issues clean; read-only round. Local: 16/16 tests pass.

## Round 51 — 2026-08-06

**Findings (by driver):**
- ② UX / ④ competitor: manual and pasted recipes had no photo and no way to add one — imported recipes get images, so the recipe box was visually split into rich and bare cards (Plan to Eat/Samsung Food both allow user photos).
- ① testing: user-supplied URL fields need injection coverage (javascript:/data: URIs).

**Fixes shipped:**
- Optional “Photo URL” field on the recipe edit form; `sanitizeImageUrl` (src/util.js) keeps only http/https URLs, else stores NULL. Photo renders on the card grid, detail page and share recipe page; clearing restores the 🍽 placeholder; save bumps version so open share pages self-update.
- New unit test for `sanitizeImageUrl` (javascript:/data:/garbage → null); suite 16→17.

**Evidence:** live verification (`test-report-iter51.md` + recording): add photo → renders on card/detail/share; clear → placeholder returns; `javascript:alert(1)` submitted through the real form → no alert, no img, stored NULL; notes/title regression clean; 375/375; Console/Issues clean; fixtures restored. Local: 17/17 tests pass.

## Round 52 — 2026-08-06

**Findings (by driver):**
- ② UX / ④ competitor: prep/cook/servings meta only existed on imported recipes — manual/pasted recipes could never show it and imported values couldn’t be corrected (both competitors allow editing recipe meta).
- ① testing: numeric form fields need clamp/NULL coverage.

**Fixes shipped:**
- 3-col Prep (min) / Cook (min) / Servings row on the recipe edit form; `clampMinutes` (src/util.js) keeps positive integers up to 6000 else NULL, servings trimmed to 40 chars (empty→NULL). Meta renders on the card grid, detail and share recipe pages; save bumps version.
- New unit test for `clampMinutes`; suite 17→18.

**Evidence:** live verification (`test-report-iter52.md` + recording): set 10/25/“Serves 4” → meta on card/detail/share; clear-all removes it; Prep=0 through the real form → stored NULL (negatives/letters blocked client-side by type=number, server path source-verified); imported bolognese meta preserved on re-save; 375/375 (3-col row fits); Console/Issues clean; fixtures restored. Local: 18/18 tests pass.

## Round 53 — 2026-08-06

**Findings (by driver):**
- ⑤ growth / ④ competitor: batch cooking is a high-intent evergreen topic that maps directly onto existing features (×2/×3 scaling, quantity merge, leftovers nights) — no guide covered it.

**Fixes shipped:**
- New pSEO guide `/guides/batch-cooking-for-busy-weeks` (“Batch cooking for busy weeks: cook twice, eat five times”); sitemap 20→21 locs; IndexNow HTTP 200.

**Evidence:** live verification (`test-report-iter53.md` + recording): listed last on /guides with exact title/excerpt; page renders h1 + both h2 sections + bullets + CTA; title/meta exact; More guides wraps to the first 3 guides and navigates; sitemap exactly 21 locs incl. new URL (first fetch was a stale CDN copy — re-fetch fixed); 375/375; Console/Issues clean; read-only round.

## Round 54 — 2026-08-06

**Findings (by driver):**
- ② UX / ④ competitor: when deciding what to cook, “have we done this recently?” had no answer on the recipe page — rotation history lived only in the planner (competitors surface last-cooked info).

**Fixes shipped:**
- Plan-stats line on the logged-in recipe detail page: “Planned once/N times · last on Ddd D Mmm” from COUNT/MAX(date) of `plan_entries` with date ≤ today (UTC) — future-dated entries excluded; never-planned recipes show nothing; share recipe page unaffected; print:hidden (`planStatsLine`, src/index.js).

**Evidence:** live verification (`test-report-iter54.md` + recording): plan Test Stew today → “Planned once · last on Thu 6 Aug”; never-planned recipe → no line; extra far-future 2027 entry → count/date unchanged; share page → no line; print preview hides it; 375/375; Console/Issues clean; fixtures removed. Plural “N times” branch source-verified only.

## Round 55 — 2026-08-06

**Findings (by driver):**
- ⑤ growth: guide pages had no structured data (Article/Breadcrumb rich-result eligibility) and no visible way back to the guides index except the site nav.

**Fixes shipped:**
- JSON-LD @graph on every guide page: Article (headline/description/canonical/og-card image, MealLoop org author+publisher w/ icon-512 logo) + BreadcrumbList (Guides → guide).
- Visible breadcrumb nav “Guides › <title>” above the h1 linking back to /guides.

**Evidence:** live verification (`test-report-iter55.md` + recording): breadcrumb renders and navigates, title matches h1; JSON-LD parses with 11/11 exact field checks on 2 guides; strict CSP — zero console errors (ld+json is data, not executed); CTA/More guides//guides listing regression clean; 375px long-title breadcrumb wraps cleanly; read-only round.

## Round 56 — 2026-08-06

**Findings (by driver):**
- ② UX / ④ competitor: manual reorder of list items within a category — long-standing backlog item; Plan to Eat's July content push (“best app for a multi-store shopper”, “stop wasting mental energy on your shopping list”) keeps list ergonomics front and centre. Competitor recheck (Plan to Eat blog Jan–Jul 2026): content/podcast-led growth, no major new web product feature to counter.

**Fixes shipped:**
- Per-item “↑ Move up / ↓ Move down” in the ✎ Edit-item popup → new POST /app/list/move: swaps among same-category same-checked-state items, writes normalized `sort_index` (migration 0012). /app/list and share page order by `category, COALESCE(sort_index, 1000000), created_at`, so custom order syncs to the family share page.

**Evidence:** live verification (`test-report-iter56.md` + recording): reorder + persistence after reload; boundary moves are silent no-ops; rename+note regression after popup restructure; incognito share page shows the custom order; checked-off section isolated; 375px popup fits, Console/Issues clean; fixtures removed.

## Round 57 — 2026-08-06

**Findings (by driver):**
- ④/⑤ growth: Plan to Eat's 2026 content calendar leans on picky-eater / family-friction topics (“3 dinner strategies for picky eaters”, Mar 2026); MealLoop's no-signup family share is a strong native answer but had no guide targeting that search intent.

**Fixes shipped:**
- New pSEO guide `meal-planning-for-picky-eaters` (“Meal planning for picky eaters — without cooking two dinners”): plan around the overlap, plan swaps into recipe notes, repetition as a feature, shared no-signup plan kills the 6pm ambush. Sitemap 21→22, IndexNow 200.

**Evidence:** live verification (`test-report-iter57.md` + recording): guide renders with R55 breadcrumb+JSON-LD (11/11 field checks), listed last of 18 on /guides with exact title/excerpt, More guides wraps to first 3, 375px wrap clean, Console/Issues clean; read-only round.

## Round 58 — 2026-08-06

**Findings (by driver):**
- ② UX: cook mode (R18) lets you tap steps done, but mise en place — checking off ingredients as you prep — had no equivalent; cooks lose their place in the ingredient list on the phone at the counter.

**Fixes shipped:**
- Cook mode tap-to-dim ingredients: ingredients `<ul>` got class `ingredients-list`; app.js binds bullet rows (`li.flex` only — R38 section headings stay non-clickable); CSS scoped to `.cook-mode` (cursor, opacity 0.4 + line-through). Client-side only, no persistence; works on the share recipe page too.

**Evidence:** live verification (`test-report-iter58.md` + recording): tap dims+strikes, re-tap restores; steps regression; no effect outside cook mode; heading row non-clickable (temp 'For the garnish:' fixture, restored); exit clears all styling; incognito share page works incl. 375px; Console/Issues clean.

## Round 59 — 2026-08-06

**Findings (by driver):**
- ① QA: the R56 move route's swap logic was inline SQL/array code with no unit coverage; boundary/missing-id branches only exercised via manual production tests.

**Fixes shipped:**
- Extracted pure helper `swapAdjacent(arr, value, dir)` into src/util.js (returns null for boundary/missing → no DB write, no version bump) and rewired POST /app/list/move to use it. 7 new unit tests (immutability, both directions, boundary/missing/empty) — suite 18→19.
- ⑤ data check: guide pages are starting to register views (batch-cooking 9, leftovers 8 since 8/1) — still QA-dominated overall.

**Evidence:** live smoke regression (`test-report-iter59.md` + recording): swap + reload persistence, boundary no-op, Console/Issues clean, fixtures cleaned.

## Round 60 — 2026-08-06

**Findings (by driver):**
- ⑤ growth/③ visual: structured-data coverage was complete on guide pages (R55) but the /guides hub itself had none — an ItemList completes the picture for search engines crawling the guide cluster.

**Fixes shipped:**
- /guides listing emits a single ItemList JSON-LD script: 18 ListItems, position 1..18, name = guide title, absolute url per guide.

**Evidence:** live verification (`test-report-iter60.md` + recording): exactly 1 ld+json script on /guides, parses as ItemList with positions 1..18 and names character-identical to the visible card order; listing visual regression clean (no breadcrumbs, 18 cards); strict CSP — Console/Issues clean; 375px clean; read-only round.

## Round 61 — 2026-08-06

**Findings (by driver):**
- ② UX / ③ visual: on mobile the 7 day cards stack, so mid-week you scroll past dead days to find today; the “Today” nav link reloaded /app at the top; past days looked identical to upcoming ones.

**Fixes shipped:**
- Today's card gets `id="today"` + `scroll-mt-20`; the “Today” control links to `/app#today` (returns to current week and anchors, offset for the sticky header).
- Past-day cards (date < today UTC) get `opacity-60 print:opacity-100` — dimmed on screen, full contrast in print.

**Evidence:** live verification (`test-report-iter61.md` + recording): desktop dimming (past dimmed, today ringed, future normal); 375px “Today” click anchors today's card below the sticky header; return from ?week=next anchors correctly; print preview shows past days at full contrast; Console/Issues clean; read-only round.

## Round 62 — 2026-08-06

**Findings (by driver):**
- ① QA / ② UX: POST /app/staples/add accepted the same label repeatedly — each duplicate staple then got re-added to the grocery list on every “Add week's ingredients”.

**Fixes shipped:**
- Case-insensitive duplicate guard on staples add: `lower(label)` match within the household → silent no-insert, normal redirect. Distinct labels unaffected.

**Evidence:** live verification (`test-report-iter62.md` + recording): exact and case-variant resubmits leave exactly one row (original casing preserved); distinct label still inserts; ✕ removal regression; fixtures cleaned; Console/Issues clean.

## Round 63 — 2026-08-06

**Findings (by driver):**
- ④/⑤ growth: budget meal planning is an evergreen high-intent search topic (competitor content leans on it); MealLoop's staples + merged aisle-sorted list are a native answer but no guide targeted it.

**Fixes shipped:**
- New pSEO guide `meal-planning-on-a-budget` (“cut the grocery bill without coupons”): top-up trips/duplicates/waste as the real leaks; one merged list + staples + cheap-dinner rotation. Sitemap 22→23, IndexNow 200. /guides ItemList now 19 items.

**Evidence:** live verification (`test-report-iter63.md` + recording): guide renders with breadcrumb + JSON-LD (14/14 field checks); listed last of 19 on /guides with exact title/excerpt; ItemList 19 items, position 19 = new guide; More guides wraps to first 3; 375px clean; Console/Issues clean; read-only round.

## Round 64 — 2026-08-06

**Findings (by driver):**
- ⑤ data / ③ visual: /s is the top path in first-party analytics (520 views since 8/1) yet the share page's week grid had none of R61's orientation cues — family members opening the link mid-week saw 7 identical cards.

**Fixes shipped:**
- Share-page day cards mirror R61: today (UTC) gets emerald border + ring + emerald heading; past days get `opacity-60 print:opacity-100` (entries inherit dimming). No anchor link — the share grid is compact by design.

**Evidence:** live verification (`test-report-iter64.md` + recording): current week past/today/future rendering; next week shows zero ring/dim, fully past week shows all 7 dimmed, “This week” restores; print preview full contrast; 375px + Console/Issues clean; read-only round.

## Round 65 — 2026-08-06

**Findings (by driver):**
- ② UX / ④ competitor: mainstream list apps show shopping progress at a glance; MealLoop's list heading gave no count — mid-shop you had to scan/scroll to judge what's left.

**Fixes shipped:**
- Grocery-list h1 progress summary: `N to buy[ · M checked]`, `all done 🎉 · M checked` when nothing left, no span on an empty list. Rendered in shared `listBody`, so /app/list and the anonymous share list both show it; counts follow the shown (store-filtered) items.

**Evidence:** live verification (`test-report-iter65.md` + recording): exact counts through add/check/uncheck transitions incl. full check-all (“all done 🎉 · 37 checked”, fully reversed); share page shows the identical summary anonymously; store filter scopes counts to the filtered view; fixtures/stores cleaned, production restored; 375px + Console/Issues clean. Untested: empty-list no-span state (would require deleting standing items).

## Round 66 — 2026-08-06

**Findings (by driver):**
- ② UX / ④ competitor: growing recipe boxes only listed newest-first; competitors offer alphabetical browsing — finding a known recipe by name meant search or scroll.

**Fixes shipped:**
- Newest | A–Z sort control on /app/recipes: `?sort=title` → `favorite DESC, title COLLATE NOCASE ASC` (favourites stay pinned); active sort is a non-link pill (aria-current), inactive link preserves q/tag/fav; search form carries a hidden sort input in A–Z mode; unknown ?sort falls back to newest. Applies to all four query variants.

**Evidence:** live verification (`test-report-iter66.md` + recording): default order unchanged; A–Z alphabetical with favourites pinned; sort persists through search and tag filter with params preserved; ?sort=bogus falls back cleanly; 375px wrap + Console/Issues clean. Not separately proven: COLLATE NOCASE with mixed-case titles (all QA titles are Title-case).

## Round 67 — 2026-08-06

**Findings (by driver):**
- ③/④ SEO/social: every page emitted `og:type=website`, including the 19 guide articles — social scrapers and rich-result consumers treat guides as generic pages despite their Article JSON-LD (R55).

**Fixes shipped:**
- `page()` accepts an `ogType` param (default `website`, only `article` accepted); guide detail route passes `ogType: 'article'`. All other routes unchanged.

**Evidence:** live verification (`test-report-iter67.md`, cache-busted curl + browser): guide pages emit `og:type=article` with full OG set otherwise unchanged (og:description character-identical to the guide excerpt); /guides, /, /privacy, /login remain `website`; Console/Issues clean. Meta-only round — no recording. Note: production initially served stale `website` for ~minutes post-deploy (CDN propagation), resolved on its own.

## Round 68 — 2026-08-06

**Findings (by driver):**
- ① QA: two standing untested gaps from prior rounds — R65's empty-list no-span state (never verified; deleting standing QA items was unsafe) and R66's `COLLATE NOCASE` behaviour (all QA titles were Title-case). Also `page()` meta logic (og:type/robots/canonical) had no unit coverage.

**Fixes shipped:**
- New `test/layout.test.js` covering `page()` meta: og:type article only when `ogType==='article'`, bogus values fall back to website, noindex robots meta, canonical URL. Suite 19→20 green. No production code change.

**Evidence:** live QA closure (`test-report-iter68.md` + recording): lowercase fixture "avocado toast QA68" sorts 3rd (first non-fav) in A–Z — a case-sensitive sort would have placed it last — COLLATE NOCASE proven, fixture removed and box restored; disposable account (fresh signup) showed empty list with plain "Grocery list" h1 (no span) + empty hint, then "1 to buy" → "all done 🎉 · 1 checked" transitions; self-serve GDPR deletion killed the session and the household share link (404). Standing QA data untouched.

## Round 69 — 2026-08-06

**Findings (by driver):**
- ④/⑤ growth: "what's for dinner" decision fatigue is the highest-frequency pain in the category (competitor content leans on it heavily) but no guide addressed it; guide cluster stood at 19.

**Fixes shipped:**
- New pSEO guide `stop-deciding-whats-for-dinner-every-night` ("decide once a week, then just cook"): decision fatigue / hungry-decision takeaway bias / no-list side effect; weekly 10-minute sitting + visible family plan + rotation. Sitemap 23→24, IndexNow 200. /guides ItemList now 20 items.

**Evidence:** live verification (`test-report-iter69.md` + recording): breadcrumb + h1 exact; both h2 sections + 3 bullets + CTA; More guides wraps to first 3; Article+BreadcrumbList JSON-LD exact (single script, og-card image, org logo); listed last of 20 on /guides, ItemList 20 items with position 20 = new guide; sitemap 24 locs; og:type=article (R67 intact); 375px + Console/Issues clean. Note: ~1 min stale-CDN 404 right after deploy, self-resolved.

## Round 70 — 2026-08-06

**Findings (by driver):**
- ⑤ data / ③ SEO: the landing page (138 views since 8/1, 3rd-most public path) linked to the 20-guide cluster only via two small text links — no guide content surfaced on the highest-intent page; internal linking to the cluster was weak.

**Fixes shipped:**
- "From the guides" section on `/` between the FAQ and the FAQPage JSON-LD: 3 featured whole-card links (`FEATURED_SLUGS`: picky-eaters, batch-cooking, budget) with title + excerpt from `src/guides.js`, plus an "All guides →" link. Escaped output; no new JSON-LD.

**Evidence:** live verification (`test-report-iter70.md` + recording): exactly 3 cards in order with character-identical titles/excerpts; whole-card link proven by body-text click → correct guide; "All guides →" → /guides (20 guides); FAQ accordions + email form + FAQPage JSON-LD (still the only ld+json, 6 questions) intact with correct document order; 375px single-column stack, 375/375 no overflow; Console/Issues clean; logged-out CTA regression passed. Not re-tested: logged-in CTA variant (unchanged code path).

## Round 71 — 2026-08-06

**Findings (by driver):**
- ② UX / ① QA: staples were auto-categorized once by `categorize()` with no way to fix a wrong bucket ("QA71 fixture bar" → Other), and even a correct staple category was ignored when "Add week's ingredients" inserted the item — it re-ran `categorize()`.

**Fixes shipped:**
- Each /app/staples row gets a `data-autosubmit` category select (STANDARD_CATEGORIES + current) posting to household-scoped `POST /app/staples/category`; ✕ delete aria-labels now include the staple label.
- "Add week's ingredients" inserts staples with the staple's stored category (`stapleCats.get(key) || categorize(label)`); recipe ingredients unchanged.

**Evidence:** live verification (`test-report-iter71.md` + recording): milk row shows Dairy & Eggs selected; fixture staple defaulted to Other, select change auto-submitted and persisted across reload; with fixture set to Spices & Baking, "Add week's ingredients" landed it under Spices & Baking (old behavior would be Other); cleanup restored the list to 35 to buy and staples to milk only; 375px + Console/Issues clean. Note: the propagation test re-attached display-only "for <recipe>" source sub-labels to existing unchecked items (normal recompute, self-corrects next run).

## Round 72 — 2026-08-06

**Findings (by driver):**
- ④ Competitor: Plan to Eat's June 2026 update added Menu printing and duplication — menus are an active investment area for them. MealLoop's saved menus were "blind": only name dropdowns on the planner, no way to see what a menu contains, rename it, or print it.

**Fixes shipped:**
- New `GET /app/menus` "Saved menus" page: one card per menu (newest first) with day-by-day preview (days with entries only, `meal: recipe title || note`, ×N badge when scale≠1 via LEFT JOIN recipes), inline rename (`POST /app/menus/rename`, household-scoped), ✕ delete (confirm, `back=/app/menus` redirect), Print button (controls print:hidden), empty state.
- Planner shows a "View menus" link whenever the household has menus.

**Evidence:** live verification (`test-report-iter72.md` + recording): QA72 fixture menu from an empty future week → preview/rename-persistence/print-preview/delete-to-empty-state all passed; cleanup restored zero menus and the empty future week; 375px + Console/Issues clean. Untested minor gaps: positive ×N badge (only the no-badge case shown) and multi-menu newest-first ordering (single menu existed).

## Round 73 — 2026-08-06

**Findings (by driver):**
- ⑤ Data + ② UX: /guides pages are getting real views (39 + per-guide counts) but rendered the logged-out header ("Log in / Get started free") and a "Start planning → /login" CTA even for logged-in users — /guides, /guides/:slug, /privacy and /terms never resolved the session.

**Fixes shipped:**
- Those four public routes now pass `user: await getUser(c)` into `page()`, so logged-in visitors get the app header (Planner / Recipes / List / Log out).
- Guide-detail CTA box is session-aware: `user ? 'Open your planner' → /app : 'Start planning' → /login`.

**Evidence:** live verification (`test-report-iter73.md` + recording): logged-in session sees the app header on all four pages and the planner CTA lands on /app; incognito contrast shows the unchanged logged-out state; SEO regression via cache-busted curl (guide Article+Breadcrumb JSON-LD + og:type=article, /guides ItemList 20 items, landing FAQPage) all intact; 375px + Console/Issues clean. Minor untested gap: incognito /terms (same code path as /privacy).

## Round 74 — 2026-08-06

**Findings (by driver):**
- ⑤ Data + ④ Competitor: guide pages are the only organic-facing surface accruing views, and the R72 saved-menus feature (a Plan to Eat parity point) had no content surface explaining the workflow.

**Fixes shipped:**
- New pSEO guide #21 `reusable-weekly-menu-template` ("Build a reusable weekly menu (plan once, use it forever)") — cross-promotes saved menus. Sitemap 24→25 locs; IndexNow submitted (200).

**Evidence:** live verification (`test-report-iter74.md` + recording): guide renders with breadcrumb/h1/2×h2+bullets/session-aware CTA and More-guides wrap to the first 3 guides; /guides shows 21 cards with ItemList JSON-LD at 21 items (new guide position 21); single @graph [Article, BreadcrumbList] ld+json + og:type=article + correct canonical; 375px + Console/Issues clean.

## Round 75 — 2026-08-06

**Findings (by driver):**
- ④ Competitor + ① QA: Plan to Eat's June 2026 update added menu duplication — MealLoop menus couldn't be copied; plus two R72 untested gaps remained (positive ×N badge render, newest-first multi-card ordering).

**Fixes shipped:**
- Duplicate button on each /app/menus card → `POST /app/menus/duplicate`: household-scoped SELECT, inserts `Copy of <name>` (60-char cap) and copies all menu_entries (dow/meal/recipe_id/note/scale); copy renders first (newest-first).

**Evidence:** live verification (`test-report-iter75.md` + recording): QA75 fixture with a ×2-scaled entry proved the ×2 badge in the preview (R72 gap closed); Duplicate produced "Copy of QA75 menu" first (ordering gap closed) with an identical preview; renaming the copy left the original unchanged (entries copied, not shared); print/delete regressions to empty state passed; cleanup restored zero menus and the empty future week; 375px + Console/Issues clean. Untested edges: 60-char copy-name truncation; cross-household menu_id guard (needs a second account).

## Round 76 — 2026-08-06

**Findings (by driver):**
- ④ Competitor: Plan to Eat's app integrates planned recipes with calendar apps; MealLoop had no calendar surface for the plan.

**Fixes shipped:**
- New `GET /s/:token/calendar.ics` — share-token-scoped iCal feed (window today−7..today+28): one all-day VEVENT per plan entry (`SUMMARY "Meal: Title[ ×N]"`, note text for note-only entries, comma/semicolon escaping, CRLF, `X-PUBLISHED-TTL PT1H`), invalid token → 404. Resetting the share link also rotates this URL.
- `/app/share` gains a "Meal plan in your calendar" card: readonly feed URL + Copy (data-copy), Google/Apple/Outlook explainer.

**Evidence:** live verification (`test-report-iter76.md` + recording): card renders and Copy proven via a real clipboard paste; feed parsed structurally (8 VEVENTs matching current-week plan entries, correct window, VCALENDAR headers); wrong token 404; share page/account card regressions clean; 375px + Console/Issues clean. Untested: real calendar-client subscription; SUMMARY escaping/×N branches (no such entries in standing plan).

## Round 77 — 2026-08-06

**Findings (by driver):**
- ⑤ Data + ④ Competitor: the R76 iCal feed (a differentiator vs Samsung Food web and a parity point vs Plan to Eat's app) had no content surface; guides remain the organic-facing channel accruing views.

**Fixes shipped:**
- New pSEO guide #22 `meal-plan-in-your-family-calendar` ("Put the meal plan in the calendar your family already checks") — cross-promotes the calendar feed. Sitemap 25→26 locs; IndexNow 200.

**Evidence:** live verification (`test-report-iter77.md` + recording): breadcrumb/h1/2×h2+3 bullets/session-aware CTA render; More-guides wraps to first 3; /guides 22 cards + ItemList 22 items (position 22); single @graph [Article, BreadcrumbList] + og:type=article + canonical correct; sitemap 26 locs; 375px + Console/Issues clean.

## Round 78 — 2026-08-06

**Findings (by driver):**
- ① QA: two R76 untested edges remained (iCal comma/semicolon escaping and the ×N SUMMARY branch); the feed's escaping was an inline lambda with no unit coverage.

**Fixes shipped:**
- Extracted `icsEscape` into src/util.js (RFC 5545 TEXT escaping) with unit tests (`test/util.test.js`, suite 20→21); calendar-feed SUMMARY and X-WR-CALNAME now use it.

**Evidence:** live verification (`test-report-iter78.md` + recording): feed regression (8 VEVENTs, structure/CRLF/Content-Type unchanged); live comma fixture "QA78 pasta, salad night" → raw `SUMMARY:Dinner: QA78 pasta\, salad night`; live ×2 recipe fixture → `SUMMARY:Lunch: Test Stew ×2`; fixtures cleaned with byte-identical feed baseline; 375px + Console/Issues clean. Caveat: semicolon/backslash branches proven by unit tests only (same replace-chain code path).

## Round 79 — 2026-08-06

**Findings (by driver):**
- ② UX + ③ Mobile: week navigation on the planner and share page required tapping small Prev/Next links on phones; competitor mobile apps navigate weeks by swipe. Long-standing candidate finally scheduled.

**Fixes shipped:**
- Swipe week navigation (public/app.js): pages with `a[data-swipe-prev]`/`a[data-swipe-next]` (planner + share page) navigate on a horizontal touch swipe (≥70px, vertical < half horizontal to protect scrolling; swipes starting on form controls/links ignored).

**Evidence:** live verification (`test-report-iter79.md` + recording): click nav regression; device-emulated swipes left/right navigate ?week=±7 on /app and /s; vertical-scroll, short-swipe and form-control guards all hold; desktop mouse drag unaffected; 375px + Console/Issues clean. Caveat: proven via Chrome touch emulation, not a physical device.

## Round 80 — 2026-08-06

**Findings (by driver):**
- ① QA: R75's two untested edges were still open (menu-duplicate 60-char name truncation, cross-household adversarial menu_id guard); testing surfaced a new 375px overflow with unbroken long menu names on /app/menus.

**Fixes shipped:**
- Extracted `copyName` into src/util.js with unit tests (suite 21→22); `/app/menus/duplicate` uses it.
- 80b: `/app/menus` card h2 gained `break-words min-w-0 max-w-full`, fixing the 375px horizontal overflow with space-free long names.

**Evidence:** live verification (`test-report-iter80.md` + recording): 60-X menu duplicated to a name of exactly 60 chars ("Copy of " + 52 X's); adversarial duplicate POST from a disposable second household with the QA household's menu_id = silent no-op (both households' menu counts unchanged); disposable account GDPR-deleted; 80b re-check: 60-char unbroken name wraps at 375px (scrollWidth 375, was 753); Console/Issues clean; all fixtures cleaned, standing data intact.

## Round 81 — 2026-08-06

**Findings (by driver):**
- ② UX: the only bulk action on checked grocery items was the destructive "Clear checked" — re-shopping recurring items meant re-adding them by hand. Common list-app parity gap.

**Fixes shipped:**
- "Uncheck all" button on the /app/list "Checked off (N)" header (app view only; share page stays without it), backed by household-scoped POST /app/list/uncheck (checked=0 + version bump for share-page sync).

**Evidence:** live verification (`test-report-iter81.md` + recording): 2-item checked fixture → one click restored both to their open categories with sources/notes/stores intact ("33 to buy · 2 checked" → "35 to buy"); share page synced and shows no button; single-toggle and Clear-checked regressions pass; 375px + Console/Issues clean; household restored to 35 to buy · 0 checked. Caveat: adversarial cross-household POST on the new route not exercised (same scoping pattern as proven in R80).

## Round 82 — 2026-08-06

**Findings (by driver):**
- ④ Competitor: Plan to Eat July 2026 update reviewed — content/podcast growth only, no web product change requiring action (their nutrition/macro tracking stays out of our v1 scope).
- ② UX: typing "milk, eggs, bread" in the grocery add box created one item; multi-add in one line is standard in list apps.

**Fixes shipped:**
- Comma multi-add: `splitListInput` in src/util.js (splits on commas but keeps decimal commas like "1,5 kg"; max 20 parts; unit-tested, suite 22→23), used in /app/list/add and the anonymous share add (respecting the 500-item cap). Placeholder now "Add items (e.g. milk, eggs, 2 lemons)".

**Evidence:** live verification (`test-report-iter82.md` + recording): 3-way split on the app view, decimal comma kept as one item, re-add merge regression, share-page 2-way split synced to app, cleanup back to exactly 35 to buy · 0 checked, 375px + Console/Issues clean. Caveats: 20-part cap and length truncation proven by unit tests only; single-word QA labels categorize to "Other" (pre-existing categorizer, unrelated to the split).

## Round 83 — 2026-08-06

**Findings (by driver):**
- ①/⑤: R82 testing showed common groceries (pears, plums, buns, jam) auto-categorized to "Other"; hand-typed items get no useful aisle grouping.

**Fixes shipped:**
- Expanded CATEGORY_RULES (src/util.js): Produce +fruits/vegetables (pears, plums, berries, oranges, melon, cauliflower, kale, …), Meat & Seafood +cod/haddock/tofu, Bakery +buns/bagel/rolls/baguette/cereal/couscous; new early rule sends jam/jelly/marmalade/peanut butter to Oils & Condiments (before Produce so "strawberry jam" isn't a berry); Dairy butter gained a `(?<!peanut )` lookbehind. Unit tests extended.

**Evidence:** live verification (`test-report-iter83.md` + recording): pears→Produce, buns→Bakery, strawberry jam + peanut butter→Oils & Condiments, tofu→Meat & Seafood, plain butter→Dairy & Eggs; cleanup back to 35 to buy · 0 checked; 375px + Console/Issues clean. Caveat: 5 of ~30 new keywords proven live (rest unit-tested); existing rows keep their stored category by design.

## Round 84 — 2026-08-06

**Findings (by driver):**
- ④ Competitor + ⑤ Data: Plan to Eat's July 2026 content push centers on "why meal plans fail / most common planning mistakes" (podcast #137 + Instagram series) — validated topic demand our guide cluster didn't cover.

**Fixes shipped:**
- pSEO guide #23 `why-meal-plans-fall-apart` ("Why your meal plan falls apart by Wednesday (and how to fix it)") — fantasy-week/rigid/invisible failure modes, planning the real week, survivable plans; cross-promotes share link + calendar visibility. Sitemap 26→27 locs; IndexNow 202.

**Evidence:** live verification (`test-report-iter84.md` + recording): render (breadcrumb/h1/3×h2/3 bullets/CTA), last of 23 cards, ItemList 23 items at position 23, @graph [Article, BreadcrumbList], og:type=article, og:description=excerpt, canonical, sitemap 27 locs, More-guides link click-proven (closing the standing exact-match caveat), 375px + Console/Issues clean.

## Round 85 — 2026-08-06

**Findings (by driver):**
- ② UX walkthrough: changing servings on an already-planned recipe required delete + re-add (scale was only settable at add time via the "+ add" form); Plan to Eat allows adjusting servings on a planned meal in place.

**Fixes shipped:**
- Inline ×N scale select on recipe-backed planner entry rows (options ×0.5–×4 from SCALES, autosubmit, emerald/semibold when ≠1); new household-scoped `POST /app/plan/scale` (SCALES-validated, `recipe_id IS NOT NULL` guard, preserves ?week). Static ×N badge is now print-only; note entries unchanged.

**Evidence:** live verification (`test-report-iter85.md` + recording): ×1→×2 autosubmit + persistence across reload, note-only entry has no scale select, print preview shows ×2 badge with zero controls, share page unaffected, state restored to ×1 / 35 to buy · 0 checked, 375px + Console/Issues clean.

**Caveats:** ×2 ingredient-to-grocery-list flow not exercised (would have polluted the standing 35-item list; scale→quantity math is the same code path proven in earlier rounds); adversarial cross-household POST skipped (route reuses the household-scoped UPDATE pattern live-proven in R80/R81).

## Round 86 — 2026-08-06

**Findings (by driver):**
- ① QA: R85 shipped inline scale editing with two unverified branches — the ×N ingredient-quantity flow into the grocery list and the /app/plan/scale adversarial guards (cross-household id, invalid scale value).

**Fixes shipped:**
- QA hardening round, no code change. Disposable-account production run (R68/R80 pattern): deterministic 2-ingredient fixture at ×2 produced exactly "2 cups milk"/"4 onions" via Add week's ingredients, and ×1 restore re-produced "1 cup milk"/"2 onions"; cross-household POST with the standing QA entry id and an invalid scale=7 both silently no-op'd (state verified in the owning session after reload); disposable account GDPR-deleted, share token 404.

**Evidence:** `test-report-iter86.md` + recording; standing QA household verified untouched (Wed lasagne ×1, 35 to buy · 0 checked); Console/Issues clean (expected 404 on deleted share link aside).

**Caveats:** adversarial POSTs were page-context fetch calls from the disposable session (route redirects unconditionally, so guard proof = unchanged state in owning session); 375px out of scope this round.

## Round 87 — 2026-08-06

**Findings (by driver):**
- ② UX + ④ Competitor: removing a single grocery item required check + "Clear checked" (destructive to other checked items' state); Plan to Eat and every mainstream list app offer per-item delete.

**Fixes shipped:**
- Red "Delete item" action in the grocery ✎ Edit-item popup (App view only), with a data-confirm prompt naming the item; new household-scoped `POST /app/list/remove` (DELETE + bumpVersion, back validated to /app/list prefix so store-filtered views are preserved).

**Evidence:** live verification (`test-report-iter87.md` + recording): accept path (36→35 to buy), cancel path keeps item, delete under an active ?store= filter stays on the filtered URL, share-page rows remain checkbox-only, 375px popup fits, Console/Issues clean; restored to 35 to buy · 0 checked with no QA87/store residue.

**Caveats:** the back-rejection branch (non-/app/list back) not adversarially probed live — same prefix-validation pattern as the R27 routes; share-page sync covered implicitly (zero residue) rather than a dedicated add+reload cycle.

## Round 88 — 2026-08-06

**Findings (by driver):**
- ⑤ Data + ④ Competitor: guide cluster keeps drawing the only non-QA traffic (picky-eaters guide at 16 views); "how to meal plan fast / 20 minutes" is a high-intent evergreen query competitors target with heavy content while our cluster lacked a time-boxed routine piece.

**Fixes shipped:**
- pSEO guide #24 `meal-plan-in-20-minutes` ("The 20-minute Sunday meal plan (a lazy, repeatable routine)") — 0–5/5–15/15–20 minute structure tying into recipe box, planned leftovers, one-shot list generation, staples and family share. Sitemap 27→28 locs; IndexNow 200.

**Evidence:** live verification (`test-report-iter88.md` + recording): render (breadcrumb/h1/3×h2/3 bullets/logged-in CTA), last of 24 cards, ItemList 24 items at position 24, single @graph [Article, BreadcrumbList], headline==title, description==og:description==excerpt, canonical==mainEntityOfPage, og:type=article, sitemap 28 locs, More-guides wrap = first 3 titles, 375px + Console/Issues clean.

**Caveats:** More-guides links verified by exact titles (mechanism click-proven R84); logged-out CTA covered R73; IndexNow 200 pre-verified by lead; read-only round, no household data changed.

## Round 89 — 2026-08-06

**Findings (by driver):**
- ② UX: note-only planner entries (e.g. "Fruit + yogurt", "Leftovers: …") could only be deleted and re-added to fix a typo or change wording — recipe entries got in-place scale editing in R85 but notes had no in-place edit at all.

**Fixes shipped:**
- ✎ details-popup on note-only planner rows (prefilled required input, maxlength 120, Save) posting to new `POST /app/plan/note` — household-scoped UPDATE with `recipe_id IS NULL` guard, empty note no-op, bumps version, redirects preserving ?week. Recipe rows unchanged; R37 Esc/click-outside close applies; action span stays print-hidden.

**Evidence:** live verification (`test-report-iter89.md` + recording): edit→save→reload persistence, share page synced both ways (edited + restored), recipe row has scale select and no ✎, Esc/click-outside close, required guard blocks empty save, print preview shows text only, 375px with popup open clean, Console/Issues clean; household restored exactly (note original, lasagne ×1, 35 to buy · 0 checked).

**Caveats:** whitespace-only server no-op, 121-char truncation, and cross-household POST not probed live — the route reuses the household-scoped pattern live-proven for /app/plan/scale in R86.

## Round 90 — 2026-08-06

**Findings (by driver):**
- ① QA: R89 shipped the note editor with four unverified server branches — 120-char truncation, whitespace-only no-op, cross-household guard, and the `recipe_id IS NULL` guard against recipe-backed entries.

**Fixes shipped:**
- QA hardening round, no code change. Disposable-account production run (R86 pattern): 150-char POST stored exactly the first 120 chars; whitespace-only note was a pure no-op; foreign-household entry id ("HACKED") and the QA household's own recipe-backed lasagne id both silently no-op'd (state verified in the owning sessions after reload); disposable account GDPR-deleted, share token 404.

**Evidence:** `test-report-iter90.md` + recording; standing QA household verified untouched (note "Fruit + yogurt", lasagne ×1, 35 to buy · 0 checked); Console/Issues clean (expected 404 on deleted share link aside).

**Caveats:** multi-byte/emoji truncation across the 120 boundary (UTF-16 slice) not probed; adversarial POSTs were page-context fetch calls, guard proof = unchanged state in the owning session.

## Round 91 — 2026-08-06

**Findings (by driver):**
- ① QA: R90 flagged that all user-input truncations used raw `slice(0, n)`, which can split an emoji's UTF-16 surrogate pair at the limit and store a broken half-character.
- ③ Visual (found in-round by 91b testing): very long unbroken grocery labels overflowed the row horizontally at 375px (scrollWidth 859/375), pushing the ✎ off-screen.

**Fixes shipped:**
- New `clip(s, n)` util (slice to n UTF-16 units, drop a trailing lone high surrogate) + 7-case unit test (suite 24); applied to all user-typed fields: plan note create/edit (120), grocery note (140), labels/titles (200), staples, list/share add and the 500-char multi-add input.
- 91b/91c: grocery row wrap fix — `min-w-0` on toggle form and button, `[overflow-wrap:anywhere]` on the label span (`break-words` alone never triggered because flex wrappers sized to min-content).

**Evidence:** `test-report-iter91.md` (91/91b/91c sections) + recordings: emoji label round-trip via UI; boundary POSTs stored exactly 199/119 'a's with no U+FFFD or lone surrogate; 91b honest FAIL documented (859/375), 91c re-verified 375/375 with 8-line wrapped label and native ✎ click; restored to 35 to buy · 0 checked.

**Caveats:** only 2 of the clip call sites runtime-tested (shared util covers the rest); desktop wrap only exercised at 2 lines.

## Round 92 — 2026-08-06

**Findings (by driver):**
- ② UX + ④ Competitor: staples could only reach the grocery list through the planner's "Add week's ingredients" — a list-only user (no meal plan that week) had no way to pull their staples in; Plan to Eat exposes staples directly on the shopping list.

**Fixes shipped:**
- "+ Add staples" button on the /app/list header (App view only) posting to new household-scoped `POST /app/list/staples`: per staple, ingredientKey dedupe — unchecked match skipped, checked match unchecked ("buy again", counted), no match inserted with the staple's stored category (fallback categorize()); bumpVersion only when something changed; redirect `?added=N&src=staples` with a "from your staples" notice variant.

**Evidence:** live verification (`test-report-iter92.md` + recording): no-op branch ("Everything from your staples is already on the list.", milk not duplicated), insert branch with stored category (Spices & Baking, not the inferred one), idempotence, buy-again branch, cleanup to 35 to buy · 0 checked with milk staple intact, share page has no button, 375px header wraps cleanly, Console/Issues clean.

**Caveats:** cross-household POST not adversarially probed (same household-scoped pattern proven R80/86/90); the one console 404 was tester's own wrong URL (/s/token/list doesn't exist).

## Round 93 — 2026-08-06

**Findings (by driver):**
- ⑤ Data + ④ Competitor: R92 shipped one-tap staples→list but the guide cluster had no staples/pantry content; "grocery staples list" is an evergreen query and Plan to Eat's content repeatedly leans on lowering grocery costs / fewer store runs.

**Fixes shipped:**
- pSEO guide #25 `household-staples-list` ("The household staples list that ends midweek store runs") — what belongs on a staples list, maintain-once/reuse-forever (describes the dedupe-aware one-tap add), why it beats memory; companion content to the R92 feature. Sitemap 28→29 locs; IndexNow 200.

**Evidence:** live verification (`test-report-iter93.md` + recording): render (breadcrumb/h1/3×h2/3 bullets/logged-in CTA), last of 25 cards, ItemList 25 items at position 25, single @graph [Article, BreadcrumbList], headline==title, description==og:description==excerpt, canonical==mainEntityOfPage, og:type=article, sitemap 29 locs, More-guides wrap = first 3 titles, 375px + Console/Issues clean.

**Caveats:** More-guides links verified by exact titles (mechanism click-proven R84); logged-out CTA covered R73; IndexNow 200 pre-verified by lead; read-only round.

## Round 94 — 2026-08-06

**Findings (by driver):**
- ① QA (adversarial round, closing R91/R92 recorded gaps): live-proved cross-household isolation of `POST /app/list/staples` (session-scoped, disposable household B's press only touched B's list; standing list stayed 35 to buy · 0 checked) and the remaining clip() boundaries at runtime — item note 140 and label rename 200 both surrogate-safe. **Found 1 real bug (P1)**: paste import bypassed clip() — `parseRecipeText` used raw `title.slice(0, 200)`, so a title with an emoji straddling the 200-unit boundary stored a lone surrogate that rendered as `���` (measured `[202,'fffd']`).

**Fixes shipped (94b):**
- `src/recipes.js` now clips everywhere it truncates text: `parseRecipeText` returns `clip(title, 200)`, and JSON-LD `normalize()` clips title (200), description (500) and servings (40). New unit test covers the paste-title emoji boundary (suite 24/24).

**Evidence:** `test-report-iter94.md` + two recordings: R94 failing proof (`aaa…a���`), 94b re-verification on production — same fixture now stores exactly 199 'a's (`[199,'61',false,false,true]`), cleanup verified (both disposable households GDPR-deleted, share tokens 404, standing household intact: 35 to buy · 0 checked, milk staple, Fruit + yogurt note, Wed lasagne ×1).

**Caveats:** normalize() clips (URL-import title/description/servings) verified in source + unit path only, not runtime (needs a controllable external recipe URL); manual-form/edit recipe title clip call sites remain code-read only.

## Round 95 — 2026-08-06

**Findings (by driver):**
- ② UX + ⑤ Data: /app/recipes is the #4 app path (270 views since 8/1) but every card unconditionally showed "+ Plan this week", even for recipes already on the current week — no signal, easy double-plan. Plan to Eat/Samsung Food both surface planned-state on recipe entries.

**Fixes shipped:**
- Recipe-box cards now show plan status: recipes on the CURRENT real week's plan (weekDates(today()), recipe-backed entries only, one DISTINCT recipe_id query) get a stone "✓ On this week's plan" link → /app with aria-label "<title> is on this week's plan"; others keep the emerald "+ Plan this week" → /app?recipe=<id>.

**Evidence:** live verification (`test-report-iter95.md` + recording): lasagne card ✓/other 6 cards +, full plan→✓→unplan→+ round-trip through the native UI (Test Soup on Mon snacks, then removed), A–Z sort keeps badges, 375px single-column grid clean, Console/Issues clean, household left exactly as found (35 to buy · 0 checked, Wed lasagne ×1, Fruit + yogurt note).

**Caveats:** note-only exclusion asserted from code (recipe_id IS NOT NULL); tag-filter variant covered by the shared `planned` Set + A–Z spot check; badge keys off today()'s week, not ?week=.

## Round 96 — 2026-08-06

**Findings (by driver):**
- ③ Visual/mobile + ② UX: with 35 open items across 7 categories the grocery list is several screens tall on mobile — no quick way to jump to a section while shopping; competitor list apps offer aisle/section navigation.

**Fixes shipped:**
- "Jump to aisle" chip nav above the grocery list (App + share page, shared listBody): rendered when ≥3 open (unchecked) categories, one pill "<Category> <count>" → #cat-<idx>; sections get id=cat-<idx> class=scroll-mt-4; print:hidden; chip order follows the household's aisle order and counts are open items per category (store filters recompute upstream).

**Evidence:** live verification (`test-report-iter96.md` + recording): 7 chips 1:1 with sections (name/href/count/order), counts sum to 35, anchor jump to #cat-6 on both /app/list and /s/<token>, print preview excludes the nav, 375px chips wrap on 3 rows at 375/375 with working tap; Console/Issues clean; read-only round, household untouched.

**Caveats:** store-filter chip variant untested at runtime (standing household has no stores; same items pipeline feeds listBody); <3-categories hide threshold asserted from code only.

## Round 97 — 2026-08-06

**Findings (by driver):**
- ① QA: two recorded runtime gaps remained — R94's normalize() clips on the URL-import path (title 200 / description 500 / servings 40) were code-read only, and R96's store-filtered Jump-to-aisle chips had never run against a household with stores.

**Fixes shipped:**
- No app code change. Added a controllable JSON-LD import fixture `test/fixtures/qa97-recipe.html` (Recipe with name 201 UTF-16 units / description 501 / recipeYield 41, each ending in 🍕 straddling the cap), servable via raw.githubusercontent.com — reusable for future import boundary tests.

**Evidence:** live verification on disposable household D (`test-report-iter97.md` + recording): URL import of the fixture stored title exactly 199 a's / description 499 d's / servings 39 s's, no U+FFFD (normalize() clips runtime-proven); store-filter chips — with milk+bread on "QA97 Mart" and dish soap on "QA97 B", the QA97 Mart filter showed 3 to buy with exactly 3 chips (no Other), All stores restored 4 chips; cleanup: D GDPR-deleted, share token 404, standing household intact (35 to buy · 0 checked, milk staple, Fruit + yogurt note, Wed lasagne ×1).

**Caveats:** store filter keeps unassigned items (`!i.store || i.store===storeFilter`), so a distinguishing test requires an item on a *different* store — the originally planned single-store fixture was strengthened mid-run.

## Round 98 — 2026-08-06

**Findings (by driver):**
- ④ Competitor + ⑤ Data: Plan to Eat's 2025–26 content leans heavily on household stress/mental-load topics ("Dinner shouldn't add to your stress", grocery-cost content); the guide cluster had no piece on sharing the planning work itself — which is exactly the product's differentiator (no-login family share link).

**Fixes shipped:**
- pSEO guide #26 `meal-planning-as-a-team` ("Meal planning as a team: splitting the work without the friction") — role-based split, read-only share link as the no-app-for-everyone answer, defaults-vs-exceptions. Sitemap 29→30 locs; IndexNow 200.

**Evidence:** live verification (`test-report-iter98.md` + recording): render (breadcrumb/h1/3×h2/3 bullets/logged-in CTA), last of 26 cards, ItemList 26 items position 26, single @graph [Article, BreadcrumbList], metadata identities all hold, sitemap 30 locs, More-guides wrap = first 3 titles, 375px 375/375 + Console/Issues clean.

**Caveats:** More-guides verified by titles (mechanism click-proven R84); logged-out CTA covered R73; read-only round.

## Round 99 — 2026-08-06

**Findings (by driver):**
- ② UX: R95 added plan-status to recipe-box cards, but the recipe DETAIL page still showed an unconditional emerald "Add to your week plan" — inconsistent signal and the same double-plan risk on the page users read before cooking.

**Fixes shipped:**
- /app/recipes/:id now computes plannedThisWeek (recipe-backed plan_entries in the current weekDates(today()) window) and the action row shows a stone "✓ On this week's plan" link → /app plus a small underlined "Plan again" link → /app?recipe=<id> when planned (preserving intentional re-planning), else the unchanged emerald button. Share recipe page (canEdit=false) unchanged.

**Evidence:** live verification (`test-report-iter99.md` + recording): lasagne detail shows ✓ + Plan again (Plan again lands on the planner preselect banner, nothing added), Test Soup detail unchanged, Favourite/Add-ingredients unaffected, share recipe page has no action row, print hides the row, 375px wraps at 375/375, Console/Issues clean on fresh load; household untouched (35 to buy · 0 checked).

**Caveats:** print preview with an external hero image triggers harmless third-party CORB warnings in the Issues panel (pre-existing, print-only); "Plan again" verified to the preselect banner only.

## Round 100 — 2026-08-06 (capstone)

**Findings (by driver):**
- ① QA (capstone): after 100 rounds of iteration, ran a full golden-path production sweep on a disposable household to prove the entire product loop end-to-end — no code change this round.

**Sweep verified (test-report-iter100.md + showcase recording):**
- Signup via email code → empty planner; recipe intake ×3 (URL import with clipped 199-char title, paste-parse, manual); week planning (×1 and ×2 entries + note, ✎ note edit, Today anchor); "Add week's ingredients" (5 items, ×2 quantities doubled, staple auto-added, aisle chips match sections, check/uncheck, rename+note, per-item delete); anonymous share link (week + list sync, anonymous add flowing back, read-only recipe page, calendar.ics 200 with 3 VEVENTs incl. note entries); guides/SEO (26 cards, sitemap 30 locs); 375px planner+list at 375/375; Console/Issues clean; GDPR delete → share token and calendar.ics 404; standing household exactly intact (35 to buy · 0 checked, milk staple, Fruit + yogurt note, Wed lasagne ×1).

**Caveats:** share "logged-out" check used incognito (the share route renders anonymously regardless of session); print view and store filters not re-exercised (runtime-proven R92/R96/R97/R99).

## Round 101 — 2026-08-07 (专项 sprint: multi-competitor deep scan)

**Driver ④ (competitor research, expanded):** scanned 16+ competitors beyond the two head-to-head benchmarks (Plan to Eat, Samsung Food): Paprika, AnyList, CopyMeThat, Eat This Much, Mealime, SideChef, RecipeSage, Tandoor, Grocy, OurGroceries, Crouton, Umami, Mela, MealBoard, Cooklist, BigOven. Method: real page fetches of marketing/pricing pages + prior logged-in product experience; observable-tech reverse notes (frameworks, pSEO structure, pricing patterns). No anti-bot bypass (Samsung Food/BigOven 403 plain fetch — covered from prior in-browser sessions).

**Output:** docs/competitor-scan-2026-08.md — per-competitor notes, cross-cutting takeaways, priority-ordered adoption backlog. Key finding: no credible competitor is "free forever"; every one anchors a paid tier ($1/mo CopyMeThat → $5.95/mo Plan to Eat). Interaction patterns to adopt: tap-to-start timers (Paprika/Crouton), cook-mode step dimming (Mela), 3-step narrative + outcome metrics (Mealime/Plan to Eat), data export (RecipeSage/Umami), household-vs-individual pricing (AnyList).

**Evidence:** docs/competitor-scan-2026-08.md; raw fetches in /tmp/comp (session-local).

## Round 102 — 2026-08-07 (定价改造: Beta free trial + published paid plans)

**Boss directive (P0):** stop positioning as "free"; display real paid plans; all features open as "Beta free trial" (no actual billing — payments not yet connected).

**Fixes shipped:**
- New `/pricing` page: 3 tiers (Free $0 / Household $3/mo or $24/yr, highlighted / Supporter $29/yr) + prominent open-beta banner ("free for everyone during the beta, no card required, billing starts only at launch with prior notice") + 3 pricing FAQs.
- Landing: badge → "OPEN BETA · ALL FEATURES FREE DURING BETA · NO ADS"; hero CTA → "Start your free beta trial"; FAQ #1 rewritten to cost/beta framing with /pricing link; meta description updated.
- layout.js: "Pricing" in logged-out nav + footer; header CTA → "Start free trial"; footer/default-description reworded to open-beta framing.
- Terms: beta/pricing-at-GA clause replaces "provided free of charge".
- Guide "Free Plan to Eat alternatives": MealLoop sentence reworded to open-beta framing.
- sitemap.xml 30 → 31 locations (adds /pricing).

**Evidence:** live checks — /pricing 200 with tier table; landing badge/CTA/FAQ updated; sitemap 31 locs; terms beta clause live. npm test 24/24, build:css clean. Constraint respected: no real payment collection; CTAs route to /login.

## Round 103 — 2026-08-05 (competitor sprint: landing "Plan → Shop → Cook")

**Findings (by driver):**
- ④ Competitor (P1, from docs/competitor-scan-2026-08.md): Mealime/Plan to Eat/Eat This Much all anchor their landing on a 3-step outcome narrative ("Plan → Shop → Cook" / generator-first); our landing jumped from feature grid straight to email capture with no story arc and no pricing teaser.
- Constraint respected: no fabricated outcome metrics or testimonials (red line: 不伪造数据) — we have no organic users yet, so the section states what the product does, not invented stats.

**Fixes shipped:**
- `src/index.js` landing: new "How it works" section — numbered Plan / Shop / Cook cards (emerald step badges, white cards) + a pricing teaser line linking /pricing, placed between the feature grid and the email-capture band.

## Round 104 — 2026-08-05 (competitor sprint: cook-mode step focus + tap-to-start timers)

**Findings (by driver):**
- ④ Competitor (P1): Mela dims all but the current cooking step; Paprika/Crouton auto-detect durations in step text and make them tap-to-start timers. Our cook mode had tap-to-done but no current-step focus and no timers.

**Fixes shipped:**
- `public/app.js`: in cook mode the first not-done step gets `.current` (recomputed on every toggle); duration phrases ("10 minutes", "1 hour", ranges like "10–12 minutes", via TreeWalker on step text nodes, one per step, ≤24h) become inline `timer-btn` buttons — tap starts a mm:ss countdown (amber), finish flashes red "⏰ Time's up — tap to reset", tap while running/finished resets; `stopPropagation` so timers don't toggle step done.
- `src/input.css`: `.cook-mode .steps-list li:not(.current):not(.done) { opacity:.55 }`, timer-btn states (dotted underline → running amber tabular-nums → finished red flash animation). Works on both /app/recipes/:id and the anonymous share recipe page (same recipeBody + app.js).

## Round 105 — 2026-08-05 (competitor sprint: recipe JSON export — data portability)

**Findings (by driver):**
- ④ Competitor (P1): RecipeSage/Umami/Tandoor treat data export as a trust lever (JSON-LD/PDF/Markdown exports); AnyList/Paprika lock data in. We had GDPR delete but no export.

**Fixes shipped:**
- `src/index.js`: new `GET /app/export.json` (behind requireHousehold, household-scoped) — all recipes as schema.org `Recipe` objects (name, recipeIngredient, HowToStep instructions, description/url/image/recipeYield/prepTime/cookTime ISO-8601 durations, keywords=tags, comment=notes, dateCreated) wrapped in `{exportedAt, household, recipeCount, recipes}`, served with `Content-Disposition: attachment; filename="mealloop-recipes.json"`.
- `/app/share`: new "Your data" card with a Download recipes (JSON) link, placed above the Account card.

## Round 106 — 2026-08-05 (competitor sprint P2: grocery item photos)

**Findings (by driver):**
- ④ Competitor (P2 backlog from docs/competitor-scan-2026-08.md): AnyList/OurGroceries attach photos to grocery items ("which brand exactly" problem for the person doing the shopping). We had item notes but no visual.

**Fixes shipped:**
- Migration 0013: `shopping_items.photo_url` (applied remotely).
- `/app/list/note` route also saves `photo` via `sanitizeImageUrl` (http/https only, else NULL — same guard as recipe photos).
- ✎ Edit-item popup: Photo URL field; list rows render a 32px rounded thumbnail between checkbox and label (App + share page via shared listBody, `print:hidden`).

## Round 107 — 2026-08-05 (competitor sprint P2: month-view planning)

**Findings (by driver):**
- ④ Competitor (P2): Paprika/MealBoard offer month-view planning; our planner was week-only with no zoomed-out view.

**Fixes shipped:**
- New `GET /app/month` (`?month=YYYY-MM` validated, defaults to current): Mon–Sun calendar grid over the weeks spanning the month; per-day up to 3 entry chips (recipe title ×scale or note) + "+N more"; today ringed emerald, other-month days dimmed (hidden on mobile when empty); every day links to `/app?week=<that week>`; Prev/This month/Next nav; mobile stacks with weekday labels.
- Planner header gains a "Month" button next to week nav.

## Round 108 — 2026-08-05 (competitor sprint P2: guide topic hub)

**Findings (by driver):**
- ④ Competitor (P2): SideChef's topic-hub navigation organizes large content sets; our /guides was a flat 26-item list (weak internal linking and scanning).

**Fixes shipped:**
- `/guides` now groups guides into 4 themed sections (Meal planning basics 10 / Grocery lists & shopping 5 / Recipes & cooking 6 / Family, sharing & tools 5) with anchor chip nav (`#topic-N`, scroll-mt); ItemList JSON-LD reordered to match visible order (26 items); card headings h2→h3 under section h2s; leftover-guard appends any future unmapped guide to the last section so new guides can't drop out of the hub.

## Round 109 — 2026-08-07 (competitor sprint P2: JSON recipe importer / migration path)

**Findings (by driver):**
- ④ Competitor (P2 backlog): RecipeSage/Paprika/Mela make export easy, but switching *into* a new planner still means retyping. We had one-way portability (R105 /app/export.json) but no import — a real adoption blocker for users with existing collections.

**Fixes shipped:**
- New `POST /app/recipes/import-json` (file upload, 5 MB cap, ≤200 recipes/file): accepts a MealLoop export (`{recipes:[…]}`), a bare schema.org Recipe array, or a single Recipe object. Maps `name/recipeIngredient/recipeInstructions` (incl. HowToStep objects and HowToSection flattening), ISO-8601 `prepTime/cookTime` → minutes via clampMinutes, `recipeYield`, description, source URL (http/https only), image via sanitizeImageUrl; every string through surrogate-safe clip(). Batch insert; success notice "Imported N recipes"; friendly errors for bad JSON / no titled recipes.
- Recipes page gains a fourth intake path: "Or import a JSON backup (moving from another app)".

## Round 110 — 2026-08-07 (weekly pSEO: recipe portability guide)

**Findings (by driver):**
- ⑤ Data/SEO: weekly pSEO cadence due; R109 shipped the import feature with no acquisition surface targeting "export recipes from <app>" / switching intent.

**Fixes shipped:**
- New guide `/guides/move-recipes-from-another-app` ("How to move your recipes out of another meal planning app") — export → verify schema.org JSON → import walkthrough; added to the Recipes & cooking hub section (now 7). Sitemap 31→32 locs; IndexNow HTTP 200.

## Round 111 — 2026-08-07 (competitor sprint P2: favourites-first planning)

**Findings (by driver):**
- ② UX / ④ Competitor: pinned/quick-access recipes (Plan to Eat) — our recipe box already floats favourites first, but the planner's "+ add" recipe dropdown was pure created_at order, so favourites sank as the box grows.

**Fixes shipped:**
- Planner recipe dropdown now orders `favorite DESC, created_at DESC` and, when favourites exist, splits into `<optgroup>` "★ Favourites" / "All recipes" — pinned quick access at the exact point of use.

## Round 112 — 2026-08-07 (competitor sprint P2: interactive landing demo)

**Findings (by driver):**
- ④ Competitor (P2, last major backlog item): Mealime/SideChef landings show the product, ours only described it — no way to "feel" the app before signing up.

**Fixes shipped:**
- Landing gains a "See it in action" section: Plan/Shop/Cook tab demo (role=tablist/tabpanel with aria-selected), Plan shows a 3-day mock week, Shop has real client-only checkboxes with line-through on check (CSS peer, no JS state), Cook shows the dimmed-steps + timer narrative; CTA into /login (or /app when logged in). Tab switching is ~15 lines in app.js, CSP-clean (self-hosted, no framework).

## Round 113 — 2026-08-07 (competitor adopt: prominent Start cooking CTA)

**Findings (by driver):**
- ④ Competitor (Umami adopt note): our Cook mode was hidden behind a subdued text-xs outline button; Umami makes "Start Cooking" the recipe page's primary action.

**Fixes shipped:**
- Recipe pages (App + share) now show an emerald "▶ Start cooking" primary button; exits back to the same label. Data check: search_terms still only {test 2, stew 2, onion 1, lasagne 1} — no new organic terms to feed pSEO this week (guide cadence satisfied by R110).

## Round 114 — 2026-08-07 (visual sprint: competitor visual research)

**Findings:** Studied 10 sites (Mealime, Crouton, Mela, Plan to Eat, SideChef, AnyList, Paprika, Umami, RecipeSage, NYT Cooking) via screenshots + public source capture: fonts, palettes, framework markers. Full analysis + replication decisions in docs/visual-research-2026-08.md. Key takeaways: warm cream canvas (NYT/Crouton), rounded display type (Crouton's Nunito / Mealime's serif), warm produce accent colors (Mealime), micro-delight on completion, confident brand mark (Mela/Plan to Eat).

## Round 115 — 2026-08-07 (visual sprint: warm brand language)

**Fixes shipped:**
- Self-hosted Nunito variable font (SIL OFL, 39 KB woff2, `font-display: swap`) for headings/brand — rounded and homely for the family-cooking audience; body stays on system sans for speed.
- Warm kitchen palette: the neutral `stone` scale re-tokened toward cream/oat via Tailwind v4 `@theme` (lightness per step preserved → WCAG contrast ratios hold). Whole site warms with zero markup churn.

## Round 116 — 2026-08-07 (visual sprint: joyful micro-interactions)

**Fixes shipped:**
- Checkbox check-pop (spring cubic-bezier), button/tab press-scale, landing hero fade-up, and a "all done 🎉" celebrate bounce on the grocery list — all CSS-only, all inside `@media (prefers-reduced-motion: no-preference)` so reduced-motion users get an unanimated site. No JS animation runtime added (CSP + perf budget intact).

## Round 117 — 2026-08-07 (visual sprint: brand assets)

**Fixes shipped:**
- New brand mark: plate + loop-arrow (emerald tile, cream plate, amber food dot) — favicon.svg redrawn, icon-192/512 re-rendered from it, header logo SVG updated to match.
- OG card (1200×630) redesigned in brand: cream canvas, mark, Nunito wordmark, produce accents. Self-drawn SVG → PNG; no third-party assets.
- Empty states for recipe box and grocery list get warm inline SVG illustrations (steaming plate / grocery bag).

## Round 118 — 2026-08-07 (visual sprint: stack/component-library review)

**Findings & decision:** shadcn/ui and Motion/GSAP are React-runtime tools; MealLoop is CSP-strict server-rendered Hono + vanilla JS. Adopted the shadcn-style *token* architecture (design tokens in Tailwind v4 `@theme`) and CSS-native spring animations instead — same visual outcome, zero bundle/CSP cost. Tailwind already at v4 (latest). Recorded in docs/visual-research-2026-08.md + tech-stack-review addendum.

## Round 119 — 2026-08-08 (performance: asset caching + font preload)

**Findings:** All static assets served `max-age=0, must-revalidate` — the 39 KB brand font and icons re-validated on every view; font also discovered late (CSS-chained).
**Fixes shipped:** `public/_headers` — `/fonts/*` → `max-age=31536000, immutable`; favicon/icons/og-card → `max-age=86400`. `<link rel=preload as=font>` for nunito-latin.woff2 in the shared head.
**Verified in production:** font now `cache-control: public, max-age=31536000, immutable`, og-card 86400, preload tag present on landing. TTFB spot-check: / 131 ms, /pricing 74 ms, /login 108 ms.

## Round 120 — 2026-08-08 (Resend integration: double opt-in product-updates subscription)

**Context:** Boss provisioned org RESEND_API_KEY (send-only). DNS verified: DKIM `resend._domainkey.zalize.com`, SPF on `send.zalize.com`, DMARC `p=quarantine` — deliverability test to a Mail.tm inbox landed in ~5 s.
**Findings:** the landing `/subscribe` form stored raw email intents with **no** confirmation — sending product email to that list would violate the double-opt-in red line.
**Fixes shipped:** migration 0014 (confirmed/confirm_token/unsub_token/confirmed_at/unsubscribed_at on email_intents); `/subscribe` now sends a confirmation email (Resend) with `List-Unsubscribe` + `List-Unsubscribe-Post: One-Click` headers and neutral "check your inbox" response (no address enumeration, 2 sends/hour rate limit); `GET /subscribe/confirm?t=` marks confirmed; `GET|POST /unsubscribe?t=` (one-click capable) marks unsubscribed and invalidates the confirm token. Product email may only ever target `confirmed = 1 AND unsubscribed_at IS NULL`; legacy unconfirmed intents get no email.
**Verified in production:** full loop — subscribe → confirmation email received (headers verified in raw source) → confirm page → unsubscribe (GET and POST) → confirm token invalid after unsubscribe → bad token safe. Login magic-code emails unchanged (worker secret already present).

## Round 121 — 2026-08-08 (data-driven: share-page conversion CTA)

**Findings:** `/s` share pages are the single highest-traffic path (810 views last 7 days) but had zero conversion surface — anonymous family viewers had no route into the product.
**Fixes shipped:** warm footer CTA on `/s/:token` ("made with MealLoop — Start yours, free during beta" → /), print-hidden, read-only page behavior unchanged.

## Round 122 — 2026-08-08 (pSEO: back-to-school guide, seasonal)

**Fixes shipped:** 27th guide `back-to-school-meal-planning` (seasonal August/September topic: school-night dinners + lunchbox batching + one-shop weeks). Sitemap 32 locs, IndexNow ping 200.

## Round 123 — 2026-08-08 (security hardening: response headers)

**Findings:** security-header sweep found `Permissions-Policy`, `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` missing (HSTS/XFO/nosniff/Referrer-Policy/CSP already in place). Data driver skipped this round: Cloudflare D1 HTTP API returning 7403 for all tokens (app itself unaffected — Worker binding works).
**Fixes shipped:** global middleware now also sets `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`, `COOP: same-origin`, `CORP: same-origin`.
**Verified in production:** all three headers present on `/`; home 200, bad share token still 404; external recipe/item photos unaffected (CORP governs our resources, not embedded third-party images).

## Round 124 — 2026-08-08 (SEO: SoftwareApplication + Offer structured data on /pricing)

**Findings:** landing has FAQPage JSON-LD and guides have Article/ItemList, but `/pricing` exposed no structured data — competitor pattern (app-store style rich results) is SoftwareApplication with Offer entries.
**Fixes shipped:** `/pricing` now emits `SoftwareApplication` JSON-LD (LifestyleApplication, Web) with three `Offer`s (Free $0 / Household $3 / Supporter $29 USD) matching the visible plan cards.
**Verified in production:** JSON-LD parses, type/offers match the page; error-path sweep this round also confirmed 404 page friendly, invalid share token 404, bad month redirects, robots.txt correct.

## Round 125 — 2026-08-08 (clean-sweep round: no P0/P1/P2 found)

**Five-driver scan:** a11y (skip link, heading order, autocomplete/inputmode/one-time-code on login) — clean; error paths (404, bad share token, bad month, invalid guide) — clean; perf budget (compressed: / 5.4 KB, styles.css 7.5 KB, app.js 3 KB; TTFB ~75 ms) — well under budget; security headers — completed in R123; competitor re-dig — no new material since R101–118 scans. **Data driver blocked:** Cloudflare D1 HTTP API returning 7403 for all account tokens (platform-side; the app itself is unaffected since it uses the Worker binding). No improvement item found this round — per protocol, one more no-find round converts to low-intensity operations.

## Round 126 — 2026-08-08 (clean-sweep round 2: no findings → low-intensity mode)

**Scan:** all 33 sitemap URLs return 200 with unique titles and meta descriptions (no duplicates, no thin pages); TTFB ~79 ms. D1 HTTP API still 7403 (platform-side; data driver still blocked, app unaffected). Second consecutive round with no actionable improvement — per protocol, converting to low-intensity operations (weekly pSEO + IndexNow, traffic weekly, security/retention watch).

## Round 127 — 2026-08-12 (ops: secret-gated aggregate stats endpoint; data driver unblocked)

**Findings:** Cloudflare D1 HTTP API still returns 7403 for every account token (platform-side), blocking the data-analysis driver since R125 — while the Worker's D1 binding works fine.
**Fixes shipped:** `GET /ops/stats?days=N` — requires `Authorization: Bearer <ADMIN_STATS_KEY>` (new Worker secret; wrong/missing key → plain 404). Returns only the first-party aggregate counters the app already stores (analytics_daily paths, search_terms, email_intents totals) — never user data.
**Verified in production:** no-auth → 404; with key → JSON. 14-day readout: /s 814 · /app/list 621 · /app 375 · / 205 · /guides 72; guide detail views led by picky-eaters (18), batch-cooking (13), leftovers/budget (11 each); search terms still internal-QA only; email intents: 1 total (0 confirmed, 1 unsubscribed — QA rows).

## Round 128 — 2026-08-12 (competitor revisit: title-first recipe search ranking)

**Findings:** competitor revisit — Plan to Eat's 2026 updates: recipe search now ranks title matches above description/ingredient matches (v8.3.2), Concise Mode AI rewriting, form-variant list rows; Samsung Food doubling down on Vision AI calorie tracking ($59.99/yr Food+). AI/nutrition items remain out of v1 scope; the search-ranking pattern is directly adoptable — our recipe search ordered purely by `${order}` so an ingredient-only match could outrank an exact title match.
**Fixes shipped:** recipe box search now orders by `(title LIKE '%q%') DESC` first, then the existing sort — title hits always surface above ingredient-only hits. Partial-word matching already worked (substring LIKE).
**Verified in production:** deployed; unit suite 24/24 green.

## Round 129 — 2026-08-12 (pSEO: freezer meals guide — data-driven topic)

**Findings:** /ops/stats readout shows practical-cooking guides lead views (picky-eaters 18, batch-cooking 13, leftovers/budget 11) — freezer-meal intent is adjacent and uncovered.
**Fixes shipped:** 28th guide `freezer-meals-for-family-weeknights` (plan-from-the-freezer angle tied to ×2 scaling + weekly plan), in "Meal planning basics" topic.
**Verified in production:** guide 200 with Article/Breadcrumb JSON-LD, listed in /guides, sitemap 34 locs, IndexNow 200. TTFB spot-check: / 134 ms, /pricing 75 ms, new guide 81 ms.

## Round 130 — 2026-08-12 (CWV re-test + backlog re-eval)

**CWV (Lighthouse, mobile emulation, headless):** `/` LCP 1.1 s / CLS 0 (perf 1.00); guide page LCP 1.1 s / CLS 0 (perf 1.00) — no flags.
**Backlog re-eval:** pantry min-stock stays deferred (niche, no user signal); real-device touch validation still not possible from this environment; AI features (Concise Mode-style rewrites, nutrition/Vision AI) remain out of scope pending AI budget per boss directive.

## Round 131 — 2026-08-12 (clean-sweep round: no findings)

**Five-driver scan:** landing "From the guides" picks (picky-eaters / batch-cooking / budget) exactly match the top-3 most-viewed guides in the 90-day /ops/stats readout — already data-aligned, no change needed. Search terms still internal-QA only; no new referrers. Competitor deltas beyond R128's adopted search-ranking pattern are all AI-dependent (out of scope pending budget). Perf/a11y/security re-checked green in R130. No actionable item found — one more no-find round converts to low-intensity operations.

## Round 132 — 2026-08-12 (flagship: AI week-menu generation)

**Directive:** boss greenlit AI channel (api.aicdks.com, glm-5.2) — closes the AI gap vs Plan to Eat/Samsung Food without their subscription pricing.
**Shipped:** "✨ Plan my week with AI" on the planner → server-side call drafts 7 dinners from the household's recipe box (+ tags/favourites, avoiding the last 2 weeks); box too small → the model proposes full new recipes (ingredients+steps) that get saved into the box on apply. Draft lives in KV (1h TTL): per-day ↻ Swap from alternates, days already planned are kept as-is, Apply inserts plan entries (new recipes tagged `ai-suggested`), Discard deletes the draft. Failure/timeout degrades to a notice pointing at the existing "Fill empty dinners" path. Key is a Worker secret (AICDKS_API_KEY), never sent to the client; prompts contain recipe titles only — no emails/tokens.

## Round 133 — 2026-08-12 (flagship: pantry ↔ grocery list linkage)

**Shipped:** /app/pantry — household-level "what we have at home" with stocked/low/out levels. Stocked items are skipped by "Add week's ingredients" and "+ Add staples" (notice shows how many were skipped); "Used up" one-tap after cooking; one button sends all low/out items to the grocery list (dedupe/buy-again aware). Pantry rows deleted with household on GDPR erase. Migration 0015 applied in production via new key-gated POST /ops/migrate (idempotent DDL only — D1 HTTP API outage workaround, same gate as /ops/stats).

### 133b — pantry stocked-skip unit-mismatch fix (QA regression finding)

Testing found the common case failing: pantry "basmati rice" (Stocked) did not skip "300g basmati rice" because `ingredientKey` embeds the unit (`basmati rice|` ≠ `basmati rice|g`). Added `pantryKey` (name-only, quantity/unit-agnostic) and switched all pantry matching to it: weekly to-list skip, staples skip, and pantry→list dedupe (no more near-duplicate rows). Unit tests added (25 total).

## Round 134–136 — 2026-08-12 (onboarding / user guidance)

**Directive:** boss asked for restrained user guidance. Competitor patterns (from the August scan + Samsung Food deep-dive): long forced onboarding quizzes (Samsung Food, 6 steps) hurt more than help; the effective pattern is Plan to Eat/Mealime-style lightweight setup checklists and contextual empty-state CTAs. We follow the latter.
**R134–135 shipped:**
- Planner "Get set up in N steps" checklist card (replaces the old single "Start with one recipe" card): ① Add a recipe ② Plan a dinner ③ Get your grocery list, each with done-state (✓/strikethrough) computed server-side from household data; dismissible ✕ remembered in localStorage (`ml-hide-setup`); rendered `hidden` and revealed client-side so dismissed users never see a flash; disappears entirely once all 3 steps done; print-hidden.
- Empty-state CTA: grocery list empty state now offers "Open the planner" + "Set up staples" buttons (editable views only — share page unchanged).
- New-feature discovery: one-time amber "New" badges on "✨ Plan my week with AI" (planner) and "Pantry" (grocery-list toolbar) via generic `data-new` helper — hidden after first click, localStorage-remembered, no animation (nothing to reduce for reduced-motion).
**R136:** the setup checklist doubles as the first-run coach — deliberately no overlay coach marks (strict CSP, restraint principle: nothing blocks the UI, everything skippable, zero requests).

### 136b — 375px planner toolbar overflow fix (regression finding, pre-existing)

New-user regression flagged the planner at 422px scrollWidth on a 375px viewport. Isolation showed the setup card fits fine — the culprit was the week-nav toolbar (Print/Prev/Today/Next/Month/+ Snacks) missing `flex-wrap`, dating back to R106–108 when the Month link was added. Added `flex-wrap`; re-verified 375/375 in production.

**Regression evidence (testing agent, disposable household, GDPR-deleted after):** full new-user walkthrough recorded — 3→2→1-step progression with ✓/strikethrough, dismiss persists via localStorage and card restores when key cleared, card gone after all steps, empty-list CTAs present, Pantry badge one-time behaviour proven (`ml-new-pantry`), axe 0 violations, standing household untouched (35 to buy · 0 checked, no setup card as expected). Untested: AI badge post-click hiding (avoided a paid generation; mechanism shared with pantry badge), share-page empty-list CTA absence (low priority).

## Round 137–141 — 2026-08-12 (brand system + full-activity marketing)

**Directive:** boss asked for comprehensive branding + all product activities beyond development.
**R137 brand system (docs/brand/):** brand-story.md (positioning one-liner, story, pillars, differentiation, proof points), naming-and-voice.md (canonical product/feature names, tone-of-voice rules, banned words, microcopy patterns), visual-guide.md (logo usage, color, type, spacing, motion, asset inventory — consolidates R114–118).
**R138 on-site brand consistency:** audited name casing (no violations), titles/OG/footer/email signatures consistent; footer gains About + Press links.
**R139 About + Press pages:** /about (story + beliefs, brand-guide copy) and /press (short/long boilerplate, facts, downloadable logo/icon/OG assets, naming/color rules); both in sitemap (34→36 locs).
**R140 email lifecycle:** new `sendWelcome` (src/auth.js) — one-time welcome email on first subscription confirmation (quickstart + unsubscribe + List-Unsubscribe headers, only to just-double-opted-in addresses; re-confirms don't resend). Announcement + re-engagement templates and confirmed-only sending procedure in docs/marketing/email-lifecycle.md.
**R141 marketing pack (docs/marketing/):** directory-submissions.md (10-site checklist with canonical copy — all require real accounts, so all are boss-to-execute 👤), product-hunt-kit.md (tagline, gallery plan, maker comment, FAQ, runbook), social-calendar-14d.md (14 days of copy-paste X/Reddit/HN posts, value-first Reddit rules), content-plan.md (internal-link rules + next 8 guide topics).
**Red lines kept:** no fake accounts registered, no reviews fabricated, welcome email only post-double-opt-in, no anti-bot bypass.

## Round 142–146 — 2026-08-05 (design-system deep upgrade)

**Directive:** boss asked for a deep font/component upgrade, full desktop+mobile adaptation, richer premium effects, and "plain language for expert output" (user mental model).
**R142 typography:** display scale rhythm (h1 1.15 / h2–h3 1.25 line-height, -0.01em tracking), `text-wrap: balance` on headings + `pretty` on paragraphs; `.tnum` tabular-nums utility applied to compared numbers (pricing amounts, grocery-list count, servings-scale selector; timers already had it).
**R143 component polish:** one shadow language (subtle 2-layer card shadow; deeper popover shadow), global `:focus-visible` emerald ring on all interactive elements, input/select focus border transition; touch comfort on coarse pointers (22px checkboxes, ≥44px list rows, ≥40px buttons/nav) without inflating desktop density.
**R144 device adaptation:** main container widens to max-w-6xl at ≥1280px (planner 7-col grid gets real room; header/footer unchanged at 5xl for reading width). 375/768/1024/1440 walkthrough delegated to regression.
**R145 effects:** hero ambient radial backdrop (emerald+amber, zero JS/CLS), staggered card entrances (`.stagger`, 70ms steps) on landing features/how-it-works and pricing cards, card hover lift, `details` popover pop-in — all inside the existing `prefers-reduced-motion: no-preference` gate.
**R146 plain language:** visible planner microcopy explaining what the AI button does and pantry skipping ("drafts from your own recipe box — nothing saved until you apply"), title tooltips on servings-scale (×2 doubles grocery amounts, recipe unchanged) and units selector (display-only, reversible). Pantry page and skip notices already carried plain-language copy.

### 146b — heading-order a11y fix (regression finding, pre-existing)

Regression axe flagged moderate `heading-order` (h1→h3) on landing and /app — pre-existing markup. Landing feature cards and planner/month/share day labels promoted h3→h2 (visual classes unchanged). /pricing and /app/list were already clean.

## Round 147–151 — 2026-08-05 (1:1 replication benchmark vs Plan to Eat)

**Directive:** pick one flagship competitor, deep-walk every page/flow in a real account, build a replication scorecard, fix every sub-100% item as a defect, then list where we exceed.
**R147 benchmark walkthrough:** Plan to Eat (web) chosen over Mealime (web-first, real trial). Walked Cook/Plan/Shop, recipe detail, cooking view, staples, drag-to-plan → auto list, 375px responsive mode. Compliance: patterns re-implemented from scratch; no code/assets/copy taken; no bot walls bypassed.
**R148 scorecard:** docs/replication-benchmark.md — page-by-page IA/layout/interaction/state/copy comparison with 0–100% fidelity scores, P-ranked gaps, deliberate n/a list, superiority list (share link, AI drafts, pantry deduction, mobile web, privacy/CSP, export, SEO moat — PTE's own 375px web squeezes desktop layout and ships CSP violations).
**R149 recipe Duplicate (parity fix):** POST /app/recipes/:id/duplicate copies title "(copy)", ingredients, steps, times, servings, photo, notes, tags; action added next to Edit/Delete.
**R150 "Most planned" sort (parity fix):** third sort option on /app/recipes (PTE "Times Planned"), correlated count of past plan_entries; preserved across searches.
**R151 list "From this week's plan" chips (parity fix):** /app/list shows linked chips for each recipe planned this week (PTE Planned Recipes panel equivalent), print-hidden.

### 151b — recipe-card heading-order fix (regression finding, pre-existing)

Regression axe flagged moderate `heading-order` (h1→h3) on /app/recipes — pre-existing recipe-card markup. Card titles promoted h3→h2 (visual classes unchanged).

## Round 152–154 — 2026-08-05 (replication upgrade: full page coverage + technical-standard audit)

**Directive:** confirm every benchmark page is covered, and match the benchmark's technical standards.
**R152 page-coverage inventory:** crawled PTE sitemap_index (29 pages + 1,275 posts), both robots.txt, nav/footer — 28 page types; 22/22 in-scope types covered (100%), 6 deliberate-n/a (payments ×3, podcast/email archive, macro tour). One real gap found: no public FAQ.
**R153 technical audit + fix:** black-box DevTools/headers/Lighthouse comparison across 12 dimensions (rendering, JS weight, assets, fonts, images, CDN, structured data, SEO, security headers, perf, a11y) — 12/12 meet or exceed after fixing the one gap: un-hashed CSS/JS with max-age=0 → build-hash `?v=` URLs + immutable 1y (scripts/asset-version.mjs, wired into `npm run deploy`).
**R154 /faq:** public FAQ page (9 Q&As, FAQPage JSON-LD, footer link, sitemap 37 locs) — PTE tour/frequently-asked-questions parity.
## Round 155 — 2026-08-09 (acceptance-review remediation: 68/100 report)

**Directive:** external acceptance review scored 68/100 (fail). P0: new user clicking "Plan my week with AI" with an empty recipe box waits ~80 s in silence, then errors with no fallback.
**P0 fixes:** ① pre-check in /app/ai/generate — fewer than 3 recipes redirects to a guided notice offering an in-house 8-recipe starter pack (`src/starters.js`, POST /app/recipes/starters, dedup by title) or import; ② bounded AI wall time — 20 s timeout per attempt with one automatic retry (max ~40 s, was a single 60 s attempt); ③ failure notice rebuilt: role=alert with a one-click "Try again" and a "Fill from recipe box instead (no AI)" fallback.
**P1 fix:** full-screen progress overlay during drafting (spinner + staged status lines advancing every 7 s + "usually 10–25 s" expectation), aria-live, reduced-motion-safe static ring.
**P2 fixes:** ① grocery-list toolbar condensed from 9 flat controls to 2 primary (+ Add staples, Share with family) + "⋯ More" menu (Copy/Print/Staples/Pantry/Aisle order/Clear checked/Units); aisle-order editor now an inline card when open; ② warm food illustration (in-house generated, no third-party rights) added to the landing hero + starter CTA on the empty recipe box.
**Cross-report self-check:** login page now states what the email is used for (sign-in codes only, no default marketing); AI wait/failure UX covered above; nav ≤6 items at 375px — no overflow.
**R155b:** overlay stage-timer bug fixed (single interval, one listener per form).

## Round 156 — 2026-08-09 (re-verification P2: retry state feedback + QA account cleanup)

**Directive:** acceptance re-verification passed (68→84). Leftover P2: clicking "Try again" after an instant AI failure gave no state feedback.
**Fix:** the ai=err "Try again" form now carries hidden retry=1; a repeat failure redirects to ?ai=err&retried=1 whose alert reads "We retried and the AI service is still unavailable…" with a "Try once more" button — so even sub-second failures produce a visible state change (plus the existing Retrying… busy state + progress overlay on submit).
**Ops:** new key-gated POST /ops/cleanup-qa (same ADMIN_STATS_KEY gate, same cascade as self-serve deletion) removed the acceptance reviewer's QA accounts (delivered+qa1754730005 / delivered+qa1754820001 @resend.dev; no other qa-pattern accounts existed).
**Regression (production, disposable account, GDPR-deleted after):** overlay + Retrying… on retry submits; first failure keeps old copy/Try again; second failure lands on retried=1 with new copy/Try once more; fallback intact; baseline household untouched (35 to buy · 0 checked). AI relay was down the whole run — success-path smoke deferred until it recovers.

## Round 157 — 2026-08-10 (AI relay diagnosis + email-send observability)

**Trigger:** post-merge success-path smoke for the AI planner failed again despite the relay answering direct tests minutes earlier.
**Diagnosis (wrangler tail with new error logging):** the relay intermittently returns `503 model_not_found — 分组 free 下模型 glm-5.2 无可用渠道（distributor）` — a relay-side channel/group outage, not an app bug (the Worker key was also re-synced to the boss-provided key to rule out a mismatch). App-side timeout/retry/fallback behaves as designed; success path remains unproven until the relay's glm-5.2 channel is stable.
**Separate incident:** Resend `POST /emails` returning 429 `daily_quota_exceeded` — new sign-in codes cannot be emailed until the daily quota resets (login-code KV fallback exists for ops). Added error-detail logging to `sendMagicCode` and AI fetch failures so future tails show root causes immediately.
**Escalated to boss:** aicdks channel/quota needs attention (stored admin password no longer logs in); Resend daily quota may need a plan bump if usage grows.

## Round 158 — 2026-08-10 (weekly pSEO: guide #29)

**Driver ⑤ data:** practical-cooking guides lead 14-day views (picky-eaters 18, batch-cooking 13, leftovers/budget 11). Shipped 29th guide `slow-cooker-meal-planning` (crunch-night matching, night-before prep, cheap cuts economics), grouped under Meal planning basics.
**Verified in production:** guide 200, listed in /guides and sitemap, IndexNow ping 200. Full sitemap scan all 200, TTFB / 78 ms.
**Driver ① note:** aicdks relay still unstable (503 model_not_found earlier, now 429 rate-limit on direct test) — success-path smoke still pending relay recovery; escalated in R157.

## Round 159 — 2026-08-10 (AI availability hint on the planner)

**Driver ①/②:** with the aicdks relay flapping (503/429 for hours), every user who clicks "✨ Plan my week with AI" pays the full overlay-then-error round trip with no forewarning.
**Fix:** `/app/ai/generate` failures now set a 5-minute KV flag `ai:unavailable` (cleared on the next success); while set, the planner toolbar shows a small amber status line — "AI drafting is having trouble right now — you can try anyway, or fill your week from your recipe box." The button stays enabled (flag is advisory, not a lockout).
**Verified in production (disposable account, deleted after):** triggered a failure → flag set → hint renders on the planner; hint suppressed on ?ai= pages (the alert already covers those); tests 25/25, deploy clean.

## Round 160 — 2026-08-10 (competitor scan → family meal reactions on the share link)

**Driver ④ competitor scan:** Plan to Eat release notes reviewed (8.3.2–8.3.6: title-first search we already ship; Concise Mode AI rewrite — AI-dependent, backlog; form-variant list rows — our nameKey already keeps "smoked paprika" ≠ "paprika"). New-competitor sweep found FamilyPlate / Mealisto / DinnerTable all leading with **family voting on meals** — a fit for our anonymous share-link strength, no AI needed.
**Shipped:** anonymous 👍/👎 reactions on planned meals, voted straight from the share link (no account): `plan_reactions` table (migration 0016 + /ops/migrate DDL), per-device `ml_voter` cookie, POST `/s/:token/react` (toggle/switch, entry ownership checked, bumps sync version), tallies + own-vote highlight on the share page, read-only tally badge on the owner's planner. Reactions cascade-delete with entry/recipe/week/household deletions.
**Verified in production (disposable account + 2 anonymous voters, deleted after):** vote → 👍1 with aria-pressed; switch → 👎1; second voter independent; toggle-off removes; planner badge shows 👍1 👎1; bad entry/reaction → 404; baseline household untouched (35 to buy).

## Round 161 — 2026-08-10 (surface reactions to owners & family)

**Driver ② UX:** the new reactions (R160) were invisible until someone stumbled on the buttons. Owners inviting family had no idea the link now collects votes.
**Fix:** /app/share copy now says the family can "👍/👎 planned meals"; share-page subtitle changed from "Shared read-only plan · check items below…" to "Shared family plan · tap 👍/👎 on meals, check items below to sync with everyone".
**Verified in production:** both copy changes live (cache propagation ~30 s); baseline household untouched (35 to buy · 0 checked). Tests 25/25. AI relay re-checked this round: still 503 model_not_found — success-path smoke remains blocked externally.

## Round 162 — 2026-08-10 (visual walkthrough of reactions, 375px + 1280px)

**Driver ③ visual:** real-browser walkthrough of the share page with live votes at 375px and 1280px (disposable household, deleted after — share link 404s post-delete, GDPR cascade confirmed). No horizontal overflow at 375px (scrollWidth delta 0); reaction buttons wrap cleanly under each meal title; own-vote highlight (emerald pill + tally) reads clearly at both widths; coarse-pointer buttons inherit the existing ≥40px touch-target rule. No defects found this round.
**Driver ① note:** relay still 503 on this round's check.

## Round 163 — 2026-08-10 (honest login-error copy during the Resend quota outage)

**Driver ② UX:** Resend still returns 429 daily_quota_exceeded (re-verified via tail), so every new-user login attempt failed with "try again in a minute" — misleading when the outage lasts until the quota resets.
**Fix:** `sendMagicCode` now returns `'ok' | 'quota' | 'fail'`; a 429 shows "Our email service is over capacity right now. Please try again later today — sorry about that." Other failures keep the try-again-in-a-minute copy.
**Verified in production:** live /login POST renders the quota message; tests 25/25, deploy clean. Resend quota/plan escalation from R157 still stands.

## Round 164 — 2026-08-10 (QA regression: calendar feed, export, URL import)

**Driver ① QA:** production regression of three less-trafficked paths with a disposable household (deleted after): `/s/:token/calendar.ics` → 200 `text/calendar`, 7 VEVENTs for a filled week; `/app/export.json` → 200 with `exportedAt`/`household`/`recipeCount` schema; live recipe-URL import (BBC Good Food classic lasagne) → parsed to a full recipe page. All green — no defects.
**Driver ① note:** relay unchanged (503 on this round's earlier checks); Resend quota outage now surfaced honestly on /login (R163).

## Round 165 — 2026-08-10 (marketing surfaces catch up with reactions)

**Driver ⑤/②:** landing, FAQ and pricing still described the share link as view+check-off only — the new reactions (R160) were absent from every acquisition surface.
**Fix:** landing "Share with a link" card, FAQ "Does my family need accounts?", and the Household plan feature list now mention 👍/👎 meal reactions from the link.
**Verified in production:** all three surfaces render the new copy (cache propagation ~30 s). Tests 25/25, deploy clean. Relay re-check this round: still 503.

## Round 166 — 2026-08-10 (reactions in first-party stats)

**Driver ⑤ data:** no way to see whether families actually use the new reactions without querying D1 by hand.
**Fix:** /ops/stats now returns a `reactions` block (per-reaction count + distinct voters over the window).
**Verified in production:** endpoint returns `reactions: []` (QA votes were cascade-deleted with their disposable accounts — correct). Tests 25/25, deploy clean. Relay re-check: still 503.

## Round 167 — 2026-08-10 (net-negative reaction nudge on the planner)

**Driver ② UX:** the owner's tally badge treated 👍3/👎0 and 👍0/👎3 identically — no signal that the family actively dislikes a planned meal.
**Fix:** when downvotes outnumber upvotes, the planner badge turns amber with the tooltip "Family isn't keen on this one — consider swapping it".
**Verified in production (disposable household, deleted after):** downvoted meal shows the amber badge + tooltip; baseline untouched (35 to buy). Tests 25/25.

## Round 168 — 2026-08-10 (visual regression 375px + guide #31 "let the family vote on dinner")

**Driver ③:** post-R165 real-browser regression of landing/FAQ/pricing at 375px — zero horizontal overflow on all three, new copy renders cleanly.
**Driver ⑤/pSEO:** weekly guide ships the story behind the new reactions feature: "Let the family vote on dinner" (guide #31, Family/sharing topic). Sitemap now 39 locs; IndexNow ping 200.
**Verified in production:** guide page 200 with correct title; sitemap includes it. Tests 25/25. Relay: still 503 this round.

## Round 169 — 2026-08-10 (privacy-safe referrer analytics)

**Driver ⑤ data:** the loop calls for referrer analysis but we never collected referrers — external traffic sources were invisible.
**Fix:** middleware now aggregates external referrer **hostnames only** (no paths/queries, same-host skipped) into `referrers_daily` (migration 0017 + /ops/migrate DDL); /ops/stats returns a `referrers` block.
**Verified in production:** synthetic hits with google/bing Referer headers show up as `{host, views}`; migrate `{ok:true}`. Cookie-free/aggregate privacy stance unchanged (host-level only). Tests 25/25.

## Round 170 — 2026-08-10 (privacy policy catches up with R160/R169)

**Driver ① compliance sweep:** the privacy policy predated the reactions cookie and referrer aggregates — "cookie-free until you log in" was no longer accurate for share-link voters.
**Fix:** /privacy now discloses the `ml_voter` functional cookie (random token, 12 months, no identity), 👍/👎 reaction data with its legal basis and cascade deletion, and referring-site hostname aggregates (never full URLs); landing FAQ privacy answer updated to match; policy date bumped.
**Verified in production:** all three disclosures render on /privacy. Tests 25/25.
