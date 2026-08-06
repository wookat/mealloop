# Iteration log — continuous improvement loop (100-round mode)

Each round: five drivers (① QA/tests ② UX walkthrough ③ frontend visual/a11y ④ competitor research ⑤ user/data analytics) → P0/P1/P2 triage → fix & deploy → live regression → log here.

## Round 1 — 2026-08-06

**Findings (by driver):**
- ⑤ Data (P1): 12 legacy `analytics_daily` rows still contained raw share tokens (`/s/<token>`) from before the round-2 redaction fix — privacy hygiene gap in stored data (code already redacts).
- ③ Visual/a11y (P2): no skip-to-content link; nav lacked `aria-current`/active state; logged-in users couldn't see which section they were in.
- ③ SEO/growth (P2): no Open Graph / Twitter Card meta on indexable pages — shared links rendered bare.
- ① QA: `npm test` 8/8 green; no regressions found.
- ④ Competitor: no material change since benchmark-round-6 (same day).
- ⑤ Traffic snapshot: PV 353 (nearly all internal QA), intents 0, users 4, households 4. First organic-looking day-2 hits on `/` (10 views 2026-08-06).

**Fixes shipped:**
- Purged/aggregated legacy token analytics rows into `/s` in remote D1 (leftover count = 0).
- `src/layout.js`: skip link (`sr-only focus:not-sr-only`), `aria-current="page"` + active nav styling, `og:*` + `twitter:card` meta on indexable pages, `id="main"`.

**Evidence:** curl header/meta checks post-deploy; D1 query shows 0 `/s/%` rows.
