# Test report — R103–105 (prod, commit ae616c2): landing narrative, cook-mode focus + timers, JSON export

Production: https://mealloop.zalize.com · Plan: test-plan-iter103.md · Recording: rec-9553af81 (annotated)
Code refs: How-it-works src/index.js:73-90; cook-mode focus public/app.js:125-137 + styles.css cook-mode rules; timers app.js:139-178; export card/route src/index.js:1708-1750.

All logged-out checks in incognito; standing session used read-only for authenticated checks. No mutations to the standing household anywhere this round (cook-mode/timer state is client-side only).

## T1 — R103 landing "How it works" — PASSED

- New section renders between the 3-feature grid and the emerald "Get new features first" band: h2 "How it works", 3 white bordered cards Plan / Shop / Cook, each with an emerald circular badge 1/2/3.
- Teaser line "Curious what it will cost after the beta? See pricing — everything is free while we're in beta." with "See pricing" as a rendered emerald underlined link; clicking it landed on /pricing (3 tiers intact — doubles as R102 regression glance).
- 375px iPhone SE: cards stack single-column, `scrollWidth/clientWidth = 375 / 375`, Console "No Issues", Issues clean.

| 🟢 Desktop section + teaser | 🟢 375px single-column |
|---|---|
| ![how it works](https://app.devin.ai/attachments/1b2b9da6-1861-4876-ac14-457fabe13e2c/ss_73cb9762.png) | ![375](https://app.devin.ai/attachments/ed078894-e642-42b9-8895-c0303f2afd75/ss_8da9c0dc.png) |

![See pricing click → /pricing](https://app.devin.ai/attachments/b865d098-a6df-4e6b-9a46-9ec7b7deaefa/ss_zoom_b4eceefc.png)

## T2 — R104 cook-mode step focus (standing lasagne, /app/recipes/ab51a6a4ce824525ade8) — PASSED

- Entering cook mode: step 1 gets class `current` at full opacity; steps 2+ visibly dimmed. Class dump: `- | current | ...` semantics confirmed via console (`done | current | - | - | -` after tapping step 1).
- Tap step 1 → strikethrough + 0.4 opacity (done), `current` moved to step 2 (full opacity). Tap step 1 again → un-done, `current` returned to step 1 (`current | - | - | - | -`).
- Exit cook mode → dimming and cursor styling removed, button back to "Cook mode".

| 🟢 Cook mode: step 1 current, rest dim | 🟢 Step 1 done → current on step 2 |
|---|---|
| ![current](https://app.devin.ai/attachments/8e2611d9-6f94-4e3a-88e5-51fd24b0bf10/ss_8b95398c.png) | ![done](https://app.devin.ai/attachments/4fe785db-8142-48b4-ad6e-573c7f80e862/ss_be327d94.png) |

## T3 — R104 tap timers — PASSED

- Duration phrases render as dotted-underline emerald buttons (first phrase per step only: "5 mins", "1 min", "1 min", "25–30 mins"; step 4 has no phrase and no button), aria-labels "Start a N minute timer" (range "25–30 mins" → 25-minute timer).
- Tap "1 min" → amber `⏱ 0:59/0:58…` ticking every second; full 60s observed on the share page → red "⏰ Time's up — tap to reset"; tap → restored original "1 min" label.
- Inside cook mode: tapping the running timer button did NOT toggle the step's done state (classes unchanged: `current | - | - | - | -`) — stopPropagation works.
- Timers work outside cook mode too (started/reset on the normal authenticated view).

| 🟢 Ticking countdown | 🟢 Finished state |
|---|---|
| ![tick](https://app.devin.ai/attachments/d1bceb4f-9144-4304-8323-1ed3f739078e/ss_zoom_601823b1.png) | ![finished](https://app.devin.ai/attachments/13edc44f-949e-4520-85c3-76498caf29f5/ss_zoom_af91aa30.png) |

| 🟢 Tap reset → original label | 🟢 Timer running in cook mode, step not toggled |
|---|---|
| ![reset](https://app.devin.ai/attachments/ac507404-1307-4f1c-9555-b79d13300aab/ss_zoom_e8336017.png) | ![cookmode timer](https://app.devin.ai/attachments/ee820b4b-5c80-4d21-9232-349c146d1a58/ss_zoom_306aeb52.png) |

## T4 — Anonymous share recipe page timers — PASSED

/s/r7cncy7kz1oadsc6rnij/r/ab51a6a4ce824525ade8 (incognito, logged out): same timer buttons render in the steps; the "1 min" timer ran the full start → tick → ⏰ finish → reset cycle there (screenshots above were captured on this page). Note: the share recipe page also shows Print/Cook mode buttons.

![share recipe with timers](https://app.devin.ai/attachments/e7441a1b-2e82-4099-8531-a137d61e0c8b/ss_18d560c1.png)

## T5 — R105 recipe JSON export — PASSED

- /app/share shows the new "Your data" card ABOVE the Account card, with "Download recipes (JSON)" → /app/export.json (download attr mealloop-recipes.json).
- Clicking downloaded `mealloop-recipes.json` (6.6 KB, Chrome download shelf). Parsed: keys `[exportedAt, household, recipeCount, recipes]`; `exportedAt` ISO 2026-08-07T19:30:07.965Z; household "My family"; **recipeCount 7 = recipes.length 7**; every recipe `@type: Recipe` with `name`, `recipeIngredient` list, and `recipeInstructions` all `{@type: HowToStep, text}` (programmatic all() check → True).
- Logged out: `curl -sI /app/export.json` → **302 Location: /login** (no data leak).

| 🟢 Your data card above Account | 🟢 Download completed (shelf) |
|---|---|
| ![your data](https://app.devin.ai/attachments/f8d7a465-c1cd-454e-ace6-c335c7112900/ss_7987c0b6.png) | ![download](https://app.devin.ai/attachments/41e9be2a-6ec8-4dfc-b1dc-dfbc42fb2181/ss_3c992132.png) |

## T6 — Regression (read-only) — PASSED

/app/list: heading exactly "Grocery list 35 to buy", aisle chips 17+4+4+2+1+2+5 = 35, list ends at OTHER with no "Checked off" section (0 checked). Nothing modified. /pricing verified intact in T1.

| 🟢 List 35 to buy | 🟢 List bottom — no checked section |
|---|---|
| ![list](https://app.devin.ai/attachments/862260a3-4ff1-4c03-8f25-e4999cdf8822/ss_be9d8e26.png) | ![bottom](https://app.devin.ai/attachments/3ec6a6f2-fed7-438a-86fc-1eb7a744d551/ss_8bcf4623.png) |

## Notes / limitations

- Content-Disposition header was proven functionally (browser saved the file as mealloop-recipes.json via the attachment download) rather than by inspecting the raw header of an authenticated response.
- One tester slip on the recording: a first tap intended to reset the running timer inside cook mode missed the button (timer kept ticking); reset was then demonstrated cleanly outside cook mode and on the share page. Not an app defect.
- Cook-mode opacity values (1 / 0.55 / 0.4) were verified visually + via class names (`current`/`done`), not by computed-style pixel measurement.

## Verdict

All R103–105 assertions passed. No defects found. Standing household untouched (35 to buy · 0 checked).
