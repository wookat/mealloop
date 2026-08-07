# Test report — R114–118 visual/brand sprint (prod, PR #23, commit c40a67c)

Production: https://mealloop.zalize.com · Plan: test-plan-iter114.md · Recording: rec-6693a734 (annotated)
Code refs: @font-face Nunito + warm @theme palette + reduced-motion-gated animations src/input.css:4-64; hero fade-up src/index.js:52; empty states src/index.js:1091-1094 / :1782-1785; celebrate span :1725; new logo src/layout.js:35-36; favicon.svg/icon-192/512/og-card.png replaced.

Standing household read-only throughout. Empty states verified on a disposable Mail.tm household (`qa11418415@web-library.net`), GDPR-deleted afterwards (share token 404).

## T1 — R115 Nunito + warm cream palette — PASSED

- Landing (incognito): computed `h1` fontFamily = **"Nunito, ui-rounded, system-ui, sans-serif"**; `document.fonts.check('700 16px Nunito')` = **true**; body background = **rgb(251, 248, 243)** (#fbf8f3). Console "No Issues", Issues panel clean.
- Logged-in /app: same Nunito h1 + warm bg (CDP check after incognito closed).
- Shell: `/fonts/nunito-latin.woff2` → **200, content-type font/woff2**; served styles.css contains `font-display:swap`, `#fbf8f3`, `Nunito`.

| 🟢 Landing: Nunito headings, cream bg | 🟢 Computed: Nunito + fonts loaded |
|---|---|
| ![landing](https://app.devin.ai/attachments/37d43cad-6133-49a6-813a-a12785dfbb8c/ss_56a8c352.png) | ![computed](https://app.devin.ai/attachments/79aa9229-295d-48c6-81b0-f40b632df36c/ss_6bf363dc.png) |

🟢 body bg rgb(251,248,243): ![bg](https://app.devin.ai/attachments/0757669c-9dd5-4a00-9590-dd2fd4c8c94e/ss_zoom_38f0fb43.png)

## T2 — R116 micro-interactions + reduced-motion gate — PASSED

- Motion allowed: computed `animationName` = **fade-up** on hero section, **check-pop** on checked demo checkbox; `[role=tab]` transitionProperty = **transform, background-color**. Demo checkboxes clicked live on the Shop tab (client-only; pop captured on recording).
- Emulated `prefers-reduced-motion: reduce` (DevTools Rendering) + reload: checkbox and hero animationName = **none**, tab transitionDuration = **0s** — all animations/transitions absent.
- `.celebrate{animation:…}` present in served styles.css (curl, 1 match) and the "all done 🎉" template wraps it in `span.celebrate` (src/index.js:1725). Not driven at runtime — standing list stayed at "35 to buy" per instructions, so the celebrate animation itself is **untested at runtime** (CSS-class existence only).

| 🟢 Computed animations (motion allowed) | 🟢 Reduced motion: animationName none |
|---|---|
| ![motion](https://app.devin.ai/attachments/1094a4c2-89d7-4e48-95ea-157e7cfab187/ss_zoom_e9bc6cc0.png) | ![reduced](https://app.devin.ai/attachments/801f451d-6fb0-4312-8ecd-7139e3c2b6bf/ss_zoom_ad25e269.png) |

| 🟢 Demo checkboxes toggled live | 🟢 Reduced motion: transition 0s |
|---|---|
| ![checkboxes](https://app.devin.ai/attachments/596b994e-4383-46a5-9294-4974de3587ca/ss_39b21ee7.png) | ![transition](https://app.devin.ai/attachments/11f24482-f11a-4738-8a1a-cb0552e13afa/ss_zoom_43ae7df3.png) |

## T3 — R117 brand assets — PASSED

- curl: /favicon.svg (image/svg+xml), /icon-192.png, /icon-512.png, /og-card.png all **200**; downloaded og-card.png is **1200×630** and **byte-identical (md5) to the new repo file** (61,129 bytes — not the old 58,999-byte card); landing `og:image` = absolute `https://mealloop.zalize.com/og-card.png`.
- Browser: tab favicon shows the emerald rounded-square plate mark; header logo is the new loop-arrow + plate with amber dot next to the Nunito wordmark; og-card renders the new plate+loop design.

| 🟢 New favicon + header logo | 🟢 New OG card (1200×630) |
|---|---|
| ![logo](https://app.devin.ai/attachments/3626f0e5-5f58-4705-9ce1-115240a91ff0/ss_zoom_9a6fa55e.png) | ![og](https://app.devin.ai/attachments/038ab481-ce77-4b90-8de4-5f06b6d5d84d/ss_697ad23c.png) |

## T4 — R117 empty-state illustrations (disposable account) — PASSED

Fresh household: /app/recipes shows the plate illustration (amber ring + steam curls) above "Your recipe box is empty — paste a URL above to import your first recipe."; /app/list shows the grocery-bag illustration (amber + lime dots) above the empty-list text. Account then GDPR-deleted via native confirm; share token `vbv0n5h8embjceo6mtcr` → **404** (curl).

| 🟢 Empty recipe box | 🟢 Empty list |
|---|---|
| ![recipes](https://app.devin.ai/attachments/a3209c39-cf53-4e0b-9f81-7dd6c522abf1/ss_34f31911.png) | ![list](https://app.devin.ai/attachments/dfde9902-7f8a-46d7-82c0-d555589f1fd6/ss_1f6aaffd.png) |

| 🟢 Bag illustration zoom | 🟢 GDPR delete confirm |
|---|---|
| ![bag](https://app.devin.ai/attachments/287d0454-50c8-4f81-95c3-b1e5f1471fc7/ss_zoom_dade1899.png) | ![delete](https://app.devin.ai/attachments/80ca0938-4322-482d-a2f2-6ae9983b0de3/ss_bc2900f3.png) |

## T5 — Regression — PASSED

- 375px iPhone SE: landing `/` scrollWidth **375/375**; standing /app/list **375/375**, no horizontal overflow; DevTools Issues clean on landing (the R112b checkbox-id fix cleared last round's warning).
- Standing household: **Grocery list 35 to buy**, no Checked-off section, list contents intact.

| 🟢 Landing 375px + 375/375 | 🟢 List 375px |
|---|---|
| ![landing375](https://app.devin.ai/attachments/be0d0841-5a27-432d-a233-6dbda7bec213/ss_6bd89ffd.png) | ![list375](https://app.devin.ai/attachments/fe8bd00a-d046-4077-b9b2-e6894f32ac44/ss_7f6e49d7.png) |

| 🟢 Standing list top (35 to buy) | 🟢 List bottom: no checked-off section |
|---|---|
| ![top](https://app.devin.ai/attachments/084edef1-4a6e-4c9f-8dcd-38826f7aa6e1/ss_9133c6a7.png) | ![bottom](https://app.devin.ai/attachments/083e1785-2b9d-4ba1-9475-d1920bad1079/ss_dedb282e.png) |

## Notes / limitations

- The "all done 🎉" celebrate animation was not driven at runtime (would require checking off all 35 standing items) — verified only as CSS rule in served styles.css + template markup.
- FOIT/FOUT was not measured with throttled-network instrumentation; `font-display: swap` is confirmed in the served CSS and no invisible-text flash was observed on fresh loads.
- Micro-interaction animations are inherently hard to prove in still screenshots; computed animationName/transition values plus the recording (live checkbox pops, tab presses) are the evidence.

## Verdict

All R114–118 assertions passed. Disposable household fully deleted; standing household exactly as found (35 to buy · 0 checked).
