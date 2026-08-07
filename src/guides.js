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
  {
    slug: 'batch-cooking-for-busy-weeks',
    title: 'Batch cooking for busy weeks: cook twice, eat five times',
    excerpt: 'Two bigger cooking sessions can cover most of a week\'s dinners — if the plan and the maths are done for you.',
    body: [
      p('Batch cooking sounds like a Sunday spent chained to the stove. It doesn\'t have to be: two ordinary cooking sessions, each just scaled up, can cover most of a week\'s dinners. The hard parts — doubling the ingredients correctly and remembering which night eats what — are exactly what a planner should do for you.'),
      h2('Pick batch-friendly dinners'),
      ul([
        'Stews, chili, curries, lasagne and roasts all reheat as well as (or better than) they cook — pick two of these per week.',
        'Scale the recipe ×2 or ×3 when you plan it, so the grocery list gets the doubled quantities automatically — no mental arithmetic at the store.',
        'Book the repeat nights immediately: cook Monday, plan “Leftovers” for Tuesday and Thursday, and the week is nearly done.',
      ]),
      h2('Let the list do the maths'),
      p('The most common batch-cooking failure is under-buying: you double the recipe in your head but shop from the original quantities. A planner that scales ingredients per planned meal and merges them into one aisle-sorted grocery list closes that gap — 750g of mince twice becomes 1.5kg on the list, and everyone shopping sees the same numbers.'),
    ].join(''),
  },
  {
    slug: 'meal-planning-for-picky-eaters',
    title: 'Meal planning for picky eaters — without cooking two dinners',
    excerpt: 'One shared plan, small swaps and a bit of repetition beat short-order cooking every night.',
    body: [
      p('Feeding a household where one person won\'t touch mushrooms and another lives on pasta usually ends one of two ways: you cook two dinners, or someone eats toast. A shared weekly plan offers a third way — plan meals everyone can see coming, build in the safe swaps, and stop renegotiating dinner at 6pm.'),
      h2('Plan around the overlap, not the pickiest'),
      ul([
        'Start the week with two or three "everyone eats this" dinners — the overlap is usually bigger than it feels on a stressful night.',
        'For divisive meals, plan the swap into the recipe itself: a note like "plain pasta portion for T" means whoever cooks knows the deal without asking.',
        'Repetition is a feature: picky eaters do better with familiar meals on a visible rota, and a planner makes the repeats one click instead of a chore.',
      ]),
      h2('Let everyone see the week'),
      p('Half of picky-eater friction is surprise. When the week\'s dinners sit on a shared plan the whole household can open — no app install, no account for the kids — "what\'s for dinner" stops being an ambush. Swaps get requested on Sunday instead of protested on Wednesday, and the grocery list already has the alternative on it.'),
    ].join(''),
  },
  {
    slug: 'meal-planning-on-a-budget',
    title: 'Meal planning on a budget: cut the grocery bill without coupons',
    excerpt: 'Most grocery overspend is unplanned buying. A weekly plan and one shared list quietly remove it.',
    body: [
      p('Cutting the grocery bill rarely comes from hunting coupons or switching to a cheaper store. The big leak is unplanned buying: shopping without a list, duplicate purchases because two people shopped, and mid-week top-up trips where everything costs more. A weekly plan closes all three.'),
      h2('Where the money actually goes'),
      ul([
        'Top-up trips are the killer: every extra store visit adds impulse buys — plan the week once and shop once.',
        'Duplicates happen when the list lives in one person\'s head: a shared list everyone can check before buying ends the second jar of pasta sauce.',
        'Waste is spent money in the bin: planning a leftovers night per big cook turns "extra food" into a free dinner instead of a fridge casualty.',
      ]),
      h2('Plan cheap on purpose'),
      p('Budget weeks don\'t need special recipes — they need the boring maths done for you. Merge the week\'s ingredients into one aisle-sorted list so you buy each thing once at the right amount, keep pantry staples on an automatic list so you never emergency-buy them at a corner-shop markup, and rotate the two or three cheap dinners your family already likes. The plan doesn\'t have to be clever; it has to be visible to everyone who shops.'),
    ].join(''),
  },
  {
    slug: 'stop-deciding-whats-for-dinner-every-night',
    title: 'Stop deciding what\'s for dinner every night',
    excerpt: 'The 6pm "what\'s for dinner?" question is a decision-fatigue problem. Decide once a week, then just cook.',
    body: [
      p('The hardest part of dinner is rarely the cooking — it\'s the deciding. By 6pm everyone is tired, nobody has a suggestion, and the discussion itself takes longer than a stir-fry. The fix isn\'t inspiration; it\'s moving the decision to a moment when you have energy, and making it once for the whole week.'),
      h2('Why the nightly decision fails'),
      ul([
        'Decision fatigue is real: after a full day, "anything is fine" and "not that" are the only answers anyone gives.',
        'Deciding hungry biases you toward takeaway — the option with zero decisions attached.',
        'Nightly decisions can\'t drive a shopping list, so even when you pick a meal, an ingredient is missing.',
      ]),
      h2('Decide once, on your terms'),
      p('Pick the week\'s dinners in one 10-minute sitting — coffee in hand, recipe box open — and put them on a plan the whole family can see. The question "what\'s for dinner?" becomes "look at the plan", the shopping list writes itself from the chosen recipes, and the 6pm negotiation disappears. If choosing still feels like work, let a rotation choose for you: a two-week cycle of meals your family already likes needs no creativity at all.'),
    ].join(''),
  },
  {
    slug: 'reusable-weekly-menu-template',
    title: 'Build a reusable weekly menu (plan once, use it forever)',
    excerpt: 'A saved menu turns a good week of dinners into a template you can drop onto any future week in one click.',
    body: [
      p('Some weeks of dinners just work: everyone ate, nothing was wasted, the shopping was one trip. The mistake is letting that week evaporate. Save it as a named menu — "Busy school week", "Payday week", "Camping prep" — and the next time life looks the same, apply it instead of planning from scratch.'),
      h2('What makes a menu worth saving'),
      ul([
        'It survived reality: every meal actually got cooked, not just planned.',
        'It has a shape: one big cook that feeds a leftovers night, one quick meal for the busiest evening, one crowd-pleaser.',
        'It matches a recurring situation — a school week, a holiday week, a week when one parent travels.',
      ]),
      h2('Templates beat inspiration'),
      p('Meal planning apps love to push endless new recipes, but families run on repetition: most households rotate 8-12 dinners. Two or three saved menus cover most of the calendar, and applying one takes seconds — it fills only the empty slots, so you can still swap a night out. Keep a small library, print one for the fridge, and let "what should we eat this week?" become "which menu is this week?".'),
    ].join(''),
  },
  {
    slug: 'meal-plan-in-your-family-calendar',
    title: 'Put the meal plan in the calendar your family already checks',
    excerpt: 'Nobody opens a meal planning app to see what\'s for dinner — but everyone checks the family calendar. A calendar feed fixes that.',
    body: [
      p('The best meal plan is the one people actually see. Most families already live out of a shared calendar — school pickups, football practice, appointments. If dinner lives in a separate app, it\'s invisible at exactly the moment someone asks "what\'s for dinner tonight?" while looking at today\'s schedule.'),
      h2('Why a calendar feed beats another app'),
      ul([
        'Zero new habits: meals show up as all-day events next to everything else the family already checks.',
        'It updates itself: a subscribed feed refreshes automatically when the plan changes — no exporting, no re-adding.',
        'It works for the family member who refuses to install anything: if they can see the shared Google or Apple calendar, they can see dinner.',
      ]),
      h2('How to set it up'),
      p('Look for a meal planner that offers an iCal (.ics) subscription URL. Copy the link once and add it in Google Calendar ("From URL"), Apple Calendar ("New Calendar Subscription") or Outlook. From then on, the week\'s planned meals appear as all-day events — "Dinner: lasagne" on Wednesday — alongside the rest of family life, and stay current as the plan changes.'),
    ].join(''),
  },
  {
    slug: 'why-meal-plans-fall-apart',
    title: 'Why your meal plan falls apart by Wednesday (and how to fix it)',
    excerpt: 'Most meal plans don\'t fail from lack of discipline — they fail because they were written for a fantasy week instead of your real one.',
    body: [
      p('Every family knows the pattern: a hopeful Sunday plan, a decent Monday, and by Wednesday it\'s takeaway again. The plan didn\'t fail because you\'re lazy — it failed because it ignored the week you were actually going to have.'),
      h2('The three ways plans break'),
      ul([
        'The fantasy-week plan: seven ambitious dinners with no easy night, no leftovers night, and nothing for the evening someone gets home at 7:30.',
        'The rigid plan: one changed evening knocks over the rest of the week because every meal depended on the one before it.',
        'The invisible plan: it lives in one person\'s head or one person\'s app, so nobody else can follow it, shop for it, or start cooking.',
      ]),
      h2('Plan the week you\'ll actually have'),
      p('Before picking a single recipe, look at the calendar: which nights are rushed, which are normal, which have time to cook properly. Match the meal to the night — a 15-minute meal or planned leftovers on the rushed ones, the interesting recipe on the relaxed one. Four or five planned dinners with slack beats seven perfect ones.'),
      h2('Make the plan survivable'),
      p('Keep meals independent so any night can be swapped without dominoes. Put the plan where the whole family can see it — a shared link or the family calendar — so anyone can answer "what\'s for dinner?" and anyone can start it. And when a night goes sideways, swap instead of scrapping: the plan isn\'t broken, it just moved.'),
    ].join(''),
  },
  {
    slug: 'meal-plan-in-20-minutes',
    title: 'The 20-minute Sunday meal plan (a lazy, repeatable routine)',
    excerpt: 'You don\'t need a food-prep personality to meal plan. Twenty minutes, a recipe box you already trust, and one list — done before the coffee is.',
    body: [
      p('Most meal-planning advice assumes you enjoy it. This routine assumes you don\'t: it\'s the minimum viable version that still saves the weeknight scramble and the third supermarket trip, and it fits in twenty minutes on a Sunday.'),
      h2('Minutes 0–5: read the week, not recipes'),
      p('Open the family calendar first. Mark the rushed nights, the normal nights, and the one night with time to cook. Decide how many dinners you actually need to plan — usually four or five, because at least one night is leftovers and one takes care of itself.'),
      h2('Minutes 5–15: pick from what you already know'),
      ul([
        'Pull from your own recipe box, not from browsing — the 8–12 meals your family already eats are faster to pick and guaranteed to get eaten.',
        'Match effort to the night: quick meals on rushed nights, the interesting one on the relaxed night.',
        'Schedule leftovers on purpose the day after the biggest meal, so it\'s a plan rather than fridge roulette.',
      ]),
      h2('Minutes 15–20: one list, then stop'),
      p('Generate the shopping list from the planned meals in one go, add the household staples, and share both the plan and the list with the family so anyone can shop or start cooking. Don\'t optimise further — a finished 20-minute plan beats a perfect one that never happens, and next Sunday it\'s faster because the recipe box is already loaded.'),
    ].join(''),
  },
  {
    slug: 'household-staples-list',
    title: 'The household staples list that ends midweek store runs',
    excerpt: 'Most "emergency" grocery trips are for the same ten boring items. A maintained staples list — added to every shop in one tap — makes them disappear.',
    body: [
      p('Think about your last three unplanned store runs. Chances are they weren\'t for anything exotic — they were for milk, bread, eggs, coffee, or toilet paper. Recipe ingredients get planned; the boring background items that every household burns through get forgotten, because they belong to no particular meal.'),
      h2('What belongs on a staples list'),
      ul([
        'Consumables you buy on almost every shop: milk, bread, eggs, butter, fruit for lunchboxes, coffee or tea.',
        'Cooking infrastructure you never want to run out of: oil, onions, garlic, rice or pasta, stock cubes, salt.',
        'Household non-food that ambushes you at the worst moment: toilet paper, dish soap, bin bags.',
      ]),
      h2('Maintain it once, reuse it forever'),
      p('Write the list once and keep it in the same tool as your grocery list, not in your head. It should take one tap to pour the staples into this week\'s shop, and the tool should be smart enough to skip anything already on the list — no duplicate milk because a recipe needed it too. Prune it every month or two: if something keeps coming home unused, it isn\'t a staple.'),
      h2('Why this beats memory'),
      p('A staples list turns "did anyone check if we have coffee?" into a solved problem: the default is that staples are always on the list, and the household only has to notice the exceptions. Combined with a shared family list, whoever is doing the shop — or adding "we\'re out of dish soap" from the sofa — is always working from the same, complete picture.'),
    ].join(''),
  },
];
