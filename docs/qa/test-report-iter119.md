# Test report — R119–122 (production, branch devin/1786146508-r119-batch, commits 7a91d82+e9ab963)

Tested on https://mealloop.zalize.com. UI flows in the browser (recorded, annotated); curl/wrangler for headers, sitemap, JSON-LD and email-header evidence. Standing household strictly read-only; final state exactly **35 to buy · 0 checked**.

**Discrepancy (handoff, not app):** sitemap has **33** locations (handoff said 32) — the new guide URL is present; previous round already measured 32, so +1 guide = 33. Same off-by-one pattern as R110.

**Note:** the new guide slug is NOT in `GUIDE_TOPICS` (src/index.js:333-338); it appears on /guides via the leftover-guides fallback, appended to the last section, making "Family, sharing & tools" count 6. Rendering is correct; flagging in case a different section was intended.

## T1 R119 cache headers + font preload — PASSED
- `/fonts/nunito-latin.woff2` → `cache-control: public, max-age=31536000, immutable`
- `/favicon.svg`, `/icon-192.png`, `/icon-512.png`, `/og-card.png` → `public, max-age=86400`
- Control: `/styles.css` → `max-age=0, must-revalidate` (proves _headers scoping, not a blanket rule)
- Landing head contains `<link rel="preload" href="/fonts/nunito-latin.woff2" as="font" type="font/woff2" crossorigin>`
- Browser: Console empty, DevTools "No Issues" — no unused-preload warning, no CSP violation

![landing console clean / No Issues](https://app.devin.ai/attachments/1da034e2-cb5e-43e3-9f10-e143a546395d/ss_zoom_5019ddbd.png)

## T2 R120 double opt-in subscribe (fresh Mail.tm mailbox qa119sub15558@emalupe.com, 375px UI) — PASSED
- Landing footer form submit at 375px → **"Check your inbox 📬"** page
- Email from `MealLoop <mealloop@zalize.com>`, subject "Confirm your MealLoop updates subscription", raw headers include `List-Unsubscribe: <https://mealloop.zalize.com/unsubscribe?t=…>` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`; body carries confirm + unsubscribe links
- Confirm link in browser → **"You're on the list 🎉"**
- `/unsubscribe?t=…` GET → **"You're unsubscribed"**; POST (one-click style) → same h1
- Old confirm link after unsubscribe → **"Link not valid"**
- Bad token → **"Nothing to unsubscribe"**
- Rate limit: 3 total form submits within the hour → exactly **2** confirmation emails in the mailbox (3rd suppressed), page response identical each time (no enumeration)

| 375px submit → Check your inbox | Confirm → You're on the list |
|---|---|
| ![check inbox](https://app.devin.ai/attachments/72b6d480-a8dc-4791-8609-7c4e06bce411/ss_4765d898.png) | ![confirmed](https://app.devin.ai/attachments/e6c418c1-098b-4f92-809a-8ecab6a1c2af/ss_01da51ba.png) |

| Unsubscribed | Old confirm link now invalid |
|---|---|
| ![unsubscribed](https://app.devin.ai/attachments/ce126a13-f870-458f-869d-ca4e26398ffb/ss_3f70313f.png) | ![link not valid](https://app.devin.ai/attachments/46ee3591-a0bc-4ce0-93ad-7eb2a8844442/ss_6614c2c6.png) |

![bad token → nothing to unsubscribe](https://app.devin.ai/attachments/d27cf23d-39f5-40a3-abb3-9ec161b2a018/ss_abec1c33.png)

QA residue: both QA rows removed from `email_intents` afterwards (verified count 0); no MealLoop account was created.

## T3 R121 share-page footer CTA (read-only) — PASSED
- `/s/r7cncy7kz1oadsc6rnij`: emerald aside below the list — "This live plan & grocery list is made with **MealLoop** — plan your own family's week in minutes." + "Start yours — free during beta" with href="/"
- Print preview: CTA absent from all 3 print pages (print:hidden)
- 375px: CTA renders, scrollWidth **375/375**, DevTools "No Issues"
- No list interactions; heading stayed "Grocery list 35 to buy" throughout

| CTA on share page | Print preview last page — no CTA |
|---|---|
| ![share CTA](https://app.devin.ai/attachments/c512b1ee-398f-4308-b708-f7ef9ba8b079/ss_14c2b40a.png) | ![print no CTA](https://app.devin.ai/attachments/d9e7cf4d-520e-46b8-96cf-17bcb9b00cfa/ss_856cdc17.png) |

![375px share page with CTA](https://app.devin.ai/attachments/aaf942e2-e8fb-442b-99a2-706abf6d6338/ss_defaecc5.png)

## T4 R122 back-to-school guide — PASSED (see notes above)
- `/guides` lists the new card (last in "Family, sharing & tools", chip count 6 via leftover fallback)
- Guide page renders h1, 3 h2s, 3-bullet ul, breadcrumb "Guides › …", CTA; console clean / "No Issues"
- Curl: `@type: Article` + `@type: BreadcrumbList` JSON-LD present; ItemList now 28 items, new guide position 28 matching visible order
- Sitemap: **33** `<loc>` including `/guides/back-to-school-meal-planning` (handoff said 32 — see discrepancy)

| Listing card | Guide page |
|---|---|
| ![listing](https://app.devin.ai/attachments/e9b1eb9b-7ecf-4203-a4f1-e796902a35db/ss_d353299e.png) | ![guide](https://app.devin.ai/attachments/3088af6a-fac7-4fec-9637-4be8faa46d22/ss_429823c9.png) |

## T5 Regression — PASSED
Standing /app/list exactly **35 to buy**, category chips 17+4+4+2+1+2+5 = 35, no Checked-off section; Issues clean on landing and share page.

![standing list 35 to buy](https://app.devin.ai/attachments/5109f9c4-1325-4379-96c4-69c9686384e8/ss_5ab37288.png)

Recording: `/home/ubuntu/screencasts/rec-e39dd7fc-9449-4bb7-aacf-8ec407b753d7/rec-e39dd7fc-9449-4bb7-aacf-8ec407b753d7-edited.mp4`
