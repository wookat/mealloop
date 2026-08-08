# R142–146 design system (prod, branch devin/1786192444-design-system, commit 330c107, PR #29)

Code refs: input.css — type rhythm/tnum (:28-42), focus-visible outline (:46-50), card shadows (:51-56), input focus border + transition (:57-62), pointer:coarse targets (:64-76), .hero-ambient (:79-84), .stagger delays + card hover lift + details pop-in (motion-gated, :100-131); layout.js:51 `main … max-w-5xl xl:max-w-6xl`; index.js — hero-ambient class :56, .stagger landing grids :65/:78, pricing .stagger + .tnum price :276/:282, AI button title + microcopy line :630-642, scale select title+tnum :680, list count tnum :2019, Units select title :2043.

All read-only on the standing household; do NOT click AI generate. Recording of the browser walkthrough.

## T1 Breakpoint sweep — no horizontal overflow
DevTools device toolbar, responsive widths 375 / 768 / 1024 / 1440. Pages: `/`, `/pricing`, `/guides`, `/app`, `/app/list`, `/app/pantry`, share `/s/r7cncy7kz1oadsc6rnij`.
- For each page×width: console `innerWidth + ':' + document.documentElement.scrollWidth + '/' + document.documentElement.clientWidth` → PASS iff scrollWidth == clientWidth at all 4 widths (28 checks; screenshot representative ones).
- R144 wide container at 1440 on /app: `getComputedStyle(document.getElementById('main')).maxWidth` → PASS iff `1152px` (xl:max-w-6xl); at 1024 → `1024px` (max-w-5xl). FAIL if 1024px at 1440 (old behavior).

## T2 Visual effects (desktop, motion allowed)
1. Landing reload: hero shows soft green/amber radial tint top corners (screenshot; compare vs plain cream). Computed `getComputedStyle(document.querySelector('.hero-ambient')).backgroundImage` contains two radial-gradients.
2. Stagger: computed `animation-delay` of 2nd/3rd feature cards = 0.07s/0.14s; capture mid-entrance screenshot right after reload if possible (else rely on computed values + note).
3. Card hover lift: hover a /guides card → computed transform translateY(-2px) + larger shadow (screenshot hovered vs not).
4. Focus-visible: on landing press Tab a few times → visible 2px emerald outline on focused link/button (screenshot).
5. Popover pop-in: /app/list open "Aisle order…" details → popover appears (animation pop-in in computed style while open).
6. R146: /app (standing, has empty dinner slots) shows microcopy line "✨ The AI drafts dinners from your own recipe box — you review the draft and nothing is saved until you apply it. Stocked pantry items are skipped…" under buttons; AI button has title attr; scale select (Wed lasagne) title starts "×2 doubles"; Units select title starts "Display only"; list count span + pricing price p have computed font-variant-numeric: tabular-nums.

## T3 Reduced motion
DevTools Rendering → Emulate CSS prefers-reduced-motion: reduce, reload landing:
- computed `animationName` of `.stagger > *:nth-child(2)` = none and `.fade-up` section = none; guides card hover transform stays `none`. PASS iff zeroed. Screenshot of console values.

## T4 axe + CWV
- axe (saved DOM + jsdom, color-contrast off) on `/`, `/pricing`, `/app`, `/app/list`: 0 serious/critical.
- Lighthouse headless on `/`: LCP ≤ 2.5s (baseline 1.1s), CLS ≤ 0.1 (baseline 0) — flag regression if worse than baseline meaningfully.

## T5 Regression
Standing /app/list exactly "35 to buy", no Checked-off section; console/Issues clean on landing + /app.
