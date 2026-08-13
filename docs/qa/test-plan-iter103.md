# R103–105 (prod, commit ae616c2) — landing narrative, cook-mode focus + timers, JSON export

Read-only round on the standing household. Code refs: How-it-works src/index.js:73-90 (3 cards 1/2/3 Plan/Shop/Cook, emerald round badges, teaser line with /pricing link); cook-mode current/dim public/app.js:125-137 + styles.css (`li.current` opacity 1, other unfinished .55, done .4 + strikethrough); timers app.js:139-178 (regex first duration per step → `button.timer-btn`, aria-label "Start a N minute timer", click stopPropagation, running → "⏱ m:ss" ticking, click while running → reset to original label, finish → class finished "⏰ Time's up — tap to reset"); export src/index.js:1708-1750. Lasagne share page has phrases: 15 min, 60 min, 5 mins, 1 min, 6 mins, 1 min, 20 mins, 25–30 mins.

## T1 Landing "How it works" (logged out, incognito)
PASS iff between the 3-feature grid and the emerald "Get new features first" band there is an h2 "How it works" with 3 white bordered cards Plan/Shop/Cook each with an emerald circular badge 1/2/3, plus centered teaser "Curious what it will cost after the beta? See pricing — everything is free while we're in beta." where "See pricing" is a rendered emerald underlined link; clicking it lands on /pricing. At 375px (device mode) cards stack single-column, 375/375 no overflow, Console "No Issues", Issues clean.

## T2 Cook-mode step focus (standing lasagne detail /app/recipes/ab51a6a4ce824525ade8, logged in)
Enter cook mode via the "Cook mode" button. PASS iff step 1 has class `current` at full opacity while steps 2+ are visibly dimmed (~0.55). Tap step 1 → it gets done styling (0.4 + strikethrough) and `current`/full opacity moves to step 2. Tap step 1 again (un-done) → current returns to step 1. Exit cook mode → dimming gone. (Client-side classes only — no data mutation.)

## T3 Tap timers (same page)
PASS iff duration phrases render as dotted-underline emerald buttons (first phrase per step only), e.g. one with aria-label "Start a N minute timer". Outside cook mode too (verify before entering cook mode). Click the "1 min" timer → text becomes amber "⏱ 1:00" and ticks down each second (observe two different values, e.g. 0:59 → 0:5x); click a running timer → resets to original "1 min" text. Restart it and wait ~65s → red flashing "⏰ Time's up — tap to reset"; tap → resets. Click a timer inside cook mode → step's done state must NOT toggle (step keeps its current/done classes unchanged).

## T4 Share recipe page timers (anonymous, incognito)
Open /s/r7cncy7kz1oadsc6rnij/r/ab51a6a4ce824525ade8. PASS iff same timer buttons render in step text and one starts a ticking countdown when clicked (read-only page, no cook-mode dimming assertions needed beyond timers working).

## T5 JSON export (standing session)
On /app/share PASS iff a "Your data" card renders ABOVE the Account card with button-styled link "Download recipes (JSON)" href /app/export.json download=mealloop-recipes.json. Click it → file downloads; inspect the downloaded JSON: keys exportedAt (ISO), household, recipeCount = 7, recipes.length = 7, each recipe has @type "Recipe", name, recipeIngredient array, recipeInstructions array of {@type:"HowToStep",text}. Logged out: `curl -sI https://mealloop.zalize.com/app/export.json` → 302 Location /login. Header check: authenticated response Content-Disposition attachment; filename="mealloop-recipes.json" (via the downloaded file's existence + curl -I is unauthenticated, so verify header via DevTools Network entry of the click OR accept the download filename as proof).

## T6 Regression (read-only)
/app/list = exactly "35 to buy" with no Checked-off section; /pricing still renders 3 tiers (glance). No mutations anywhere.
