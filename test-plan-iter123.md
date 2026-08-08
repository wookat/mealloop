# R123–124 quick regression (prod, branch devin/1786146508-r119-batch, commits 835c880+c060d6d; no recording per handoff)

Code refs: security-header middleware src/index.js:16-22 (adds Permissions-Policy camera/mic/geo/payment/usb=(), COOP same-origin, CORP same-origin alongside existing XFO/XCTO/Referrer/CSP); /pricing SoftwareApplication+3-Offer JSON-LD src/index.js:249-265.

Shell pre-checks (done in setup): all three new headers present on /, /pricing, /s/token; pricing HTML contains 1 SoftwareApplication + 3 Offer JSON-LD types.

## T1 Headers + console/Issues sweep (browser)
For each of: `/` (logged-in main profile), `/pricing`, `/app`, `/s/r7cncy7kz1oadsc6rnij`:
- Console empty (no COOP/CORP warnings) and DevTools Issues shows "No Issues". Screenshot each.

## T2 CORP must not break cross-origin images (adversarial: CORP same-origin on OUR responses is fine, but verify external images still render)
- Share recipe page /s/r7cncy7kz1oadsc6rnij/r/ab51a6a4ce824525ade8: BBC Good Food lasagne photo visibly renders (not broken-image icon); console has no ERR_BLOCKED_BY_RESPONSE.
- Also confirm the lasagne photo renders on the app recipe page /app/recipes/ab51a6a4ce824525ade8.

## T3 COOP sanity: print dialog + Copy list still work (share page, read-only)
- Click "Print" button on share page → Chrome print preview opens (screenshot), cancel.
- Click "Copy list" → button/label feedback ("Copied" state) with no console error.
- NO list mutations.

## T4 /pricing render + JSON-LD
- /pricing at 375px: page renders 3 plan cards, scrollWidth 375/375.
- JSON-LD in page source: SoftwareApplication with offers Free 0 / Household 3 / Supporter 29 USD (curl, done).

## T5 Regression
- Standing /app/list heading exactly "35 to buy", no Checked-off section.
