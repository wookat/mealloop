# Benchmark Round 2 — internal gates (UX walkthrough + security audit) → fixes → production re-verification

Date: 2026-08-05 · Inputs: gate-2 UX walkthrough report (4×P1, 5×P2, 8×P3) and gate-4 security audit (2×P0, 3×P1, 7×P2) run against production by dedicated role sessions.

## Gap list → resolution (evidence: PR #2 + its verification comment)

| Src | Item | Sev | Resolution |
|---|---|---|---|
| UX | "Add week's ingredients" not idempotent (19 → 38 items) | P1 | Fixed: label-dedupe + "Added N / already on list" banner; re-verified live (15 → 15) |
| UX | Share page recipe names not clickable — family can't see steps | P1 | Fixed: read-only `/s/:token/r/:id` view; verified incognito |
| UX | New-user empty-planner dead end | P1 | Fixed: "Start with one recipe" callout + "import one" link replaces empty dropdown |
| UX | "2 tbsp olive oil" → "2 olive oil" | P1 | Investigated: BBC's own JSON-LD/app state omit the unit (`quantityText:"2"`, no `metricUnit`) — upstream data, not our parser; documented |
| Sec | Code brute-forceable (no attempt limit) | P0 | Fixed: 5 wrong attempts invalidate code; verified live (real code rejected after 6 wrong) |
| Sec | `Math.random()` OTP | P0 | Fixed: `crypto.getRandomValues` |
| Sec | No send rate limit (mail-bomb / Resend quota) | P1 | Fixed: 3 sends / 10 min / email; verified live (4th send refused) |
| Sec | SSRF: no app-layer guard, redirects unchecked | P1 | Fixed: `isPublicHttpUrl` host validation, manual redirect re-validation (max 5), 15s timeout, 4 MB cap; unit-tested |
| Sec | Privacy policy below GDPR Art.13 baseline | P1 | Fixed: legal bases, processors, retention, rights, share-link warning; verified live |
| Sec | CSP gaps / share-token in analytics / plan IDOR / no link revocation / subscribe abuse | P2 | Fixed: frame-ancestors etc.; `/s` path normalization; recipe-ownership check; "Reset link" rotation (verified: old token 404s); subscribe dedupe + unsubscribe note |
| UX | Contrast (stone-400), ISO week title, no plan CTA on recipe | P2 | Fixed: stone-500 pass, friendly date title, "Add to your week plan" CTA |

Remaining known items: CSP still allows 'unsafe-inline' (needs nonce refactor, P2 carried to a later round); UX P3 backlog (8 items) carried.

## Self-assessment
- All gate P0/P1 closed and re-verified in production by the QA agent (report `test-report-round2.md`, recording attached to PR #2 comment).
- Wedge features (no-signup share link, free, web-first) now stronger than round 1: shared recipe view closes the biggest family-collaboration gap vs Plan to Eat / Samsung Food (both require accounts/apps for members).
- Round-3 candidates: grocery quantity merging, recipe search/filter, copy-week/planner ergonomics, CSP nonce refactor, plus signals from live analytics/email intents.
