# R134–136 onboarding (prod, branch devin/1786183076-ai-pantry, commit d01e8f4)

Code refs: setup card src/index.js:533-571 (setupSteps from recipes/plan_entries/shopping_items existence; heading "Get set up in N steps"; rendered only when setupLeft>0; `hidden` + data-dismiss-box="setup", ✕ data-dismiss); reveal/dismiss localStorage `ml-hide-setup` public/app.js:67-78; New badges data-new="ai-week" (AI button :585) and data-new="pantry" (list Pantry link :1977), reveal unless `ml-new-<key>`, click host sets key (app.js:81-89); empty-list CTAs "Open the planner"+"Set up staples" only when editable (:2032-2035).

Setup done: brand-new disposable household qa134onb77340@emalupe.com logged in (incognito). Planner already confirmed showing "Get set up in 3 steps" + NEW badge on AI button.

## T1 New-user setup card progression (recorded)
1. Precondition screenshot: /app shows "Get set up in 3 steps", all 3 steps ○, "Add a recipe" and "Get your grocery list" are underlined links; AI button has amber NEW badge. FAIL if old "Start with one recipe" card appears.
2. Click "Add a recipe" link → /app/recipes; add manual recipe "QA Onboard Pasta" (200g spaghetti / 1 courgette). Back to /app: PASS iff heading now "Get set up in 2 steps", step 1 shows ✓ + strikethrough "Add a recipe", steps 2–3 still ○.
3. Plan the recipe into Tue dinner via "+ add". PASS iff card shows "Get set up in 1 step", steps 1–2 struck.
4. Click "Add week's ingredients to grocery list" → /app/list (2 added). Return to /app: PASS iff setup card GONE entirely (no "Get set up" text).

## T2 Dismiss persistence (recorded) — do BEFORE T1 step 2? No: dismiss removes card; test on a second stage instead:
Actually run between T1.2 and T1.3: after step 1 done ("2 steps"), click ✕ → card hides immediately; reload /app → card still absent (localStorage ml-hide-setup). Then clear localStorage key via devtools console (`localStorage.removeItem('ml-hide-setup')`) + reload → card returns showing "2 steps" (proves server still renders it and reveal logic works). Continue T1.3.

## T3 Pantry "New" badge one-time (recorded)
1. /app/list: Pantry link shows amber NEW badge (screenshot).
2. Click Pantry → /app/pantry loads. Navigate back to /app/list. PASS iff Pantry link now has NO badge (ml-new-pantry set). AI badge: verify visible on first /app load (T1.1); after T1.4 week still has empty dinners → AI button present; skip clicking generate (cost); assert persistence pattern via pantry badge only + note AI badge untested post-click.
3. Empty-list CTAs: at T1.4 the list is non-empty; instead verify CTAs at the START (before T1.2): /app/list empty state shows "Open the planner" (emerald) + "Set up staples" buttons. Click "Open the planner" → /app. (Do this as T0 right after recording starts.)

## T4 375px + axe on planner (recorded lightly)
- Devtools device mode 375px on /app (with setup card + NEW badge state — do before completing all steps, e.g. at "2 steps" stage): scrollWidth 375/375, no overflow. axe via copy(outerHTML)+jsdom: 0 serious/critical.

## T5 Regression + cleanup
1. Standing household /app (main profile): NO "Get set up" card (has recipes/plans/items); NEW badges may show — do NOT click AI generate. /app/list heading "35 to buy", no Checked-off.
2. GDPR-delete disposable account; share token → 404.
