# Test report — R106–108 (prod, PR #21, branch devin/1786132416-r106-batch): item photos, month view, guide topic hub

Production: https://mealloop.zalize.com · Plan: test-plan-iter106.md · Recording: rec-56b7945f (annotated)
Code refs: photo input + thumbnail src/index.js:1571,1588-1596 + POST /app/list/note sanitizeImageUrl (src/util.js:183-191); month view src/index.js:923-982 + planner Month button :441; guide hub src/index.js:248-281.

Standing session used for authenticated checks; anonymous share page in incognito. One disposable QA item was created and fully removed; final state exactly 35 to buy · 0 checked.

## T1 — R106 grocery item photos — PASSED

- Added disposable "QA photo item" (list went 35 → 36). Its ✎ edit popup shows the new "Photo URL (https://…)" url input under the note field.
- Saved `https://mealloop.zalize.com/og-card.png` → 32px rounded thumbnail renders between checkbox and label on /app/list.
- Anonymous share page /s/r7cncy7kz1oadsc6rnij shows the same thumbnail (`<img src=".../og-card.png">` in the item row, visually confirmed).
- Server-side guard: console `fetch` POST /app/list/note with `photo=javascript:alert(1)` → 200 (redirect followed); after reload the row has **0 `<img>`** and the popup photo value is `""` — javascript: stored as NULL, no thumbnail.
- Re-set the photo via UI, then cleared the field and saved → thumbnail removed.
- ✎ → Delete item (native confirm) → list back to exactly **35 to buy** (Other 5).

| 🟢 Edit popup with Photo URL field | 🟢 Thumbnail on /app/list |
|---|---|
| ![popup](https://app.devin.ai/attachments/fb06e8dc-d05a-46f6-99e9-4e8406f31ea1/ss_26eeae9b.png) | ![thumb](https://app.devin.ai/attachments/ad8b1143-d701-4b56-bcef-214ad7b90f3c/ss_zoom_01f11cce.png) |

| 🟢 Same thumbnail on anonymous share page | 🔴→🟢 javascript: URL rejected (no thumbnail) |
|---|---|
| ![share thumb](https://app.devin.ai/attachments/52a90de7-bbe6-4f0f-a959-5266bd90a07f/ss_zoom_4bfe46fb.png) | ![rejected](https://app.devin.ai/attachments/3bab6bf1-b541-4df3-9ec8-7bc24c51055b/ss_zoom_4c330a40.png) |

| 🟢 Cleared field → thumbnail gone | 🟢 QA item deleted, 35 to buy restored |
|---|---|
| ![cleared](https://app.devin.ai/attachments/b3712156-06d8-450e-8fd6-5708b92ca15e/ss_zoom_8e9dd3cc.png) | ![restored](https://app.devin.ai/attachments/f28aa4b3-bf13-4564-8238-1ca116bcb020/ss_e28def92.png) |

## T2 — R107 month view — PASSED (read-only)

- Planner header shows the new "Month" button → /app/month?month=2026-08, h1 "August 2026", Mon–Sun weekday header, full-week grid Jul 27 → Sep 6; today (Fri Aug 7) has the emerald ring; other-month days dimmed; Wed Aug 5 shows emerald chips "Easy classic lasagne" + "Fruit + yogurt"; every day cell links to that week's Monday (`/app?week=…`).
- Clicking the Wed Aug 5 cell opened **/app?week=2026-08-03** with the standing week (lasagne Wed).
- Prev → July 2026, Next ×2 → September 2026 (scale chip "Test Stew ×2" rendered), "This month" → August 2026.
- Invalid `/app/month?month=2026-13` fell back to the current month (h1 "August 2026").
- 375px iPhone SE: stacked day rows with weekday labels, empty other-month days hidden (grid starts at Sat Aug 1), `scrollWidth/clientWidth = 375 / 375`, Console "No Issues", Issues "No issues detected so far".

| 🟢 August 2026 month grid (today ringed, Wed 5 chips) | 🟢 Day click → week 2026-08-03 |
|---|---|
| ![month](https://app.devin.ai/attachments/c3811f56-1d18-44ae-a15e-86e82ccda1db/ss_dcc67953.png) | ![week](https://app.devin.ai/attachments/c8a42460-6547-493d-b2ee-b9387cb178a2/ss_a12f3600.png) |

| 🟢 Next → September (×2 chip) | 🟢 ?month=2026-13 falls back to August |
|---|---|
| ![sep](https://app.devin.ai/attachments/ff85c08a-e71f-40c8-93a6-f9d281ec1a73/ss_b5039dcc.png) | ![fallback](https://app.devin.ai/attachments/c910b84e-2b6d-4915-9200-474c2606be1a/ss_2a60ac5c.png) |

![375px month view, Issues clean](https://app.devin.ai/attachments/97451c34-dd39-4757-b168-0c1922a81301/ss_24c481a3.png)

## T3 — R108 guide topic hub — PASSED (read-only)

- /guides shows 4 anchor chips: "Meal planning basics 10", "Grocery lists & shopping 5", "Recipes & cooking 6", "Family, sharing & tools 5"; below, 4 h2 sections (id topic-0..3) with exactly 10/5/6/5 cards, cards now use h3 headings.
- Clicking a chip jumped to its section (URL gained #topic-1, Grocery lists section scrolled into view).
- Curl-side: exactly 1 ItemList with **26 items**, positions 1..26, and the JSON-LD name order **exactly matches** the displayed grouped card order (`order matches: True`); per-section h3 counts [10, 5, 6, 5].

| 🟢 4 topic chips with counts | 🟢 Chip anchor jump (#topic-1 in view) |
|---|---|
| ![chips](https://app.devin.ai/attachments/5ed63b8b-66f9-4923-a89c-a3d67b5b053f/ss_zoom_6ab10e06.png) | ![anchor](https://app.devin.ai/attachments/5032b15a-c4c8-499b-81fd-ba2fa9c44493/ss_7209797b.png) |

![grouped guides page](https://app.devin.ai/attachments/5b7ba358-ada9-44fc-a7c9-0315c1439cd1/ss_76efd52c.png)

## T4 — Regression — PASSED

Final /app/list exactly **35 to buy**, aisle chips 17+4+4+2+1+2+5 = 35, no Checked-off section, no leftover QA item/photo/store.

![list bottom, no checked section](https://app.devin.ai/attachments/1cfca25f-b2ff-4183-b143-aaa51786ccfe/ss_6bb5b53b.png)

## Notes / limitations

- The `javascript:` guard was proven server-side via a console `fetch` from the authenticated page (the `type=url` input natively blocks non-URL entry, so the UI can't submit it) — this is the code's own POST path, not a cookie-extracted curl.
- The chip anchor was exercised on the "Grocery lists & shopping" chip (#topic-1) rather than #topic-2 as planned — same mechanism, one mid chip.
- Print-hidden state of the thumbnail (`print:hidden` class present in DOM) was not exercised in a print preview this round.
- No DB residue: the only mutations were the disposable QA item's add/edit/delete, all reverted.

## Verdict

All R106–108 assertions passed. No defects found. Standing household exactly as found (35 to buy · 0 checked).
