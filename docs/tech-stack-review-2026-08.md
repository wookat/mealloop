# Tech-stack review — 2026-08 (boss directive #3, competitor sprint)

Question: is the current stack the best/most modern/most suitable for this domain, within the Cloudflare platform constraint? Upgrade only where there is a clear benefit.

## Current stack

- **Runtime/hosting:** Cloudflare Workers (single Worker, `wrangler deploy`), custom domain route mealloop.zalize.com
- **Framework:** Hono 4 (routing, middleware) — server-rendered HTML strings
- **Data:** Cloudflare D1 (SQLite, 12 migrations) + KV (rate limits/codes)
- **Styling:** Tailwind CSS v4 (`src/input.css` → built `public/styles.css`, no CDN)
- **Client JS:** one vanilla `public/app.js` (~5 KB), no framework, strict CSP (`script-src 'self'`, no unsafe-inline)
- **Tests/CI:** vitest unit suite (24 tests), GitHub Actions

## What competitors observably use (from docs/competitor-scan-2026-08.md)

| Product | Observable stack | Relevant lesson |
|---|---|---|
| Mealime | Next.js marketing site | SSR + good LCP; we already SSR at the edge |
| RecipeSage | Astro marketing + Angular app, open source | Astro great for content sites; our guide pages are already static-fast SSR |
| Plan to Eat | WordPress + NitroPack marketing, Rails-era app | marketing/app split; not needed at our size |
| SideChef | Next.js, heavy faceted pSEO | faceted pSEO is a content strategy, not a stack requirement |
| Paprika/AnyList/Mela/Crouton | native apps | out of v1 scope (web-first strategy) |

## Assessment

1. **Workers + Hono + SSR strings**: still the best fit. Zero cold-start edge SSR beats competitors' origin-served pages on TTFB; Hono is the current de-facto standard Workers framework (actively maintained, 2026-current). No change.
2. **React/Next/Remix on Workers?** No clear benefit: the app is form-POST + tiny progressive-enhancement JS under a strict CSP. A hydration framework would add ~40–100 KB JS, complicate CSP, and none of our features need client state management. Rejected for now; revisit only if we build a highly interactive surface (e.g. drag-drop planner).
3. **Astro for guides?** Would split the codebase for marginal gain — guides are already served in ~1 SSR template with JSON-LD. Rejected.
4. **D1**: right choice (relational, household-scoped joins everywhere). Durable Objects considered for live list sync; current 5s version-polling is adequate at current scale and far simpler. Revisit at real concurrent-user scale (would give push-based sync via WebSockets/DO).
5. **Tailwind v4**: already on the latest major. Keep.
6. **Upgrades adopted this sprint:** none required beyond routine dependency currency; `npm outdated` reviewed at deploy time.

## Conclusion

Stack is modern, mainstream and platform-appropriate; no migration has a clear benefit today. Flagged future triggers: Durable Objects when real-user concurrency arrives; a client framework only if a drag-drop/offline surface is prioritized.

## Addendum (R118, visual sprint)

Component-library/animation-stack question re-evaluated for the visual upgrade: shadcn/ui, Radix, Motion and GSAP all assume a React (or at least bundler+JS-runtime) client. Under our strict CSP, zero-framework SSR architecture the equivalent wins are achieved with: Tailwind v4 `@theme` design tokens (shadcn-style token system), CSS-native spring easings (`cubic-bezier(0.34,1.56,0.64,1)`) for micro-interactions, and a self-hosted variable font (Nunito, OFL). No JS animation runtime adopted — no clear benefit, real bundle/CSP cost. Tailwind remains on the latest major (v4).
