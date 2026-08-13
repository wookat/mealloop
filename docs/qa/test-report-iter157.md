# Test report — R157 AI 排餐成功路径冒烟 (production)

- **Target:** https://mealloop.zalize.com (merged main, no new code)
- **Account:** disposable Mail.tm `qa157b21734@emalupe.com` — GDPR-deleted after the run (share token `u5ndcdnojwh4v5q0cfv7` → 404)
- **Result:** success path PROVEN end-to-end (draft → swap → apply), with one AI failure + one successful retry
- **Recording:** rec-34ca931b-2095-4223-b311-2e64e0407d5b-edited.mp4

## Timeline / assertions

| # | Step | Expected | Observed | Result |
|---|------|----------|----------|--------|
| 1 | Login-code email to Mail.tm | code delivered | delivered on first send this run (Resend recovered; no KV fallback needed) | ✅ |
| 2 | Empty box → AI click → fewbox → "Add 8 starter recipes" | `?ai=starters` notice, 8 recipes | notice shown, setup step ticked | ✅ |
| 3 | "✨ Plan my week with AI" attempt 1 | overlay, /app/ai ≤~40 s | overlay appeared instantly (spinner + "Reading your recipe box…"), but **failed after ~30 s → `?ai=err`** | ⚠️ 1 failure |
| 4 | "Try again" (allowed single retry) | /app/ai | overlay + Retrying…; **reached /app/ai between ~25–45 s** (observed at the ~45 s check) | ✅ |
| 5 | Draft page | 7 day cards + alternates | 7 dinners Mon Aug 10–Sun Aug 16, all "From your recipe box", ↻ Swap on every day (alternates exist), Apply/Discard | ✅ |
| 6 | ↻ Swap on Monday | day's recipe changes | "Weeknight beef tacos" → "Fried rice with egg and peas" | ✅ |
| 7 | "Apply to my week" | plan persisted, /app shows 7 dinners | redirected to /app?week=2026-08-10 with a dinner on all 7 days incl. the swapped Fried rice; "Plan a dinner" setup step ticked | ✅ |
| 8 | GDPR delete | logged out, token dead | confirm dialog → landing page; `/s/u5ndcdnojwh4v5q0cfv7` → HTTP 404 | ✅ |
| 9 | Baseline share (read-only) | 35 to buy · 0 checked | `/s/r7cncy7kz1oadsc6rnij` → 200, "Grocery list 35 to buy", chips 17/4/4/2/1/2/5 (=35), no Checked-off; nothing clicked | ✅ |

## Evidence

![8 starter recipes added](https://app.devin.ai/attachments/403495f8-5eb6-4d90-a1f3-e622adaf985f/ss_e74fdc81.png)
![AI overlay on submit](https://app.devin.ai/attachments/b94c7770-2fd8-4701-8f65-31ca472b0df2/ss_fc2207c0.png)
![attempt 1 failed → ai=err](https://app.devin.ai/attachments/adf9aa4e-ffcd-4e02-969a-c3036a2cf5b4/ss_c8be9357.png)
![/app/ai 7-day draft + Swap + Apply](https://app.devin.ai/attachments/b345717e-4cfa-4f00-89e4-0e0393409301/ss_ede95d5b.png)
![Swap: Mon → Fried rice with egg and peas](https://app.devin.ai/attachments/8b403070-5240-48a2-8bd6-c65b6aca4d71/ss_a391edb9.png)
![Applied: 7 dinners on /app](https://app.devin.ai/attachments/a4a6958a-f922-465f-829a-fe04fabea1f6/ss_d21eb62a.png)
![GDPR delete confirm](https://app.devin.ai/attachments/d89da6eb-bff1-4ec4-aac6-af1530044011/ss_8a512c46.png)
![Baseline share intact: 35 to buy](https://app.devin.ai/attachments/4aa360b4-3119-4d03-aa2d-cb3fd2bd375d/ss_3fa30054.png)

## Notes / known issues

1. **AI reliability:** 1 of 2 generation attempts failed (~50% this run; last run 2/2 failed). The error path caught it gracefully, but flakiness on the relay persists — consider server-side logging of the relay error body to distinguish 429/5xx/timeouts.
2. **Cosmetic (known since R155):** overlay stage text advances far faster than 7 s/stage — the last stage "Taking longer than usual — retrying once…" was showing ~13 s after submit (duplicate submit listeners/intervals in public/app.js).
3. Login email worked this run; the previous run's Resend outage was not reproduced.
