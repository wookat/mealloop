# R119–122 (prod, branch devin/1786146508-r119-batch, commits 7a91d82+e9ab963)

Code refs: cache headers public/_headers (fonts max-age=31536000 immutable; favicon/icons/og-card 86400); font preload src/layout.js:23. Subscribe double opt-in src/index.js:167-197 ("Check your inbox 📬"; rate limit 2/hr via KV subconfirm:<email>), confirm :199-214 ("You're on the list 🎉" / "Link not valid"), unsubscribe GET+POST :216-234 ("You're unsubscribed" / "Nothing to unsubscribe"); email via Resend from mealloop@zalize.com with List-Unsubscribe + one-click headers (src/auth.js:26-44). Share CTA aside src/index.js:2103-2107 (emerald aside, print:hidden, link → /). New guide src/guides.js:437-454 slug back-to-school-meal-planning.

Standing household strictly READ-ONLY (share page only viewed; baseline 35 to buy · 0 checked). Subscribe flow uses fresh Mail.tm mailbox qa119sub15558@emalupe.com (no MealLoop account created — email_intents only; nothing to GDPR-delete).

## T1 R119 cache headers + preload (shell + browser)
1. curl -sI /fonts/nunito-latin.woff2 → `cache-control: public, max-age=31536000, immutable`; /favicon.svg, /icon-192.png, /icon-512.png, /og-card.png → `max-age=86400`; contrast: /styles.css must NOT have the immutable header (proves _headers scoping, not a blanket rule).
2. Landing HTML contains `<link rel="preload" href="/fonts/nunito-latin.woff2" as="font" type="font/woff2" crossorigin>` (curl).
3. Browser landing: Console/Issues clean — specifically no "preload not used within a few seconds" warning and no CSP violation from the preload.

## T2 R120 double opt-in subscribe (browser UI, Mail.tm)
1. Landing footer email form ("Get new features first"): at 375px emulation, type qa119sub15558@emalupe.com, click "Notify me" → page shows h1 exactly "Check your inbox 📬" with copy "If that address is valid…".
2. Mail.tm API: message arrives from MealLoop <mealloop@zalize.com> subject "Confirm your MealLoop updates subscription"; raw headers include `List-Unsubscribe: <https://mealloop.zalize.com/unsubscribe?t=…>` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`; body has /subscribe/confirm?t= and /unsubscribe?t= links.
3. Open confirm link in browser → h1 "You're on the list 🎉".
4. Open /unsubscribe?t=<unsubToken> (GET) → h1 "You're unsubscribed". POST to same URL (curl form POST, no auth needed) → same page.
5. After unsubscribe, reopen the confirm link → h1 "Link not valid" (unsubscribed_at IS NULL filter).
6. Bad token: /unsubscribe?t=badtoken123456 → h1 "Nothing to unsubscribe".
7. Rate limit: submit the form twice more for the same email; 2nd submit still says "Check your inbox 📬" (no enumeration) but only ≤2 total confirmation emails exist in the mailbox after ~30s (3rd send suppressed). Note: first send already used 1 of 2; assert mailbox total ≤2.

## T3 R121 share-page CTA (standing share page, READ-ONLY)
1. /s/r7cncy7kz1oadsc6rnij (incognito): below the grocery list an emerald aside renders: "This live plan & grocery list is made with MealLoop — plan your own family's week in minutes." + button "Start yours — free during beta" with href="/"; click navigates to landing.
2. Print preview (Ctrl+P): the aside is absent (print:hidden).
3. 375px: share page scrollWidth 375/375; DevTools Issues clean on share page.
4. NO list interactions (no check/add).

## T4 R122 back-to-school guide
1. /guides listing shows card "Back-to-school meal planning: dinners and lunchboxes on a school-night clock" (Meal planning topic? — GUIDE_TOPICS not updated in diff: verify where it appears; if absent from topic sections, flag it).
2. /guides/back-to-school-meal-planning renders h1 + 3 h2s (Plan the week backwards from the calendar / One list, one shop, no weekday store runs / Let the plan answer the 5pm question) + 3-bullet ul + CTA; no console errors.
3. Curl: Article JSON-LD (@type Article) + BreadcrumbList present like other guides; sitemap.xml = 32 locs? NOTE: prev count was 32; +1 guide should be 33 unless handoff's "32" accounts differently — report actual and check the new URL is included.

## T5 Regression
Standing /app/list via main profile (read-only): exactly "35 to buy", no Checked-off section.
