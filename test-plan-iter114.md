# R114–118 visual/brand sprint (prod, PR #23, commit c40a67c)

Code refs: @font-face Nunito font-display:swap + @theme warm stone palette (stone-50 #fbf8f3, stone-100 #f5efe5…) + h1-h4/.font-display rule + reduced-motion-gated micro-interactions (button:active scale .96, checkbox check-pop, .fade-up, .celebrate) — src/input.css:4-64. Hero section class fade-up src/index.js:52. Demo checkboxes now id=demo-item-N :109. Empty recipe box illustration + "Your recipe box is empty — paste a URL above to import your first recipe." :1091-1094; empty list bag illustration :1782-1785; "all done 🎉" wrapped in span.celebrate :1725 (do NOT drive standing list there — assert class exists in served styles.css + DOM template only). New plate+loop favicon.svg / header logo (viewBox 64, amber dot) src/layout.js:35-36; og-card.png/icon-192/512 replaced.

Standing household read-only. Empty states via fresh Mail.tm disposable account, GDPR-deleted afterwards.

## T1 R115 brand: Nunito + warm cream
1. Landing `/` (incognito): DevTools console `getComputedStyle(document.querySelector('h1')).fontFamily` starts with `Nunito`; `document.fonts.check('700 16px Nunito')` === true; body/page background computed color of stone-50 element = `rgb(251, 248, 243)` (#fbf8f3). Visually: rounded Nunito headings, warm cream page background (not previous cool grey).
2. Shell: `curl -sI https://mealloop.zalize.com/fonts/nunito-latin.woff2` → 200 + woff2 content-type; served /styles.css contains `font-display:swap`, `#fbf8f3`, `check-pop`, `fade-up`, `celebrate`, `prefers-reduced-motion`.
3. Logged-in /app (standing session): h1 "Week of…" computed fontFamily Nunito too.
4. No console errors / CSP violations on landing.

## T2 R116 micro-interactions
1. Landing demo Shop tab: computed style of a demo checkbox when checked has `animationName: check-pop` (getComputedStyle after checking); visually click "2 onions" (client-only, safe) — pop visible on recording.
2. Button press: `getComputedStyle(tab, ':active')` not reliable — instead assert stylesheet rule exists (styles.css `button:active…scale(0.96)`) and press a demo tab on-screen.
3. Hero: section.fade-up computed `animationName: fade-up` (fill both).
4. Reduced motion: DevTools Rendering → emulate `prefers-reduced-motion: reduce`, reload → checkbox checked computed animationName `none`, button transition `all 0s` / none, fade-up animationName `none`.
5. .celebrate: assert `.celebrate{animation:…celebrate…}` present in served styles.css (curl) — standing list heading stays "35 to buy" (no all-done state driven).

## T3 R117 brand assets
1. curl -sI: /favicon.svg, /icon-192.png, /icon-512.png, /og-card.png all 200; og-card Content-Length ≈ 61129 (new file, not old 58999).
2. Landing meta `og:image` absolute URL → open it in browser: renders new 1200×630 card (plate+loop mark) correctly.
3. Header logo: new mark (loop arrow + plate with amber dot — viewBox 64) next to Nunito "MealLoop" wordmark — zoom screenshot.
4. Favicon: browser tab icon shows emerald rounded square plate mark.

## T4 R117 empty states (disposable account)
Create fresh Mail.tm account, log in (magic code via Mail.tm API):
1. /app/recipes: plate illustration SVG (amber ring, steam curls) + text exactly "Your recipe box is empty — paste a URL above to import your first recipe." — PASS iff illustration visibly renders above the text.
2. /app/list: grocery-bag illustration (amber+lime dots) + "List is empty. Plan your week and click "Add week's ingredients", or add items manually."
3. GDPR-delete the account (/app/share → Delete account & all data); share token 404.

## T5 Regression
1. 375px iPhone SE: landing `/` and standing /app/list scrollWidth 375/375, no horizontal overflow; DevTools Issues clean on landing.
2. Standing household final: exactly "35 to buy", no Checked-off section.
