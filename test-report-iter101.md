# Test report — R101–102 (prod, PR #20): pricing overhaul

Production: https://mealloop.zalize.com · Plan: test-plan-iter101.md · Recording: rec-75a9bd72 (annotated)
Code refs: /pricing route src/index.js:143-181, PRICING_PLANS :125-141, landing badge/CTA/FAQ :41,53,57, terms :217, sitemap :1860, logged-out nav/footer src/layout.js:44-46,54.

All tests executed in an incognito window (logged-out) except T5 (standing logged-in session, read-only).

## T1 — /pricing logged-out — PASSED

- h1 "Simple pricing, built for households"; amber "MealLoop is in open beta" banner with "free for everyone during the beta … no card required".
- 3 tiers in order: **Free $0 forever** ("Start free") · **Household $3 /month · or $24/year** with emerald ring + "Most popular" pill ("Start free beta trial") · **Supporter $29 /year** ("Start free beta trial").
- All 3 CTAs `href="/login"`; clicking the Household CTA landed on the /login email-code form. No payment form, card field, or checkout anywhere on the page or after the CTA.
- Exactly 3 `<details>` pricing FAQs with the expected questions; first one expanded and showed its answer text.

![pricing desktop top](https://app.devin.ai/attachments/3ea74783-c452-4e28-b49a-b1df7c7b0fb9/ss_1dd12cf4.png)

| 🟢 FAQ expanded (3 details) | 🟢 CTA → /login (no payment) |
|---|---|
| ![faq](https://app.devin.ai/attachments/d7d77213-8349-43db-a9c7-3d9b671f563f/ss_73556ab5.png) | ![login](https://app.devin.ai/attachments/ec0b5efd-4cf6-4856-a9f0-bd8283d2b845/ss_9414a21b.png) |

## T2 — Landing badge / hero CTA / FAQ pricing link — PASSED

- Badge pill exactly: **OPEN BETA · ALL FEATURES FREE DURING BETA · NO ADS**.
- Hero CTA: **Start your free beta trial** → /login.
- FAQ #1 "How much does MealLoop cost?" expands to the beta-cost answer; the word "pricing" renders as a real emerald underlined `<a href="/pricing">` (not escaped text) and clicking it navigated to /pricing (URL bar zoom shot).

| 🟢 Badge + hero CTA | 🟢 FAQ #1 open with rendered pricing link |
|---|---|
| ![landing](https://app.devin.ai/attachments/0f41b80f-42b8-4ce9-bc45-3a0dec6f0560/ss_f69a369a.png) | ![faq1](https://app.devin.ai/attachments/784cc4d5-736d-4631-9fd4-d9a118b13cec/ss_64777b77.png) |

![clicked FAQ pricing link → /pricing](https://app.devin.ai/attachments/ec25d577-2618-4ed4-8768-25ecea9c3fc9/ss_zoom_cf9eec38.png)

## T3 — Logged-out nav + footer + 375px + diagnostics — PASSED

- Header nav (logged out): Pricing · Log in · **Start free trial** (emerald), visible in every logged-out screenshot; footer starts with a Pricing link.
- iPhone SE 375px on /pricing: cards stack single-column, nav fits one row, `scrollWidth/clientWidth = 375 / 375`; Console "No Issues"; Issues panel "No issues detected so far".

![375px pricing + clean Issues](https://app.devin.ai/attachments/0adb5ef5-f7b9-4841-b1f5-a1b1dcf740d3/ss_4d913d11.png)

## T4 — Terms clause + sitemap — PASSED

- /terms opens with: "MealLoop is currently in open beta: all features are provided free of charge during the beta period. Published pricing takes effect only at general availability, with prior notice to beta users."
- `curl sitemap.xml`: exactly **31** `<loc>` entries, including `https://mealloop.zalize.com/pricing`.

![terms](https://app.devin.ai/attachments/6a14ecff-b8be-44c3-88cd-32da9b014b74/ss_646a5b5e.png)

## T5 — Logged-in variant + standing-household regression (read-only) — PASSED

- Standing logged-in session: /pricing shows app nav (Planner/Recipes/List/Log out) and all 3 CTAs become **"Open your planner"** → /app (no /login CTAs). Session working = login-flow regression covered (no new account created; no DB changes this round).
- /app/list: heading exactly **"Grocery list 35 to buy"**, aisle chips sum 17+4+4+2+1+2+5 = 35, list ends at OTHER with **no "Checked off" section** (0 checked). Nothing was clicked/modified.

| 🟢 Logged-in /pricing CTAs → /app | 🟢 Standing list 35 to buy · 0 checked |
|---|---|
| ![loggedin](https://app.devin.ai/attachments/40cefd07-5361-42ca-9dbd-c50e4ca003ad/ss_558dc16c.png) | ![list](https://app.devin.ai/attachments/40c99402-a580-4519-9223-c5755aa493a9/ss_7fd6626e.png) |

![list bottom — no checked section](https://app.devin.ai/attachments/fcf5f464-f905-4053-ae80-956e6e39a0dd/ss_351343df.png)

## Notes / limitations

- One tester slip on the recording: first click on FAQ #1 didn't toggle the details (page had scrolled); second click worked. Not an app defect.
- Login was regression-verified via the standing session (session cookie still valid, app pages render); the full email-code flow was not re-run this round to avoid creating accounts (fully proven in R100).
- DevTools used only for the 375px measurement and Console/Issues; everything else native UI.

## Verdict

All R101–102 assertions passed. No defects found. Standing household untouched.
