# MealLoop — visual brand guide

Consolidates the R114–118 visual sprint (see docs/visual-research-2026-08.md) into the working reference.

## Logo & mark
- Mark: "plate + loop" — a plate (outer ring + amber center dot) wrapped by a circular arrow. Files: `public/favicon.svg` (master, viewBox 64), `public/icon-192.png`, `public/icon-512.png`, header inline SVG in `src/layout.js`.
- Wordmark: **MealLoop** set in Nunito Bold (the `font-display` class), emerald-700 on light backgrounds.
- Lockup: mark left of wordmark, gap ≈ 0.25× mark width (header uses `gap-1.5` at 26px).
- Clear space: keep ≥ 0.5× mark width empty around the lockup. Minimum mark size 16px.
- Don't: recolor the loop, drop the amber dot, stretch, add drop shadows, or place on low-contrast photos.

## Color
| Token | Hex | Use |
|---|---|---|
| Emerald 600 `#059669` | primary | primary buttons, links, brand accents, theme-color |
| Emerald 700 `#047857` | primary-dark | hover, wordmark, text links |
| Amber 400 `#fbbf24` / 600 `#d97706` | accent | "New" badges, notes, the plate dot, highlights |
| Warm cream (stone-50 re-token) `#fbf8f3` | background | page background |
| Stone 800 `#292524` | text | body text |
| Stone 500/300/200 | neutrals | secondary text, borders, dividers |
Accessibility: body text pairs must meet WCAG AA (stone-800 on cream, white on emerald-600+).

## Typography
- Display (h1–h4, wordmark): **Nunito** Bold/ExtraBold, self-hosted `public/fonts/nunito-latin.woff2` (`font-display: swap`, preloaded).
- Body/UI: Tailwind default system stack.
- Scale: page h1 `text-2xl font-bold`; section h2 `text-lg font-semibold`; UI text `text-sm`.

## Spacing & shape
- Tailwind spacing scale; cards `rounded-xl border p-4`, controls `rounded-lg px-3 py-1.5`.
- Content max width `max-w-5xl`; legal/long-form `max-w-2xl`.

## Motion
- CSS-only, all inside `@media (prefers-reduced-motion: no-preference)`: check-pop on checkboxes, button press scale .96, hero fade-up, full-list `.celebrate`.
- No JS animation runtimes (strict CSP; see docs/tech-stack-review-2026-08.md).

## Imagery & illustration
- Empty states: self-drawn line SVGs in brand colors (plate + steam, grocery bag) — never stock photos or third-party clip art.
- Screenshots for marketing: real product on cream background, 1200×630 for cards; OG card `public/og-card.png`.

## Asset inventory
| Asset | Path |
|---|---|
| Favicon / master mark | `public/favicon.svg` |
| App icons | `public/icon-192.png`, `public/icon-512.png` |
| OG / social card 1200×630 | `public/og-card.png` |
| Web font | `public/fonts/nunito-latin.woff2` |
| Header lockup markup | `src/layout.js` |
