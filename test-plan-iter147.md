# R147–151 PtE benchmark parity (prod, branch devin/1786195396-pte-benchmark, commit 93ca5dc)

Code refs: src/index.js — POST /app/recipes/:id/duplicate (:1658-1671), Duplicate button next to Edit recipe (:1730), sort=planned + order subquery (:1308-1310), sort group third link "Most planned" + hidden sort input on search form (:1341,:1345), /app/list weekRecipes query (:1740-1743) + "From this week's plan:" chips div print:hidden (:2037).

Standing QA household only; list page read-only (no checkbox clicks); baseline must end at 35 to buy · 0 checked.

## T1 R149 Duplicate
1. /app/recipes/ab51a6a4ce824525ade8 (Lasagne) → button "Duplicate" visible between "Edit recipe" and "Delete recipe". Screenshot.
2. Click Duplicate → PASS iff redirected to a NEW recipe URL (id ≠ ab51a6a4ce824525ade8), h1 = "Lasagne (copy)", and ingredients/steps/servings/tags match the original (spot-check first+last ingredient and servings value).
3. /app/recipes shows both "Lasagne" and "Lasagne (copy)".
4. Cleanup: on the copy's page click "Delete recipe" (confirm) → recipe list no longer shows "(copy)"; original Lasagne intact.

## T2 R150 Most planned sort
1. BEFORE screenshot of /app/recipes sort group (Newest / A–Z only in old version — new version must show third item "Most planned"). PASS iff "Most planned" present.
2. Click "Most planned" → URL ?sort=planned, chip highlighted (bg-stone-200, aria-current). PASS iff order changes to plan-count desc: Lasagne (planned ≥1 historically) appears above never-planned recipes (favorites still on top if any). Compare against Newest order screenshot — orders must differ unless coincidentally identical (then verify via a recipe known planned vs never planned).
3. Search persistence: with sort=planned active, type "las" in search, submit → PASS iff URL keeps sort=planned (hidden input) and "Most planned" chip still highlighted.

## T3 R151 Week chips on /app/list
1. Check current week /app: if no dinners this week, temporarily plan Lasagne on one empty day of THIS week (note the day), to trigger chips. (Do not touch Aug 5 baseline entry.)
2. /app/list → PASS iff top shows "From this week's plan:" label + green chip "Lasagne" (emerald pill) ABOVE the "Grocery list 35 to buy" heading. AFTER screenshot (pair with a BEFORE from prior round /app/list top which had no chips band).
3. Chip is a link → click → lands on Lasagne recipe page.
4. Print-hidden: Ctrl+P preview (or emulate print media in DevTools rendering) → chips absent. PASS iff not rendered in print.
5. Cleanup: remove the temporary plan entry → /app/list reloaded shows NO "From this week's plan:" row (proves conditional). List still exactly "35 to buy", chips sum 35, no Checked-off section.

## T4 375px + axe
- DevTools responsive 375px on /app/recipes (sort=planned), /app/list (with chips visible during T3), recipe detail w/ Duplicate button: scrollWidth == clientWidth (375/375) each.
- axe (saved DOM + jsdom, contrast off) on /app/recipes and /app/list: no serious/critical, no NEW violations vs prior rounds (list baseline 0; recipes page new — expect 0).

## T5 Lighthouse
- Headless Lighthouse desktop on `/`: PASS iff LCP ≤ 1.5s and CLS = 0.

## T6 Final baseline regression
- /app/list: exactly "35 to buy", category chips 17/4/4/2/1/2/5, no Checked-off; recipe box has no "(copy)"; planner current week back to original state; Aug 5 lasagne untouched.
