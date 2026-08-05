# MealLoop v1 — Production QA Report

**Target:** https://mealloop.zalize.com (Cloudflare Workers + D1 + KV, PR #1, branch `devin/1785934500-mealloop-v1`)
**Method:** End-to-end UI testing in Chrome against production; shell (curl) for SEO/security spot checks. Login done with a real Mail.tm mailbox (`mealloop-qa-4405@web-library.net`) receiving the Resend email.
**Recording:** `/home/ubuntu/screencasts/rec-d004578a-c4fc-48ec-ada4-694b3d371a0e/rec-d004578a-c4fc-48ec-ada4-694b3d371a0e-edited.mp4`

## Result summary

| # | Test | Result |
|---|------|--------|
| 1 | Landing page renders, footer cross-links | ✅ Pass |
| 2 | Magic-code login (real email via Resend → Mail.tm) | ✅ Pass |
| 3 | Recipe import — **Allrecipes URL** | ❌ **FAIL (P1)** — `Import failed: Fetch failed (403)` |
| 3b | Recipe import — BBC Good Food URL (fallback) | ✅ Pass (title, image, times, ingredients, steps) |
| 4 | Planner: add recipe entry, add note, delete entry | ✅ Pass |
| 5 | Week → grocery list, aisle grouping, optimistic check-off, Clear checked | ✅ Pass |
| 6 | Share link no-login view + ~5s cross-context sync | ✅ Pass (synced within ~8s) |
| 7 | SEO: robots.txt, sitemap.xml, /guides + guide page | ✅ Pass |
| 8 | Mobile responsiveness /app and /app/list (390px) | ✅ Pass |
| 9 | Security: /app auth redirect, bad share token 404, XSS escaping, privacy/terms | ✅ Pass |

## P1 Bug: Allrecipes import blocked (403)

The PR's own golden-path URL `https://www.allrecipes.com/recipe/223042/chicken-parmesan/` fails twice consistently: Allrecipes (Cloudflare-protected) blocks the Worker's server-side fetch. Users pasting Allrecipes URLs — one of the two sites named in the input placeholder — get a bare error. Suggest: browser-like headers or a fetch proxy, and softer error copy.

| 🔴 Allrecipes import fails (403) | 🟢 BBC Good Food import works |
|---|---|
| ![fail](https://app.devin.ai/attachments/12d13836-d3dc-41f8-a668-528de9eff336/ss_de064a75.png) | ![ok](https://app.devin.ai/attachments/77d93a04-d150-49bb-aa18-3be926bcc3ae/ss_883e8a40.png) |

## Evidence

| Landing page | Login → /app planner |
|---|---|
| ![landing](https://app.devin.ai/attachments/28b13d81-f928-4e38-b68a-214af70ea118/ss_3bf77229.png) | ![planner](https://app.devin.ai/attachments/667e7513-f781-4461-b64c-061aa3fd0d0e/ss_a6139f4d.png) |

| Planner with recipe + note entries | Grocery list: 2 items checked (optimistic) → cleared |
|---|---|
| ![planner entries](https://app.devin.ai/attachments/534513e4-8b81-45d7-9b94-bc4f901a8043/ss_b70dac7b.png) | ![checked](https://app.devin.ai/attachments/8a96deb7-ed9e-4617-b161-9ea8eeab036d/ss_7f4e864f.png) |

| After "Clear checked" | Share page /s/<token> in incognito (no login) |
|---|---|
| ![cleared](https://app.devin.ai/attachments/e320f42d-83a0-4483-a1d0-978340816853/ss_f02c9ae9.png) | ![share](https://app.devin.ai/attachments/0da8c705-55e1-4222-bd56-32563bd5eb3c/ss_a9cdd72b.png) |

**Sync:** checked "300g fresh lasagne sheets" in incognito; the logged-in `/app/list` tab auto-reloaded and showed it checked within ~8s without manual refresh:

![sync](https://app.devin.ai/attachments/550d85f5-1d7f-4d2b-86ba-1220f5922a87/ss_8d579912.png)

| Mobile 390px /app | Mobile 390px /app/list |
|---|---|
| ![mobile app](https://app.devin.ai/attachments/551fc239-5519-4cb3-b6f6-849ba4f3d664/ss_6de04c0b.png) | ![mobile list](https://app.devin.ai/attachments/5be4c921-90ec-46aa-8569-707c7e56b529/ss_11a80b58.png) |

| XSS escaped (recipe title payload as text, no alert) | /guides list |
|---|---|
| ![xss](https://app.devin.ai/attachments/a07ed98d-a7e2-479d-a849-cb8f20fe040a/ss_035b3de7.png) | ![guides](https://app.devin.ai/attachments/d140578c-579e-4d51-86cc-0c17e0ff6348/ss_5afcc7a5.png) |

## Shell spot checks (security/compliance)

```
GET /app (no cookie)        → 302 → /login  ✅
GET /s/badtoken123          → 404          ✅
GET /privacy, /terms        → 200, 200     ✅
GET /robots.txt             → Allow /, Disallow /app + /s/, Sitemap ✅
GET /sitemap.xml            → 10 URLs incl. all 6 guide pages ✅
```

## UX walkthrough findings (non-blocking)

- **P2:** Import error message `Import failed: Fetch failed (403)` is developer-speak; suggest "That site blocked us — try another link or add the recipe manually."
- **P3:** Ingredient categorizer misfiles some items: "200ml hot beef stock" → Meat & Seafood, "passata" → Produce, prosciutto/lasagne sheets → Other. Acceptable for v1.
- **P3:** Optimistic checkbox toggles a green fill but the ✓ contrast is subtle at desktop density; fine on mobile.
- **P3:** No security headers beyond defaults (no HSTS/CSP/X-Frame-Options observed). Consider adding.
- Landing page email-capture form works and privacy policy accurately describes cookie-free analytics + single session cookie (matches code).
