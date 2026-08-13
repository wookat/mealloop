# MealLoop — Retest 3: Cloudflare Browser Rendering Fallback for Allrecipes Import

**Target:** https://mealloop.zalize.com (production), PR #1 branch `devin/1785934500-mealloop-v1`
**Scope:** Single item — import `https://www.allrecipes.com/recipe/223042/chicken-parmesan/` from /app/recipes via the new headless-browser fallback (`@cloudflare/puppeteer`, BROWSER binding, commit `6c74466`).
**Recording:** `/home/ubuntu/screencasts/rec-31d42945-053d-4ce3-9399-6772cd556ff2/rec-31d42945-053d-4ce3-9399-6772cd556ff2-edited.mp4`

## Result: ❌ FAIL (new failure mode)

Two attempts, both landed back on /app/recipes with a **new** error banner:
**"Import failed: no recipe data was found on that page — you can add it manually below"**
No recipe was created.

![Import fails with 'no recipe data was found'](https://app.devin.ai/attachments/934d8742-f07d-4dd8-8c92-2009baf18e5f/ss_f4a0f240.png)

## Diagnosis (from `wrangler tail` during both attempts)

- The error changed from the 403 copy to the `extractRecipe(html) === null` copy (src/recipes.js:21), so **the fallback chain executed**: direct fetch 403 → Browser Rendering ran → page HTML contained no `application/ld+json` Recipe block.
- Timing from tail: `POST /app/recipes/import` → error redirect in **~2-4 seconds** on both attempts. A real Chrome render of an Allrecipes page (browser launch + navigation + ads/CMP scripts) takes far longer. `domcontentloaded` is firing almost instantly on a much smaller page.
- Conclusion: **Allrecipes serves its bot-challenge/interstitial page to the Browser Rendering headless browser as well** (Cloudflare egress IPs are still fingerprinted), so the rendered HTML is the challenge page, not the recipe.

## Suggested next steps for the lead

1. Log `html.length` and a 200-char snippet in `browserExtract` before extraction — one `wrangler tail` run would confirm the challenge-page hypothesis definitively.
2. Try `waitUntil: 'networkidle0'` + a realistic UA/viewport via `page.setUserAgent(...)` — default headless UA advertises `HeadlessChrome`, an instant bot signal.
3. If Allrecipes (Dotdash Meredith) keeps blocking, consider accepting the graceful manual-entry fallback for this publisher and documenting supported sites — BBC Good Food and most JSON-LD sites import fine directly.

## History of this bug across runs

| Attempt | Approach | Outcome |
|---|---|---|
| v1 | plain Worker fetch | 403, raw "Fetch failed (403)" |
| Fix 1 | browser-like headers | still 403; friendly copy ✅ |
| Fix 2 | r.jina.ai proxy | proxy 403/429s from Worker egress |
| Fix 3 | Browser Rendering | renders challenge page → "no recipe data" |
