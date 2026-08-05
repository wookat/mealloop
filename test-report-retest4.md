# MealLoop — Retest 4 (Final): UA-Spoofed Browser Render for Allrecipes Import

**Target:** https://mealloop.zalize.com (production), PR #1 branch `devin/1785934500-mealloop-v1`, commit `1ab3067`
**Scope:** Single item — import `https://www.allrecipes.com/recipe/223042/chicken-parmesan/` from /app/recipes with the fix-4 fallback (`page.setUserAgent` real Chrome UA + `networkidle2` 25s + render logging), `wrangler tail` running throughout.
**Recording:** `/home/ubuntu/screencasts/rec-38eb17be-8586-4cd3-b68a-27c6913ac472/rec-38eb17be-8586-4cd3-b68a-27c6913ac472-edited.mp4`

## Result: ❌ FAIL — with definitive root-cause evidence

The import returned the graceful banner **"Import failed: no recipe data was found on that page — you can add it manually below"**. No recipe created.

![Import fails with 'no recipe data was found'](https://app.devin.ai/attachments/06d3f08f-13ff-40e9-8d99-020ee140923a/ss_1d1ebe34.png)

## The requested tail line (smoking gun)

```
POST https://mealloop.zalize.com/app/recipes/import - Ok @ 8/5/2026, 1:31:47 PM
  (log) browserExtract https://www.allrecipes.com/recipe/223042/chicken-parmesan/: html=651 title=
```

The headless browser — with a real Chrome UA and networkidle2 — received a **651-byte document with an empty `<title>`**. The real recipe page is ~2 MB with a full title. Allrecipes (Dotdash Meredith) is serving an essentially empty bot-block document to Cloudflare's Browser Rendering infrastructure itself; this is IP/infrastructure-level blocking, not UA or timing.

## Conclusion

Allrecipes cannot be imported from Cloudflare infrastructure with any of the 4 approaches tried (plain fetch → browser-like headers → r.jina.ai proxy → Browser Rendering with real UA). The graceful manual-entry fallback works correctly and is the right call for shipping v1. Recommend documenting Allrecipes/Dotdash Meredith sites as "manual entry" and keeping the JSON-LD import for the many sites that allow it (BBC Good Food verified working).

## Fix-attempt history

| Attempt | Approach | Outcome |
|---|---|---|
| v1 | plain Worker fetch | 403, raw "Fetch failed (403)" |
| Fix 1 | browser-like headers | still 403; friendly copy ✅ |
| Fix 2 | r.jina.ai proxy | proxy 403/429s from Worker egress |
| Fix 3 | Browser Rendering (default UA) | challenge page → "no recipe data" |
| Fix 4 | real UA + networkidle2 + logging | **html=651 title=(empty)** — infrastructure-level block confirmed |
