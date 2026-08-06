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
  {
    slug: 'metric-imperial-recipe-conversion',
    title: 'Metric vs imperial in recipes: convert once, cook anywhere',
    excerpt: 'Grams or ounces? How to handle recipes that mix unit systems without a calculator at the stove.',
    body: [
      p('Half the internet\'s best recipes are written in grams and millilitres, the other half in ounces, pounds and cups. Mixed-unit weeks are normal — a British stew next to an American casserole — and converting by hand at the stove is where mistakes happen.'),
      h2('The conversions that matter'),
      ul([
        '<strong>Weight:</strong> 1 oz ≈ 28 g, 1 lb ≈ 454 g. Weight converts exactly, so prefer it when a recipe offers both.',
        '<strong>Volume:</strong> 1 fl oz ≈ 30 ml, 1 US cup = 240 ml. Fine for liquids.',
        '<strong>Cups of dry ingredients don\'t convert cleanly.</strong> A cup of flour is ~120 g but a cup of sugar is ~200 g — density matters, so keep cups as cups unless the recipe gives weights.',
      ]),
      h2('Let the planner do it'),
      p('A good meal planner converts display units for the whole grocery list and every recipe in one switch — grams to pounds and ounces, or the reverse — while keeping the original amounts untouched underneath, so nothing drifts after repeated conversions. Everyone in the household sees the same units, including on the shared list.'),
    ].join(''),
  },
  {
    slug: 'shared-grocery-list-without-an-app',
    title: 'A shared family grocery list — without making everyone install an app',
    excerpt: 'The fastest way to a live, synced grocery list for the whole household: one link, no accounts.',
    body: [
      p('The usual family grocery workflow — screenshots of a note, a text thread, or “can you also grab…” calls — breaks the moment two people shop in parallel or the plan changes mid-week.'),
      h2('Why app-based sharing fails at home'),
      ul([
        'Everyone must install the same app and create an account — the least-motivated family member never does.',
        'Grandparents, teenagers and partners on different platforms fall out of sync.',
        'Paid tiers often gate the one feature families need: multi-member sync.',
      ]),
      h2('The link-first alternative'),
      p('A web-first list that lives at a single private link fixes this: anyone with the link opens it in a browser, sees the week\'s plan and the live list, and checks items off — changes sync to everyone in seconds. No install, no sign-up, and you can rotate the link any time to revoke access.'),
    ].join(''),
  },
  {
    slug: 'dinner-rotation-two-weeks',
    title: 'The two-week dinner rotation: stop deciding what\'s for dinner',
    excerpt: 'A small pool of proven meals on a loose rotation beats novelty. How to build one and keep it fresh.',
    body: [
      p('Decision fatigue, not cooking skill, is why weeknight dinners collapse into takeaway. The fix is boring on purpose: a pool of 10–14 meals your family already likes, rotated so nothing repeats within two weeks.'),
      h2('Building the pool'),
      ul([
        'Start with the <strong>last 10 dinners everyone actually ate</strong> — not aspirational recipes.',
        'Tag them by effort: a couple of 15-minute meals for the worst weeknights.',
        'Add one new recipe a month at most; retire anything that gets groans twice.',
      ]),
      h2('Keeping it fresh without thinking'),
      p('The rotation only works if you don\'t have to remember what you cooked lately. A planner that can fill an empty week from your recipe box — automatically preferring meals you haven\'t planned in the last two weeks — turns the rotation into one click, and the grocery list generates itself from there.'),
    ].join(''),
  },
  {
    slug: 'cook-from-your-phone-without-screen-lock',
    title: 'Cooking from your phone: beat the screen lock and the tiny text',
    excerpt: 'Flour-covered fingers vs. a sleeping phone screen. How a proper cook mode fixes recipe-following.',
    body: [
      p('Following a recipe on a phone usually means: screen locks at the exact wrong moment, text is too small to read from the counter, and you lose your place between steps — all with hands you don\'t want touching the screen.'),
      h2('What a real cook mode does'),
      ul([
        '<strong>Keeps the screen awake</strong> while you cook (browsers support this — no app needed).',
        '<strong>Enlarges the steps</strong> so they\'re readable from arm\'s length.',
        '<strong>Marks steps done</strong> with a single tap, so a glance shows where you are.',
      ]),
      p('This works from a plain web page too — including a recipe someone shared with you by link — so the person cooking doesn\'t need an account or an install to get a proper hands-free view.'),
    ].join(''),
  },
  {
    slug: 'save-recipes-from-sites-that-block-importers',
    title: 'When a recipe site blocks importers: save it by pasting the text',
    excerpt: 'Some big recipe sites block automated importers. Copy-paste still works — if your planner can parse plain text.',
    body: [
      p('A growing number of recipe sites put anti-bot walls in front of their pages, so even well-behaved importers get blocked. You should not have to retype a recipe field by field — the whole thing is already on your clipboard.'),
      h2('The paste-and-parse workflow'),
      ul([
        'Select the recipe on the original page — title, ingredients and method — and copy it.',
        'Paste it into a planner that understands the standard layout: a title line, an <strong>“Ingredients”</strong> heading, then a <strong>“Method”</strong> or <strong>“Instructions”</strong> heading.',
        'Bullets and step numbers should be cleaned up automatically, and the ingredients should flow straight into your grocery list.',
      ]),
      p('This keeps the recipe usable — scaled servings, unit conversion, cook mode, and a link-shareable copy for whoever is cooking — without violating anyone\'s terms by scraping around a block.'),
    ].join(''),
  },
  {
    slug: 'print-a-recipe-without-ads-and-clutter',
    title: 'How to print a recipe without the ads, photos and life story',
    excerpt: 'Recipe sites print terribly: ads, giant photos, comments. Two ways to get a clean one-page recipe card.',
    body: [
      p('Hit print on most recipe sites and you get five pages: hero photos, ad slots, the author\'s trip to Tuscany, and — somewhere on page four — the actual ingredients. If you cook from paper, you want a one-page card: title, ingredients, numbered steps, nothing else.'),
      h2('Option 1: the site\'s own print button'),
      p('Some recipe sites offer a "print recipe" link inside the recipe card that strips the page down. It works when it exists, but many blogs don\'t have one, and you\'ll have to find it again every time you re-cook the dish.'),
      h2('Option 2: save the recipe once, print it clean forever'),
      ul([
        'Import the recipe into your meal planner (by URL, or by pasting the text if the site blocks importers).',
        'Print from the planner instead — a good one prints just the title, timings, ingredients (with section headings like <strong>For the sauce</strong> kept intact) and numbered steps on a single page.',
        'The saved copy also feeds your grocery list and can be shared with whoever is cooking — no re-finding the original page.',
      ]),
      p('Bonus: printing from your own recipe box means the recipe never disappears behind a redesign, a paywall, or a dead link.'),
    ].join(''),
  },
  {
    slug: 'plan-leftovers-nights-reduce-food-waste',
    title: 'Plan leftovers nights on purpose (and stop throwing food away)',
    excerpt: 'The average family bins hours of cooking every week. One planned leftovers night fixes most of it.',
    body: [
      p('Leftovers get wasted for one reason: nobody plans to eat them. They sit in the fridge as a vague possibility until they become a science experiment. The fix isn\'t cooking less — it\'s giving leftovers a slot in the week like any other dinner.'),
      h2('Make it a named night, not a maybe'),
      ul([
        'When you plan a big-batch dinner (chili, roast, lasagne), immediately book the next night as “Leftovers” — one decision, two dinners.',
        'Plan 4–5 cooked dinners plus 1–2 leftovers nights instead of 7 fresh meals; the week gets cheaper and calmer.',
        'Put the leftovers night on the shared plan so whoever cooks (or doesn\'t) sees it — it only works if everyone knows the fridge is the menu.',
      ]),
      h2('Let the plan do the remembering'),
      p('A meal planner that adds a “Leftovers” entry for the next day in one click removes the friction entirely: cook once, tap once, and tomorrow\'s dinner is already decided and visible to the whole household. No guilt, no fridge archaeology, and a grocery list that\'s one dinner shorter.'),
    ].join(''),
  },
  {
    slug: 'organize-grocery-list-by-store-aisle',
    title: 'How to organize your grocery list by store aisle (and stop backtracking)',
    excerpt: 'A list sorted the way you walk your store turns a 40-minute shop into 20. Here\'s how to set one up.',
    body: [
      p('Most grocery lists are sorted by whatever order you typed things in — so you grab pasta, walk to dairy, then discover parmesan three aisles back. The fix is a list grouped by aisle, sorted in the order <em>you</em> walk <em>your</em> store.'),
      h2('Step 1: group items into aisles'),
      p('Start with broad sections every supermarket shares: produce, meat &amp; seafood, dairy &amp; eggs, bakery &amp; grains, canned goods, spices, oils. A good list app assigns these automatically as you add items, and lets you add custom sections ("Asian aisle", "Pet food") for your store\'s quirks.'),
      h2('Step 2: put the aisles in walking order'),
      ul([
        'Think about your actual route: most stores funnel you into produce first and keep frozen/chilled near the checkout end.',
        'Reorder the sections once to match — produce at the top, the aisle nearest the exit at the bottom.',
        'If different people shop different stores, per-store filters plus one shared aisle order still beat a flat list.',
      ]),
      p('Do this once and every future list comes out pre-sorted: you sweep the store in one pass, and whoever you share the list with walks the same route — no backtracking, no forgotten parmesan.'),
    ].join(''),
  },
];
