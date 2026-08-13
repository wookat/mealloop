# R109–110 (prod, PR #21, commit 34434d5) — JSON recipe importer + portability guide

Code refs: intake form src/index.js:1075-1082 (`<details>` "Or import a JSON backup (moving from another app)" → multipart POST /app/recipes/import-json, file input accept=.json); importer :1148-1210 (accepts array | {recipes:[…]} | single object; name/title, recipeIngredient (HowToStep toText), recipeInstructions incl. HowToSection.itemListElement flattening, prepTime/cookTime PT…H…M → minutes, recipeYield, description clip 500, url http/https only, image via sanitizeImageUrl; success redirect ?imported=N → role=status "Imported N recipes from your file." :1030; bad JSON → role=alert "That file isn't valid JSON — export your recipes as JSON (e.g. a MealLoop backup or a schema.org Recipe file) and try again."). Guide: src/guides.js slug move-recipes-from-another-app in Recipes & cooking (GUIDE_TOPICS :252) → counts 10/5/7/5, ItemList 27, sitemap +1.

All mutations in a disposable Mail.tm household (incognito). Standing household NOT logged into. Fixtures: /tmp/qa109-recipes.json (2 recipes: full one with HowToStep + HowToSection + PT15M/PT1H5M + https image + url; minimal name+ingredients), /tmp/qa109-badimage.json (image javascript:alert(1)), /tmp/qa109-notjson.json (plain text).

## T1 Import 2-recipe fixture
On disposable /app/recipes, expand the new details "Or import a JSON backup (moving from another app)", choose /tmp/qa109-recipes.json, click "Import recipes". PASS iff green role=status notice exactly "Imported 2 recipes from your file." and recipe box shows QA109 Tomato Soup + QA109 Minimal Toast.
Open QA109 Tomato Soup: PASS iff image renders (og-card), Prep 15 min / Cook 65 min (or 1h5m rendering), servings "4 servings", 3 ingredients, 3 steps in order (Chop… / Add tomatoes… / Simmer…), source link to example.com. Open QA109 Minimal Toast: title + 2 ingredients, no steps/image, no crash.

## T2 Round-trip export → re-import
Download /app/export.json (recipeCount 2), re-upload the downloaded file via the same form. PASS iff "Imported 2 recipes from your file." and recipe box now shows 4 recipes (duplicates acceptable), no crash.

## T3 Error branch
Upload /tmp/qa109-notjson.json. PASS iff amber role=alert notice "That file isn't valid JSON…" and recipe count unchanged (still 4).

## T4 Image guard
Upload /tmp/qa109-badimage.json. PASS iff "Imported 1 recipe from your file.", QA109 Bad Image renders with NO image element (image stored NULL), ingredients/step intact.

## T5 R110 guide + SEO (logged out ok, curl + browser)
1. /guides: "Recipes & cooking" chip now shows 7; new card "How to move your recipes out of another meal planning app" present in that section (last).
2. Guide page /guides/move-recipes-from-another-app renders h1 + 3 h2s (Step 1: export from your old app / Step 2: check the file is standard / Step 3: import it into the new tool) + 3-bullet ul.
3. Curl: meta description == og:description == excerpt; sitemap.xml = 32 locs (user said 31→ verify actual; must include the new URL; previous count was 31 after /pricing, so expect 32 — report actual); ItemList 27 items matching visible order, counts 10/5/7/5.
4. Console/Issues clean on the guide page.

## T6 Cleanup + regression
GDPR-delete the disposable account (/app/share → Delete account & all data); its share token → 404. Standing household untouched (not logged into; verify /app/list = 35 to buy via the main profile's existing session read-only at the end).
