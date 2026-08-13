# Test report — R111–113 (prod, PR #22, branch devin/1786136042-r111-batch, commit 9806a93)

Production: https://mealloop.zalize.com · Plan: test-plan-iter111.md · Recording: rec-50b8fa98 (annotated)
Code refs: R111 optgroups src/index.js:459/:570; R112 demo section src/index.js:90-121 + tab JS public/app.js:15-31; R113 cook button src/index.js:1407 + app.js:99.

Fully read-only round: no data mutations anywhere. Logged-out checks in incognito; standing session used only for read-only inspection.

## Finding (minor, introduced by R112)

⚠️ **Issues panel not fully clean on `/`**: DevTools reports "A form field element should have an id or name attribute" ×3 — the three new demo checkboxes (e.g. `input type=checkbox aria-label="2 onions (demo)"`) have neither id nor name. Improvement-level (no console error, no CSP violation, no functional impact), but the handoff asked for "Console/Issues clean". Fix: add `id="demo-check-N"` (or name) to the demo checkboxes.

![Issues panel: demo checkbox flagged](https://app.devin.ai/attachments/678192ef-6cec-4172-b7ef-3393b8fcbb75/ss_13b2e60e.png)

No other console errors and no CSP violations were observed.

## T1 — R112 "See it in action" demo (logged out) — PASSED

- Section renders between "How it works" and the emerald email band; Plan tab active (emerald), Plan panel shows Week of Mon, Aug 10 with Mon/Tue ("Lentil soup ×2")/Wed cards.
- Click Shop → Shop tab emerald, Produce panel with 2 unchecked items + pre-checked "1 bag spinach" (line-through). DevTools console (incognito context): `["Plan:false","Shop:true","Cook:false"]` — aria-selected toggles correctly.
- Click Cook → Cook panel: "Step 2 of 6" emerald-highlighted, Step 3 dimmed.
- Checkbox demo: checked "2 onions" (strikethrough appeared), unchecked spinach (strikethrough removed); `performance` resource count **4 vs baseline 4 — zero network requests**.
- CTA "Try the real thing — free in beta" → clicked → landed on /login.

| 🟢 Default Plan tab | 🟢 Shop tab: pre-checked spinach |
|---|---|
| ![plan](https://app.devin.ai/attachments/127f8951-cd69-4615-96df-15f33ab35aa0/ss_d781f185.png) | ![shop](https://app.devin.ai/attachments/7ee8f44c-1388-4861-a85c-4be020911c34/ss_08417472.png) |

| 🟢 Toggled checkboxes (client-only) | 🟢 Zero network calls (4 vs 4) |
|---|---|
| ![toggled](https://app.devin.ai/attachments/d8679832-ecbb-4d84-821e-9d89947f95fd/ss_3e958bc4.png) | ![network](https://app.devin.ai/attachments/ea083082-5810-4737-bd54-6b9591dacf94/ss_zoom_4a57d382.png) |

| 🟢 Cook panel | 🟢 CTA → /login |
|---|---|
| ![cook](https://app.devin.ai/attachments/3a5d97e7-b30a-48f9-aa90-7680f70f2c33/ss_8b2688d8.png) | ![login](https://app.devin.ai/attachments/ad4f1f70-4599-479f-9593-d1790f179a02/ss_0373348a.png) |

## T1b — 375px layout — PASSED

iPhone SE emulation: tabs fit one row, plan cards stack single-column, scrollWidth **375 / 375** (no horizontal overflow).

| 🟢 375px stacked demo | 🟢 scrollWidth 375/375 |
|---|---|
| ![375](https://app.devin.ai/attachments/e9070a31-9f65-4e5c-8464-d2a0e2e78bc1/ss_7150f1f2.png) | ![width](https://app.devin.ai/attachments/721dc95b-d543-459a-8a4e-c5380a4b21ae/ss_3f358915.png) |

## T2 — Logged-in CTA variant — PASSED

With the standing session, the demo CTA reads "Open your planner" with `href="/app"` (DOM-confirmed + visible).

![logged-in CTA](https://app.devin.ai/attachments/98faca32-d7bf-49b9-b631-674fd74d19b0/ss_f4415111.png)

## T3 — R111 planner optgroups (standing household, read-only) — PASSED

Expanded Fri Aug 7 dinner "+ add"; the recipe select shows "— pick recipe —" then **★ Favourites** (The best spaghetti bolognese recipe, Test Soup) followed by **All recipes** (5 others incl. Easy classic lasagne). The two favourites exactly match the ★ recipes on /app/recipes. No plan entry was added (Escape to close, nothing submitted).

| 🟢 Dropdown with ★ Favourites / All recipes | 🟢 ★ recipes match (recipe box) |
|---|---|
| ![optgroups](https://app.devin.ai/attachments/44b7ce00-8034-4225-8e8f-93ce8b8ce4e6/ss_52e6615b.png) | ![favs](https://app.devin.ai/attachments/a507df2c-75d1-48ae-8bd8-ea7001f9ad0c/ss_078f7ced.png) |

## T4 — R113 ▶ Start cooking (anonymous share recipe page) — PASSED

/s/r7cncy7kz1oadsc6rnij/r/ab51a6a4ce824525ade8 logged out: button next to Print is the emerald "▶ Start cooking" (old text-xs "Cook mode" gone). Click → cook mode engages (step 1 focused, others dimmed) and label becomes "Exit cook mode"; click again → cook mode exits and label returns to "▶ Start cooking".

| 🟢 ▶ Start cooking button | 🟢 Cook mode on: Exit cook mode + dimming |
|---|---|
| ![start](https://app.devin.ai/attachments/62673f7b-5496-44cb-8454-b741250add81/ss_a38154ce.png) | ![cookmode](https://app.devin.ai/attachments/1e2a8010-399f-4b59-8a69-8b1737d564ce/ss_4c32ec0b.png) |

🟢 After exit, label restored: ![restored](https://app.devin.ai/attachments/346c119d-bd3b-4695-bef0-3d39eee2cdbf/ss_zoom_ad47045c.png)

## T5 — Regression: standing household untouched — PASSED

/app/list: **Grocery list 35 to buy**, aisle chips 17+4+4+2+1+2+5 = 35, bottom of list has no Checked-off section (0 checked).

| 🟢 List top: 35 to buy | 🟢 List bottom: no checked-off section |
|---|---|
| ![top](https://app.devin.ai/attachments/d51e499e-caf9-4b81-9913-ebf986ea304b/ss_9161a110.png) | ![bottom](https://app.devin.ai/attachments/6900f451-6471-4c16-ac61-40aaaeff3b1b/ss_03845f91.png) |

## Notes / limitations

- R113 was verified on the anonymous share recipe page only (per handoff); the app-side recipe page uses the same recipeBody markup (src/index.js:1407) but was not separately clicked this round.
- aria-selected and zero-network proof used the DevTools console in the incognito window itself (the CDP browser_console tool attaches to the main profile while incognito is open — known pitfall).
- Console showed one error from a mistyped diagnostic command of mine (VM script), not from the app.

## Verdict

All R111–113 functional assertions passed. One minor accessibility/Issues finding: the three R112 demo checkboxes lack id/name attributes, so DevTools' Issues panel is not fully clean on the landing page.
