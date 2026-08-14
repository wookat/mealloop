# Analytics export — 30-day retention funnel (generated 2026-08-14)

Aggregate-only export from first-party data (D1 `analytics_daily` / `referrers_daily` / product tables). No PII: counts only, QA-pattern accounts (`delivered+qa…@resend.dev`, `qa+…@example.com`) and the standing QA baseline household are excluded from funnel steps. Window: last 30 days.

## Funnel

| Step | Definition | Count |
|---|---|---|
| 1. First visits (proxy) | Page views on `/` (landing) | 307 views |
| 2. Login-page reach | Page views on `/login` | 79 views |
| 3. Sign-ups | Users created in window (QA patterns excluded) | 4 |
| 4. Activation — planned a meal | New-user households with ≥1 plan entry | 2 |
| 4b. Activation — grocery list | New-user households with ≥1 shopping item | 2 |
| 5. Return visits | New-user households active on ≥2 distinct days (plan/list/recipe writes) | 0 |

## Context (30-day traffic, views not uniques)

- Total tracked views: 3,291. Top paths: `/s` share pages 853, `/app/list` 668, `/app` 463, `/app/recipes` 347, `/` 307, `/guides*` 337 (hub 80 + articles), `/login` 79.
- External referrers (hostname-only aggregates): google.com 1, bing.com 1 — organic search is not yet a meaningful channel.
- All-time user count: 5.

## Honest caveats (method limits, not fixable without adding tracking entities)

1. **Views, not visitors.** First-party analytics counts page views per day/path only — no cookies/fingerprinting by design — so step 1 is a proxy, and view→signup rates are not true unique-visitor conversion.
2. **QA contamination in traffic (not in funnel).** GDPR-deleted disposable test accounts leave no user rows, but their page views remain in `analytics_daily`; the heavy `/s`, `/app/list`, `/app` view counts are dominated by this project's own QA/acceptance testing. Funnel steps 3–5 exclude QA-pattern accounts, but disposable Mail.tm-domain accounts that were later deleted are simply absent (correctly not counted).
3. **Return-visit definition.** No `last_seen` is tracked; "return" is approximated as write-activity on ≥2 distinct days. A user who returns and only reads would not count.
4. **Interpretation.** With ~2 organic search referrals and 4 sign-ups in 30 days, the funnel is too thin for rate conclusions; the actionable signal is acquisition (indexing/distribution), not in-product retention. Bing Webmaster/GSC registration (audit round 5 suggestion) would add real impression/click data upstream of step 1.
