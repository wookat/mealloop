# R106–108 (prod, PR #21, branch devin/1786132416-r106-batch) — item photos, month view, guide topic hub

Code refs: photo input in edit popup src/index.js:1588-1596 (`input name=photo type=url` placeholder "Photo URL (https://…)"); thumbnail render :1571 (`img h-8 w-8 rounded-md object-cover print:hidden` between checkbox and label, both /app/list and share via shared listBody); POST /app/list/note runs photo through sanitizeImageUrl (src/util.js:183-191, http/https only else NULL); month view src/index.js:923-982 (Mon–Sun grid, today emerald ring, other-month `bg-stone-50 opacity-60` + `hidden sm:block` when empty, cells link /app?week=<Monday>, chips ≤3 + "+N more", invalid ?month regex fallback to current month, Prev/This month/Next/Week view); Month button in planner header :441; guide hub :248-281 (GUIDE_TOPICS 4 sections 10/5/6/5, chip nav → #topic-0..3, h2 id=topic-N scroll-mt-4, cards now h3, ItemList reordered to flat grouped order).

Standing household mutation policy: ONE disposable QA item ("QA photo item") allowed; must be deleted at the end; final state exactly 35 to buy · 0 checked.

## T1 R106 item photos (logged in, /app/list)
1. Add item "QA photo item" via the add form → appears (36 to buy).
2. Open its ✎ popup — PASS iff a "Photo URL (https://…)" url input renders under the note field. Enter `https://mealloop.zalize.com/og-card.png`, Save → item row shows a 32px rounded thumbnail between checkbox and label.
3. Share page /s/r7cncy7kz1oadsc6rnij (incognito): same item shows the thumbnail (read-only page).
4. Server-side guard: via console fetch POST /app/list/note with photo=`javascript:alert(1)` (label kept) → reload: no thumbnail, no `<img>` for the item (photo stored NULL). Also note the type=url input natively blocks non-URL entry.
5. Clear the photo field via ✎ (empty), Save → thumbnail gone.
6. ✎ → Delete item (native confirm) → list back to exactly **35 to buy**.

## T2 R107 month view (logged in, read-only)
1. /app planner header shows new "Month" button → click → lands on /app/month?month=2026-08 with h1 "August 2026".
2. PASS iff: Mon–Sun weekday header row (desktop); grid covers full weeks (starts Mon Jul 27 area, ends Sun); today's cell (Fri Aug 7) has emerald ring; other-month days dimmed; Wed Aug 5 cell shows emerald chips "Easy classic lasagne" AND "Fruit + yogurt" (note); no "+N more" (only 2 entries).
3. Click the Wed Aug 5 cell → /app?week=2026-08-03 shows the standing week with lasagne Wed.
4. Back to month: Prev → July 2026, Next ×2 → September 2026, "This month" → August 2026.
5. Invalid /app/month?month=2026-13 → falls back to current month (h1 "August 2026").
6. 375px device mode: layout stacks (day rows with weekday labels), 375/375 no overflow, Console/Issues clean.

## T3 R108 guide topic hub (logged out ok, read-only)
1. /guides shows chip nav with exactly 4 chips: "Meal planning basics 10", "Grocery lists & shopping 5", "Recipes & cooking 6", "Family, sharing & tools 5"; below, 4 h2 sections (id topic-0..3) with card counts 10/5/6/5, cards use h3 titles.
2. Clicking chip "Recipes & cooking 6" scrolls to the #topic-2 h2.
3. Curl-side: ItemList JSON-LD has 26 items whose order exactly matches the displayed grouped card order (positions 1..26 = flat grouped titles/URLs).

## T4 Regression (read-only)
Final /app/list exactly "35 to buy", no Checked-off section, no leftover QA item/photo. (Pricing/landing untouched this round — skip.)
