---
name: testing-mealloop
description: How to E2E test the MealLoop production app (mealloop.zalize.com) — DNS workaround, magic-code login via Mail.tm, KV fallback for codes, share-link sync testing.
---

# Testing MealLoop (mealloop.zalize.com)

## Reaching production
- The box's DNS resolver may not have the record. Add `104.21.0.1 mealloop.zalize.com` to `/etc/hosts` (works for both curl and Chrome). Alternatively `curl --resolve mealloop.zalize.com:443:104.21.0.1 ...`.
- Local dev alternative: `cd /home/ubuntu/repos/mealloop && npx wrangler dev` (remote D1/KV bindings).

## Login (email magic code)
- Create a throwaway mailbox via Mail.tm API: GET `https://api.mail.tm/domains`, POST `/accounts` {address,password}, POST `/token`, then GET `/messages` with Bearer token. Resend emails from mealloop@zalize.com usually arrive within ~10s.
- Fallback if email doesn't arrive: read the code from KV:
  `CLOUDFLARE_API_TOKEN=$CLOUDFLARE_GLOBAL_API_TOKEN CLOUDFLARE_ACCOUNT_ID=ddff52d24ee44e21a021c15eaffcc86d npx wrangler kv key get "code:<email>" --namespace-id a02f5b9e979e4f9fb8dbe95a0cd4f983 --remote`
- Codes expire in 10 min; session cookie `ml_session` lasts 30 days.

## Key flows / gotchas
- Recipe import: Allrecipes blocks the Worker fetch with 403 (may be permanent); BBC Good Food URLs (e.g. https://www.bbcgoodfood.com/recipes/classic-lasagne-0) import reliably.
- Share sync test: get link from /app/share, open /s/<token> in incognito, check an item there, and watch the logged-in /app/list tab — it polls /app/list/version every 5s and reloads on version change.
- List check-off is optimistic (inline JS fetch POST to .../toggle with X-Requested-With: fetch).
- Household/share token is auto-created on first /app visit.

## Devin Secrets Needed
- CLOUDFLARE_GLOBAL_API_TOKEN (only for the KV code fallback / wrangler remote).
