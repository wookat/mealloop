# R133b pantryKey re-verify (prod, commit f84dd79)

Code refs: pantryKey src/util.js:223 (name-only, unit/qty-agnostic; verified locally "300g basmati rice"→"basmati rice", "peanut butter"≠"butter"); used in weekly to-list skip src/index.js:1123/1136, staples skip :1847/1854, pantry→list dedupe :2185-2186.

Setup done: disposable household qa133b32265@emalupe.com; recipe "QA Rice Bowl" (300g basmati rice / 50g butter / 1 red onion) planned Mon Aug 3 dinner. Old (broken) behavior: stocked "basmati rice" NOT skipped, notice "Added 3 new items", rice on list.

## T1 stocked-skip with quantified ingredient + false-positive sanity
1. /app/pantry: add "basmati rice, peanut butter" (2 rows, both Stocked).
2. /app → "Add week's ingredients to grocery list". PASS iff notice = "Added 2 new items from this week's plan. Skipped 1 item you already have in the pantry.", list shows "50g butter" and "1 red onion" but NOT basmati rice. FAIL if rice present (regression) or butter missing (peanut butter false-positive skip).

## T2 pantry→list dedupe against quantified list row
1. Check off "50g butter" on the list (checked state).
2. /app/pantry: add "butter", set its level to Out.
3. Click "Add 1 low/out item to grocery list". PASS iff list still has exactly ONE butter row — "50g butter" now unchecked (reused) — and no new plain "butter" row. FAIL if two butter rows.

## T3 Cleanup + regression
1. GDPR-delete household via /app/share → Delete; share token → 404.
2. Standing /app/list (main profile) exactly "35 to buy", no Checked-off section.
