# MealLoop — Retest 2: r.jina.ai Proxy Fallback for Allrecipes Import

**Target:** https://mealloop.zalize.com (production), PR #1 branch `devin/1785934500-mealloop-v1`
**Scope:** Single item — import `https://www.allrecipes.com/recipe/223042/chicken-parmesan/` from /app/recipes, expecting a successful import via the new r.jina.ai rendering-proxy fallback.
**Recording:** `/home/ubuntu/screencasts/rec-6fcd5af9-6644-4bc7-b7a6-1c49382a348c/rec-6fcd5af9-6644-4bc7-b7a6-1c49382a348c-edited.mp4`

## Result: ❌ FAIL

Three import attempts (two recorded, one during log tailing) all landed back on /app/recipes with the banner **"Import failed: this site blocks automated access — you can copy the recipe in manually below"**. No recipe was created.

![Import still fails with friendly-error banner](https://app.devin.ai/attachments/f77c654f-a17e-4758-9f38-b479866b49ec/ss_0c6af7e0.png)

## Diagnosis (evidence-based)

1. **The fix IS deployed.** `wrangler deployments list` shows the latest upload at `2026-08-05T13:16:25Z` (matching commit `d9d7627 feat: rendering-proxy fallback…`); all my attempts were at 13:20+ UTC.
2. **The proxy itself works from outside Cloudflare.** From this box:
   `curl -H 'X-Return-Format: html' https://r.jina.ai/https://www.allrecipes.com/recipe/223042/chicken-parmesan/` → **HTTP 200, 1.76 MB HTML in 1.75s, contains the `application/ld+json` recipe block** (parses fine).
3. **Inside the Worker, the fallback fetch is being rejected.** `wrangler tail` shows the `POST /app/recipes/import` completing and redirecting to the error page within ~1 second — far too fast to have downloaded 1.76 MB via the proxy. Since the shown message is the 403/429-specific copy (src/recipes.js:29-30), the r.jina.ai request itself must be returning 403/429 to the Worker.

**Most likely root cause:** r.jina.ai rate-limits/blocks unauthenticated requests, and Cloudflare Workers egress from shared IPs immediately trips that limit (jina's free tier is ~20 RPM per IP; authenticated requests with an `Authorization: Bearer <JINA_API_KEY>` header get much higher limits and dedicated treatment).

## Suggested fixes for the lead

- Add a `JINA_API_KEY` Worker secret and send `Authorization: Bearer` on the r.jina.ai request. **No JINA_API_KEY exists in the session secret store** — the user would need to provide one (free at jina.ai).
- Alternatively use Cloudflare's own Browser Rendering API binding, which avoids third-party rate limits entirely.
- Add a `console.log` of the fallback response status in `fetchAndExtract` so `wrangler tail` shows the real status code next time (currently the 403 vs 429 distinction is invisible).
