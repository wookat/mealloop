# MealLoop — Product Hunt launch kit

## Listing
- **Name:** MealLoop
- **Tagline (≤60):** The family meal planner where the grocery list writes itself
- **Links:** https://mealloop.zalize.com (no app stores — it's web, works on any phone)
- **Topics:** Productivity, Cooking, Family, Web App
- **Pricing:** Free (open beta; published paid plans at GA)
- **First comment = maker comment (below); launch on a Tue–Thu.**

## Gallery (capture at 1270×760 from production, cream background)
1. Planner week view with a filled week + "✨ Plan my week with AI" button (hero)
2. Grocery list grouped by aisle with checked items + store tabs
3. Share link page on a phone frame (anonymous, no login)
4. Recipe import: paste URL → structured recipe
5. Pantry page (stocked/low/out) + "Skipped N in your pantry" notice
6. Cook mode with tap-to-start timers
Cover: the 1200×630 OG card (public/og-card.png) is the fallback; a custom "plan → shop → cook" 3-panel is better.

## Maker comment (draft)
> Hey PH 👋
>
> MealLoop started with our own 6pm problem: recipes in ten tabs, the shopping list in a text thread, and someone at the store buying the wrong things twice.
>
> How it works: save recipes once (paste any recipe URL — we read the standard recipe data most sites embed — or type them in, or import a JSON backup), drop them on a week, and the grocery list writes itself: quantities merged, sorted by supermarket aisle, minus what's already in your pantry. Your household shares one private link — anyone can check things off at the store, live, with no account and no app install.
>
> A few things we're proud of:
> • AI weekly drafts grounded in *your own* recipe box (it suggests dinners your family actually eats, not internet-random ones)
> • No onboarding quiz. You're planning within a minute of logging in.
> • Privacy-first: no ads, no cookies before login, cookie-free aggregate analytics, one-click GDPR erase, recipes export in schema.org JSON.
> • Nerd corner: server-rendered on Cloudflare Workers + D1, no JS framework, strict CSP, CSS-only micro-interactions.
>
> Everything is free during the open beta. Would love your feedback — especially from whoever does the meal planning in your house.

## FAQ answers (have ready)
- **vs Plan to Eat / Mealime / AnyList?** Household-first (shared list without accounts), pantry-aware list generation, AI drafts from your own recipes, and a web app that needs no install. And no signup quiz.
- **Native apps?** It's a responsive web app — install-free is the point for family sharing; PWA manifest included.
- **What does the AI send?** Recipe titles only. No emails, tokens, or personal data leave the server.
- **Import blocked sites?** Sites that block automation → paste the recipe text; we parse it.
- **Business model?** Published pricing (Free / Household $3 mo / Supporter $29 yr) starts billing at GA; beta users get notice first.

## Launch-day runbook (👤 boss)
1. Schedule launch 00:01 PT; maker comment posted immediately.
2. Share to personal networks with a personal note (no vote-begging in public spaces).
3. Reply to every comment same-day (voice guide: docs/brand/naming-and-voice.md).
4. Add a launch banner? No — keep the site calm; a small "As seen on PH" footer badge post-launch is fine.
5. Log outcome (rank, signups, feedback themes) in this file.
