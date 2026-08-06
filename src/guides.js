// pSEO guide articles (static content, server-rendered).
const p = (s) => `<p class="text-stone-700 leading-relaxed">${s}</p>`;
const h2 = (s) => `<h2 class="text-xl font-bold mt-6">${s}</h2>`;
const ul = (items) => `<ul class="list-disc pl-5 space-y-1 text-stone-700">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;

export const GUIDES = [
  {
    slug: 'how-to-meal-plan-for-a-family',
    title: 'How to meal plan for a family (without losing your mind)',
    excerpt: 'A realistic 15-minute weekly routine for family meal planning: pick, plan, shop, repeat.',
    body: [
      p('Family meal planning fails when it becomes a project. The trick is a tiny weekly loop: 15 minutes on Sunday, one shared list, zero renegotiation at 6pm.'),
      h2('The 15-minute weekly loop'),
      ul([
        '<strong>Pick 4-5 dinners</strong>, not 7. Leave room for leftovers and one “fend for yourself” night.',
        '<strong>Reuse winners.</strong> Keep a recipe box of meals your family actually eats and rotate it.',
        '<strong>Generate the list once.</strong> Pull all ingredients for the week into a single grocery list, grouped by aisle.',
        '<strong>Share it.</strong> Whoever is near a store can see what is still unchecked.',
      ]),
      h2('Why shared visibility matters'),
      p('Most plans die because they live in one person\'s head or one person\'s app account. When the plan and the list are a link anyone in the family can open — no app install, no account — the plan survives contact with real life.'),
    ].join(''),
  },
  {
    slug: 'grocery-list-by-aisle',
    title: 'Why your grocery list should be grouped by aisle',
    excerpt: 'Aisle-grouped lists cut shopping time dramatically and stop the backtracking dance.',
    body: [
      p('A flat grocery list makes you cross the store five times. Grouping by department — produce, meat, dairy, pantry — turns shopping into a single lap.'),
      h2('How to group without the busywork'),
      p('Doing this manually is tedious, which is why nobody does it. A good meal planner categorizes ingredients automatically when they come from your weekly plan, and lets you check items off from your phone as you shop — with changes syncing to everyone instantly, so two people can split the store.'),
    ].join(''),
  },
  {
    slug: 'import-recipes-from-any-website',
    title: 'How to save recipes from any website in one click',
    excerpt: 'Most recipe sites embed structured data. Here is how importers extract clean ingredients and steps.',
    body: [
      p('Nearly every major recipe site (Allrecipes, BBC Good Food, Serious Eats, food blogs) embeds schema.org Recipe data in the page. A recipe importer reads that data and extracts the title, photo, ingredient list, and steps — no ads, no life story, no pop-ups.'),
      h2('What to look for in an importer'),
      ul([
        'It should keep the <strong>steps readable in the app</strong>, not force you back to the original page while cooking.',
        'It should always <strong>link back to the source</strong> to credit the creator.',
        'It should feed ingredients straight into your <strong>grocery list</strong>.',
      ]),
    ].join(''),
  },
  {
    slug: 'meal-planning-apps-vs-shared-notes',
    title: 'Meal planning apps vs. a shared notes app: what actually works',
    excerpt: 'Shared notes break down at the grocery list. Here is the honest comparison.',
    body: [
      p('Many families start with a shared note or spreadsheet. It works until the shopping trip: no aisle grouping, no check-off sync, no connection between the plan and the list, and manual retyping of every ingredient.'),
      h2('When a dedicated planner wins'),
      ul([
        'Ingredients flow from recipes into the list automatically.',
        'Checking an item updates for everyone within seconds.',
        'The week view answers “what\'s for dinner?” before anyone asks.',
      ]),
      p('The catch: most meal planning apps demand a subscription and an app install for every family member. Prefer tools where family members can participate with just a link.'),
    ].join(''),
  },
  {
    slug: 'plan-to-eat-alternatives',
    title: 'Free Plan to Eat alternatives in 2026',
    excerpt: 'Plan to Eat has no free tier. Here are free ways to get recipe clipping, planning, and shopping lists.',
    body: [
      p('Plan to Eat is a solid recipe clipper and planner, but it costs $5.95/month with only a 14-day trial — and family members need accounts too. If you want the same core loop for free, you have options.'),
      h2('What to replicate'),
      ul([
        '<strong>Recipe clipping</strong> from any site with structured data.',
        '<strong>Drag-to-plan</strong> weekly calendar.',
        '<strong>Auto-generated shopping list</strong> grouped by store section.',
      ]),
      p('MealLoop offers this loop free, web-first, with a family share link that requires no accounts for family members. Import a recipe, plan your week, and send one link to the household.'),
    ].join(''),
  },
  {
    slug: 'scaling-recipes-for-family-size',
    title: 'How to scale recipes up or down for your family size',
    excerpt: 'Cooking for 2 from a serves-4 recipe, or doubling for guests: what scales cleanly and what does not.',
    body: [
      p('Most recipes serve four; most households are not four people. Scaling quantities is easy math, but a few things do not scale linearly.'),
      h2('What scales cleanly'),
      ul([
        '<strong>Main ingredients</strong>: proteins, vegetables, grains — multiply directly.',
        '<strong>Liquids in stews and soups</strong> — multiply, then adjust to the pot.',
      ]),
      h2('What to watch'),
      ul([
        '<strong>Seasoning and heat</strong> (salt, chilli): start with ~75% of the scaled amount and adjust to taste.',
        '<strong>Baking</strong>: chemistry is per-pan — prefer making two batches over doubling one.',
        '<strong>Cook times</strong> barely change with quantity; oven times change with <em>thickness</em>, not weight.',
      ]),
      p('A planner that lets you set a per-meal serving multiplier — and carries the scaled quantities straight into the grocery list — saves you doing this arithmetic in the store aisle.'),
    ].join(''),
  },
  {
    slug: 'weekly-grocery-list-with-staples',
    title: 'Never forget the milk: staples and your weekly grocery list',
    excerpt: 'The items you buy every week deserve automation. How a staples list removes the most common shopping miss.',
    body: [
      p('The most common grocery failure is not the special ingredient for Tuesday\'s curry — it is the milk, bread, and coffee you buy every single week and forgot to write down.'),
      h2('The staples pattern'),
      ul([
        'Keep a short list of items you <strong>always</strong> want on the shopping list.',
        'Have them added <strong>automatically</strong> every time the week\'s ingredients are generated.',
        'Check them off like anything else — anyone in the family, from any phone.',
      ]),
      p('Combined with aisle grouping and a shared link, staples turn the weekly list from a memory test into a checklist.'),
    ].join(''),
  },
  {
    slug: 'samsung-food-review-for-families',
    title: 'Samsung Food for family meal planning: an honest review',
    excerpt: 'Samsung Food is powerful but busy. Where it shines and where a family-first planner fits better.',
    body: [
      p('Samsung Food (formerly Whisk) is free and feature-rich: nutrition scores, communities, AI suggestions. For pure family meal planning it has friction: a long onboarding quiz, recipe steps that often require visiting the original site, and constant prompts toward the mobile app and the paid Food+ tier.'),
      h2('Who it suits'),
      p('If you want nutrition analytics and social recipe discovery, it is worth a look. If you mainly need “plan the week, one shared list, everyone can see it”, a lighter web-first planner with a no-signup family link gets you there with far fewer taps.'),
    ].join(''),
  },
];
