# R101–102 (prod, PR #20) — pricing overhaul verification

Code: /pricing route src/index.js:143-181, PRICING_PLANS :125-141 (Free $0/forever "Start free" · Household $3 "/month · or $24/year" highlight "Most popular" · Supporter $29/year), amber beta banner :150-152, 3 FAQ details :170-178, CTAs href = user ? /app : /login (:164). Landing badge :53, hero CTA :57, FAQ #1 with /pricing link inside details answer :41. Logged-out nav Pricing + "Start free trial" src/layout.js:44-46; footer Pricing :54. Terms beta clause src/index.js:217. Sitemap urls incl /pricing :1860 (26 guides + 5 = 31).

## T1 /pricing logged-out (incognito)
PASS iff: h1 "Simple pricing, built for households"; amber banner "MealLoop is in open beta" + "free for everyone during the beta"; 3 tier cards in order Free $0 forever / Household $3 "/month · or $24/year" with emerald ring + "Most popular" pill / Supporter $29 /year; CTA labels "Start free" / "Start free beta trial" ×2, ALL hrefs = /login (click one → lands on /login, no payment form anywhere); exactly 3 <details> pricing FAQs with the exact questions ("Is it really all free right now?", "What happens to my data when billing starts?", "Do family members I share the link with need a plan?") — expandable.

## T2 Landing page logged-out
PASS iff badge pill reads exactly "OPEN BETA · ALL FEATURES FREE DURING BETA · NO ADS"; hero CTA "Start your free beta trial" → /login; FAQ "How much does MealLoop cost?" opens and the word "pricing" renders as an emerald underlined LINK (not escaped `<a...>` text) and clicking it navigates to /pricing.

## T3 Logged-out nav + footer
PASS iff header nav shows Pricing · Log in · Start free trial (emerald); footer contains Pricing link before Guides/Privacy/Terms. At 375px the header does not overflow: scrollWidth/clientWidth = '375 / 375' on /pricing (also covers pricing mobile layout — cards stack single-column); Console "No Issues", Issues "No issues detected so far".

## T4 Terms + sitemap
PASS iff /terms contains the clause "currently in open beta: all features are provided free of charge during the beta period"; sitemap.xml = exactly 31 <loc>s including https://mealloop.zalize.com/pricing.

## T5 Logged-in variant + regression (standing session, read-only)
PASS iff /pricing in the standing logged-in session shows all 3 card CTAs as "Open your planner" → /app (no /login CTAs, no nav Pricing/Start free trial — app nav instead); /app/list still exactly "35 to buy" · 0 checked (read-only look). Login flow regression is covered by the logged-in session working; no new account needed (no DB changes this round).
