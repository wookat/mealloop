# Competitor scan — August 2026 (R101)

Broad scan of 16+ meal-planning / recipe-manager / grocery-list competitors, beyond the two
head-to-head benchmarks (Plan to Eat, Samsung Food) used in Rounds 1–100. For each: what it
does well, observable tech, pricing, and what MealLoop should adopt.

Method: real page fetches of marketing/pricing pages + prior logged-in product experience
(Plan to Eat, Samsung Food) + public docs/GitHub for open-source players. No anti-bot bypass:
Samsung Food and BigOven block plain HTTP and were covered from prior in-browser sessions.

## Per-competitor notes

### Plan to Eat — plantoeat.com ($5.95/mo, $49/yr; 14-day free trial, no card)
- Positioning: "Pick your meals. We'll handle the grocery list." Outcome-metric social proof
  (47.5% less planning time, 23% lower food costs, from a 2,568-customer survey).
- Tech: WordPress + NitroPack marketing site; app is a separate SPA. Recipe clipper browser
  extension. Nutrition & macro tracking now first-class nav item.
- Adopt: outcome-driven landing copy with concrete numbers; pricing anchored monthly/yearly;
  "Free Trial — no card required" CTA wording.

### Samsung Food (ex-Whisk) — samsungfood.com (free + paid Food+ tier)
- (Prior in-app experience; site 403s plain fetches.) Strengths: import breadth, communities,
  AI features, nutrition scores. Friction: long onboarding quiz, app-push, steps often on
  origin site.
- Adopt: freemium + premium tier framing; polished import UX.

### Paprika — paprikaapp.com (one-time purchase per platform)
- Strengths: aisle-sorted grocery list with quantity merge ("1 egg + 2 eggs = 3 eggs" —
  exactly our R92/36 behavior), auto-detected timers in steps (tap to start), pinned active
  recipes, month view planning, reusable menus, cross-off ingredients + highlight current step.
- Adopt: tap-to-start timers detected in step text; month-at-a-glance planning; pinned recipes.

### AnyList — anylist.com ($9.99/yr individual, $14.99/yr household)
- Strengths: type-ahead common-item suggestions, instant multi-device list sync, item photos,
  Siri/Alexa entry, list folders/themes; household pricing distinct from individual.
- Adopt: household vs individual pricing tiers; item photos (backlog); polished autocomplete
  (we have a basic version, theirs suggests common items even before any history).

### CopyMeThat — copymethat.com (free ≤ 40 recipes, then $1/mo, yearly & lifetime options)
- Strengths: dirt-cheap paywall with a clear free limit (40 recipes); clipper retains link to
  original; "recipe sets" reusable in the planner; pantry list; merge items across lists.
- Adopt: free-tier-with-limit pricing pattern; lifetime option as a trust signal.

### Eat This Much — eatthismuch.com (free tier; Premium $5/mo annual, $14.99 monthly; Pro per-client)
- Strengths: generator-first landing (interactive demo above the fold, no signup); automatic
  leftovers; save/load favorite weeks; PDF export of plans; Instacart/AmazonFresh delivery
  integration; per-client professional tier (dietitians).
- Adopt: interactive above-the-fold demo; three-tier pricing table (Free/Premium/Pro) layout.

### Mealime — mealime.com (free; Pro subscription)
- Tech: Next.js marketing site. Strengths: "1. Plan 2. Shop 3. Cook" 3-step narrative,
  200 personalization options (allergies/dislikes/servings), 4.5M-user social proof.
- Adopt: 3-step how-it-works narrative on landing; social-proof counters.

### SideChef — sidechef.com (B2B + consumer; retailer-integrated commerce)
- Tech: massive recipe pSEO (category hub pages: diet/ingredient/cuisine/dish-type), rich
  faceted nav, step-by-step guided cooking with photos per step, "Add N Ingredients" commerce
  CTA on every card.
- Adopt: guide/hub faceting for pSEO (our 26 guides could gain a topic index); per-card
  ingredient-count badges.

### RecipeSage — recipesage.com (open source, free; Astro site)
- Strengths: import from URL/photo/PDF/Word; offline PWA; fuzzy search incl. misspellings;
  migration importers from 12+ competitors; per-serving nutrition; multi-language; JSON-LD/CSV
  export ("your data belongs to you").
- Adopt: data-export (JSON) for trust; migration-from-競品 import as growth wedge (backlog).

### Tandoor — tandoor.dev (open source; hosted €1.99–6.49/mo tiers incl. free €0 tier)
- Strengths: "cook with what's in your fridge" search; permission system with secret recipes;
  real-time list sync; property calculator (nutrition/price per recipe); space-based sharing.
- Adopt: hosted-tier pricing page pattern for an OSS-adjacent audience.

### Grocy — grocy.info (self-hosted, free)
- Strengths: pantry/stock tracking with min-stock auto-list, barcode flows, "Due Score" to use
  up expiring stock, chore/equipment management. ERP-depth niche.
- Adopt: (niche) pantry min-stock ideas — backlog only.

### OurGroceries — ourgroceries.com (free + premium)
- Strengths: instant shared-list sync as THE hero feature, item photos/barcodes, Alexa,
  auto aisle grouping, recipes→list. Marketing is entirely testimonial-driven.
- Adopt: testimonial-density on landing.

### Crouton — crouton.app (Apple ecosystem, paid app)
- Strengths: recipe scanning (OCR from cookbooks), multiple in-recipe timers, auto meal-plan
  generation from stored recipes, metric/imperial conversion.
- Adopt: auto-fill week from recipe box (we have "Fill dinners" — theirs also respects
  variety), multiple timers.

### Umami — umami.recipes (iOS/Android; Next.js site)
- Strengths: "import without the fluff", interactive cooking checklist, export to
  PDF/markdown/HTML/JSON, shared recipe books, Chrome extension.
- Adopt: recipe JSON export; "Start Cooking" prominent per-recipe CTA (we have Cook mode —
  raise its visibility).

### Mela — mela.recipes (iOS/macOS, paid; MacStories design award)
- Strengths: design-first recipe viewer, RSS-feed recipe subscriptions, dimmed non-current
  steps in cook mode, live import preview while browsing.
- Adopt: cook-mode step dimming (we highlight; dimming others is stronger focus), typographic
  restraint.

### MealBoard / Cooklist / BigOven
- MealBoard: iOS all-in-one, minimal web presence. Cooklist: pivoted to "Agentic Commerce for
  Grocery" (B2B) — a signal that consumer grocery apps monetize via retail integration.
  BigOven: 403s plain fetch; legacy player, recipe-scan + leftovers ideas already covered.

## Cross-cutting takeaways

1. **Nobody serious is "free forever" with no paid plan.** Every credible player anchors a
   paid tier (from $1/mo CopyMeThat to $5.95/mo Plan to Eat); free tiers are limited or
   trial-based. MealLoop's "free, no trial" framing reads hobbyist → replace with
   **Beta free trial of a real paid product** (boss directive, R102).
2. **Pricing page patterns**: 2–3 tier table, monthly vs yearly toggle/anchor, household vs
   individual (AnyList), "no card required" trial (Plan to Eat), lifetime option (CopyMeThat).
3. **Interaction patterns worth copying**: tap-to-start timers in steps (Paprika/Crouton),
   step dimming in cook mode (Mela), item photos (AnyList/OurGroceries), interactive demo
   above the fold (Eat This Much), 3-step narrative + outcome metrics (Mealime/Plan to Eat).
4. **Tech stacks observed**: Next.js (Mealime, Umami, Cooklist), Astro (RecipeSage),
   WordPress+NitroPack (Plan to Eat marketing). No competitor advantage requires abandoning
   our Workers+Hono SSR + Tailwind stack; it matches or beats their TTFB. (Full stack review
   in docs/tech-stack-review-2026-08.md.)
5. **Trust levers**: data export (RecipeSage/Umami), retain-source-link clipping (CopyMeThat),
   survey-based outcome stats (Plan to Eat).

## Adoption backlog (priority-ordered)

- P0 (boss directive): pricing overhaul — paid plans displayed, all features open as
  "Beta free trial", no "free forever" copy. → R102
- P1: landing redesign — 3-step narrative, outcome metrics, pricing section, stronger
  social-proof layout. → R103
- P1: cook mode upgrades — step dimming + tap-to-start timers parsed from step text. → R104
- P1: recipe JSON export (data portability trust lever). → R105
- P2: item photos on grocery items; month-view planning; pinned recipes; guide topic hub;
  migration importers; pantry min-stock; interactive landing demo.
