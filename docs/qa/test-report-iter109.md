# Test report — R109–110 (prod, PR #21, commit 34434d5): JSON recipe importer + portability guide

Production: https://mealloop.zalize.com · Plan: test-plan-iter109.md · Recording: rec-2775c9a2 (annotated)
Code refs: intake form src/index.js:1075-1082, importer src/index.js:1148-1210, success/err notices :1030/:1029, guide src/guides.js (slug move-recipes-from-another-app) + GUIDE_TOPICS src/index.js:252.

All mutations in a disposable Mail.tm household `qa1091015@web-library.net` (incognito), GDPR-deleted at the end. Standing household never logged into during the mutation flow; verified read-only at the end.

## T1 — Import 2-recipe schema.org array — PASSED

- New `<details>` "Or import a JSON backup (moving from another app)" on /app/recipes with file input + helper text; uploaded `/tmp/qa109-recipes.json` (bare array: 1 full Recipe with HowToStep + HowToSection + PT15M/PT1H5M + https image + url, 1 minimal name+ingredients).
- Green role=status notice exactly **"Imported 2 recipes from your file."**; both cards render, Soup card shows "Prep 15m · Cook 65m · 4 servings" + image.
- QA109 Tomato Soup detail: image renders, 3 ingredients, **3 steps in order** (HowToSection.itemListElement flattened), description, "Original source" link → `https://example.com/qa109-soup` (hover status bar).
- QA109 Minimal Toast detail: title + 2 ingredients, no image/steps, no crash.

| 🟢 Imported 2 recipes notice + cards | 🟢 Full recipe detail (image, 15m/65m, flattened steps) |
|---|---|
| ![notice](https://app.devin.ai/attachments/c701c497-67ce-49b8-a00d-95a235096469/ss_6b52ed77.png) | ![soup](https://app.devin.ai/attachments/02804b38-fd34-468b-b62e-5935646f3114/ss_49603bfe.png) |

| 🟢 Minimal recipe (no crash) | 🟢 Source href = example.com/qa109-soup |
|---|---|
| ![toast](https://app.devin.ai/attachments/50199d7b-79a9-43f9-8e1a-c204257ab2c5/ss_d131af07.png) | ![href](https://app.devin.ai/attachments/17e5fd6e-1e8c-4f20-96f6-ddf0c2e1403c/ss_zoom_7c9412e6.png) |

## T2 — Round-trip export → re-import — PASSED

Downloaded /app/export.json (shell-verified: `{exportedAt, household, recipeCount: 2, recipes}` with both QA109 names) and re-uploaded the downloaded file via the same form → **"Imported 2 recipes from your file."**, recipe box now 4 (duplicates as expected), no crash.

| 🟢 Export downloaded (876 B) | 🟢 Re-import: 4 recipes |
|---|---|
| ![download](https://app.devin.ai/attachments/0cc1e80c-068b-4063-bf4a-5ec13ff07d63/ss_2ab8b3c4.png) | ![reimport](https://app.devin.ai/attachments/e0f651f6-dee5-4124-a182-5b0a56efc316/ss_1fd93853.png) |

## T3 — Non-JSON error branch — PASSED

Uploaded a plain-text file → amber role=alert notice **"That file isn't valid JSON — export your recipes as JSON (e.g. a MealLoop backup or a schema.org Recipe file) and try again."**; recipe box unchanged at 4.

![error notice](https://app.devin.ai/attachments/ac4b46f7-ad01-4fef-8aac-4c4d00f2e0f5/ss_6c31459c.png)

## T4 — javascript: image guard — PASSED

Uploaded a Recipe with `"image": "javascript:alert(1)"` → **"Imported 1 recipe from your file."**; QA109 Bad Image card shows the placeholder (no image) and the detail page renders title/ingredient/step with **no image element** — image stored NULL via sanitizeImageUrl.

| 🟢 Imported 1, card placeholder | 🟢 Detail: no image rendered |
|---|---|
| ![guard](https://app.devin.ai/attachments/277a43cf-8e0e-4206-adb7-a94ab751c3a4/ss_3b76a490.png) | ![detail](https://app.devin.ai/attachments/5c65a943-a3b9-4d15-b5da-f3332e68b0b0/ss_a4c86f16.png) |

## T5 — R110 portability guide + SEO — PASSED (one count note)

- /guides chip nav now "Recipes & cooking **7**" (10/5/7/5); new card "How to move your recipes out of another meal planning app" is the **last** card in that section; chip click jumped to #topic-2.
- Guide page renders h1 + 3 h2s (Step 1: export from your old app / Step 2: check the file is standard / Step 3: import it into the new tool) + 3-bullet ul + CTA.
- Curl: meta description == og:description == excerpt; ItemList = **27** items, order exactly matches visible grouped card order (new guide at position 22); sitemap **32 locs** including the new URL.
- ⚠️ Note: the handoff said "sitemap 30→31 locs" but the actual count is **32** — the previous round already had 31 (26 guides + / /pricing /guides /privacy /terms), so +1 new guide = 32. Off-by-one in the handoff text, not a defect: the new URL is present and all other counts match.

| 🟢 Chip "Recipes & cooking 7" | 🟢 New card last in section |
|---|---|
| ![chips](https://app.devin.ai/attachments/567a3c20-ca86-4948-83a9-95f375dd53d1/ss_472ed9f6.png) | ![card](https://app.devin.ai/attachments/abfabfd7-297e-4b56-b333-120c78f7acba/ss_fd58a7eb.png) |

![guide page](https://app.devin.ai/attachments/35944f09-ba70-4f33-994d-b1736835ec2d/ss_74bb8a50.png)

## T6 — Cleanup + regression — PASSED

- GDPR delete via "Delete account & all data" (native confirm) → logged out to landing; share token `agssm9qthmqmngm7d5ot` → **404** (curl).
- Standing household (read-only check via main profile): exactly **35 to buy**, aisle chips 17+4+4+2+1+2+5 = 35, no Checked-off section.

| 🟢 Native delete confirm | 🟢 Standing list 35 to buy · 0 checked |
|---|---|
| ![confirm](https://app.devin.ai/attachments/d39207e8-22d1-4f3a-a128-335cf2d6918c/ss_a08c7647.png) | ![standing](https://app.devin.ai/attachments/28fcc03a-bcce-44c6-bf4b-98b8c64a6d6e/ss_70ff0a27.png) |

## Notes / limitations

- 5 MB / 200-recipe caps not runtime-exercised (would need a synthetic oversized upload; code-read only).
- Cook time renders as "Cook 65m" for PT1H5M (minutes conversion correct; display style is minutes, matching existing behavior).
- Console/Issues: no app errors observed during the flow; a dedicated DevTools Issues sweep was done on the guide page only implicitly via clean loads (no explicit Issues-panel screenshot this round).
- The "Original source" href was verified via hover status bar (CDP console was attached to the wrong window; avoided cookie-based curl).

## Verdict

All R109–110 assertions passed (with the sitemap off-by-one note above — actual 32 locs, new URL present). Disposable household fully deleted; standing household exactly as found.
