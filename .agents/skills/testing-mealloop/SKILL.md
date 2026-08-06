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
- Rate limits: max 3 code sends per email per 10 min; 5 wrong verify attempts invalidate the code. Once send-limited, /login won't render the code form again — use one fresh Mail.tm mailbox per limit you're testing.

## Key flows / gotchas
- Recipe import: Allrecipes/Dotdash Meredith block ALL Cloudflare-egress fetches, including Browser Rendering (they serve a ~651-byte empty document). Expect the friendly-error/manual-entry fallback there; test import with BBC Good Food URLs (e.g. https://www.bbcgoodfood.com/recipes/classic-lasagne-0) instead.
- Import error banners distinguish the failing stage: "blocks automated access" = HTTP 403/429 on fetch; "no recipe data was found" = page fetched/rendered but no schema.org JSON-LD (likely a challenge page).
- Debugging imports: run `CLOUDFLARE_API_TOKEN=$CLOUDFLARE_GLOBAL_API_TOKEN CLOUDFLARE_ACCOUNT_ID=ddff52d24ee44e21a021c15eaffcc86d npx wrangler tail mealloop --format pretty` while triggering; the `browserExtract <url>: html=N title=...` log line shows what the headless render received. POST→redirect timing is a quick proxy for whether a real render happened.
- Grocery categories are stored at insert time — categorizer changes only affect newly added items.
- Share sync test: get link from /app/share, open /s/<token> in incognito, check an item there, and watch the logged-in /app/list tab — it polls /app/list/version every 5s and reloads on version change.
- List check-off is optimistic (inline JS fetch POST to .../toggle with X-Requested-With: fetch).
- Household/share token is auto-created on first /app visit.
- Quantity merging keys on ingredient name+unit — to test merge math exactly, plan on an empty future week (`/app?week=YYYY-MM-DD`) so previously planned recipes don't add into the totals.
- "Copy last week's plan" renders only when the viewed week has zero entries.
- All client JS is in static `/app.js` (data-copy buttons, form[data-confirm] dialogs, .toggle-form check-off, 5s version poll) — after CSP changes check the browser console for violations.
- Tags are normalized to slugs (lowercase, spaces→dashes, max 10); tag filter is `/app/recipes?tag=<slug>`; favorites sort first via `ORDER BY favorite DESC`.
- Confirm-dialog cancel tests should verify state via a reload (token/recipe unchanged).
- Staples (/app/staples) are appended by name (case-insensitive) on every "Add week's ingredients" click; menu forms on /app render conditionally — Save input only on weeks WITH entries, Apply select only on EMPTY weeks (Delete select whenever any menu exists).
- The nav "Planner" link always lands on the CURRENT week — use /app?week=YYYY-MM-DD explicitly to avoid polluting the grocery list with the current week's ingredients.
- Category selects on /app/list use `data-autosubmit` + a `__custom` prompt in /app.js — Cancel must revert the select with no reload; the share page has no category selects.
- Snacks toggle is per-household (`households.snacks`) and hides-but-keeps snack plan_entries when turned off.
- Grocery scaling multiplies ingredient quantities before merge and uses MAX(scale) per recipe per week; existing-item dedupe is by exact lowercase label, so scaled lines coexist with unscaled ones (e.g. "3 cups flour" + "4 cups flour").
- For scaling/pluralization tests, always include one *imported* recipe (descriptive multi-word ingredient names, ranges like "2-3") — clean manual test names hide formatIngredient bugs. Range quantities ("2-3 sprigs") are deliberately never parsed/scaled/merged (parseIngredient returns qty=null) — expect them verbatim at any scale. Pluralization only applies to names of ≤2 words. Old garbled/scaled lines persist via exact-label dedupe, so assert on exact new-line text, not section contents.
- Since Round 3, grocery dedupe is by normalized `ingredientKey` (name+unit, plural/qty-insensitive): re-adding after a scale change UPDATES the existing unchecked item's label in place (checked items are never relabeled) and `?added=N` counts only true inserts — old exact-label-dedupe expectations no longer apply. Share page accepts `/s/<token>?week=YYYY-MM-DD` with Prev/This/Next week links; invalid week values fall back to the current week.
- Console-clean checks via the JS hook miss CSP violation reports — open the devtools Console panel once per round. (Cloudflare zone RUM auto-injection was disabled in Round 5, so the beacon.min.js CSP error should be gone.) To verify Copy-list clipboard content, paste into the manual-recipe Ingredients textarea and delete without saving; incognito pages can't programmatically read the clipboard back.
- At 375px, compare scrollWidth to viewport (not just eyeball) — nowrap buttons in a non-wrapping flex container overflow silently. This test browser profile injects a local Content-Security-Policy-Report-Only ("[Report Only] Refused to load … app.js") — verify with `curl -sI` that the server sends no Report-Only header before attributing it to the app.
- Chrome min window width (~532px) blocks a real 375px window; use devtools device toolbar (F12 then Ctrl+Shift+M). URL-bar autocomplete may hijack "/" to "/login" — press Delete before Enter.

## Devin Secrets Needed
- CLOUDFLARE_GLOBAL_API_TOKEN (only for the KV code fallback / wrangler remote).
