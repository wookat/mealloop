# R111–113 (prod, PR #22, branch devin/1786136042-r111-batch, commit 9806a93)

Code refs: R111 optgroups src/index.js:459 (SELECT … favorite ORDER BY favorite DESC) + :570 (`<optgroup label="★ Favourites">` / `<optgroup label="All recipes">` iff favs exist). R112 demo section src/index.js:90-121 (role=tablist, 3 role=tab buttons aria-selected, panels data-demo-panel 0/1/2, Shop panel 3 client checkboxes [2 unchecked, '1 bag spinach' checked] peer-checked:line-through, CTA user? '/app Open your planner' : '/login Try the real thing — free in beta'); tab JS public/app.js:15-31. R113 cook button src/index.js:1407 (`▶ Start cooking`, emerald bg-emerald-600) + app.js:99 (toggle → 'Exit cook mode' / back to '▶ Start cooking').

Read-only round: NO mutations anywhere. Standing household only inspected (planner select + final list check). Logged-out checks in incognito.

## T1 R112 landing demo (logged out, incognito)
1. On `/`, "See it in action" section appears between "How it works" and the emerald "Get new features first" band. Default: Plan tab emerald with aria-selected=true, Shop/Cook stone with aria-selected=false; Plan panel visible (Week of Mon, Aug 10, Mon/Tue/Wed cards incl. "Lentil soup ×2"), panels 1/2 hidden.
2. Click Shop: Shop tab turns emerald + aria-selected=true, Plan reverts to stone/false; Shop panel visible (Produce list: 2 onions, 3 bell peppers unchecked; "1 bag spinach" pre-checked with line-through). Click Cook: Cook panel visible (Step 2 of 6 highlighted emerald, Step 3 dimmed).
3. Checkbox demo: with DevTools Network open (or console request counter), check "2 onions" → line-through appears; uncheck "1 bag spinach" → strikethrough removed; PASS iff zero network requests fired by the toggles.
4. CTA reads "Try the real thing — free in beta" → href /login; click navigates to /login.
5. 375px iPhone SE: demo section stacks (plan cards single column), tabs fit, scrollWidth 375/375; Console "No Issues", Issues panel clean (CSP included).

## T2 R112 logged-in CTA variant (main profile, read-only)
On `/` with standing session: demo CTA reads "Open your planner" → href /app. PASS iff exact label + href.

## T3 R111 planner optgroups (standing household, READ-ONLY)
On /app, expand one day's "+ add" details, inspect the recipe select. PASS iff select contains exactly two optgroups `★ Favourites` (first) and `All recipes`, favourites at top matching the household's ★ recipes, plus "— pick recipe —" placeholder. Do NOT submit the form; collapse/leave without adding. Visual: open the dropdown to show group headers on screen.

## T4 R113 Start cooking button (anonymous share recipe page)
On /s/r7cncy7kz1oadsc6rnij/r/ab51a6a4ce824525ade8 (logged out): button next to Print is emerald "▶ Start cooking" (not old text-xs "Cook mode"). Click → cook mode engages (step dimming) and label becomes "Exit cook mode"; click again → cook mode exits, label back to "▶ Start cooking".

## T5 Regression
Final read-only check on main profile /app/list: exactly 35 to buy, no Checked-off section.
