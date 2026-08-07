# Visual / brand research — August 2026 (R114)

Goal: study how the best meal-planning products and food sites present themselves visually
(screenshots + public page source analysis), then replicate the strengths in MealLoop with a
distinct warm, appetizing identity for home-cooking families. Boundaries respected: no anti-bot
bypass (plain page loads only), no copyrighted asset reuse — closed-source sites are studied for
structure and ideas, all assets are re-made from scratch or via open-licensed tooling.

## Sites studied (screenshot + source capture)

| Site | Stack (observable) | Typography | Palette / mood | What works |
|---|---|---|---|---|
| Mealime | Next.js, Typekit | Chaparral Pro (serif display) + Lato | Fresh green `#5ebd21`, warm accents `#FF8F00`/`#FFCE00`, white space, scattered produce illustrations | Big friendly serif headline, floating vegetable illustrations give instant "food" feel without photos; app screenshot in device frame |
| Crouton | Static HTML | Nunito (rounded sans, Google Fonts) | Soft cream/white, pastel card chips | Rounded typeface = homely/friendly; feature list is short and concrete; device mockups show real UI |
| Mela | Static HTML | Serif display | Bold single-color brand (yellow) + dark | Confident brand color; "Best Design" positioning; cook-mode focus (we already replicate the dimming) |
| Plan to Eat | WordPress + FontAwesome | Slab/serif blend | Teal `#2e5f6e` + orange logo | Warm editorial blog photography; strong logo mark; family-oriented copy |
| SideChef | Custom, Montserrat/Poppins/Nunito Sans | Geometric sans | White + vivid food photography | Photography-led appetite appeal; step-by-step visual language |
| AnyList | Static, Open Sans + Goblin One | Display serif logo | Blue + white | Simple, utility-first; not a visual benchmark |
| Paprika | Static, Montserrat + Open Sans | Sans | Red/paprika accent | Single strong spice-derived brand color |
| Umami | Vite/Next hybrid, system-ui | System stack | Minimal monochrome | Fast, content-first; system fonts = zero font cost |
| RecipeSage | Astro, system stack | System | Purple accent | OSS; system fonts, low overhead |
| NYT Cooking | Next.js | NYT serif display | Cream/white, editorial | The appetite benchmark: giant food photography, serif headlines, cream background, generous whitespace |

## Patterns worth replicating (integrated, not copied from one site)

1. **Warm off-white/cream canvas** (NYT Cooking, Crouton) instead of neutral grey — reads
   "kitchen", not "dashboard".
2. **A friendly rounded/serif display face for headings** (Mealime's Chaparral, Crouton's Nunito)
   over default sans — the single highest-leverage visual change.
3. **Food-derived accent palette**: keep our herb-green primary, add a warm apricot/amber
   secondary (Mealime's `#FF8F00`, Plan to Eat's orange) for highlights, favourites, and joy
   moments.
4. **Produce illustration accents** (Mealime) rather than stock photos — works with our
   no-external-asset CSP and stays light.
5. **Micro-delight on completion** (mobile apps: check-off animations) — checkbox pop + strike,
   "all done" celebration; must degrade under `prefers-reduced-motion`.
6. **Confident brand mark** (Mela, Plan to Eat): our current generic loop icon → a food-related
   logo (plate/loop hybrid), matching favicon, icons, OG card and empty states.

## MealLoop visual direction (decided)

- Audience: home-cooking families → warm, appetizing, relaxed, a little playful. Not clinical.
- Canvas: warm cream (`#faf7f2`-family) backgrounds, soft warm-grey text.
- Type: self-hosted **Nunito** (OFL licence) for display/headings — rounded, homely; system sans
  for body (fast, readable).
- Color: primary herb green (existing emerald, kept for continuity + WCAG AA), secondary warm
  apricot/amber for favourites/highlights/celebration, tomato red kept for destructive.
- Motion: CSS-only micro-animations (check pop, button press, card hover-lift, fade-in-up on
  landing), all inside `@media (prefers-reduced-motion: no-preference)`.
- Brand assets: redraw logo/favicon (plate + loop), regenerate OG card, add empty-state
  illustrations (open-licensed generation, no third-party marks).

## Tech-stack note (R118, full review in tech-stack-review-2026-08.md)

- shadcn/ui and Motion/GSAP are React-ecosystem tools; MealLoop is server-rendered Hono + vanilla
  JS by design (CSP-strict, zero client framework). Verdict: adopt the **shadcn-style token
  system** (design tokens in Tailwind v4 `@theme`) and CSS-native animation instead of importing a
  JS animation runtime — same visual outcome, no bundle/CSP cost. Tailwind already at v4 (latest).
- Fonts self-hosted as woff2 (Google Fonts CSS is blocked by our `style-src 'self'` CSP anyway);
  Nunito is SIL OFL — licence-compliant.

## Evidence

- Screenshots: `/home/ubuntu/screenshots/ss_ba972d5a.png` (Mealime), `ss_557deb95.png` (Crouton),
  `ss_d63e9153.png` (Mela), `ss_1adbaff6.png` (NYT Cooking), `ss_53431790.png` (Plan to Eat).
- Source captures analyzed via curl (fonts, colors, framework markers) on 2026-08-05.
