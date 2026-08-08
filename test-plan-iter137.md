# R137–141 brand + marketing (prod, branch devin/1786188640-brand-batch, commit 63a1ada)

Code refs: /about src/index.js:347-364, /press :366-391 (asset links /favicon.svg, /icon-512.png, /og-card.png with `download`), footer About+Press src/layout.js:57-58, sitemap urls +about+press src/index.js:2536 (36 expected: prior 34 + 2), sendWelcome src/auth.js:45-63 (subject "Welcome to MealLoop — plan your first week in a minute", List-Unsubscribe + one-click headers, unsubscribe link), fired once via `if (!row.confirmed) waitUntil(sendWelcome(...))` in /subscribe/confirm src/index.js:198-205 — re-visiting confirm link after confirmed=1 must NOT resend.

Setup done: D1 cleanup works with CLOUDFLARE_GLOBAL_API_TOKEN (default CLOUDFLARE_API_TOKEN gets 7403). email_intents currently has 1 pre-existing row (leave untouched).

## T1 About/Press pages (browser, logged out)
1. /about renders: h1 "About MealLoop", "What we believe" h2 with 4 bullets, links to /press + mailto. /press renders: h1 "MealLoop press kit", Boilerplate/Facts/Brand assets/Screenshots h2s. PASS iff visible in screenshots, no 404.
2. Footer on landing AND /about shows About + Press links between Guides and Privacy; click Press in footer → /press. PASS iff links present and navigate.
3. curl: /favicon.svg, /icon-512.png, /og-card.png → 200 with sensible content-types; /about + /press → 200.
4. Sitemap: curl /sitemap.xml → exactly 36 `<loc>` including /about and /press.
5. 375px (device toolbar) on /about and /press: scrollWidth 375/375. axe (saved DOM + jsdom, contrast off) on both: 0 serious/critical. DevTools Console/Issues clean on both.

## T2 Welcome email lifecycle (fresh Mail.tm address)
1. Landing footer subscribe form: type fresh address (verify typed value before submit) → "Check your inbox 📬".
2. Mail.tm: confirm email arrives ("Confirm your subscription"-style). Open confirm link in browser → "You're on the list 🎉".
3. Within ~60–120s a SECOND email arrives: subject exactly "Welcome to MealLoop — plan your first week in a minute"; raw source has List-Unsubscribe + List-Unsubscribe-Post: List-Unsubscribe=One-Click; body has /unsubscribe?t= link. PASS iff all three. FAIL if no second email.
4. Idempotency: reload the same confirm link → page still shows confirmed message; wait 90s → NO third email in Mail.tm (message count stays 2). FAIL if a second welcome arrives.
5. Unsubscribe via link → "You're unsubscribed".
6. Cleanup: `CLOUDFLARE_API_TOKEN=$CLOUDFLARE_GLOBAL_API_TOKEN npx wrangler d1 execute mealloop-db --remote --command "DELETE FROM email_intents WHERE email='<addr>'"`; verify SELECT COUNT for that email = 0 and total back to 1.

## T3 Read-only spot check (regression)
1. Landing / → 200, renders.
2. Standing /app planner loads (main profile), lasagne Wed intact; do NOT click AI generate.
3. Standing /app/list heading exactly "35 to buy", no Checked-off section.
