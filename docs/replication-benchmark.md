# Replication benchmark — Plan to Eat (web) vs MealLoop

Date: 2026-08-05 · Rounds R147–R151

**Benchmark product:** Plan to Eat (app.plantoeat.com), chosen over Mealime because it is
web-first, offers a real 14-day trial we can deep-walk, and maps 1:1 onto MealLoop's
plan → shop → cook loop. Walkthrough was done in a real trial account (Cook / Plan / Shop,
recipe detail, cooking view, staples, drag-to-plan → auto shopping list, 375px responsive
mode). Evidence screenshots: ss_069c67ec (recipe box), ss_35b2aca8 (planner),
ss_4c577c84 (recipe detail), ss_0f9e5022 (cooking view), ss_89ae3f96 (staples),
ss_7f3d7bee (auto-generated list), ss_189a0205 (375px).

**Compliance boundary:** structure/interaction/experience patterns replicated and
re-implemented from scratch; no closed-source code, copyrighted images, fonts, trademarks
or verbatim copy taken; no bot walls bypassed (trial account is a normal signup).

Scoring: fidelity of *our* equivalent vs the PTE pattern, 0–100%. "n/a by design" =
deliberately out of scope (recorded, not a defect).

## Page/flow-by-flow comparison

### Information architecture
| PTE | MealLoop | Fidelity | Gap |
|---|---|---|---|
| 3-section top nav Cook / Plan / Shop + Account | Planner / Recipes / List / Pantry + account menu | 95% | Same mental model, ours adds Pantry; naming is noun-based (fine) |
| Sidebar sub-nav per section (My Recipes / Queue / Freezer / Friends / PTE Recipes) | Flat pages | 80% | Queue/Freezer/Friends/curated recipes are social/curated features — n/a by design (single-household product) |

### Recipe box (PTE "Cook")
| PTE pattern | MealLoop | Fidelity | Gap |
|---|---|---|---|
| Grid (photo cards) / Table toggle | List with favourites-first | 75% | No photo-grid view (P2) |
| Search + 13 sort options incl. Times Planned, Recently Added | Search (title-first ranking) + sort newest/title | 70% | **P1: add "Most planned" sort — we already track plan stats** (fixed R150) |
| Faceted filters (course/cuisine/ingredient/tags/calories/time/rating/website) | Tag filter + favourites chip | 65% | Course/cuisine/calories/rating are metadata we don't collect — tags cover the household use case; ingredient-based filter P2 |
| Add Recipe split-button: by hand / clip from web / paste link / import from other apps | Paste URL / paste text / type by hand / JSON import | 95% | Same four entry paths |
| Empty state with onboarding options + help links | "Get set up" checklist + empty-state CTAs | 95% | — |

### Recipe detail
| PTE pattern | MealLoop | Fidelity | Gap |
|---|---|---|---|
| Photo, source link, description, prep/cook/total time, servings | All present (total time derivable) | 95% | — |
| Original vs Scaled ingredient tabs with serves input, metric + mixed-units toggles | ×N scaling at planning time; household-level metric/imperial switch | 85% | Scaling lives on the planner (deliberate: scaling matters for the list); display-only unit switch is equivalent |
| Numbered directions, Concise Mode | Numbered steps | 90% | Concise (AI-shortened) mode n/a by design (would alter user's recipe text) |
| Cooking View (Overview / Step by Step) | Cook mode: screen-wake, current-step focus, tap-to-start timers | 100% | Ours adds inline timers |
| Add to Planner / View History / Plan stats | Add to week plan / ✓ On this week's plan / "Planned N times · last on …" | 100% | — |
| Duplicate | — | 0% → 100% | **P1: added Duplicate action (R149)** |
| Print | Print button (clean print stylesheet) | 100% | — |
| Make private / Queue / Rating / Nutrition calc / Social share | — | n/a by design | Household-private by default; nutrition calc P2 (needs food DB) |

### Planner (PTE "Plan")
| PTE pattern | MealLoop | Fidelity | Gap |
|---|---|---|---|
| Month + Week views, Today jump | Week planner + /app/month grid, today highlight | 95% | — |
| Drag recipes from sidebar onto meal slots | "+ add" per-day dropdown (favourites-first) + ?recipe= preselect | 85% | Drag&drop is mouse-only; our tap flow works on touch too. PTE itself falls back to tap on mobile. P2: optional desktop drag |
| Meal rows Breakfast/Lunch/Dinner/Snacks/Notes per day | Dinner + Snacks slots + per-entry notes | 85% | Breakfast/Lunch rows P2 (our audience plans dinners; notes cover exceptions) |
| Menus (save/reuse a week), copy/move/swap | Saved menus with apply + duplicate | 95% | — |
| Serving-size edit on planned entry | ×N scale select per entry | 100% | — |
| Print meal plan, share meal plan | Print + household share link (read-only week + list) | 100% | Ours shares list+week in one anonymous link |

### Shopping list (PTE "Shop")
| PTE pattern | MealLoop | Fidelity | Gap |
|---|---|---|---|
| List auto-populates from planner date range (today/7d/2w/custom) | One-tap "Add week's ingredients" from the shown week | 90% | Explicit-tap is deliberate (predictable, idempotent); range presets n/a |
| "Planned Recipes" sidebar showing which recipes feed the list | Per-item sources ("from Chicken Parmesan") | 80% → 95% | **P1: added "From this week's plan" recipe chips on the list (R151)** |
| Group by store, categories editing, merge duplicates, metric toggle | Stores + category order editing, auto-merge quantities, units switch | 100% | Merging is automatic (no toggle needed) |
| Sub-groups within category (cheese under Dairy) | Flat within category | 80% | P2 |
| Staples list page with check-to-add | Staples with auto-add + pantry-aware skip | 100% | Ours skips stocked pantry items |
| Item edit/remove/notes, hide removed | Edit popup (note, photo, store, category), check/uncheck | 95% | — |
| Print / share / Deliver Groceries (Instacart) | Print, copy, anonymous share link | 90% | Delivery integration n/a by design (US-only affiliate) |

### Cross-cutting
| Dimension | PTE | MealLoop | Verdict |
|---|---|---|---|
| Mobile web at 375px | Desktop layout squeezed; sidebar eats content; pushes native app | Fully responsive, 44px touch targets | **We exceed** |
| Console/CSP hygiene | CSP violations + blocked trackers in console | Strict CSP, zero console errors | **We exceed** |
| Loading/perf | Rails + heavy JS, spinner-y | SSR, LCP 0.3s, CLS 0 | **We exceed** |
| States (hover/empty/error/loading) | Good empty states, hover cues | Equivalent + reduced-motion fallbacks | Parity |

## Superiority list (ours, beyond the benchmark)
1. Anonymous household share link — family shops without accounts/app installs (PTE Friends requires accounts).
2. AI weekly menu drafts grounded in the household's own recipe box, review-before-apply.
3. Pantry stock levels that subtract from the generated grocery list.
4. Inline tap-to-start timers inside cook mode steps.
5. Mobile-web-first responsive UI (PTE web pushes you to the native app at phone widths).
6. Privacy: no trackers, cookie-free aggregate analytics, strict CSP (PTE ships Sentry/Plausible/Stripe on every page).
7. Open-format export/import (schema.org Recipe JSON) + GDPR self-serve deletion.
8. 26+ SEO guides + structured data (PTE app is behind login, no content moat).

## Fixes shipped from this benchmark (R149–R151)
- R149 — Recipe **Duplicate** action (PTE parity): copies title "(copy)", ingredients, steps, times, servings, photo, notes, tags.
- R150 — Recipe box **"Most planned" sort** (PTE "Times Planned"), joins existing plan stats.
- R151 — Grocery list **"From this week's plan"** chips linking each contributing recipe (PTE Planned Recipes panel).

Remaining P2 backlog (deliberate): photo-grid recipe view, ingredient-based filters,
category sub-groups, desktop drag&drop, breakfast/lunch slots, nutrition facts.

---

## Page-coverage inventory (R152, 2026-08-05)

Sources: `www.plantoeat.com/robots.txt` → `sitemap_index.xml` (page-sitemap: 29 URLs; post-sitemaps: 1,275 blog posts), `app.plantoeat.com/robots.txt` (allow-list), nav/footer crawl of both hosts, plus the authenticated walkthrough above. PTE page **types** (grouping the 1,275 posts and 12 email-archive pages as one type each):

| # | PTE page type | Ours | Covered in scorecard |
|---|---|---|---|
| 1 | Marketing home | Landing `/` | ✅ |
| 2 | Tour: meal planner | Landing planner section + demo tabs | ✅ |
| 3 | Tour: recipe organizer | Landing recipes section | ✅ |
| 4 | Tour: grocery list maker | Landing list section | ✅ |
| 5 | Tour: macro tracking | — | deliberate n/a (nutrition/macro tracking out of scope; noted in P2 backlog as nutrition facts) |
| 6 | FAQ (`/tour/frequently-asked-questions`) | `/faq` (added R154, FAQPage JSON-LD) | ✅ new |
| 7 | About + About/story | `/about` | ✅ |
| 8 | Media kit | `/press` | ✅ |
| 9 | Legal hub + terms + privacy | `/terms`, `/privacy` | ✅ |
| 10 | Blog (listing + 1,275 posts) | `/guides` (28 guides) | ✅ (content moat differs by design) |
| 11 | Podcast | — | deliberate n/a (audio content channel, not product) |
| 12 | Email newsletter archive (`/email/*`) | — | deliberate n/a (we don't publish email archives; double-opt-in list exists) |
| 13 | Recipe clipper (browser extension) | Paste-URL import | ✅ scored (import flow row) |
| 14 | Signup / login | `/login` (passwordless) | ✅ |
| 15 | Gift subscriptions | — | deliberate n/a (no payments by directive) |
| 16 | Referral program | — | deliberate n/a (no payments/rewards by directive) |
| 17 | Annual sale page | — | deliberate n/a (no payments) |
| 18 | App: recipes list | `/app/recipes` | ✅ |
| 19 | App: recipe detail | `/app/recipes/:id` | ✅ |
| 20 | App: cooking view | Cook mode | ✅ |
| 21 | App: planner (week/month) | `/app` + `/app/month` | ✅ |
| 22 | App: shopping lists | `/app/list` | ✅ |
| 23 | App: staples lists | `/app/staples` (+ pantry) | ✅ |
| 24 | App: queue | — | deliberate n/a (social save-for-later; our favourites cover intent) |
| 25 | App: freezer | — | deliberate n/a (inventory niche; pantry covers intent) |
| 26 | App: friends | Anonymous share link | ✅ scored (we exceed: no accounts needed) |
| 27 | App: account/settings | Household settings + GDPR delete | ✅ |
| 28 | App: print views (recipe/planner/list) | Print styles on all three | ✅ |

**Coverage: 22/28 types compared (79% raw); 6/28 marked deliberate-n/a with reasons (payments ×3, audio/email channels ×2, macro tour ×1). Coverage of in-scope page types: 22/22 = 100%.** Gap found by this inventory — no public FAQ page — fixed as R154 (`/faq`).

## Technical-standard audit (R153, 2026-08-05)

Black-box observation only (headers, DevTools, view-source, Lighthouse); no scraping behind bot walls, no code copied.

| Dimension | Plan to Eat (observed) | MealLoop | Verdict |
|---|---|---|---|
| Rendering | www: WordPress SSR (theme "pro", Cloudflare APO). App: Rails SSR + Webpack JS islands (`x-runtime`, `/packs/js/*`) | Workers SSR (Hono), no hydration payload | ✅ meets (same SSR-first architecture, less JS) |
| JS shipped (entry page) | app login: 508 KB JS over 3 bundles + 2 third-party scripts | ~8 KB `app.js`, zero third-party | ✅ exceeds |
| HTML weight | www home 358 KB raw; login 17 KB | home 5.1 KB gzipped | ✅ exceeds |
| Asset pipeline | Content-hashed filenames + `Cache-Control: immutable` | **Was**: un-hashed `/styles.css` with `max-age=0` revalidation → **fixed R153**: build-hash `?v=` + immutable 1y on CSS/JS | ✅ meets after fix |
| Font pipeline | woff2, Cloudflare Fonts rewrite (`/cf-fonts/`), no preload | self-hosted subset woff2 + `rel=preload` + `font-display:swap` | ✅ meets/exceeds |
| Image pipeline | www: webp + srcset (12×); app: user images via S3, no srcset | Recipe images lazy-loaded; brand art is inline SVG; no raster hero images to srcset | ✅ meets (n/a surface: we ship almost no raster images) |
| CDN/cache | Cloudflare, APO on www; HTML DYNAMIC | Cloudflare Workers edge; HTML SSR at edge (TTFB 70–140 ms vs their 160–180 ms www / 60 ms app US-only origin) | ✅ meets |
| Structured data | www: 2 JSON-LD blocks (WebSite/Organization) | Recipe, ItemList, SoftwareApplication+Offer, FAQPage (new), Article on guides | ✅ exceeds |
| SEO tech | sitemap_index + robots content-signals; app robots disallow | sitemap.xml (35 locs incl. /faq), robots, IndexNow, canonicals, OG on every page | ✅ meets/exceeds |
| Security headers | HSTS preload, XFO, XCTO, referrer-policy; **CSP report-only** with `unsafe-inline` styles | Enforced CSP (no unsafe-inline), HSTS, XFO DENY, XCTO, referrer-policy, Permissions-Policy, COOP/CORP | ✅ exceeds (our CSP is enforced; theirs report-only) |
| Perf baseline (Lighthouse desktop, same box, same run) | www home: perf 0.98, LCP 1.1 s, CLS 0.003, 2,466 KiB transferred | home: perf 1.00, LCP 0.3 s, CLS 0, 70 KiB transferred | ✅ exceeds |
| A11y level | Unlabeled icon buttons + heading jumps observed in app | axe clean on audited pages (0 violations after R151b) | ✅ exceeds |

**Result: 12/12 technical dimensions meet or exceed the benchmark's standard** (1 fixed this round: hashed-asset immutable caching; 1 not applicable in kind: srcset — we ship no marketing raster imagery).

## Fixes shipped from this upgrade (R152–R154)
- R152 — Page-coverage inventory (above); confirmed no missing in-scope page type except FAQ.
- R153 — Asset versioning: `scripts/asset-version.mjs` hashes CSS+JS at deploy → `?v=<hash>` URLs + `Cache-Control: immutable` (PTE hashed-asset parity).
- R154 — Public `/faq` with FAQPage JSON-LD, footer link, sitemap entry (PTE FAQ tour-page parity).
