# Benchmark Round 1 — MealLoop vs Plan to Eat vs Samsung Food

Date: 2026-08-05 · Scope: post-launch deep comparison per company SOP (item-by-item, with evidence).
Evidence base: real signed-up hands-on sessions with both competitors during Phase A research (screenshot index in `research-report.md`), plus live production QA of MealLoop (PR #1 comment).

## Item-by-item comparison

| # | Capability | Plan to Eat | Samsung Food | MealLoop (live) | Verdict / gap |
|---|---|---|---|---|---|
| 1 | Recipe import by URL | ✅ Browser clipper + URL import, very reliable | ✅ URL import incl. many sites | ✅ JSON-LD import + Browser Rendering fallback; Allrecipes/Dotdash blocked at their edge (651-byte block doc) → manual entry fallback | ⚠️ P1: importer works on JSON-LD sites (BBC Good Food etc.) but fails on Dotdash network; needs licensed scraping provider to close |
| 2 | View steps in-app | ✅ | ❌ often links out to source site | ✅ full ingredients + steps stored and rendered | ✅ at parity / ahead of Samsung Food |
| 3 | Weekly planner | ✅ month calendar, drag-drop | ✅ weekly planner | ✅ Monday-start week, 3 meals/day, recipe or note | ⚠️ P2: no drag-drop, no multi-week/month view |
| 4 | Grocery list auto-generation | ✅ aggregated, categorized, quantity merge | ✅ | ✅ aisle-categorized from week plan; check-off syncs | ⚠️ P2: no quantity merging of duplicate ingredients (e.g. 2× "onion" appears twice) |
| 5 | Family sharing | ⚠️ account required per member | ⚠️ account + app push | ✅ single no-signup share link `/s/<token>`, live sync ~5s | ✅ core differentiator, verified cross-context |
| 6 | Free tier | ❌ paid only (trial) | ✅ free but heavy app/subscription upsell | ✅ fully free, no paywall | ✅ ahead |
| 7 | Web-first UX | ⚠️ dated UI | ⚠️ web is app-companion; 6-step onboarding | ✅ modern Tailwind, mobile 390px verified, zero onboarding steps | ✅ ahead |
| 8 | Nutrition info | ⚠️ basic | ✅ rich nutrition/diet scoring | ❌ none | ⚠️ P2-: out of v1 scope; revisit if user demand appears |
| 9 | Recipe collections/tags | ✅ | ✅ saved collections | ❌ flat list only | ⚠️ P2: add search/filter once recipe counts grow |
| 10 | Pantry / staples | ✅ staples list | ✅ pantry tracking | ❌ | P3: not needed for wedge |
| 11 | Mobile apps | ✅ iOS/Android | ✅ iOS/Android | ❌ responsive web only (by design) | Accepted trade-off for v1 |
| 12 | Onboarding friction | Low | High (6 steps, diet quiz, app push) | Lowest (email code → in) | ✅ ahead |

## P0/P1 actions this round
- **P0: none open.** Production QA passed all golden paths; security hardening shipped (code-send/attempt rate limits, SSRF host guard).
- **P1 (import coverage, item 1):** accepted as v1 limitation with graceful manual-entry fallback + placeholder steering to import-friendly sites. Closing it fully requires a licensed third-party scraping/rendering provider — deferred pending traffic signal, not bypassing site protections.

## Self-assessment
- Wedge validated: items 5–7 (no-signup family link, free, web-first) are objectively ahead of both competitors, each with live-production evidence.
- Round-2 candidates (highest value first): grocery quantity merging (item 4), recipe search/filter (item 9), planner drag-drop or copy-week (item 3), plus any P0/P1 from the UX walkthrough and security audit gates.
