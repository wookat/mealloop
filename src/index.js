import { Hono } from 'hono';
import { page } from './layout.js';
import { getUser, sendMagicCode, sendSubscribeConfirm, sendWelcome, verifyCode, logout, sessionCookie, clearCookie, getVoter, voterCookie } from './auth.js';
import { importRecipeFromUrl, parseRecipeText } from './recipes.js';
import { uid, token, esc, weekDates, categorize, today, mergeIngredients, scaleIngredient, ingredientKey, pantryKey, convertUnits, isIngredientHeading, STANDARD_CATEGORIES, sortCategories, sanitizeImageUrl, clampMinutes, swapAdjacent, icsEscape, copyName, splitListInput, clip } from './util.js';
import { GUIDES } from './guides.js';
import { generateWeekDraft } from './ai.js';
import { STARTER_RECIPES } from './starters.js';
import { ASSET_V } from './assetv.js';

const app = new Hono();

// Daily cost caps for the LLM drafting endpoint: narrow per-household quota
// is the main gate, per-IP is a wide backstop (CGNAT-safe), and a global
// daily circuit breaker bounds total spend.
const AI_DAILY_PER_HOUSEHOLD = 10;
const AI_DAILY_PER_IP = 100;
const AI_DAILY_GLOBAL = 200;

// ---------- security headers + first-party cookie-free analytics ----------
app.use('*', async (c, next) => {
  await next();
  try {
    c.res = new Response(c.res.body, c.res);
    c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    c.res.headers.set('X-Frame-Options', 'DENY');
    c.res.headers.set('X-Content-Type-Options', 'nosniff');
    c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    c.res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    c.res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    c.res.headers.set('Content-Security-Policy', "default-src 'self'; img-src * data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'");
  } catch {}
  try {
    const ct = c.res.headers.get('content-type') || '';
    const ua = c.req.header('user-agent') || '';
    // Skip QA-marked traffic (UA suffix, header or cookie) and obvious
    // non-browser agents (bots, scripts) so counts stay close to real visitors.
    const qa =
      ua.includes('DevinQA') ||
      !ua.startsWith('Mozilla/') ||
      /bot|crawl|spider|curl|wget|python|headless/i.test(ua) ||
      c.req.header('x-qa-traffic') ||
      /(?:^|;\s*)ml_qa=1/.test(c.req.header('cookie') || '');
    if (c.req.method === 'GET' && ct.includes('text/html') && c.res.status === 200 && !qa) {
      const raw = new URL(c.req.url).pathname;
      // Never persist share tokens in analytics.
      const path = raw.startsWith('/s/') ? '/s' : raw.split('/').slice(0, 3).join('/') || '/';
      c.executionCtx.waitUntil(
        c.env.DB.prepare(
          'INSERT INTO analytics_daily (day, path, views) VALUES (?, ?, 1) ON CONFLICT(day, path) DO UPDATE SET views = views + 1'
        ).bind(today(), path).run()
      );
      // Aggregate external referrer hosts only (no paths, no query strings).
      try {
        const ref = c.req.header('referer');
        if (ref) {
          const host = new URL(ref).hostname;
          if (host && host !== new URL(c.req.url).hostname) {
            c.executionCtx.waitUntil(
              c.env.DB.prepare(
                'INSERT INTO referrers_daily (day, host, views) VALUES (?, ?, 1) ON CONFLICT(day, host) DO UPDATE SET views = views + 1'
              ).bind(today(), host).run()
            );
          }
        }
      } catch {}
    }
  } catch {}
});

// ---------- edge cache for public marketing pages ----------
// Workers don't edge-cache fetch-handler responses on their own, so static
// public pages go through caches.default (NameChart's pattern): key is
// path + ASSET_V, 1 h TTL, and anything session-scoped or query-varied skips.
app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  const cacheable =
    c.req.method === 'GET' &&
    !url.search &&
    !(c.req.header('cookie') || '').includes('ml_session=') &&
    (url.pathname === '/robots.txt' || url.pathname === '/sitemap.xml' || sitePaths().includes(url.pathname));
  if (!cacheable) return next();
  const key = new Request(`${url.origin}${url.pathname}?edge=${ASSET_V}`);
  const hit = await caches.default.match(key);
  if (hit) {
    const res = new Response(hit.body, hit);
    res.headers.set('X-Edge-Cache', 'HIT');
    c.res = res;
    return;
  }
  await next();
  if (c.res.status === 200 && !c.res.headers.get('set-cookie')) {
    const copy = c.res.clone();
    const stored = new Response(copy.body, copy);
    stored.headers.set('Cache-Control', 'public, s-maxage=3600');
    c.executionCtx.waitUntil(caches.default.put(key, stored));
    c.res.headers.set('X-Edge-Cache', 'MISS');
  }
});

// ---------- marketing ----------
const FEATURED_SLUGS = ['meal-planning-for-picky-eaters', 'batch-cooking-for-busy-weeks', 'meal-planning-on-a-budget'];
const FEATURED_GUIDES = FEATURED_SLUGS.map((s) => GUIDES.find((g) => g.slug === s)).filter(Boolean);

const LANDING_FAQ = [
  ['How much does MealLoop cost?', 'MealLoop is in open beta: every feature — the planner, recipe import, grocery list and family sharing — is free while we finish the product, no card required. Paid plans (see our <a class="text-emerald-700 underline" href="/pricing">pricing</a>) start billing only when we launch, and beta users get notice first.'],
  ['Does my family need to install anything or sign up?', 'No. You share one private link; anyone who opens it sees the week\u2019s plan and the live grocery list in their browser and can check items off — no app, no account.'],
  ['Can I import recipes from any website?', 'Almost — we read the standard recipe data most sites embed (BBC Good Food, Serious Eats, most food blogs). If a site blocks automated access, just paste the whole recipe text — we split it into title, ingredients and steps for you.'],
  ['Does the grocery list update for everyone in real time?', 'Yes. Checking an item on your phone shows up for everyone else viewing the list within a few seconds \u2014 handy when two people split the store.'],
  ['Can I switch between metric and imperial units?', 'Yes. One switch converts the whole grocery list and every recipe between grams/millilitres and ounces, pounds and fluid ounces \u2014 originals are kept, so you can switch back anytime.'],
  ['What about my privacy?', 'MealLoop sets no cookies on these pages, uses no third-party trackers or ads, and only collects aggregate counts. The only cookies are a session cookie when you log in and an anonymous token if you vote on a shared plan. Your recipes and plans stay yours.'],
];

app.get('/', async (c) => {
  const user = await getUser(c);
  const body = `
<section class="py-10 sm:py-16 text-center fade-up hero-ambient -mx-4 px-4">
  <p class="inline-block mb-4 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold tracking-wide">OPEN BETA · ALL FEATURES FREE DURING BETA · NO ADS</p>
  <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900 max-w-2xl mx-auto">What's for dinner? <span class="text-emerald-600">Decide once, together.</span></h1>
  <p class="mt-4 text-lg text-stone-600 max-w-xl mx-auto">Import recipes from any site, plan your week, and share one live grocery list with your whole family — with a single link. No accounts needed for them.</p>
  <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
    <a href="${user ? '/app' : '/login'}" class="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-lg hover:bg-emerald-700 shadow-sm">${user ? 'Open your planner' : 'Start your free beta trial'}</a>
    <a href="/guides" class="px-6 py-3 rounded-xl border border-stone-300 font-semibold text-lg hover:bg-stone-100">How it works</a>
  </div>
  <img src="/hero-dinner.webp" alt="Illustration of a family dinner table with a pot of pasta, salad and four place settings" width="880" height="587" fetchpriority="high" class="mx-auto mt-10 w-full max-w-2xl">
</section>
<section class="grid sm:grid-cols-3 gap-4 py-8 stagger">
  ${[
    ['Import from any recipe site', 'Paste a URL — we pull the title, photo, ingredients and steps automatically. Steps stay readable right here.'],
    ['One live grocery list', 'Ingredients from your weekly plan are grouped by store aisle. Checking an item syncs for everyone in seconds.'],
    ['Share with a link', 'Your family sees the week, checks off groceries, and 👍/👎 the meals with one link — no app install, no sign-up, no subscription.'],
  ].map(([t, d]) => `
  <div class="rounded-2xl bg-white border border-stone-200 p-5">
    <h2 class="font-semibold text-stone-900">${t}</h2>
    <p class="mt-1.5 text-sm text-stone-600">${d}</p>
  </div>`).join('')}
</section>
<section class="py-8">
  <h2 class="text-2xl font-bold text-center">How it works</h2>
  <div class="mt-6 grid sm:grid-cols-3 gap-4 stagger">
    ${[
      ['1', 'Plan', 'Pick dinners for the week from your recipe box — import from any site, paste text, or type your own. Ten minutes on Sunday.'],
      ['2', 'Shop', 'One tap turns the week into an aisle-sorted grocery list. Quantities merge, staples auto-add, and everyone sees the same live list.'],
      ['3', 'Cook', 'Open the recipe on any device: cook mode keeps the screen awake, scales servings, and lets you tap off steps as you go.'],
    ].map(([n, t, d]) => `
    <div class="rounded-2xl bg-white border border-stone-200 p-5">
      <div class="flex items-center gap-3">
        <span aria-hidden="true" class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">${n}</span>
        <h3 class="font-semibold text-lg text-stone-900">${t}</h3>
      </div>
      <p class="mt-3 text-sm text-stone-600">${d}</p>
    </div>`).join('')}
  </div>
  <p class="mt-6 text-center text-sm text-stone-600">Curious what it will cost after the beta? <a class="text-emerald-700 underline" href="/pricing">See pricing</a> — everything is free while we're in beta.</p>
</section>
<section class="py-8" aria-labelledby="demo-heading">
  <h2 id="demo-heading" class="text-2xl font-bold text-center">See it in action</h2>
  <p class="mt-2 text-center text-sm text-stone-600">A live-feel preview — click around, nothing to install.</p>
  <div class="mt-6 mx-auto max-w-2xl rounded-2xl bg-white border border-stone-200 p-4 sm:p-6" data-demo>
    <div role="tablist" aria-label="Product demo" class="flex gap-2">
      ${['Plan', 'Shop', 'Cook'].map((t, i) => `<button type="button" role="tab" id="demo-tab-${i}" aria-controls="demo-panel-${i}" aria-selected="${i === 0}" data-demo-tab="${i}" class="rounded-full px-4 py-1.5 text-sm font-semibold ${i === 0 ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}">${t}</button>`).join('')}
    </div>
    <div id="demo-panel-0" role="tabpanel" aria-labelledby="demo-tab-0" data-demo-panel="0" class="mt-4">
      <p class="text-xs font-semibold text-stone-500 uppercase tracking-wide">Week of Mon, Aug 10</p>
      <div class="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
        ${[['Mon', 'Chicken fajitas'], ['Tue', 'Lentil soup ×2'], ['Wed', 'Family lasagne']].map(([d, m]) => `
        <div class="rounded-lg border border-stone-200 p-2.5"><p class="text-xs font-semibold text-stone-500">${d}</p><p class="mt-1 rounded bg-emerald-50 px-2 py-1 text-sm text-emerald-900">${m}</p></div>`).join('')}
      </div>
      <p class="mt-3 text-sm text-stone-600">Pick dinners from your recipe box — scaled servings and notes included. One button turns the whole week into a grocery list.</p>
    </div>
    <div id="demo-panel-1" role="tabpanel" aria-labelledby="demo-tab-1" data-demo-panel="1" class="mt-4 hidden">
      <p class="text-xs font-semibold text-stone-500 uppercase tracking-wide">Produce</p>
      <ul class="mt-1 space-y-1">
        ${[['2 onions', false], ['3 bell peppers', false], ['1 bag spinach', true]].map(([label, done], i) => `
        <li><label class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-stone-50 cursor-pointer"><input type="checkbox" id="demo-item-${i}"${done ? ' checked' : ''} class="h-4.5 w-4.5 accent-emerald-600 peer" aria-label="${label} (demo)"><span class="text-sm peer-checked:line-through peer-checked:text-stone-400">${label}</span></label></li>`).join('')}
      </ul>
      <p class="mt-3 text-sm text-stone-600">Try checking items off — in the real app it syncs to everyone's phone in seconds, grouped by store aisle.</p>
    </div>
    <div id="demo-panel-2" role="tabpanel" aria-labelledby="demo-tab-2" data-demo-panel="2" class="mt-4 hidden">
      <ol class="space-y-2">
        <li class="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-950"><span class="font-semibold">Step 2 of 6.</span> Simmer the sauce for 15 minutes, stirring occasionally.</li>
        <li class="rounded-lg px-3 py-2 text-sm text-stone-400">Step 3. Layer pasta, sauce and cheese in the dish…</li>
      </ol>
      <p class="mt-3 text-sm text-stone-600">Cook mode keeps your screen awake, dims everything but the current step, and turns "15 minutes" into a tap-to-start timer.</p>
    </div>
    <p class="mt-4 text-center"><a href="${user ? '/app' : '/login'}" class="inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">${user ? 'Open your planner' : 'Try the real thing — free in beta'}</a></p>
  </div>
</section>
<section class="rounded-2xl bg-emerald-700 text-white p-6 sm:p-8 my-8">
  <h2 class="text-xl font-bold">Get new features first</h2>
  <p class="text-emerald-100 text-sm mt-1">Leave your email and we'll let you know when meal rotation, leftovers tracking and more launch.</p>
  <form method="post" action="/subscribe" class="mt-4 flex flex-col sm:flex-row gap-2 max-w-md">
    <input type="email" name="email" required aria-label="Email address" autocomplete="email" placeholder="you@example.com" class="flex-1 rounded-lg px-3 py-2.5 text-stone-900 bg-white">
    <button class="rounded-lg bg-white text-emerald-700 font-semibold px-5 py-2.5 hover:bg-emerald-50">Notify me</button>
  </form>
  <p class="text-emerald-100 text-xs mt-2">Product updates only — unsubscribe any time. See our <a class="underline" href="/privacy">privacy policy</a>.</p>
</section>
<section class="py-8 max-w-2xl mx-auto">
  <h2 class="text-2xl font-bold text-center">Frequently asked questions</h2>
  <div class="mt-6 space-y-3">
    ${LANDING_FAQ.map(([q, a]) => `
    <details class="rounded-xl bg-white border border-stone-200 p-4">
      <summary class="font-semibold cursor-pointer text-stone-900">${q}</summary>
      <p class="mt-2 text-sm text-stone-600">${a}</p>
    </details>`).join('')}
  </div>
  <p class="mt-6 text-center text-sm text-stone-600">More questions? Read our <a class="text-emerald-700 underline" href="/guides">meal planning guides</a>.</p>
</section>
<section class="py-8">
  <h2 class="text-2xl font-bold text-center">From the guides</h2>
  <div class="mt-6 grid sm:grid-cols-3 gap-4">
    ${FEATURED_GUIDES.map((g) => `
    <a href="/guides/${g.slug}" class="rounded-2xl bg-white border border-stone-200 p-5 hover:border-emerald-400 block">
      <h3 class="font-semibold text-stone-900 leading-snug">${esc(g.title)}</h3>
      <p class="mt-1.5 text-sm text-stone-600">${esc(g.excerpt)}</p>
    </a>`).join('')}
  </div>
  <p class="mt-5 text-center text-sm"><a class="text-emerald-700 underline" href="/guides">All guides →</a></p>
</section>
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: LANDING_FAQ.map(([q, a]) => ({
      '@type': 'Question',
      name: q.replace(/<[^>]+>/g, ''),
      acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') },
    })),
  })}</script>`;
  return c.html(page({ title: 'Family meal planning with real-time sync', description: "Plan the week's dinners in minutes and shop from one always-in-sync family grocery list. Import recipes from any site — free during the open beta.", body, user, path: '/' }));
});

app.post('/subscribe', async (c) => {
  const form = await c.req.parseBody();
  const email = String(form.email || '').trim().toLowerCase();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    const seen = await c.env.DB.prepare('SELECT id, confirmed, confirm_token, unsub_token FROM email_intents WHERE email = ? AND unsubscribed_at IS NULL').bind(email).first();
    if (seen && seen.confirmed) {
      // already confirmed — say nothing different (no enumeration), send no email
    } else {
      const rlKey = `subconfirm:${email}`;
      const sent = parseInt((await c.env.KV.get(rlKey)) || '0', 10);
      if (sent < 2) {
        await c.env.KV.put(rlKey, String(sent + 1), { expirationTtl: 3600 });
        let confirmToken = seen && seen.confirm_token;
        let unsubToken = seen && seen.unsub_token;
        if (!confirmToken || !unsubToken) {
          confirmToken = token(24);
          unsubToken = token(24);
          if (seen) await c.env.DB.prepare('UPDATE email_intents SET confirm_token = ?, unsub_token = ? WHERE id = ?').bind(confirmToken, unsubToken, seen.id).run();
          else await c.env.DB.prepare('INSERT INTO email_intents (id, email, source, confirm_token, unsub_token) VALUES (?, ?, ?, ?, ?)').bind(uid(), email, 'landing', confirmToken, unsubToken).run();
        }
        await sendSubscribeConfirm(c.env, email, confirmToken, unsubToken, c.req.header('cf-connecting-ip'));
      }
    }
  }
  return c.html(page({ title: 'Check your inbox', body: `<div class="py-20 text-center"><h1 class="text-2xl font-bold">Check your inbox 📬</h1><p class="mt-2 text-stone-600">If that address is valid, we've sent a confirmation link. Click it to finish subscribing — you won't get updates until you do.</p><a class="mt-6 inline-block text-emerald-700 underline" href="/">Back home</a></div>`, path: '/subscribe', noindex: true }));
});

app.get('/subscribe/confirm', async (c) => {
  const t = String(c.req.query('t') || '');
  let ok = false;
  if (/^[A-Za-z0-9_-]{10,}$/.test(t)) {
    const row = await c.env.DB.prepare('SELECT id, email, unsub_token, confirmed FROM email_intents WHERE confirm_token = ? AND unsubscribed_at IS NULL').bind(t).first();
    if (row) {
      await c.env.DB.prepare("UPDATE email_intents SET confirmed = 1, confirmed_at = datetime('now') WHERE id = ?").bind(row.id).run();
      if (!row.confirmed) c.executionCtx.waitUntil(sendWelcome(c.env, row.email, row.unsub_token));
      ok = true;
    }
  }
  const body = ok
    ? `<div class="py-20 text-center"><h1 class="text-2xl font-bold">You're on the list 🎉</h1><p class="mt-2 text-stone-600">Subscription confirmed. We'll email you when new features ship — unsubscribe any time from the link in each email.</p><a class="mt-6 inline-block text-emerald-700 underline" href="/">Back home</a></div>`
    : `<div class="py-20 text-center"><h1 class="text-2xl font-bold">Link not valid</h1><p class="mt-2 text-stone-600">This confirmation link is invalid or was already used after unsubscribing. You can subscribe again from the home page.</p><a class="mt-6 inline-block text-emerald-700 underline" href="/">Back home</a></div>`;
  return c.html(page({ title: ok ? 'Subscribed' : 'Link not valid', body, path: '/subscribe/confirm', noindex: true }));
});

const handleUnsubscribe = async (c) => {
  const t = String(c.req.query('t') || '');
  let ok = false;
  if (/^[A-Za-z0-9_-]{10,}$/.test(t)) {
    const row = await c.env.DB.prepare('SELECT id FROM email_intents WHERE unsub_token = ?').bind(t).first();
    if (row) {
      await c.env.DB.prepare("UPDATE email_intents SET confirmed = 0, unsubscribed_at = datetime('now') WHERE id = ?").bind(row.id).run();
      ok = true;
    }
  }
  const body = ok
    ? `<div class="py-20 text-center"><h1 class="text-2xl font-bold">You're unsubscribed</h1><p class="mt-2 text-stone-600">You won't receive any more product updates from MealLoop.</p><a class="mt-6 inline-block text-emerald-700 underline" href="/">Back home</a></div>`
    : `<div class="py-20 text-center"><h1 class="text-2xl font-bold">Nothing to unsubscribe</h1><p class="mt-2 text-stone-600">This unsubscribe link is invalid or already used. If you keep getting emails, contact mealloop@zalize.com.</p><a class="mt-6 inline-block text-emerald-700 underline" href="/">Back home</a></div>`;
  return c.html(page({ title: 'Unsubscribe', body, path: '/unsubscribe', noindex: true }));
};
app.get('/unsubscribe', handleUnsubscribe);
app.post('/unsubscribe', handleUnsubscribe);

const PRICING_PLANS = [
  {
    name: 'Free', price: '$0', per: 'forever', cta: 'Start free',
    blurb: 'For trying MealLoop or planning solo.',
    features: ['Up to 30 recipes', 'Weekly meal planner', 'One grocery list, aisle-sorted', 'Recipe import from any site', 'Metric / imperial switch'],
  },
  {
    name: 'Household', price: '$3', per: '/month · or $24/year', cta: 'Start free beta trial', highlight: true,
    blurb: 'The full family loop — one plan for the whole house.',
    features: ['Unlimited recipes', 'Family share link — no accounts for family', 'Family meal reactions (👍/👎) from the link', 'Live-syncing grocery list', 'Multiple stores & custom aisles', 'Staples, saved menus & leftovers planning', 'Calendar (iCal) subscription', 'Cook mode & recipe scaling'],
  },
  {
    name: 'Supporter', price: '$29', per: '/year', cta: 'Start free beta trial',
    blurb: 'Everything in Household, plus help shape the roadmap.',
    features: ['Everything in Household', 'Priority support', 'Early access to new features', 'Vote on the roadmap'],
  },
];

app.get('/pricing', async (c) => {
  const user = await getUser(c);
  const site = c.env.SITE_URL || 'https://mealloop.zalize.com';
  const body = `
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MealLoop',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    url: site,
    description: 'Family meal planning with real-time sync: import recipes, plan your week, share one grocery list.',
    offers: [
      { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Household', price: '3', priceCurrency: 'USD', description: '$3/month or $24/year' },
      { '@type': 'Offer', name: 'Supporter', price: '29', priceCurrency: 'USD', description: '$29/year' },
    ],
  })}</script>
<section class="py-8 sm:py-12 text-center">
  <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">Simple pricing, built for households</h1>
  <p class="mt-3 text-lg text-stone-600 max-w-xl mx-auto">One subscription covers the whole family — people you share your link with never need an account or a plan.</p>
  <div class="mt-5 max-w-xl mx-auto rounded-xl bg-amber-50 border border-amber-200 p-4 text-left">
    <p class="font-semibold text-amber-900">MealLoop is in open beta</p>
    <p class="text-sm text-amber-800 mt-1">Every plan below is <strong>free for everyone during the beta</strong> — all features unlocked, no card required. Billing starts only at launch, and beta users will be notified well in advance.</p>
  </div>
</section>
<section class="grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto items-stretch stagger">
  ${PRICING_PLANS.map((p) => `
  <div class="rounded-2xl bg-white border ${p.highlight ? 'border-emerald-500 ring-1 ring-emerald-500 relative' : 'border-stone-200'} p-6 flex flex-col">
    ${p.highlight ? '<span class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 text-white text-xs font-semibold px-3 py-0.5">Most popular</span>' : ''}
    <h2 class="font-bold text-lg text-stone-900">${p.name}</h2>
    <p class="mt-1 text-sm text-stone-600">${p.blurb}</p>
    <p class="mt-4 tnum"><span class="text-3xl font-extrabold text-stone-900">${p.price}</span> <span class="text-sm text-stone-500">${p.per}</span></p>
    <ul class="mt-4 space-y-2 text-sm text-stone-700 flex-1">
      ${p.features.map((f) => `<li class="flex gap-2"><span aria-hidden="true" class="text-emerald-600 font-bold">✓</span>${f}</li>`).join('')}
    </ul>
    <a href="${user ? '/app' : '/login'}" class="mt-6 inline-block text-center rounded-lg ${p.highlight ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border border-stone-300 hover:bg-stone-100'} px-4 py-2.5 font-semibold">${user ? 'Open your planner' : p.cta}</a>
  </div>`).join('')}
</section>
<section class="max-w-2xl mx-auto py-10">
  <h2 class="text-xl font-bold text-center">Pricing questions</h2>
  <div class="mt-5 space-y-3">
    ${[
      ['Is it really all free right now?', 'Yes. During the open beta every feature of every plan is unlocked for all accounts, and we don\u2019t collect any payment details. The prices above are what plans will cost when MealLoop launches.'],
      ['What happens to my data when billing starts?', 'Nothing is deleted. You\u2019ll be asked to pick a plan; if you stay on Free, your recipes remain readable and exportable even if you\u2019re over the Free limits.'],
      ['Do family members I share the link with need a plan?', 'No — that\u2019s the point of MealLoop. One Household subscription covers everyone; viewers via your share link never need an account or a payment.'],
    ].map(([q, a]) => `
    <details class="rounded-xl bg-white border border-stone-200 p-4">
      <summary class="font-semibold cursor-pointer text-stone-900">${q}</summary>
      <p class="mt-2 text-sm text-stone-600">${a}</p>
    </details>`).join('')}
  </div>
</section>`;
  return c.html(page({ title: 'Pricing', description: 'MealLoop pricing: Free, Household and Supporter plans. All features free for everyone during the open beta — no card required.', body, user, path: '/pricing' }));
});

const FAQS = [
  ['What is MealLoop?', 'MealLoop is a family meal planner: keep your recipes in one box, plan the week (or month) of dinners, and everyone in the household shops from one always-in-sync grocery list.'],
  ['How do I get my recipes in?', 'Paste a link to any public recipe page and MealLoop imports it, paste recipe text by hand, type it in yourself, or upload a JSON backup from another app. Everything you add stays exportable.'],
  ['Does my family need accounts?', 'Only the person who runs the plan needs one. Everyone else can use your household share link to see the week, check items off the grocery list, and vote 👍/👎 on planned meals — no signup, no app install.'],
  ['Does it work on my phone?', 'Yes. MealLoop is a fast website that adapts to any screen, so there is nothing to install and it is always up to date at the store.'],
  ['How does the grocery list stay in sync?', 'When you add planned meals to the list, ingredients merge automatically by aisle. Anyone viewing the list — on the app or the share link — sees checks appear within seconds.'],
  ['What does the AI week planner do?', 'It drafts a week of dinners from your own recipe box and recent history. Nothing is saved until you press Apply, and pantry items you already have are skipped on the list.'],
  ['Can I scale recipes or switch units?', 'Yes — scale servings up or down on any recipe, and switch the whole household between metric and imperial display units.'],
  ['Is my data locked in?', 'No. You can export every recipe as standard schema.org JSON at any time, and delete your account (and all data) yourself from settings.'],
  ['How much does it cost?', 'During the open beta everything is free for everyone — no card required. Planned prices are on the pricing page and beta users will be notified well before billing starts.'],
];

app.get('/faq', async (c) => {
  const user = await getUser(c);
  const body = `
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  })}</script>
<section class="max-w-2xl mx-auto py-8 sm:py-12">
  <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 text-center">Frequently asked questions</h1>
  <p class="mt-3 text-lg text-stone-600 text-center">Everything busy families ask before their first week with MealLoop.</p>
  <div class="mt-7 space-y-3">
    ${FAQS.map(([q, a]) => `
    <details class="rounded-xl bg-white border border-stone-200 p-4">
      <summary class="font-semibold cursor-pointer text-stone-900">${q}</summary>
      <p class="mt-2 text-sm text-stone-600">${a}</p>
    </details>`).join('')}
  </div>
  <p class="mt-8 text-center text-sm text-stone-600">Still curious? <a class="text-emerald-700 underline" href="/pricing">See pricing</a> or <a class="text-emerald-700 underline" href="${user ? '/app' : '/login'}">${user ? 'open your planner' : 'start planning free'}</a>.</p>
</section>`;
  return c.html(page({ title: 'FAQ', description: 'Answers to common questions about MealLoop: recipe import, household share links, the synced grocery list, AI week drafts, data export and beta pricing.', body, user, path: '/faq' }));
});

app.get('/privacy', async (c) =>
  c.html(page({ title: 'Privacy', path: '/privacy', user: await getUser(c), body: legalBody('Privacy Policy', `
<p>MealLoop is designed to be privacy-first. Controller: MealLoop (Zalize), contact <a class="text-emerald-700 underline" href="mailto:mealloop@zalize.com">mealloop@zalize.com</a>.</p>
<h2 class="font-semibold text-lg pt-2">What we collect and why</h2>
<ul class="list-disc pl-5 space-y-1">
<li><strong>Email address</strong> — to send login codes and run your account. Legal basis: performance of a contract (Art. 6(1)(b) GDPR).</li>
<li><strong>Your meal-planning content</strong> (recipes, plan entries, grocery items, household name) — to provide the service. Legal basis: contract.</li>
<li><strong>Product-update emails</strong>, only if you submit the signup form. Legal basis: consent (Art. 6(1)(a)); withdraw anytime by emailing us.</li>
<li><strong>Aggregate page counts, recipe-search terms and referring-site hostnames</strong> (date + page path, search text, or the domain a visitor came from — never full referrer URLs, no IP, no device or user identifiers, no third-party trackers, no ads). Legal basis: legitimate interest in measuring usage (Art. 6(1)(f)).</li>
<li><strong>Meal reactions from your share link</strong> (👍/👎 per planned meal, tied to a random device token — no name, no email, no account). Legal basis: legitimate interest in providing the voting feature (Art. 6(1)(f)); reactions are deleted with the meal, recipe, week or household they belong to.</li>
</ul>
<h2 class="font-semibold text-lg pt-2">Cookies</h2>
<p>One strictly necessary cookie (<code>ml_session</code>, HttpOnly/Secure/SameSite=Lax, 30 days) is set only after you log in. Share-link visitors get one functional cookie (<code>ml_voter</code>, HttpOnly/Secure/SameSite=Lax, 12 months) holding a random token so your 👍/👎 votes stay yours — it identifies a device to the household you visited, nothing more. No analytics or advertising cookies, so no consent banner is required.</p>
<h2 class="font-semibold text-lg pt-2">Processors and data location</h2>
<ul class="list-disc pl-5 space-y-1">
<li><strong>Cloudflare, Inc.</strong> — hosting, database (D1), key-value storage and headless rendering for recipe import.</li>
<li><strong>Resend (Plus Five Five, Inc.)</strong> — transactional email delivery of login codes.</li>
<li>Both may process data in the US under Standard Contractual Clauses / the EU-US Data Privacy Framework.</li>
</ul>
<h2 class="font-semibold text-lg pt-2">Retention</h2>
<ul class="list-disc pl-5 space-y-1">
<li>Login codes: 10 minutes. Session tokens: 30 days (or until you log out).</li>
<li>Account and meal-planning content: until you delete your account yourself on the Share &amp; account page, or ask us to.</li>
<li>Newsletter emails: until you unsubscribe. Aggregate page counts and search terms: 24 months (they contain no personal data).</li>
</ul>
<h2 class="font-semibold text-lg pt-2">Your rights</h2>
<p>You have the right to access, rectify, erase, restrict or object to processing, to data portability, to withdraw consent, and to lodge a complaint with your supervisory authority. Email <a class="text-emerald-700 underline" href="mailto:mealloop@zalize.com">mealloop@zalize.com</a> and we will respond within 30 days.</p>
<h2 class="font-semibold text-lg pt-2">Sharing</h2>
<p>We never sell your data. Anyone holding your household's share link can see that week's plan and grocery list without logging in — share it only with people you trust, and use "Reset link" on the Share page to revoke it.</p>
<p>MealLoop is not intended for children under 16.</p>`) }))
);

app.get('/terms', async (c) =>
  c.html(page({ title: 'Terms', path: '/terms', user: await getUser(c), body: legalBody('Terms of Service', `
<p>MealLoop is currently in open beta: all features are provided free of charge during the beta period. Published pricing takes effect only at general availability, with prior notice to beta users. The service is provided "as is", without warranty of any kind.</p>
<ul class="list-disc pl-5 space-y-1">
<li>You retain ownership of the content you add. Imported recipes remain the property of their original publishers; we store them for your personal household use and always link back to the source.</li>
<li>Do not use MealLoop for unlawful content or to abuse the import service.</li>
<li>We may update these terms; continued use constitutes acceptance.</li>
</ul>`) }))
);

app.get('/about', async (c) =>
  c.html(page({ title: 'About', path: '/about', user: await getUser(c), description: 'MealLoop is the calm way for busy families to answer "what\'s for dinner?" — plan the week in minutes, and everyone shops from one always-in-sync list.', body: `
<article class="prose-sm max-w-2xl mx-auto py-8 space-y-4">
<h1 class="text-2xl font-bold">About MealLoop</h1>
<p class="text-lg text-stone-600">MealLoop is the calm way for busy families to answer "what's for dinner?" — plan the week in minutes, and everyone shops from one always-in-sync list.</p>
<p>Every family has the same 6pm problem: someone standing in front of the fridge, tired, deciding dinner from scratch — again. Recipes live in ten browser tabs, the shopping list is a text thread, and whoever's at the store buys the wrong things twice.</p>
<p>MealLoop closes the loop. Save recipes once — paste any recipe URL, type them in, or import a backup — drag them onto a week, and the grocery list writes itself: merged quantities, sorted by aisle, minus what's already in your pantry. Your household shares one link; anyone can check things off at the store and everyone else sees it instantly. When the week's done, you loop: reuse a saved menu or let AI draft the next week from your own recipe box.</p>
<h2 class="font-semibold text-lg pt-2">What we believe</h2>
<ul class="list-disc pl-5 space-y-1">
<li><strong>Calm over clever.</strong> No forced onboarding quizzes, no gamification, no notification spam.</li>
<li><strong>The family is the unit.</strong> Shared lists and anonymous share links — no one needs an account to check off milk.</li>
<li><strong>Your food, your data.</strong> Recipes export in an open format, accounts self-delete, analytics are cookie-free aggregates. No ads, ever.</li>
<li><strong>Warmth, not sterility.</strong> Food software should feel like a kitchen, not a spreadsheet.</li>
</ul>
<p>MealLoop is built by <a class="text-emerald-700 underline" href="https://zalize.com" rel="noopener">Zalize</a> and is currently in open beta — every feature is free during the beta. Questions? <a class="text-emerald-700 underline" href="mailto:mealloop@zalize.com">mealloop@zalize.com</a>. Press &amp; media: see the <a class="text-emerald-700 underline" href="/press">press kit</a>.</p>
</article>` }))
);

app.get('/press', async (c) =>
  c.html(page({ title: 'Press kit', path: '/press', user: await getUser(c), description: 'MealLoop press & media kit: boilerplate, brand assets, screenshots and facts for journalists and creators.', body: `
<article class="prose-sm max-w-2xl mx-auto py-8 space-y-4">
<h1 class="text-2xl font-bold">MealLoop press kit</h1>
<p class="text-stone-600">Everything you need to write about MealLoop. Questions or interview requests: <a class="text-emerald-700 underline" href="mailto:mealloop@zalize.com">mealloop@zalize.com</a>.</p>
<h2 class="font-semibold text-lg pt-2">Boilerplate</h2>
<p><strong>Short:</strong> MealLoop is a family meal planner and shared grocery list: import recipes from any site, plan your week in minutes, and shop from one always-in-sync list — no app install needed for the family.</p>
<p><strong>Long:</strong> MealLoop (mealloop.zalize.com) helps busy families answer "what's for dinner?" without the nightly decision fatigue. Households save recipes once — from any recipe website, by typing them in, or by importing a backup — plan their week on a simple planner, and get an automatic grocery list with merged quantities sorted by supermarket aisle, minus what's already in the pantry. One private share link keeps the whole household in sync at the store, with no account or app required. MealLoop also drafts weekly menus with AI grounded in the family's own recipe box, exports recipes in an open format, and is privacy-first: no ads, no cookies before login, and cookie-free aggregate analytics. Built by Zalize, MealLoop is in open beta with all features free during the beta.</p>
<h2 class="font-semibold text-lg pt-2">Facts</h2>
<ul class="list-disc pl-5 space-y-1">
<li>Product: family meal planning + shared grocery list, web-based (works on any phone/desktop browser).</li>
<li>Pricing: open beta — all features free; published plans are Free, Household ($3/mo or $24/yr) and Supporter ($29/yr) at general availability.</li>
<li>Privacy: no ads, no third-party trackers, no cookies before login, GDPR self-serve account deletion.</li>
<li>Platform: Cloudflare Workers edge deployment, server-rendered, strict Content Security Policy.</li>
<li>Maker: Zalize. Contact: mealloop@zalize.com.</li>
</ul>
<h2 class="font-semibold text-lg pt-2">Brand assets</h2>
<ul class="list-disc pl-5 space-y-1">
<li><a class="text-emerald-700 underline" href="/favicon.svg" download>Logo mark (SVG)</a> — the "plate + loop"; don't recolor or restyle.</li>
<li><a class="text-emerald-700 underline" href="/icon-512.png" download>App icon 512×512 (PNG)</a></li>
<li><a class="text-emerald-700 underline" href="/og-card.png" download>Social / cover card 1200×630 (PNG)</a></li>
</ul>
<p>Name is always written <strong>MealLoop</strong> (one word, capital M and L). Primary color emerald <code>#059669</code> on warm cream <code>#fbf8f3</code>; display font Nunito.</p>
<h2 class="font-semibold text-lg pt-2">Screenshots</h2>
<p>Screenshot anything on the live site, or try the interactive demo on the <a class="text-emerald-700 underline" href="/">home page</a> — we're happy to provide specific shots on request.</p>
</article>` }))
);

function legalBody(title, inner) {
  return `<article class="prose-sm max-w-2xl mx-auto py-8 space-y-4"><h1 class="text-2xl font-bold">${title}</h1>${inner}<p class="text-stone-500 text-sm">Last updated: 2026-08-10</p></article>`;
}

// ---------- pSEO guides ----------
// Topic hub: /guides grouped into themed sections (SideChef-style topic navigation).
const GUIDE_TOPICS = [
  ['Meal planning basics', ['how-to-meal-plan-for-a-family', 'meal-plan-in-20-minutes', 'stop-deciding-whats-for-dinner-every-night', 'why-meal-plans-fall-apart', 'dinner-rotation-two-weeks', 'reusable-weekly-menu-template', 'back-to-school-meal-planning', 'meal-planning-on-a-budget', 'meal-planning-for-picky-eaters', 'plan-leftovers-nights-reduce-food-waste', 'batch-cooking-for-busy-weeks', 'freezer-meals-for-family-weeknights', 'slow-cooker-meal-planning']],
  ['Grocery lists & shopping', ['grocery-list-by-aisle', 'organize-grocery-list-by-store-aisle', 'weekly-grocery-list-with-staples', 'household-staples-list', 'shared-grocery-list-without-an-app']],
  ['Recipes & cooking', ['import-recipes-from-any-website', 'save-recipes-from-sites-that-block-importers', 'scaling-recipes-for-family-size', 'metric-imperial-recipe-conversion', 'print-a-recipe-without-ads-and-clutter', 'cook-from-your-phone-without-screen-lock', 'move-recipes-from-another-app']],
  ['Family, sharing & tools', ['meal-planning-as-a-team', 'let-the-family-vote-on-dinner', 'meal-plan-in-your-family-calendar', 'meal-planning-apps-vs-shared-notes', 'plan-to-eat-alternatives', 'samsung-food-review-for-families']],
];

app.get('/guides', async (c) => {
  const grouped = GUIDE_TOPICS.map(([topic, slugs]) => [topic, slugs.map((s) => GUIDES.find((g) => g.slug === s)).filter(Boolean)]);
  const leftover = GUIDES.filter((g) => !GUIDE_TOPICS.some(([, slugs]) => slugs.includes(g.slug)));
  if (leftover.length) grouped[grouped.length - 1][1].push(...leftover);
  const flat = grouped.flatMap(([, gs]) => gs);
  const body = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: flat.map((g, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: g.title,
      url: `https://mealloop.zalize.com/guides/${g.slug}`,
    })),
  })}</script><div class="py-8 max-w-2xl mx-auto">
<h1 class="text-3xl font-bold">Meal planning guides</h1>
<p class="mt-2 text-stone-600">Practical guides for planning family meals without the chaos.</p>
<nav aria-label="Guide topics" class="mt-4 flex flex-wrap gap-2">
${grouped.map(([topic, gs], ti) => `<a href="#topic-${ti}" class="rounded-full border border-stone-300 bg-white px-3 py-1 text-sm hover:border-emerald-400">${esc(topic)} <span class="text-stone-400">${gs.length}</span></a>`).join('')}
</nav>
${grouped.map(([topic, gs], ti) => `
<h2 id="topic-${ti}" class="mt-8 text-xl font-bold scroll-mt-4">${esc(topic)}</h2>
<ul class="mt-3 space-y-3">
${gs.map((g) => `<li class="rounded-xl bg-white border border-stone-200 p-4 hover:border-emerald-400"><a href="/guides/${g.slug}"><h3 class="font-semibold text-emerald-700">${esc(g.title)}</h3><p class="text-sm text-stone-600 mt-1">${esc(g.excerpt)}</p></a></li>`).join('')}
</ul>`).join('')}
</div>`;
  return c.html(page({ title: 'Meal planning guides', description: 'Practical guides for planning family meals: weekly planning, grocery lists, recipe import and more.', body, path: '/guides', user: await getUser(c) }));
});

app.get('/guides/:slug', async (c) => {
  const g = GUIDES.find((x) => x.slug === c.req.param('slug'));
  if (!g) return c.notFound();
  const user = await getUser(c);
  const body = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: g.title,
        description: g.excerpt,
        mainEntityOfPage: `https://mealloop.zalize.com/guides/${g.slug}`,
        image: 'https://mealloop.zalize.com/og-card.png',
        author: { '@type': 'Organization', name: 'MealLoop', url: 'https://mealloop.zalize.com' },
        publisher: { '@type': 'Organization', name: 'MealLoop', logo: { '@type': 'ImageObject', url: 'https://mealloop.zalize.com/icon-512.png' } },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Guides', item: 'https://mealloop.zalize.com/guides' },
          { '@type': 'ListItem', position: 2, name: g.title, item: `https://mealloop.zalize.com/guides/${g.slug}` },
        ],
      },
    ],
  })}</script><article class="py-8 max-w-2xl mx-auto space-y-4">
<nav aria-label="Breadcrumb" class="text-sm text-stone-500"><a class="hover:text-emerald-700 hover:underline" href="/guides">Guides</a> <span aria-hidden="true">›</span> <span class="text-stone-700">${esc(g.title)}</span></nav>
<h1 class="text-3xl font-bold">${esc(g.title)}</h1>
${g.body}
<div class="rounded-xl bg-emerald-50 border border-emerald-200 p-4 mt-6"><p class="font-medium text-emerald-900">Try it with MealLoop — free during the open beta, no app needed.</p><a href="${user ? '/app' : '/login'}" class="inline-block mt-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700">${user ? 'Open your planner' : 'Start planning'}</a></div>
${relatedGuides(g)}
</article>`;
  return c.html(page({ title: g.title, description: g.excerpt, body, path: `/guides/${g.slug}`, ogType: 'article', user }));
});

function relatedGuides(g) {
  const i = GUIDES.indexOf(g);
  const picks = [1, 2, 3].map((k) => GUIDES[(i + k) % GUIDES.length]);
  return `<nav aria-label="More guides" class="mt-8 border-t border-stone-200 pt-5">
<h2 class="text-sm font-semibold uppercase tracking-wide text-stone-500">More guides</h2>
<ul class="mt-3 space-y-2">
${picks.map((r) => `<li><a class="text-emerald-700 hover:underline" href="/guides/${r.slug}">${esc(r.title)}</a></li>`).join('')}
</ul>
</nav>`;
}

// ---------- auth ----------
// Internal app path a login can safely bounce back to.
function safeNext(v) {
  const p = String(v || '');
  return /^\/app(\/[A-Za-z0-9/_-]*)?(\?[A-Za-z0-9=&_-]*)?$/.test(p) ? p : '';
}

app.get('/login', async (c) => {
  const user = await getUser(c);
  if (user) return c.redirect(safeNext(c.req.query('next')) || '/app');
  const body = loginBody('', '', safeNext(c.req.query('next')));
  return c.html(page({ title: 'Log in', body, path: '/login', noindex: true }));
});

function loginBody(msg, email = '', next = '') {
  return `<div class="max-w-sm mx-auto py-14">
<h1 class="text-2xl font-bold text-center">Log in or sign up</h1>
<p class="text-center text-stone-600 text-sm mt-1">We'll email you a 6-digit code. No password needed.</p>
<p class="text-center text-stone-400 text-xs mt-1.5">We only use your email for sign-in codes and things you explicitly opt in to — never marketing by default.</p>
${msg ? `<p class="mt-4 text-center text-sm rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2">${esc(msg)}</p>` : ''}
${email
    ? `<form method="post" action="/verify" class="mt-6 space-y-3">
        <input type="hidden" name="email" value="${esc(email)}">
        ${next ? `<input type="hidden" name="next" value="${esc(next)}">` : ''}
        <input name="code" aria-label="6-digit code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required autofocus autocomplete="one-time-code" placeholder="6-digit code" class="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-center text-xl tracking-[0.4em]">
        <button class="w-full rounded-lg bg-emerald-600 text-white font-semibold py-2.5 hover:bg-emerald-700">Verify & continue</button>
      </form>
      <form method="post" action="/login" class="mt-3 text-center">
        <input type="hidden" name="email" value="${esc(email)}">
        ${next ? `<input type="hidden" name="next" value="${esc(next)}">` : ''}
        <button data-resend class="text-sm text-emerald-700 underline disabled:text-stone-400 disabled:no-underline">Didn't get it? Resend code</button>
      </form>`
    : `<form method="post" action="/login" class="mt-6 space-y-3">
        ${next ? `<input type="hidden" name="next" value="${esc(next)}">` : ''}
        <input type="email" name="email" required aria-label="Email address" autofocus autocomplete="email" placeholder="you@example.com" class="w-full rounded-lg border border-stone-300 px-3 py-2.5">
        <button class="w-full rounded-lg bg-emerald-600 text-white font-semibold py-2.5 hover:bg-emerald-700">Email me a code</button>
      </form>`}
</div>`;
}

app.post('/login', async (c) => {
  const form = await c.req.parseBody();
  const email = String(form.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return c.html(page({ title: 'Log in', body: loginBody('Please enter a valid email address.'), path: '/login', noindex: true }));
  }
  const sent = await sendMagicCode(c.env, email, c.req.header('cf-connecting-ip'));
  const msg = sent === 'ok' ? `Code sent to ${email}. Check your inbox.`
    : sent === 'quota' ? 'Our email service is over capacity right now. Please try again later today — sorry about that.'
    : sent === 'limit' ? 'Too many login codes were requested from this address or network. Please wait before trying again — the limit clears within an hour.'
    : 'Could not send email right now — please try again in a minute.';
  return c.html(page({ title: 'Enter code', body: loginBody(msg, sent === 'ok' ? email : '', safeNext(form.next)), path: '/login', noindex: true }));
});

app.post('/verify', async (c) => {
  const form = await c.req.parseBody();
  const email = String(form.email || '').trim().toLowerCase();
  const sess = await verifyCode(c.env, email, String(form.code || ''));
  if (!sess) {
    return c.html(page({ title: 'Enter code', body: loginBody('Invalid or expired code. Try again.', email, safeNext(form.next)), path: '/login', noindex: true }));
  }
  c.header('Set-Cookie', sessionCookie(sess));
  return c.redirect(safeNext(form.next) || '/app');
});

app.post('/logout', async (c) => {
  await logout(c);
  c.header('Set-Cookie', clearCookie());
  return c.redirect('/');
});

// ---------- app middleware: require user + household ----------
app.use('/app/*', requireHousehold);
app.use('/app', requireHousehold);

async function requireHousehold(c, next) {
  const user = await getUser(c);
  if (!user) {
    const path = new URL(c.req.url);
    return c.redirect(`/login?next=${encodeURIComponent(path.pathname + path.search)}`);
  }
  let member = await c.env.DB.prepare(
    'SELECT h.* FROM households h JOIN household_members m ON m.household_id = h.id WHERE m.user_id = ?'
  ).bind(user.id).first();
  if (!member) {
    const hid = uid();
    const share = token(20);
    await c.env.DB.batch([
      c.env.DB.prepare('INSERT INTO households (id, name, share_token, owner_id) VALUES (?, ?, ?, ?)').bind(hid, 'My family', share, user.id),
      c.env.DB.prepare('INSERT INTO household_members (household_id, user_id, role) VALUES (?, ?, ?)').bind(hid, user.id, 'owner'),
    ]);
    member = await c.env.DB.prepare('SELECT * FROM households WHERE id = ?').bind(hid).first();
  }
  c.set('user', user);
  c.set('household', member);
  await next();
}

async function bumpVersion(env, hid) {
  await env.DB.prepare('UPDATE households SET version = version + 1 WHERE id = ?').bind(hid).run();
}

// ---------- planner ----------
const SCALES = [0.5, 1, 2, 3, 4];

function mealsFor(h) {
  return h.snacks ? ['breakfast', 'lunch', 'dinner', 'snacks'] : ['breakfast', 'lunch', 'dinner'];
}

app.get('/app', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const start = c.req.query('week');
  const days = weekDates(start);
  const [entries, recipes, reactions] = await Promise.all([
    c.env.DB.prepare('SELECT p.*, r.title AS recipe_title FROM plan_entries p LEFT JOIN recipes r ON r.id = p.recipe_id WHERE p.household_id = ? AND p.date BETWEEN ? AND ?')
      .bind(h.id, days[0], days[6]).all(),
    c.env.DB.prepare('SELECT id, title, favorite FROM recipes WHERE household_id = ? ORDER BY favorite DESC, created_at DESC LIMIT 200').bind(h.id).all(),
    c.env.DB.prepare('SELECT r.plan_entry_id, r.reaction, COUNT(*) n FROM plan_reactions r JOIN plan_entries p ON p.id = r.plan_entry_id WHERE p.household_id = ? AND p.date BETWEEN ? AND ? GROUP BY r.plan_entry_id, r.reaction')
      .bind(h.id, days[0], days[6]).all(),
  ]);
  const reactBadge = (entryId) => {
    const up = reactions.results.find((r) => r.plan_entry_id === entryId && r.reaction === 'up');
    const down = reactions.results.find((r) => r.plan_entry_id === entryId && r.reaction === 'down');
    if (!up && !down) return '';
    const negative = (down?.n || 0) > (up?.n || 0);
    return ` <span class="whitespace-nowrap text-xs ${negative ? 'text-amber-700' : 'text-stone-500'} print:hidden" title="${negative ? "Family isn't keen on this one — consider swapping it" : 'Family reactions from your share link'}">${up ? `\u{1F44D}${up.n}` : ''}${up && down ? ' ' : ''}${down ? `\u{1F44E}${down.n}` : ''}</span>`;
  };
  const prevWeek = shiftDays(days[0], -7);
  const nextWeek = shiftDays(days[0], 7);
  const [menus, anyPlan, anyItem] = await Promise.all([
    c.env.DB.prepare('SELECT id, name FROM menus WHERE household_id = ? ORDER BY created_at DESC LIMIT 50').bind(h.id).all(),
    c.env.DB.prepare('SELECT 1 AS x FROM plan_entries WHERE household_id = ? LIMIT 1').bind(h.id).first(),
    c.env.DB.prepare('SELECT 1 AS x FROM shopping_items WHERE household_id = ? LIMIT 1').bind(h.id).first(),
  ]);
  const setupSteps = [
    { done: recipes.results.length > 0, label: 'Add a recipe', hint: 'paste any recipe URL, or type one in', href: '/app/recipes' },
    { done: !!anyPlan, label: 'Plan a dinner', hint: 'open “+ add” on any day below', href: null },
    { done: !!anyItem, label: 'Get your grocery list', hint: 'one click gathers every ingredient', href: '/app/list' },
  ];
  const setupLeft = setupSteps.filter((s) => !s.done).length;
  const picked = recipes.results.find((r) => r.id === c.req.query('recipe'));
  const ai = c.req.query('ai');
  const aiDown = ai ? null : await c.env.KV.get('ai:unavailable');
  const aiRetried = c.req.query('retried') === '1';
  const aiNotice = ai === 'err' ? `<div role="alert" class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 print:hidden">
  <p>${aiRetried ? `<strong>We retried and the AI service is still unavailable.</strong> It usually recovers within a few minutes — your plan is untouched. Keep trying, or fill the week without AI below.` : `<strong>The AI couldn't draft your week just now.</strong> This is usually a brief hiccup on the AI side — your plan is untouched.`}</p>
  <div class="mt-2 flex flex-wrap gap-2">
    <form method="post" action="/app/ai/generate" class="inline"><input type="hidden" name="week" value="${days[0]}"><input type="hidden" name="retry" value="1"><button data-ai-start data-busy-label="Retrying…" aria-label="Try the AI draft again" class="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">${aiRetried ? 'Try once more' : 'Try again'}</button></form>
    ${recipes.results.length ? `<form method="post" action="/app/plan/fill-week" class="inline"><input type="hidden" name="week" value="${days[0]}"><button class="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium hover:bg-amber-100">Fill from recipe box instead (no AI)</button></form>` : ''}
  </div>
</div>` : ai === 'fewbox' ? `<div role="status" class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 print:hidden">
  <p><strong>The AI plans best from your own recipes — your box has ${recipes.results.length ? `only ${recipes.results.length}` : 'none yet'}.</strong> Add our 8 family-tested starter dinners (you can edit or delete them anytime), or <a class="underline font-medium" href="/app/recipes">import your own</a> first.</p>
  <form method="post" action="/app/recipes/starters" class="mt-2"><input type="hidden" name="week" value="${days[0]}"><button data-busy-label="Adding starter recipes…" class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Add 8 starter recipes</button></form>
</div>` : ai === 'limit' ? `<div role="alert" class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 print:hidden">
  <p><strong>You've reached today's AI drafting limit (${AI_DAILY_PER_HOUSEHOLD} drafts a day).</strong> It resets tomorrow — your plan is untouched. You can still fill the week from your recipe box below.</p>
  ${recipes.results.length ? `<form method="post" action="/app/plan/fill-week" class="mt-2 inline"><input type="hidden" name="week" value="${days[0]}"><button class="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium hover:bg-amber-100">Fill from recipe box (no AI)</button></form>` : ''}
</div>` : ai === 'starters' ? `<p role="status" class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 print:hidden">8 starter recipes added to <a class="underline font-medium" href="/app/recipes">your recipe box</a> — now try “✨ Plan my week with AI”.</p>` : '';
  const body = `
${aiNotice}
${picked ? `<p class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 print:hidden"><strong>${esc(picked.title)}</strong> is preselected — open “+ add” on a day below and click Add.</p>` : ''}
<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
  <h1 class="text-2xl font-bold">Week of ${dayLabel(days[0])}</h1>
  <div class="flex flex-wrap items-center gap-2 text-sm print:hidden">
    <button type="button" data-print class="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100">Print</button>
    <a href="/app?week=${prevWeek}" data-swipe-prev class="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100">← Prev</a>
    <a href="/app#today" class="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100">Today</a>
    <a href="/app?week=${nextWeek}" data-swipe-next class="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100">Next →</a>
    <a href="/app/month?month=${days[0].slice(0, 7)}" class="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100">Month</a>
    <form method="post" action="/app/settings/snacks" class="inline"><input type="hidden" name="week" value="${days[0]}"><button class="px-3 py-1.5 rounded-lg border ${h.snacks ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-stone-300 hover:bg-stone-100'}">${h.snacks ? '✓ Snacks row' : '+ Snacks row'}</button></form>
  </div>
</div>
${setupLeft > 0 ? `
<div data-dismiss-box="setup" class="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 print:hidden" hidden>
  <div class="flex items-start justify-between gap-2">
    <h2 class="font-semibold text-emerald-900">Get set up in ${setupLeft} step${setupLeft === 1 ? '' : 's'}</h2>
    <button type="button" data-dismiss="setup" aria-label="Hide setup guide" class="text-emerald-700 hover:text-emerald-900 -mt-1 px-1">✕</button>
  </div>
  <ol class="mt-2 space-y-1.5 text-sm text-emerald-800">
    ${setupSteps.map((s) => `<li class="flex items-baseline gap-2">
      <span aria-hidden="true" class="${s.done ? 'text-emerald-600' : 'text-emerald-400'}">${s.done ? '✓' : '○'}</span>
      <span>${s.done ? `<s class="text-emerald-600">${s.label}</s>` : s.href ? `<a class="font-medium underline" href="${s.href}">${s.label}</a>` : `<span class="font-medium">${s.label}</span>`}${s.done ? '' : ` <span class="text-emerald-700/80">— ${s.hint}</span>`}</span>
    </li>`).join('')}
  </ol>
</div>` : ''}
<div class="mb-4 flex flex-wrap gap-2 print:hidden">
  <form method="post" action="/app/plan/to-list" class="inline">
    <input type="hidden" name="from" value="${days[0]}"><input type="hidden" name="to" value="${days[6]}">
    <button class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">Add week's ingredients to grocery list</button>
  </form>
  <a href="/app/share" class="px-4 py-2 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-50">Share with family</a>
  <form method="post" action="/app/plan/copy-week" class="inline">
    <input type="hidden" name="week" value="${days[0]}">
    <button class="px-4 py-2 rounded-lg border border-stone-300 text-sm hover:bg-stone-100">Copy last week's plan</button>
  </form>
  ${days.some((d) => !entries.results.some((e) => e.date === d && e.meal === 'dinner')) ? `<form method="post" action="/app/ai/generate" class="inline">
    <input type="hidden" name="week" value="${days[0]}">
    <button data-ai-start data-busy-label="Drafting your week…" title="Drafts dinners from your own recipe box — you review the draft first; nothing is saved until you apply it. Up to ${AI_DAILY_PER_HOUSEHOLD} AI drafts a day." class="px-4 py-2 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-50">✨ Plan my week with AI<span data-new="ai-week" class="ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 align-middle" hidden>New</span></button>
  </form>` : ''}
  ${aiDown && days.some((d) => !entries.results.some((e) => e.date === d && e.meal === 'dinner')) ? `<span class="basis-full text-xs text-amber-700" role="status">AI drafting is having trouble right now — you can try anyway, or fill your week from your recipe box.</span>` : ''}
  ${recipes.results.length > 0 && days.some((d) => !entries.results.some((e) => e.date === d && e.meal === 'dinner')) ? `<form method="post" action="/app/plan/fill-week" class="inline">
    <input type="hidden" name="week" value="${days[0]}">
    <button class="px-4 py-2 rounded-lg border border-stone-300 text-sm hover:bg-stone-100">Fill empty dinners from recipe box</button>
  </form>` : ''}
  ${entries.results.length ? `<form method="post" action="/app/plan/clear-week" class="inline" data-confirm="Remove all ${entries.results.length} entr${entries.results.length === 1 ? 'y' : 'ies'} from this week? This can't be undone.">
    <input type="hidden" name="week" value="${days[0]}">
    <button class="px-4 py-2 rounded-lg border border-stone-300 text-sm text-stone-500 hover:text-red-600 hover:bg-stone-100">Clear week</button>
  </form>` : ''}
  ${days.some((d) => !entries.results.some((e) => e.date === d && e.meal === 'dinner')) ? `<p class="w-full text-xs text-stone-500">✨ The AI drafts dinners from your own recipe box — you review the draft and nothing is saved until you apply it. Stocked pantry items are skipped when the grocery list is built.</p>` : ''}
</div>
<div data-ai-overlay hidden class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4" role="status" aria-live="polite">
  <div class="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
    <div class="spinner mx-auto" aria-hidden="true"></div>
    <p data-ai-stage class="mt-4 font-semibold text-stone-800">Reading your recipe box…</p>
    <p class="mt-1.5 text-sm text-stone-500">Usually takes 10–25 seconds. Nothing is saved until you review and apply the draft.</p>
  </div>
</div>
<div class="mb-5 flex flex-wrap items-center gap-2 text-sm print:hidden">
  ${entries.results.length ? `<form method="post" action="/app/menus" class="flex gap-2">
    <input type="hidden" name="week" value="${days[0]}">
    <input name="name" required maxlength="60" aria-label="Menu name" autocomplete="off" placeholder="Save this week as menu…" class="rounded-lg border border-stone-300 px-3 py-1.5 w-52">
    <button class="rounded-lg border border-stone-300 px-3 py-1.5 hover:bg-stone-100">Save menu</button>
  </form>` : ''}
  ${menus.results.length ? `<form method="post" action="/app/menus/apply" class="flex gap-2">
    <input type="hidden" name="week" value="${days[0]}">
    <select name="menu_id" aria-label="Menu" class="rounded-lg border border-stone-300 px-2 py-1.5">
      ${menus.results.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}
    </select>
    <button class="rounded-lg bg-emerald-600 text-white font-semibold px-3 py-1.5 hover:bg-emerald-700">Apply menu</button>
  </form>` : ''}
  ${menus.results.length ? `<form method="post" action="/app/menus/delete" class="flex gap-2" data-confirm="Delete this saved menu?">
    <input type="hidden" name="week" value="${days[0]}">
    <select name="menu_id" aria-label="Menu" class="rounded-lg border border-stone-300 px-2 py-1.5">
      ${menus.results.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}
    </select>
    <button class="rounded-lg border border-stone-300 px-3 py-1.5 text-stone-500 hover:text-red-600 hover:bg-stone-100">Delete menu</button>
  </form>` : ''}
  ${menus.results.length ? `<a href="/app/menus" class="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100">View menus</a>` : ''}
</div>
<div class="planner-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
${days.map((d) => `
  <div${d === today() ? ' id="today"' : ''} class="rounded-xl ${d < today() ? 'bg-stone-100 print:bg-white' : 'bg-white'} border ${d === today() ? 'border-emerald-500 ring-1 ring-emerald-200 scroll-mt-20' : 'border-stone-200'} p-3">
    <h2 class="text-sm font-semibold ${d === today() ? 'text-emerald-700' : 'text-stone-700'}">${dayLabel(d)}</h2>
    ${mealsFor(h).map((meal) => {
      const es = entries.results.filter((e) => e.date === d && e.meal === meal);
      return `<div class="mt-2">
        <p class="text-[11px] uppercase tracking-wide text-stone-500">${meal}</p>
        ${es.map((e) => `
          <div class="mt-1 flex flex-wrap items-start justify-between gap-1 rounded-lg bg-stone-50 border border-stone-200 px-2 py-1.5 text-sm">
            <span class="min-w-[4rem] break-words">${e.recipe_id ? `<a class="text-emerald-700 hover:underline" href="/app/recipes/${e.recipe_id}">${esc(e.recipe_title)}</a>${e.scale && e.scale !== 1 ? ` <span class="text-xs text-stone-500 print:inline hidden">×${e.scale}</span>` : ''}` : esc(e.note)}${reactBadge(e.id)}</span>
            <span class="flex shrink-0 items-center gap-1 print:hidden">
              ${e.recipe_id ? `<form method="post" action="/app/plan/scale">
                <input type="hidden" name="id" value="${e.id}"><input type="hidden" name="week" value="${days[0]}">
                <select name="scale" data-autosubmit aria-label="Servings scale" title="×2 doubles this recipe's ingredients on your grocery list — the recipe itself stays as written." class="rounded border border-transparent hover:border-stone-300 bg-transparent text-xs tnum ${e.scale && e.scale !== 1 ? 'text-emerald-700 font-semibold' : 'text-stone-500'} px-0 py-0.5">
                  ${SCALES.map((s) => `<option value="${s}"${s === (e.scale || 1) ? ' selected' : ''}>×${s}</option>`).join('')}
                </select>
              </form>` : `<details class="relative">
                <summary aria-label="Edit note" title="Edit note" class="cursor-pointer list-none px-1 text-sm text-stone-300 hover:text-stone-500">✎</summary>
                <div class="absolute right-0 z-10 mt-1 w-56 rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
                  <form method="post" action="/app/plan/note" class="flex gap-1">
                    <input type="hidden" name="id" value="${e.id}"><input type="hidden" name="week" value="${days[0]}">
                    <input name="note" required value="${esc(e.note)}" maxlength="120" aria-label="Note text" autocomplete="off" class="min-w-0 flex-1 rounded border border-stone-300 px-2 py-1 text-xs">
                    <button class="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700">Save</button>
                  </form>
                </div>
              </details>`}
              <form method="post" action="/app/plan/move">
                <input type="hidden" name="id" value="${e.id}"><input type="hidden" name="week" value="${days[0]}">
                <select name="date" data-autosubmit aria-label="Move to another day" class="rounded border border-transparent hover:border-stone-300 bg-transparent text-xs text-stone-500 max-w-16 px-0 py-0.5">
                  <option value="" selected>Move…</option>
                  ${days.filter((d2) => d2 !== d).map((d2) => `<option value="${d2}">${dayLabel(d2).split(',')[0]}</option>`).join('')}
                  ${e.recipe_id ? '<option value="__leftovers">+ Leftovers next day</option>' : ''}
                </select>
              </form>
              <form method="post" action="/app/plan/delete"><input type="hidden" name="id" value="${e.id}"><input type="hidden" name="week" value="${days[0]}"><button aria-label="Remove" class="text-stone-500 hover:text-red-600">✕</button></form>
            </span>
          </div>`).join('')}
        <details class="mt-1 print:hidden">
          <summary class="text-xs text-stone-500 cursor-pointer hover:text-emerald-700">+ add</summary>
          <form method="post" action="/app/plan" class="mt-1 space-y-1">
            <input type="hidden" name="date" value="${d}"><input type="hidden" name="meal" value="${meal}"><input type="hidden" name="week" value="${days[0]}">
            ${recipes.results.length
              ? `<select name="recipe_id" aria-label="Recipe" class="w-full rounded border border-stone-300 text-sm px-1 py-1">
              <option value="">— pick recipe —</option>
              ${(() => { const opt = (r) => `<option value="${r.id}"${picked && r.id === picked.id ? ' selected' : ''}>${esc(r.title)}</option>`; const favs = recipes.results.filter((r) => r.favorite); const rest = recipes.results.filter((r) => !r.favorite); return favs.length ? `<optgroup label="★ Favourites">${favs.map(opt).join('')}</optgroup><optgroup label="All recipes">${rest.map(opt).join('')}</optgroup>` : recipes.results.map(opt).join(''); })()}
            </select>
            <select name="scale" class="w-full rounded border border-stone-300 text-sm px-1 py-1" aria-label="Servings scale">
              ${SCALES.map((s) => `<option value="${s}"${s === 1 ? ' selected' : ''}>${s === 1 ? 'Normal servings (×1)' : `Scale ingredients ×${s}`}</option>`).join('')}
            </select>`
              : `<p class="text-xs text-stone-500">No recipes yet — <a class="text-emerald-700 underline" href="/app/recipes">import one</a>, or just type a note:</p>`}
            <input name="note" aria-label="Note" autocomplete="off" placeholder="or type a note (e.g. Leftovers)" class="w-full rounded border border-stone-300 text-sm px-2 py-1">
            <button class="w-full rounded bg-emerald-600 text-white text-xs font-semibold py-1 hover:bg-emerald-700">Add</button>
          </form>
        </details>
      </div>`;
    }).join('')}
  </div>`).join('')}
</div>`;
  return c.html(page({ title: 'Weekly planner', body, user, path: '/app', noindex: true }));
});

app.post('/app/plan', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const date = String(f.date || '');
  const meal = String(f.meal || '');
  const recipeId = String(f.recipe_id || '') || null;
  const note = clip(String(f.note || '').trim(), 120) || null;
  const scale = SCALES.includes(Number(f.scale)) ? Number(f.scale) : 1;
  if (recipeId) {
    const owned = await c.env.DB.prepare('SELECT id FROM recipes WHERE id = ? AND household_id = ?').bind(recipeId, h.id).first();
    if (!owned) return c.redirect(`/app?week=${f.week || ''}`);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date) && mealsFor(h).includes(meal) && (recipeId || note)) {
    await c.env.DB.prepare('INSERT INTO plan_entries (id, household_id, date, meal, recipe_id, note, scale) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(uid(), h.id, date, meal, recipeId, note, recipeId ? scale : 1).run();
    await bumpVersion(c.env, h.id);
  }
  return c.redirect(`/app?week=${f.week || ''}`);
});

app.post('/app/plan/delete', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  await c.env.DB.prepare('DELETE FROM plan_reactions WHERE plan_entry_id IN (SELECT id FROM plan_entries WHERE id = ? AND household_id = ?)').bind(String(f.id || ''), h.id).run();
  await c.env.DB.prepare('DELETE FROM plan_entries WHERE id = ? AND household_id = ?').bind(String(f.id || ''), h.id).run();
  await bumpVersion(c.env, h.id);
  return c.redirect(`/app?week=${f.week || ''}`);
});

app.post('/app/plan/note', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const note = clip(String(f.note || '').trim(), 120);
  if (note) {
    await c.env.DB.prepare('UPDATE plan_entries SET note = ? WHERE id = ? AND household_id = ? AND recipe_id IS NULL')
      .bind(note, String(f.id || ''), h.id).run();
    await bumpVersion(c.env, h.id);
  }
  return c.redirect(`/app?week=${f.week || ''}`);
});

app.post('/app/plan/scale', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const scale = Number(f.scale);
  if (SCALES.includes(scale)) {
    await c.env.DB.prepare('UPDATE plan_entries SET scale = ? WHERE id = ? AND household_id = ? AND recipe_id IS NOT NULL')
      .bind(scale, String(f.id || ''), h.id).run();
    await bumpVersion(c.env, h.id);
  }
  return c.redirect(`/app?week=${f.week || ''}`);
});

app.post('/app/plan/move', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const date = String(f.date || '');
  if (date === '__leftovers') {
    const entry = await c.env.DB.prepare(
      'SELECT p.date, p.meal, r.title FROM plan_entries p JOIN recipes r ON r.id = p.recipe_id WHERE p.id = ? AND p.household_id = ?'
    ).bind(String(f.id || ''), h.id).first();
    if (entry) {
      await c.env.DB.prepare('INSERT INTO plan_entries (id, household_id, date, meal, recipe_id, note, scale) VALUES (?, ?, ?, ?, NULL, ?, 1)')
        .bind(uid(), h.id, shiftDays(entry.date, 1), entry.meal, `Leftovers: ${entry.title}`.slice(0, 120)).run();
      await bumpVersion(c.env, h.id);
    }
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    await c.env.DB.prepare('UPDATE plan_entries SET date = ? WHERE id = ? AND household_id = ?')
      .bind(date, String(f.id || ''), h.id).run();
    await bumpVersion(c.env, h.id);
  }
  return c.redirect(`/app?week=${f.week || ''}`);
});

app.post('/app/plan/clear-week', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const week = String(f.week || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) return c.redirect('/app');
  const days = weekDates(week);
  await c.env.DB.prepare('DELETE FROM plan_reactions WHERE plan_entry_id IN (SELECT id FROM plan_entries WHERE household_id = ? AND date BETWEEN ? AND ?)')
    .bind(h.id, days[0], days[6]).run();
  await c.env.DB.prepare('DELETE FROM plan_entries WHERE household_id = ? AND date BETWEEN ? AND ?')
    .bind(h.id, days[0], days[6]).run();
  await bumpVersion(c.env, h.id);
  return c.redirect(`/app?week=${week}`);
});

app.post('/app/plan/copy-week', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const week = String(f.week || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) return c.redirect('/app');
  const days = weekDates(week);
  const prevDays = weekDates(shiftDays(week, -7));
  const [prev, current] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM plan_entries WHERE household_id = ? AND date BETWEEN ? AND ?')
      .bind(h.id, prevDays[0], prevDays[6]).all(),
    c.env.DB.prepare('SELECT date, meal FROM plan_entries WHERE household_id = ? AND date BETWEEN ? AND ?')
      .bind(h.id, days[0], days[6]).all(),
  ]);
  const occupied = new Set(current.results.map((e) => `${e.date}|${e.meal}`));
  const stmts = prev.results
    .filter((e) => !occupied.has(`${days[prevDays.indexOf(e.date)]}|${e.meal}`))
    .map((e) =>
      c.env.DB.prepare('INSERT INTO plan_entries (id, household_id, date, meal, recipe_id, note, scale) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(uid(), h.id, days[prevDays.indexOf(e.date)], e.meal, e.recipe_id, e.note, e.scale)
    );
  if (stmts.length) {
    await c.env.DB.batch(stmts);
    await bumpVersion(c.env, h.id);
  }
  return c.redirect(`/app?week=${week}`);
});

app.post('/app/plan/fill-week', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const days = weekDates(String(f.week || ''));
  const existing = await c.env.DB.prepare("SELECT DISTINCT date FROM plan_entries WHERE household_id = ? AND meal = 'dinner' AND date BETWEEN ? AND ?")
    .bind(h.id, days[0], days[6]).all();
  const planned = new Set(existing.results.map((r) => r.date));
  const empty = days.filter((d) => !planned.has(d));
  if (empty.length === 0) return c.redirect(`/app?week=${days[0]}`);
  const [recipes, recent] = await Promise.all([
    c.env.DB.prepare('SELECT id FROM recipes WHERE household_id = ? ORDER BY favorite DESC, created_at DESC LIMIT 100').bind(h.id).all(),
    c.env.DB.prepare('SELECT DISTINCT recipe_id FROM plan_entries WHERE household_id = ? AND recipe_id IS NOT NULL AND date BETWEEN ? AND ?')
      .bind(h.id, shiftDays(days[0], -14), shiftDays(days[0], -1)).all(),
  ]);
  if (recipes.results.length === 0) return c.redirect(`/app?week=${days[0]}`);
  const recentIds = new Set(recent.results.map((r) => r.recipe_id));
  // Rotate: prefer recipes not planned in the previous two weeks.
  const fresh = recipes.results.filter((r) => !recentIds.has(r.id));
  const pool = fresh.length >= 4 ? fresh : recipes.results;
  const bytes = crypto.getRandomValues(new Uint32Array(pool.length));
  const shuffled = pool.map((r, i) => [bytes[i], r]).sort((a, b) => a[0] - b[0]).map(([, r]) => r);
  const stmts = empty.map((d, i) =>
    c.env.DB.prepare('INSERT INTO plan_entries (id, household_id, date, meal, recipe_id, note, scale) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(uid(), h.id, d, 'dinner', shuffled[i % shuffled.length].id, '', 1)
  );
  await c.env.DB.batch(stmts);
  await bumpVersion(c.env, h.id);
  return c.redirect(`/app?week=${days[0]}`);
});

// ---------- AI week drafting ----------
const draftKey = (hid) => `aidraft:${hid}`;

app.post('/app/recipes/starters', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const f = await c.req.parseBody();
  const week = weekDates(String(f.week || ''))[0];
  const existing = await c.env.DB.prepare('SELECT title FROM recipes WHERE household_id = ?').bind(h.id).all();
  const have = new Set(existing.results.map((r) => r.title.toLowerCase()));
  const stmts = STARTER_RECIPES.filter((r) => !have.has(r.title.toLowerCase())).map((r) =>
    c.env.DB.prepare('INSERT INTO recipes (id, household_id, title, description, prep_minutes, cook_minutes, servings, ingredients_json, steps_json, tags, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(uid(), h.id, r.title, r.description, r.prep, r.cook, r.servings, JSON.stringify(r.ingredients), JSON.stringify(r.steps), r.tags, user.id)
  );
  if (stmts.length) {
    await c.env.DB.batch(stmts);
    await bumpVersion(c.env, h.id);
  }
  return c.redirect(`/app?week=${week}&ai=starters`);
});

app.post('/app/ai/generate', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const days = weekDates(String(f.week || ''));
  try {
    const [recipes, recent] = await Promise.all([
      c.env.DB.prepare('SELECT id, title, tags, favorite FROM recipes WHERE household_id = ? ORDER BY favorite DESC, created_at DESC LIMIT 100').bind(h.id).all(),
      c.env.DB.prepare('SELECT DISTINCT r.title FROM plan_entries p JOIN recipes r ON r.id = p.recipe_id WHERE p.household_id = ? AND p.date BETWEEN ? AND ?')
        .bind(h.id, shiftDays(days[0], -14), shiftDays(days[0], -1)).all(),
    ]);
    if (recipes.results.length < 3) return c.redirect(`/app?week=${days[0]}&ai=fewbox`);
    // Cost gate for the LLM call: per-household and per-IP daily caps (same KV
    // counter pattern as the outbound-email gate in auth.js).
    const ip = c.req.header('cf-connecting-ip') || '';
    const hKey = `rl:ai:${today()}:${h.id}`;
    const iKey = ip ? `rl:ai:${today()}:ip:${ip}` : null;
    const gKey = `rl:ai:${today()}:all`;
    const [hN, iN, gN] = await Promise.all([c.env.KV.get(hKey), iKey ? c.env.KV.get(iKey) : null, c.env.KV.get(gKey)]);
    if (
      parseInt(hN || '0', 10) >= AI_DAILY_PER_HOUSEHOLD ||
      (iKey && parseInt(iN || '0', 10) >= AI_DAILY_PER_IP) ||
      parseInt(gN || '0', 10) >= AI_DAILY_GLOBAL
    ) {
      return c.redirect(`/app?week=${days[0]}&ai=limit`);
    }
    await Promise.all([
      c.env.KV.put(hKey, String(parseInt(hN || '0', 10) + 1), { expirationTtl: 60 * 60 * 24 }),
      iKey ? c.env.KV.put(iKey, String(parseInt(iN || '0', 10) + 1), { expirationTtl: 60 * 60 * 24 }) : null,
      c.env.KV.put(gKey, String(parseInt(gN || '0', 10) + 1), { expirationTtl: 60 * 60 * 24 }),
    ]);
    const draft = await generateWeekDraft(c.env, {
      recipes: recipes.results,
      avoidTitles: recent.results.map((r) => r.title).slice(0, 30),
      dayLabels: days.map(dayLabel),
    });
    draft.week_start = days[0];
    await Promise.all([
      c.env.KV.put(draftKey(h.id), JSON.stringify(draft), { expirationTtl: 3600 }),
      c.env.KV.delete('ai:unavailable'),
    ]);
    return c.redirect('/app/ai');
  } catch (err) {
    console.error('AI generate failed:', err instanceof Error ? err.message : String(err));
    await c.env.KV.put('ai:unavailable', '1', { expirationTtl: 300 });
    return c.redirect(`/app?week=${days[0]}&ai=err${f.retry ? '&retried=1' : ''}`);
  }
});

async function loadDraft(c, h) {
  const raw = await c.env.KV.get(draftKey(h.id));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

app.get('/app/ai', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const draft = await loadDraft(c, h);
  if (!draft) return c.redirect('/app');
  const days = weekDates(draft.week_start);
  const ids = [...new Set(draft.week.concat(draft.alternates || []).map((p) => p.recipe_id).filter(Boolean))];
  const titles = new Map();
  if (ids.length) {
    const rows = await c.env.DB.prepare(`SELECT id, title FROM recipes WHERE household_id = ? AND id IN (${ids.map(() => '?').join(',')})`).bind(h.id, ...ids).all();
    for (const r of rows.results) titles.set(r.id, r.title);
  }
  const existing = await c.env.DB.prepare("SELECT date FROM plan_entries WHERE household_id = ? AND meal = 'dinner' AND date BETWEEN ? AND ?").bind(h.id, days[0], days[6]).all();
  const occupied = new Set(existing.results.map((r) => r.date));
  const body = `
<h1 class="text-2xl font-bold mb-1">Your AI week draft</h1>
<p class="text-sm text-stone-500 mb-5">Dinners for the week of ${dayLabel(days[0])}. Swap any day, then apply — days that already have a dinner planned are kept as-is. Nothing is saved until you apply.</p>
<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 mb-6">
${days.map((d, i) => {
    const p = draft.week[i];
    const isNew = !!p.new;
    const title = isNew ? p.new.title : (titles.get(p.recipe_id) || 'Unknown recipe');
    return `
  <div class="rounded-xl ${occupied.has(d) ? 'bg-stone-100 border-stone-200' : 'bg-white border-emerald-200'} border p-3">
    <h2 class="text-sm font-semibold text-stone-700">${dayLabel(d)}</h2>
    ${occupied.has(d) ? `<p class="mt-2 text-xs text-stone-500">Already planned — kept as-is.</p>` : `
    <p class="mt-2 text-sm ${isNew ? '' : 'text-emerald-800'}">${esc(title)}</p>
    ${isNew ? `<span class="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">New recipe — will be added to your box</span>
    <details class="mt-1"><summary class="cursor-pointer text-xs text-stone-500 hover:text-emerald-700">Ingredients (${p.new.ingredients.length})</summary>
      <ul class="mt-1 space-y-0.5 text-xs text-stone-600">${p.new.ingredients.slice(0, 12).map((x) => `<li>• ${esc(x)}</li>`).join('')}</ul>
    </details>` : `<span class="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">From your recipe box</span>`}
    ${(draft.alternates || []).length ? `<form method="post" action="/app/ai/swap" class="mt-2">
      <input type="hidden" name="day" value="${i}">
      <button class="rounded-lg border border-stone-300 px-2.5 py-1 text-xs hover:bg-stone-100">↻ Swap</button>
    </form>` : ''}`}
  </div>`;
  }).join('')}
</div>
<div class="flex flex-wrap gap-2">
  <form method="post" action="/app/ai/apply"><button class="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">Apply to my week</button></form>
  <form method="post" action="/app/ai/discard"><button class="rounded-lg border border-stone-300 px-5 py-2.5 text-sm text-stone-600 hover:bg-stone-100">Discard draft</button></form>
</div>`;
  return c.html(page({ title: 'AI week draft', body, user, path: '/app', noindex: true }));
});

app.post('/app/ai/swap', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const i = Number(f.day);
  const draft = await loadDraft(c, h);
  if (draft && Number.isInteger(i) && i >= 0 && i < 7 && (draft.alternates || []).length) {
    const next = draft.alternates.shift();
    draft.alternates.push(draft.week[i]);
    draft.week[i] = next;
    await c.env.KV.put(draftKey(h.id), JSON.stringify(draft), { expirationTtl: 3600 });
  }
  return c.redirect('/app/ai');
});

app.post('/app/ai/discard', async (c) => {
  const h = c.get('household');
  await c.env.KV.delete(draftKey(h.id));
  return c.redirect('/app');
});

app.post('/app/ai/apply', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const draft = await loadDraft(c, h);
  if (!draft) return c.redirect('/app');
  const days = weekDates(draft.week_start);
  const existing = await c.env.DB.prepare("SELECT date FROM plan_entries WHERE household_id = ? AND meal = 'dinner' AND date BETWEEN ? AND ?").bind(h.id, days[0], days[6]).all();
  const occupied = new Set(existing.results.map((r) => r.date));
  const owned = await c.env.DB.prepare('SELECT id FROM recipes WHERE household_id = ?').bind(h.id).all();
  const ownedIds = new Set(owned.results.map((r) => r.id));
  const stmts = [];
  for (let i = 0; i < 7; i++) {
    const d = days[i];
    if (occupied.has(d)) continue;
    const p = draft.week[i];
    let recipeId = null;
    if (p.new) {
      recipeId = uid();
      stmts.push(c.env.DB.prepare('INSERT INTO recipes (id, household_id, title, ingredients_json, steps_json, created_by, tags) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(recipeId, h.id, clip(p.new.title, 200), JSON.stringify(p.new.ingredients), JSON.stringify(p.new.steps), user.id, 'ai-suggested'));
    } else if (ownedIds.has(p.recipe_id)) {
      recipeId = p.recipe_id;
    } else {
      continue;
    }
    stmts.push(c.env.DB.prepare("INSERT INTO plan_entries (id, household_id, date, meal, recipe_id, note, scale) VALUES (?, ?, ?, 'dinner', ?, '', 1)")
      .bind(uid(), h.id, d, recipeId));
  }
  if (stmts.length) {
    await c.env.DB.batch(stmts);
    await bumpVersion(c.env, h.id);
  }
  await c.env.KV.delete(draftKey(h.id));
  return c.redirect(`/app?week=${days[0]}`);
});

app.post('/app/menus', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const week = String(f.week || '');
  const name = String(f.name || '').trim().slice(0, 60);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week) || !name) return c.redirect('/app');
  const days = weekDates(week);
  const entries = await c.env.DB.prepare('SELECT * FROM plan_entries WHERE household_id = ? AND date BETWEEN ? AND ?')
    .bind(h.id, days[0], days[6]).all();
  if (!entries.results.length) return c.redirect(`/app?week=${week}`);
  const menuId = uid();
  const stmts = [c.env.DB.prepare('INSERT INTO menus (id, household_id, name) VALUES (?, ?, ?)').bind(menuId, h.id, name)];
  for (const e of entries.results) {
    stmts.push(c.env.DB.prepare('INSERT INTO menu_entries (id, menu_id, dow, meal, recipe_id, note, scale) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(uid(), menuId, days.indexOf(e.date), e.meal, e.recipe_id, e.note, e.scale));
  }
  await c.env.DB.batch(stmts);
  return c.redirect(`/app?week=${week}`);
});

const DOW_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

app.get('/app/menus', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const [menus, entries] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM menus WHERE household_id = ? ORDER BY created_at DESC LIMIT 50').bind(h.id).all(),
    c.env.DB.prepare(`SELECT me.menu_id, me.dow, me.meal, me.note, me.scale, r.title FROM menu_entries me\n      JOIN menus m ON m.id = me.menu_id LEFT JOIN recipes r ON r.id = me.recipe_id WHERE m.household_id = ?`).bind(h.id).all(),
  ]);
  const meals = mealsFor(h);
  const mealRank = (meal) => { const i = meals.indexOf(meal); return i === -1 ? meals.length : i; };
  const byMenu = new Map();
  for (const e of entries.results) {
    const list = byMenu.get(e.menu_id) || [];
    list.push(e);
    byMenu.set(e.menu_id, list);
  }
  const body = `<div class="max-w-3xl">
<div class="flex flex-wrap items-center justify-between gap-3 mb-2">
  <h1 class="text-2xl font-bold">Saved menus</h1>
  <span class="flex items-center gap-3 print:hidden">
    <button type="button" data-print class="text-sm text-emerald-700 underline">Print</button>
    <a href="/app" class="text-sm text-emerald-700 underline">Back to planner</a>
  </span>
</div>
<p class="text-sm text-stone-600 mb-5 print:hidden">Reusable week plans — apply one to any empty slots from the planner.</p>
${menus.results.length === 0 ? `<p class="text-stone-500 text-sm">No saved menus yet — plan a week, then use “Save this week as menu” on the planner.</p>` : menus.results.map((m) => {
  const list = (byMenu.get(m.id) || []).sort((a, b) => a.dow - b.dow || mealRank(a.meal) - mealRank(b.meal));
  const byDow = new Map();
  for (const e of list) {
    const d = byDow.get(e.dow) || [];
    d.push(e);
    byDow.set(e.dow, d);
  }
  return `<section class="rounded-xl bg-white border border-stone-200 p-4 mb-4">
  <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
    <h2 class="text-lg font-bold break-words min-w-0 max-w-full">${esc(m.name)}</h2>
    <span class="flex items-center gap-2 print:hidden">
      <form method="post" action="/app/menus/rename" class="flex gap-1.5">
        <input type="hidden" name="menu_id" value="${m.id}">
        <input name="name" required maxlength="60" aria-label="Rename ${esc(m.name)}" placeholder="New name…" autocomplete="off" class="rounded border border-stone-300 text-xs px-2 py-1 w-32">
        <button class="rounded border border-stone-300 text-xs px-2 py-1 hover:bg-stone-100">Rename</button>
      </form>
      <form method="post" action="/app/menus/duplicate">
        <input type="hidden" name="menu_id" value="${m.id}">
        <button aria-label="Duplicate ${esc(m.name)}" class="rounded border border-stone-300 text-xs px-2 py-1 hover:bg-stone-100">Duplicate</button>
      </form>
      <form method="post" action="/app/menus/delete" data-confirm="Delete this saved menu?">
        <input type="hidden" name="menu_id" value="${m.id}">
        <input type="hidden" name="back" value="/app/menus">
        <button aria-label="Delete ${esc(m.name)}" class="text-stone-500 hover:text-red-600 text-sm">✕</button>
      </form>
    </span>
  </div>
  <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
    ${[0, 1, 2, 3, 4, 5, 6].filter((d) => byDow.has(d)).map((d) => `<div class="rounded-lg border border-stone-100 bg-stone-50 p-2">
      <h3 class="text-xs uppercase tracking-wide font-semibold text-stone-500 mb-1">${DOW_LABELS[d]}</h3>
      <ul class="space-y-0.5">${byDow.get(d).map((e) => `<li><span class="text-xs text-stone-400 capitalize">${esc(e.meal)}:</span> ${esc(e.title || e.note || '')}${e.scale && e.scale !== 1 ? ` <span class="text-xs text-stone-400">×${e.scale}</span>` : ''}</li>`).join('')}</ul>
    </div>`).join('')}
  </div>
</section>`;
}).join('')}
</div>`;
  return c.html(page({ title: 'Saved menus', body, user, path: '/app/menus', noindex: true }));
});

app.post('/app/menus/duplicate', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const menu = await c.env.DB.prepare('SELECT id, name FROM menus WHERE id = ? AND household_id = ?').bind(String(f.menu_id || ''), h.id).first();
  if (menu) {
    const entries = await c.env.DB.prepare('SELECT dow, meal, recipe_id, note, scale FROM menu_entries WHERE menu_id = ?').bind(menu.id).all();
    const copyId = uid();
    const name = copyName(menu.name);
    const stmts = [c.env.DB.prepare('INSERT INTO menus (id, household_id, name) VALUES (?, ?, ?)').bind(copyId, h.id, name)];
    for (const e of entries.results) {
      stmts.push(c.env.DB.prepare('INSERT INTO menu_entries (id, menu_id, dow, meal, recipe_id, note, scale) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(uid(), copyId, e.dow, e.meal, e.recipe_id, e.note, e.scale));
    }
    await c.env.DB.batch(stmts);
  }
  return c.redirect('/app/menus');
});

app.post('/app/menus/rename', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const name = String(f.name || '').trim().slice(0, 60);
  if (name) {
    await c.env.DB.prepare('UPDATE menus SET name = ? WHERE id = ? AND household_id = ?')
      .bind(name, String(f.menu_id || ''), h.id).run();
  }
  return c.redirect('/app/menus');
});

app.post('/app/menus/apply', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const week = String(f.week || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) return c.redirect('/app');
  const menu = await c.env.DB.prepare('SELECT id FROM menus WHERE id = ? AND household_id = ?').bind(String(f.menu_id || ''), h.id).first();
  if (!menu) return c.redirect(`/app?week=${week}`);
  const days = weekDates(week);
  const [entries, current] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM menu_entries WHERE menu_id = ?').bind(menu.id).all(),
    c.env.DB.prepare('SELECT date, meal FROM plan_entries WHERE household_id = ? AND date BETWEEN ? AND ?')
      .bind(h.id, days[0], days[6]).all(),
  ]);
  const occupied = new Set(current.results.map((e) => `${e.date}|${e.meal}`));
  const stmts = entries.results
    .filter((e) => e.dow >= 0 && e.dow <= 6 && !occupied.has(`${days[e.dow]}|${e.meal}`))
    .map((e) => c.env.DB.prepare('INSERT INTO plan_entries (id, household_id, date, meal, recipe_id, note, scale) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(uid(), h.id, days[e.dow], e.meal, e.recipe_id, e.note, e.scale));
  if (stmts.length) {
    await c.env.DB.batch(stmts);
    await bumpVersion(c.env, h.id);
  }
  return c.redirect(`/app?week=${week}`);
});

app.post('/app/menus/delete', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const menu = await c.env.DB.prepare('SELECT id FROM menus WHERE id = ? AND household_id = ?').bind(String(f.menu_id || ''), h.id).first();
  if (menu) {
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM menu_entries WHERE menu_id = ?').bind(menu.id),
      c.env.DB.prepare('DELETE FROM menus WHERE id = ?').bind(menu.id),
    ]);
  }
  return c.redirect(String(f.back || '') === '/app/menus' ? '/app/menus' : `/app?week=${String(f.week || '')}`);
});

app.post('/app/plan/to-list', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const rows = await c.env.DB.prepare(
    `SELECT r.id, r.title, r.ingredients_json, MAX(p.scale) AS scale FROM plan_entries p JOIN recipes r ON r.id = p.recipe_id
     WHERE p.household_id = ? AND p.date BETWEEN ? AND ? GROUP BY r.id`
  ).bind(h.id, String(f.from || ''), String(f.to || '')).all();
  // Merge duplicate ingredients across recipes (summing quantities). Existing
  // list items matching by normalized key are updated (unchecked) or kept
  // (checked) instead of duplicated, so the button stays idempotent even when
  // scales change between clicks.
  const labels = [];
  const sourcesByKey = new Map();
  for (const row of rows.results) {
    for (const ing of JSON.parse(row.ingredients_json || '[]')) {
      const label = String(ing).slice(0, 200);
      if (!label || isIngredientHeading(label)) continue;
      const scaled = scaleIngredient(label, row.scale);
      labels.push(scaled);
      const key = ingredientKey(scaled);
      const set = sourcesByKey.get(key) || new Set();
      set.add(row.title);
      sourcesByKey.set(key, set);
    }
  }
  const merged = mergeIngredients(labels);
  const [staples, pantry] = await Promise.all([
    c.env.DB.prepare('SELECT label, category FROM staples WHERE household_id = ?').bind(h.id).all(),
    c.env.DB.prepare("SELECT label FROM pantry_items WHERE household_id = ? AND level = 'stocked'").bind(h.id).all(),
  ]);
  const stapleCats = new Map(staples.results.map((s) => [ingredientKey(s.label), s.category]));
  for (const s of staples.results) if (!merged.some((m) => m.toLowerCase() === s.label.toLowerCase())) merged.push(s.label);
  const stockedKeys = new Set(pantry.results.map((p) => pantryKey(p.label)));
  const existing = await c.env.DB.prepare('SELECT id, label, checked, sources FROM shopping_items WHERE household_id = ?').bind(h.id).all();
  const byKey = new Map();
  for (const r of existing.results) if (!byKey.has(ingredientKey(r.label))) byKey.set(ingredientKey(r.label), r);
  const existingNames = new Set(existing.results.map((r) => pantryKey(r.label)));
  const stmts = [];
  let added = 0;
  let skipped = 0;
  const seen = new Set();
  for (const label of merged) {
    const key = ingredientKey(label);
    if (seen.has(key)) continue;
    seen.add(key);
    if (stockedKeys.has(pantryKey(label)) && !existingNames.has(pantryKey(label))) {
      skipped++;
      continue;
    }
    const sources = [...(sourcesByKey.get(key) || [])].sort((x, y) => x.localeCompare(y)).join(', ').slice(0, 200);
    const hit = byKey.get(key);
    if (hit) {
      if (!hit.checked && (hit.label !== label || (hit.sources || '') !== sources)) {
        stmts.push(c.env.DB.prepare('UPDATE shopping_items SET label = ?, sources = ? WHERE id = ?').bind(label, sources, hit.id));
      }
      continue;
    }
    added++;
    stmts.push(
      c.env.DB.prepare('INSERT INTO shopping_items (id, household_id, label, category, sources) VALUES (?, ?, ?, ?, ?)')
        .bind(uid(), h.id, label, stapleCats.get(key) || categorize(label), sources)
    );
  }
  for (const r of existing.results) {
    if (!r.checked && r.sources && !seen.has(ingredientKey(r.label))) {
      stmts.push(c.env.DB.prepare("UPDATE shopping_items SET sources = '' WHERE id = ?").bind(r.id));
    }
  }
  if (stmts.length) await c.env.DB.batch(stmts);
  await bumpVersion(c.env, h.id);
  return c.redirect(`/app/list?added=${added}${skipped ? `&pantry=${skipped}` : ''}`);
});

function shiftDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function dayLabel(d) {
  const dt = new Date(d + 'T00:00:00Z');
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

// ---------- month view ----------
app.get('/app/month', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const qm = String(c.req.query('month') || '');
  const base = /^\d{4}-(0[1-9]|1[0-2])$/.test(qm) ? qm : today().slice(0, 7);
  const [y, m] = base.split('-').map(Number);
  const firstDay = `${base}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  const gridStart = weekDates(firstDay)[0];
  const gridEnd = weekDates(lastDay)[6];
  const entries = await c.env.DB.prepare(
    `SELECT p.date, p.meal, p.note, p.scale, r.title FROM plan_entries p LEFT JOIN recipes r ON r.id = p.recipe_id
     WHERE p.household_id = ? AND p.date BETWEEN ? AND ? ORDER BY p.date, p.meal`
  ).bind(h.id, gridStart, gridEnd).all();
  const byDate = new Map();
  for (const e of entries.results) {
    const label = e.title ? `${e.title}${e.scale && e.scale !== 1 ? ` \u00d7${e.scale}` : ''}` : (e.note || '');
    if (!label) continue;
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date).push(label);
  }
  const days = [];
  for (let d = gridStart; d <= gridEnd; d = shiftDays(d, 1)) days.push(d);
  const monthName = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const prevM = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);
  const nextM = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
  const t = today();
  const body = `
<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
  <h1 class="text-2xl font-bold">${monthName}</h1>
  <div class="flex items-center gap-2 text-sm print:hidden">
    <a href="/app/month?month=${prevM}" class="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100">← Prev</a>
    <a href="/app/month" class="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100">This month</a>
    <a href="/app/month?month=${nextM}" class="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100">Next →</a>
    <a href="/app" class="px-3 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 hover:bg-emerald-50">Week view</a>
  </div>
</div>
<div class="hidden sm:grid grid-cols-7 gap-1 text-center text-xs font-semibold text-stone-500 mb-1">
  ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<div>${d}</div>`).join('')}
</div>
<div class="grid sm:grid-cols-7 gap-1">
  ${days.map((d) => {
    const inMonth = d.slice(0, 7) === base;
    const labels = byDate.get(d) || [];
    const shown = labels.slice(0, 3);
    return `
  <a href="/app?week=${weekDates(d)[0]}" class="block min-h-20 rounded-lg border p-1.5 text-left hover:border-emerald-400 ${d === t ? 'border-emerald-600 ring-1 ring-emerald-600' : 'border-stone-200'} ${inMonth ? 'bg-white' : 'bg-stone-100'} ${!inMonth && !labels.length ? 'hidden sm:block' : ''}">
    <span class="text-xs font-semibold ${d === t ? 'text-emerald-700' : 'text-stone-500'}"><span class="sm:hidden">${dayLabel(d)}</span><span class="hidden sm:inline">${Number(d.slice(8))}</span></span>
    <span class="mt-0.5 block space-y-0.5">
      ${shown.map((l) => `<span class="block truncate rounded bg-emerald-50 px-1 py-0.5 text-[11px] leading-4 text-emerald-900">${esc(l)}</span>`).join('')}
      ${labels.length > 3 ? `<span class="block px-1 text-[11px] text-stone-500">+${labels.length - 3} more</span>` : ''}
    </span>
  </a>`;
  }).join('')}
</div>
<p class="mt-4 text-sm text-stone-500">Tap any day to open that week in the planner.</p>`;
  return c.html(page({ title: `Month — ${monthName}`, body, user, path: '/app', noindex: true }));
});

// ---------- recipes ----------
app.get('/app/recipes', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const err = c.req.query('err');
  const q = String(c.req.query('q') || '').trim().slice(0, 100);
  const tag = normalizeTag(String(c.req.query('tag') || ''));
  const fav = c.req.query('fav') === '1';
  const sort = ['title', 'planned'].includes(c.req.query('sort')) ? c.req.query('sort') : 'newest';
  const order = sort === 'title' ? 'favorite DESC, title COLLATE NOCASE ASC'
    : sort === 'planned' ? "favorite DESC, (SELECT COUNT(*) FROM plan_entries p WHERE p.recipe_id = recipes.id AND p.date <= date('now')) DESC, created_at DESC"
    : 'favorite DESC, created_at DESC';
  if (q) {
    // Aggregate search terms (no user/household attribution) to learn what people look for.
    const term = q.toLowerCase().slice(0, 60);
    c.executionCtx.waitUntil(
      c.env.DB.prepare('INSERT INTO search_terms (day, term, count) VALUES (?, ?, 1) ON CONFLICT(day, term) DO UPDATE SET count = count + 1')
        .bind(today(), term).run()
    );
  }
  const recipes = q
    ? await c.env.DB.prepare(`SELECT * FROM recipes WHERE household_id = ? AND (title LIKE ? OR ingredients_json LIKE ?) ORDER BY (title LIKE ?) DESC, ${order}`)
        .bind(h.id, `%${q}%`, `%${q}%`, `%${q}%`).all()
    : tag
      ? await c.env.DB.prepare(`SELECT * FROM recipes WHERE household_id = ? AND (',' || tags || ',') LIKE ? ORDER BY ${order}`)
          .bind(h.id, `%,${tag},%`).all()
      : fav
        ? await c.env.DB.prepare(`SELECT * FROM recipes WHERE household_id = ? AND favorite = 1 ORDER BY ${order}`).bind(h.id).all()
        : await c.env.DB.prepare(`SELECT * FROM recipes WHERE household_id = ? ORDER BY ${order}`).bind(h.id).all();
  const allTags = await c.env.DB.prepare('SELECT tags FROM recipes WHERE household_id = ? AND tags != \'\'').bind(h.id).all();
  const anyFav = await c.env.DB.prepare('SELECT 1 FROM recipes WHERE household_id = ? AND favorite = 1 LIMIT 1').bind(h.id).first();
  const wk = weekDates(today());
  const plannedRows = await c.env.DB.prepare('SELECT DISTINCT recipe_id FROM plan_entries WHERE household_id = ? AND recipe_id IS NOT NULL AND date BETWEEN ? AND ?')
    .bind(h.id, wk[0], wk[6]).all();
  const planned = new Set(plannedRows.results.map((r) => r.recipe_id));
  const tagSet = [...new Set(allTags.results.flatMap((r) => r.tags.split(',')).filter(Boolean))].sort();
  const body = `
<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
  <h1 class="text-2xl font-bold">Recipes</h1>
  <div class="flex flex-wrap items-center gap-2">
    <form method="get" action="/app/recipes" class="flex gap-2">
      ${sort !== 'newest' ? `<input type="hidden" name="sort" value="${sort}">` : ''}
      <input type="search" name="q" aria-label="Search recipes" value="${esc(q)}" placeholder="Search title or ingredient…" class="rounded-lg border border-stone-300 px-3 py-1.5 text-sm w-56">
      <button class="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100">Search</button>
    </form>
    ${(() => { const p = new URLSearchParams(); if (q) p.set('q', q); if (tag) p.set('tag', tag); if (fav) p.set('fav', '1'); const base = p.toString(); const link = (s, label) => sort === s ? `<span aria-current="true" class="px-2 py-1 rounded-md bg-stone-200 text-stone-700 font-medium">${label}</span>` : `<a href="/app/recipes?${base ? base + '&' : ''}${s === 'newest' ? '' : `sort=${s}`}" class="px-2 py-1 rounded-md text-stone-500 hover:bg-stone-100">${label}</a>`; return `<span class="flex items-center gap-0.5 text-xs" role="group" aria-label="Sort recipes">${link('newest', 'Newest')}${link('title', 'A–Z')}${link('planned', 'Most planned')}</span>`; })()}
  </div>
</div>
${err ? `<p role="alert" class="mb-3 text-sm rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2">${esc(err)}</p>` : ''}
${/^\d+$/.test(String(c.req.query('imported') || '')) ? `<p role="status" class="mb-3 text-sm rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2">Imported ${Number(c.req.query('imported'))} recipe${Number(c.req.query('imported')) === 1 ? '' : 's'} from your file.</p>` : ''}
${tagSet.length || anyFav ? `<div class="flex flex-wrap gap-1.5 mb-4">
  ${tag || fav ? `<a href="/app/recipes" class="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-200 text-stone-700 hover:bg-stone-300">✕ Clear filter</a>` : ''}
  ${anyFav ? `<a href="/app/recipes?fav=1" class="px-2.5 py-1 rounded-full text-xs font-medium ${fav ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}">★ Favourites</a>` : ''}
  ${tagSet.map((t) => `<a href="/app/recipes?tag=${encodeURIComponent(t)}" class="px-2.5 py-1 rounded-full text-xs font-medium ${t === tag ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}">#${esc(t)}</a>`).join('')}
</div>` : ''}
<form method="post" action="/app/recipes/import" class="flex flex-col sm:flex-row gap-2 mb-6">
  <input type="url" name="url" required aria-label="Recipe URL" value="${esc(String(c.req.query('url') || ''))}" placeholder="Paste a recipe URL (e.g. from BBC Good Food, Serious Eats…)" class="flex-1 rounded-lg border border-stone-300 px-3 py-2.5">
  <button class="rounded-lg bg-emerald-600 text-white font-semibold px-5 py-2.5 hover:bg-emerald-700">Import recipe</button>
</form>
<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
${recipes.results.map((r) => `
  <div class="relative rounded-xl bg-white border border-stone-200 overflow-hidden hover:border-emerald-400">
    <a href="/app/recipes/${r.id}" class="block">
      ${r.image_url ? `<img src="${esc(r.image_url)}" alt="" class="h-36 w-full object-cover" loading="lazy">` : `<div class="h-36 w-full bg-stone-100 flex items-center justify-center text-stone-300 text-4xl">🍽</div>`}
      <div class="p-3 pb-2">
        <h2 class="font-semibold leading-snug">${r.favorite ? '<span class="text-amber-500">★</span> ' : ''}${esc(r.title)}</h2>
        <p class="text-xs text-stone-500 mt-1">${[r.prep_minutes && `Prep ${r.prep_minutes}m`, r.cook_minutes && `Cook ${r.cook_minutes}m`, r.servings && esc(r.servings)].filter(Boolean).join(' · ')}</p>
        ${r.tags ? `<p class="mt-1.5 flex flex-wrap gap-1">${r.tags.split(',').filter(Boolean).map((t) => `<span class="px-1.5 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-800">#${esc(t)}</span>`).join('')}</p>` : ''}
      </div>
    </a>
    <div class="px-3 pb-2.5">
      ${planned.has(r.id)
        ? `<a href="/app" class="inline-block rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-200" aria-label="${esc(r.title)} is on this week's plan">✓ On this week's plan</a>`
        : `<a href="/app?recipe=${r.id}" class="inline-block rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100" aria-label="Plan ${esc(r.title)} this week">+ Plan this week</a>`}
    </div>
  </div>`).join('')}
</div>
${recipes.results.length === 0 ? (q || tag || fav ? `<p class="text-stone-500 text-sm">No recipes match “${esc(q || (tag ? `#${tag}` : '★ Favourites'))}” — <a class="text-emerald-700 underline" href="/app/recipes">show all</a>.</p>` : `<div class="py-10 text-center">
  <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true" class="mx-auto"><circle cx="44" cy="50" r="30" fill="#f5efe5"/><circle cx="44" cy="50" r="18" fill="none" stroke="#f59e0b" stroke-width="3"/><path d="M36 26 q-3 -6 2 -10 M44 24 q-3 -6 2 -10 M52 26 q-3 -6 2 -10" fill="none" stroke="#aaa090" stroke-width="2.5" stroke-linecap="round"/></svg>
  <p class="mt-3 text-stone-500 text-sm">Your recipe box is empty — paste a URL above to import your first recipe.</p>
  <form method="post" action="/app/recipes/starters" class="mt-3"><button data-busy-label="Adding starter recipes…" class="rounded-lg border border-emerald-600 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Or add 8 family-tested starter recipes</button></form>
</div>`) : ''}
<details class="mt-8"${c.req.query('paste') !== undefined ? ' open' : ''}>
  <summary class="cursor-pointer text-sm text-stone-500 hover:text-emerald-700">Or paste a whole recipe</summary>
  <form method="post" action="/app/recipes/paste" class="mt-3 max-w-lg space-y-2">
    <textarea name="text" required aria-label="Recipe text" rows="10" placeholder="Paste the full recipe text — title first, then an “Ingredients” heading, then a “Method” or “Steps” heading. Bullets and numbering are fine." class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">${esc(String(c.req.query('paste') || ''))}</textarea>
    <button class="rounded-lg bg-emerald-600 text-white font-semibold px-5 py-2 hover:bg-emerald-700">Parse &amp; save</button>
  </form>
</details>
<details class="mt-3">
  <summary class="cursor-pointer text-sm text-stone-500 hover:text-emerald-700">Or add a recipe manually</summary>
  <form method="post" action="/app/recipes/new" class="mt-3 max-w-lg space-y-2">
    <input name="title" required aria-label="Title" placeholder="Title" autocomplete="off" class="w-full rounded-lg border border-stone-300 px-3 py-2">
    <textarea name="ingredients" aria-label="Ingredients" rows="5" placeholder="Ingredients — one per line" class="w-full rounded-lg border border-stone-300 px-3 py-2"></textarea>
    <textarea name="steps" aria-label="Steps" rows="5" placeholder="Steps — one per line" class="w-full rounded-lg border border-stone-300 px-3 py-2"></textarea>
    <button class="rounded-lg bg-emerald-600 text-white font-semibold px-5 py-2 hover:bg-emerald-700">Save recipe</button>
  </form>
</details>
<details class="mt-3">
  <summary class="cursor-pointer text-sm text-stone-500 hover:text-emerald-700">Or import a JSON backup (moving from another app)</summary>
  <form method="post" action="/app/recipes/import-json" enctype="multipart/form-data" class="mt-3 max-w-lg space-y-2">
    <input type="file" name="file" required accept=".json,application/json" aria-label="Recipe JSON file" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white">
    <p class="text-xs text-stone-500">Works with a MealLoop export, any schema.org Recipe JSON (single or array), or JSON-LD exports from apps like RecipeSage. Up to 200 recipes per file.</p>
    <button class="rounded-lg bg-emerald-600 text-white font-semibold px-5 py-2 hover:bg-emerald-700">Import recipes</button>
  </form>
</details>`;
  return c.html(page({ title: 'Recipes', body, user, path: '/app/recipes', noindex: true }));
});

app.post('/app/recipes/import', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const f = await c.req.parseBody();
  const url = String(f.url || '').trim();
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error('Invalid URL');
    const host = parsed.hostname;
    if (
      host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') ||
      /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(':') || !host.includes('.')
    ) throw new Error('Invalid URL');
    const r = await importRecipeFromUrl(url, c.env);
    const id = uid();
    await c.env.DB.prepare(
      `INSERT INTO recipes (id, household_id, title, source_url, image_url, description, prep_minutes, cook_minutes, servings, ingredients_json, steps_json, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, h.id, r.title, r.source_url, r.image_url, r.description, r.prep_minutes, r.cook_minutes, r.servings, JSON.stringify(r.ingredients), JSON.stringify(r.steps), user.id).run();
    return c.redirect(`/app/recipes/${id}`);
  } catch (e) {
    const friendly = /HTTP \d|blocked|Timed out|abort/i.test(e.message)
      ? "We couldn't fetch that page — the site may be blocking automated access or the link may be wrong. Copy the recipe text and paste it below instead."
      : /No recipe/i.test(e.message)
        ? "We couldn't find a recipe on that page — try the recipe's own page, or paste the recipe text below."
        : `Import failed: ${e.message}`;
    return c.redirect(`/app/recipes?err=${encodeURIComponent(friendly)}&url=${encodeURIComponent(url.slice(0, 300))}`);
  }
});

app.post('/app/recipes/new', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const f = await c.req.parseBody();
  const title = clip(String(f.title || '').trim(), 200);
  if (!title) return c.redirect('/app/recipes');
  const ingredients = String(f.ingredients || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const steps = String(f.steps || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const id = uid();
  await c.env.DB.prepare(
    'INSERT INTO recipes (id, household_id, title, ingredients_json, steps_json, created_by) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, h.id, title, JSON.stringify(ingredients), JSON.stringify(steps), user.id).run();
  return c.redirect(`/app/recipes/${id}`);
});

app.post('/app/recipes/paste', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const f = await c.req.parseBody();
  const text = String(f.text || '').slice(0, 20000);
  const parsed = parseRecipeText(text);
  if (!parsed || !parsed.title) {
    const friendly = "We couldn't split that text — make sure it has the title on the first line, then an “Ingredients” heading, then a “Method” or “Steps” heading. Or use the manual form below.";
    return c.redirect(`/app/recipes?err=${encodeURIComponent(friendly)}&paste=${encodeURIComponent(text.slice(0, 1500))}`);
  }
  const id = uid();
  await c.env.DB.prepare(
    'INSERT INTO recipes (id, household_id, title, ingredients_json, steps_json, created_by) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, h.id, parsed.title, JSON.stringify(parsed.ingredients.map((s) => s.slice(0, 300))), JSON.stringify(parsed.steps.map((s) => s.slice(0, 1000))), user.id).run();
  return c.redirect(`/app/recipes/${id}`);
});

app.post('/app/recipes/import-json', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const f = await c.req.parseBody();
  const fail = (msg) => c.redirect(`/app/recipes?err=${encodeURIComponent(msg)}`);
  let text = '';
  if (f.file && typeof f.file.text === 'function') {
    if (f.file.size > 5_000_000) return fail('That file is too large (5 MB max).');
    text = await f.file.text();
  } else text = String(f.file || '');
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return fail("That file isn't valid JSON \u2014 export your recipes as JSON (e.g. a MealLoop backup or a schema.org Recipe file) and try again.");
  }
  const arr = Array.isArray(data) ? data : Array.isArray(data?.recipes) ? data.recipes : data && typeof data === 'object' ? [data] : null;
  if (!arr) return fail('No recipes found in that file.');
  const toText = (x) => (typeof x === 'string' ? x : x && typeof x === 'object' ? String(x.text || x.name || '') : '');
  const isoMinutes = (v) => {
    const m = /^PT(?:(\d+)H)?(?:(\d+)M)?/.exec(String(v || ''));
    return m ? clampMinutes(Number(m[1] || 0) * 60 + Number(m[2] || 0)) : null;
  };
  const stmts = [];
  for (const r of arr.slice(0, 200)) {
    if (!r || typeof r !== 'object') continue;
    const title = clip(String(r.name || r.title || '').trim(), 200);
    if (!title) continue;
    const ings = (Array.isArray(r.recipeIngredient) ? r.recipeIngredient : Array.isArray(r.ingredients) ? r.ingredients : [])
      .map(toText).map((s) => clip(s.trim(), 300)).filter(Boolean).slice(0, 150);
    let inst = r.recipeInstructions ?? r.steps ?? [];
    if (typeof inst === 'string') inst = inst.split(/\n+/);
    if (!Array.isArray(inst)) inst = [];
    const steps = [];
    for (const s of inst) {
      if (s && typeof s === 'object' && Array.isArray(s.itemListElement)) for (const t of s.itemListElement) steps.push(toText(t));
      else steps.push(toText(s));
    }
    const stepsClean = steps.map((s) => clip(String(s).trim(), 1000)).filter(Boolean).slice(0, 80);
    let sourceUrl = null;
    try {
      const u = new URL(String(r.url || r.source_url || ''));
      if (u.protocol === 'https:' || u.protocol === 'http:') sourceUrl = u.href;
    } catch { /* no source url */ }
    const image = sanitizeImageUrl(toText(Array.isArray(r.image) ? r.image[0] : r.image));
    stmts.push(
      c.env.DB.prepare(
        'INSERT INTO recipes (id, household_id, title, source_url, image_url, description, prep_minutes, cook_minutes, servings, ingredients_json, steps_json, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        uid(), h.id, title, sourceUrl, image,
        clip(String(r.description || '').trim(), 500) || null,
        isoMinutes(r.prepTime), isoMinutes(r.cookTime),
        clip(String(r.recipeYield || r.servings || '').trim(), 40) || null,
        JSON.stringify(ings), JSON.stringify(stepsClean),
        clip(typeof r.comment === 'string' ? r.comment.trim() : '', 2000),
        user.id
      )
    );
  }
  if (!stmts.length) return fail('No recipes with a title were found in that file.');
  await c.env.DB.batch(stmts);
  return c.redirect(`/app/recipes?imported=${stmts.length}`);
});

app.get('/app/recipes/:id', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const r = await c.env.DB.prepare('SELECT * FROM recipes WHERE id = ? AND household_id = ?').bind(c.req.param('id'), h.id).first();
  if (!r) return c.notFound();
  const stats = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n, MAX(date) AS last FROM plan_entries WHERE household_id = ? AND recipe_id = ? AND date <= date('now')"
  ).bind(h.id, r.id).first();
  const wk = weekDates(today());
  const plannedThisWeek = await c.env.DB.prepare('SELECT 1 FROM plan_entries WHERE household_id = ? AND recipe_id = ? AND date BETWEEN ? AND ? LIMIT 1')
    .bind(h.id, r.id, wk[0], wk[6]).first();
  const body = recipeBody(r, true, h.units, stats, !!plannedThisWeek);
  return c.html(page({ title: r.title, body, user, path: `/app/recipes/${r.id}`, noindex: true }));
});

app.post('/app/recipes/:id/favorite', async (c) => {
  const h = c.get('household');
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE recipes SET favorite = 1 - favorite WHERE id = ? AND household_id = ?').bind(id, h.id).run();
  return c.redirect(`/app/recipes/${id}`);
});

app.post('/app/recipes/:id/tags', async (c) => {
  const h = c.get('household');
  const id = c.req.param('id');
  const f = await c.req.parseBody();
  const tags = String(f.tags || '').split(',').map(normalizeTag).filter(Boolean).slice(0, 10).join(',');
  await c.env.DB.prepare('UPDATE recipes SET tags = ? WHERE id = ? AND household_id = ?').bind(tags, id, h.id).run();
  return c.redirect(`/app/recipes/${id}`);
});

function normalizeTag(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').slice(0, 30);
}

app.get('/app/recipes/:id/edit', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const r = await c.env.DB.prepare('SELECT * FROM recipes WHERE id = ? AND household_id = ?').bind(c.req.param('id'), h.id).first();
  if (!r) return c.notFound();
  const ingredients = JSON.parse(r.ingredients_json || '[]');
  const steps = JSON.parse(r.steps_json || '[]');
  const body = `<div class="max-w-2xl mx-auto">
<h1 class="text-2xl font-bold">Edit recipe</h1>
<form method="post" action="/app/recipes/${r.id}/edit" class="mt-5 space-y-4">
  <label class="block"><span class="text-sm font-medium">Title</span>
    <input name="title" required maxlength="200" value="${esc(r.title)}" autocomplete="off" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"></label>
  <label class="block"><span class="text-sm font-medium">Ingredients <span class="font-normal text-stone-500">(one per line)</span></span>
    <textarea name="ingredients" rows="${Math.min(Math.max(ingredients.length + 1, 6), 20)}" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">${esc(ingredients.join('\n'))}</textarea></label>
  <label class="block"><span class="text-sm font-medium">Steps <span class="font-normal text-stone-500">(one per line)</span></span>
    <textarea name="steps" rows="${Math.min(Math.max(steps.length + 1, 6), 20)}" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">${esc(steps.join('\n'))}</textarea></label>
  <div class="grid grid-cols-3 gap-3">
    <label class="block"><span class="text-sm font-medium">Prep <span class="font-normal text-stone-500">(min)</span></span>
      <input name="prep_minutes" type="number" min="0" max="6000" inputmode="numeric" value="${r.prep_minutes ?? ''}" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"></label>
    <label class="block"><span class="text-sm font-medium">Cook <span class="font-normal text-stone-500">(min)</span></span>
      <input name="cook_minutes" type="number" min="0" max="6000" inputmode="numeric" value="${r.cook_minutes ?? ''}" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"></label>
    <label class="block"><span class="text-sm font-medium">Servings</span>
      <input name="servings" maxlength="40" placeholder="Serves 4" autocomplete="off" value="${esc(r.servings || '')}" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"></label>
  </div>
  <label class="block"><span class="text-sm font-medium">Photo URL <span class="font-normal text-stone-500">(optional — paste a link to an image)</span></span>
    <input name="image_url" type="url" maxlength="500" placeholder="https://…" value="${esc(r.image_url || '')}" autocomplete="off" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"></label>
  <label class="block"><span class="text-sm font-medium">Notes <span class="font-normal text-stone-500">(shared with your household — “double the sauce”, “kids loved it”)</span></span>
    <textarea name="notes" rows="3" maxlength="2000" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">${esc(r.notes || '')}</textarea></label>
  <div class="flex items-center gap-3">
    <button class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Save changes</button>
    <a href="/app/recipes/${r.id}" class="text-sm text-stone-500 hover:underline">Cancel</a>
  </div>
</form>
</div>`;
  return c.html(page({ title: `Edit · ${r.title}`, body, user, path: `/app/recipes/${r.id}/edit`, noindex: true }));
});

app.post('/app/recipes/:id/edit', async (c) => {
  const h = c.get('household');
  const id = c.req.param('id');
  const f = await c.req.parseBody();
  const title = clip(String(f.title || '').trim(), 200);
  if (!title) return c.redirect(`/app/recipes/${id}/edit`);
  const ingredients = String(f.ingredients || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const steps = String(f.steps || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const notes = String(f.notes || '').trim().slice(0, 2000);
  const imageUrl = sanitizeImageUrl(f.image_url);
  const servings = String(f.servings || '').trim().slice(0, 40) || null;
  await c.env.DB.prepare('UPDATE recipes SET title = ?, ingredients_json = ?, steps_json = ?, notes = ?, image_url = ?, prep_minutes = ?, cook_minutes = ?, servings = ? WHERE id = ? AND household_id = ?')
    .bind(title, JSON.stringify(ingredients), JSON.stringify(steps), notes, imageUrl, clampMinutes(f.prep_minutes), clampMinutes(f.cook_minutes), servings, id, h.id).run();
  await bumpVersion(c.env, h.id);
  return c.redirect(`/app/recipes/${id}`);
});

app.post('/app/recipes/:id/to-list', async (c) => {
  const h = c.get('household');
  const id = c.req.param('id');
  const r = await c.env.DB.prepare('SELECT title, ingredients_json FROM recipes WHERE id = ? AND household_id = ?').bind(id, h.id).first();
  if (!r) return c.notFound();
  const merged = mergeIngredients(JSON.parse(r.ingredients_json || '[]').map((i) => String(i).slice(0, 200)).filter((i) => i && !isIngredientHeading(i)));
  const existing = await c.env.DB.prepare('SELECT id, label, checked, sources FROM shopping_items WHERE household_id = ?').bind(h.id).all();
  const byKey = new Map();
  for (const it of existing.results) if (!byKey.has(ingredientKey(it.label))) byKey.set(ingredientKey(it.label), it);
  const stmts = [];
  let added = 0;
  const seen = new Set();
  for (const label of merged) {
    const key = ingredientKey(label);
    if (seen.has(key)) continue;
    seen.add(key);
    const hit = byKey.get(key);
    if (hit) {
      if (!hit.checked) {
        const sources = [...new Set([...(hit.sources || '').split(', ').filter(Boolean), r.title])].sort((x, y) => x.localeCompare(y)).join(', ').slice(0, 200);
        if (sources !== (hit.sources || '')) stmts.push(c.env.DB.prepare('UPDATE shopping_items SET sources = ? WHERE id = ?').bind(sources, hit.id));
      }
      continue;
    }
    added++;
    stmts.push(
      c.env.DB.prepare('INSERT INTO shopping_items (id, household_id, label, category, sources) VALUES (?, ?, ?, ?, ?)')
        .bind(uid(), h.id, label, categorize(label), r.title.slice(0, 200))
    );
  }
  if (stmts.length) await c.env.DB.batch(stmts);
  await bumpVersion(c.env, h.id);
  return c.redirect(`/app/list?added=${added}&src=recipe`);
});

app.post('/app/recipes/:id/duplicate', async (c) => {
  const h = c.get('household');
  const user = c.get('user');
  const r = await c.env.DB.prepare('SELECT * FROM recipes WHERE id = ? AND household_id = ?').bind(c.req.param('id'), h.id).first();
  if (!r) return c.notFound();
  const id = uid();
  const title = clip(`${r.title} (copy)`, 200);
  await c.env.DB.prepare(
    'INSERT INTO recipes (id, household_id, title, source_url, image_url, description, prep_minutes, cook_minutes, servings, ingredients_json, steps_json, notes, tags, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, h.id, title, r.source_url, r.image_url, r.description, r.prep_minutes, r.cook_minutes, r.servings, r.ingredients_json, r.steps_json, r.notes, r.tags || '', user.id).run();
  await bumpVersion(c.env, h.id);
  return c.redirect(`/app/recipes/${id}`);
});

app.post('/app/recipes/:id/delete', async (c) => {
  const h = c.get('household');
  const id = c.req.param('id');
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM plan_reactions WHERE plan_entry_id IN (SELECT id FROM plan_entries WHERE recipe_id = ? AND household_id = ?)').bind(id, h.id),
    c.env.DB.prepare('DELETE FROM plan_entries WHERE recipe_id = ? AND household_id = ?').bind(id, h.id),
    c.env.DB.prepare('DELETE FROM recipes WHERE id = ? AND household_id = ?').bind(id, h.id),
  ]);
  await bumpVersion(c.env, h.id);
  return c.redirect('/app/recipes');
});

function planStatsLine(stats) {
  if (!stats || !stats.n) return '';
  const last = new Date(stats.last + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  return `<p class="text-xs text-stone-400 mt-1 print:hidden">Planned ${stats.n === 1 ? 'once' : `${stats.n} times`} · last on ${last}</p>`;
}

function recipeBody(r, canEdit, units = '', stats = null, plannedThisWeek = false) {
  const ingredients = JSON.parse(r.ingredients_json || '[]');
  const steps = JSON.parse(r.steps_json || '[]');
  return `<article class="max-w-2xl mx-auto">
${r.image_url ? `<img src="${esc(r.image_url)}" alt="" class="rounded-2xl w-full max-h-80 object-cover mb-4 print:hidden">` : ''}
<h1 class="text-3xl font-bold">${esc(r.title)}</h1>
<p class="text-sm text-stone-500 mt-1">${[r.prep_minutes && `Prep ${r.prep_minutes} min`, r.cook_minutes && `Cook ${r.cook_minutes} min`, r.servings && esc(r.servings)].filter(Boolean).join(' · ')}</p>
${planStatsLine(stats)}
${r.description ? `<p class="mt-3 text-stone-600">${esc(r.description)}</p>` : ''}
${r.source_url ? `<p class="mt-2 text-sm"><a class="text-emerald-700 underline" href="${esc(r.source_url)}" rel="noopener nofollow">Original source</a></p>` : ''}
${r.notes ? `<div class="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3"><h2 class="text-sm font-semibold text-amber-800">Notes</h2><p class="mt-1 text-sm text-amber-900 whitespace-pre-line">${esc(r.notes)}</p></div>` : ''}
<div class="grid sm:grid-cols-2 gap-6 mt-6">
  <section>
    <h2 class="font-semibold text-lg mb-2">Ingredients</h2>
    <ul class="ingredients-list space-y-1.5 text-sm">${ingredients.map((i) => isIngredientHeading(i) ? `<li class="pt-2 font-semibold">${esc(String(i).trim().replace(/:$/, ''))}</li>` : `<li class="flex gap-2"><span class="text-emerald-600 mt-0.5">•</span><span>${esc(convertUnits(i, units))}</span></li>`).join('')}</ul>
  </section>
  <section>
    <div class="flex items-center justify-between mb-2">
      <h2 class="font-semibold text-lg">Steps</h2>
      <span class="flex gap-1.5 print:hidden">
        <button type="button" data-print class="rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-medium hover:bg-stone-100">Print</button>
        ${steps.length ? `<button type="button" data-cook-mode class="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700">▶ Start cooking</button>` : ''}
      </span>
    </div>
    <ol class="steps-list space-y-2.5 text-sm list-none">${steps.map((s, i) => `<li class="flex gap-2.5"><span class="shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">${i + 1}</span><span>${esc(s)}</span></li>`).join('')}</ol>
  </section>
</div>
${canEdit ? `<div class="mt-8 flex flex-wrap items-center gap-3 print:hidden">
  ${plannedThisWeek
    ? `<a href="/app" class="inline-block rounded-lg bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-200" aria-label="${esc(r.title)} is on this week's plan">✓ On this week's plan</a>
  <a href="/app?recipe=${r.id}" class="text-sm text-emerald-700 underline">Plan again</a>`
    : `<a href="/app?recipe=${r.id}" class="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Add to your week plan</a>`}
  <form method="post" action="/app/recipes/${r.id}/favorite"><button class="rounded-lg border px-4 py-2 text-sm font-semibold ${r.favorite ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-stone-300 hover:bg-stone-100'}">${r.favorite ? '★ Favourited' : '☆ Favourite'}</button></form>
  ${ingredients.length ? `<form method="post" action="/app/recipes/${r.id}/to-list"><button class="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold hover:bg-stone-100">Add ingredients to list</button></form>` : ''}
</div>
<form method="post" action="/app/recipes/${r.id}/tags" class="mt-4 flex gap-2 max-w-md print:hidden">
  <input name="tags" aria-label="Tags" autocomplete="off" value="${esc((r.tags || '').split(',').filter(Boolean).join(', '))}" placeholder="Tags, comma-separated (e.g. quick, vegetarian)" class="flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-sm">
  <button class="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100">Save tags</button>
</form>` : ''}
${canEdit ? `<div class="mt-4 flex items-center gap-4 print:hidden">
  <a href="/app/recipes/${r.id}/edit" class="text-sm text-emerald-700 hover:underline">Edit recipe</a>
  <form method="post" action="/app/recipes/${r.id}/duplicate"><button class="text-sm text-stone-600 hover:underline">Duplicate</button></form>
  <form method="post" action="/app/recipes/${r.id}/delete" data-confirm="Delete this recipe?"><button class="text-sm text-red-600 hover:underline">Delete recipe</button></form>
</div>` : ''}
</article>`;
}

// ---------- grocery list ----------
app.get('/app/list', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const wk = weekDates(today());
  const [items, staples, weekRecipes] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM shopping_items WHERE household_id = ? ORDER BY category, COALESCE(sort_index, 1000000), created_at').bind(h.id).all(),
    c.env.DB.prepare('SELECT label FROM staples WHERE household_id = ?').bind(h.id).all(),
    c.env.DB.prepare('SELECT DISTINCT r.id, r.title FROM plan_entries p JOIN recipes r ON r.id = p.recipe_id WHERE p.household_id = ? AND p.date BETWEEN ? AND ? ORDER BY r.title COLLATE NOCASE').bind(h.id, wk[0], wk[6]).all(),
  ]);
  const suggestions = [...new Set([...staples.results.map((s) => s.label), ...COMMON_ITEMS])];
  const added = c.req.query('added');
  const srcLabel = c.req.query('src') === 'recipe' ? 'that recipe' : c.req.query('src') === 'staples' ? 'your staples' : "this week's plan";
  const pantrySkipped = Number(c.req.query('pantry')) || 0;
  const notice = added === undefined ? '' : (Number(added) > 0
    ? `Added ${Number(added)} new item${Number(added) === 1 ? '' : 's'} from ${srcLabel}.`
    : `Everything from ${srcLabel} is already on the list.`) + (pantrySkipped ? ` Skipped ${pantrySkipped} item${pantrySkipped === 1 ? '' : 's'} you already have in the pantry.` : '');
  const stores = (h.stores || '').split(',').filter(Boolean);
  const storeFilter = stores.includes(c.req.query('store')) ? c.req.query('store') : '';
  const shown = storeFilter ? items.results.filter((i) => !i.store || i.store === storeFilter) : items.results;
  const body = listBody(h, shown, { editable: true, base: '/app/list', shareLink: true, notice, suggestions, stores, storeFilter, aislesOpen: c.req.query('aisles') === '1', weekRecipes: weekRecipes.results });
  return c.html(page({ title: 'Grocery list', body, user, path: '/app/list', noindex: true }));
});

// Adding an item that already exists (same normalized key) merges quantities
// into the unchecked item, or unchecks a checked one ("buy again"), instead
// of inserting a duplicate row.
async function addListItem(env, householdId, label) {
  const key = ingredientKey(label);
  const existing = await env.DB.prepare('SELECT id, label, checked FROM shopping_items WHERE household_id = ?').bind(householdId).all();
  const hit = existing.results.find((r) => ingredientKey(r.label) === key);
  if (hit) {
    if (hit.checked) {
      await env.DB.prepare('UPDATE shopping_items SET checked = 0, label = ? WHERE id = ?').bind(label, hit.id).run();
    } else {
      const merged = mergeIngredients([hit.label, label])[0] || label;
      if (merged !== hit.label) await env.DB.prepare('UPDATE shopping_items SET label = ? WHERE id = ?').bind(merged, hit.id).run();
    }
  } else {
    await env.DB.prepare('INSERT INTO shopping_items (id, household_id, label, category) VALUES (?, ?, ?, ?)')
      .bind(uid(), householdId, label, categorize(label)).run();
  }
  await bumpVersion(env, householdId);
}

app.post('/app/list/add', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  for (const label of splitListInput(clip(String(f.label || ''), 500))) {
    await addListItem(c.env, h.id, clip(label, 200));
  }
  const back = String(f.back || '');
  return c.redirect(back.startsWith('/app/list') ? back : '/app/list');
});

app.post('/app/list/toggle', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  await c.env.DB.prepare('UPDATE shopping_items SET checked = 1 - checked WHERE id = ? AND household_id = ?').bind(String(f.id || ''), h.id).run();
  await bumpVersion(c.env, h.id);
  if (c.req.header('X-Requested-With') === 'fetch') return c.json({ ok: true });
  const back = String(f.back || '');
  return c.redirect(back.startsWith('/app/list') ? back : '/app/list');
});

app.post('/app/settings/units', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const units = ['metric', 'imperial'].includes(String(f.units)) ? String(f.units) : '';
  await c.env.DB.prepare('UPDATE households SET units = ? WHERE id = ?').bind(units, h.id).run();
  await bumpVersion(c.env, h.id);
  const back = String(f.back || '');
  return c.redirect(back.startsWith('/app') ? back : '/app/list');
});

app.post('/app/settings/snacks', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  await c.env.DB.prepare('UPDATE households SET snacks = 1 - snacks WHERE id = ?').bind(h.id).run();
  return c.redirect(`/app?week=${String(f.week || '')}`);
});

app.post('/app/list/category', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const category = String(f.category || '').trim().slice(0, 30);
  if (category) {
    await c.env.DB.prepare('UPDATE shopping_items SET category = ? WHERE id = ? AND household_id = ?')
      .bind(category, String(f.id || ''), h.id).run();
    await bumpVersion(c.env, h.id);
  }
  const back = String(f.back || '');
  return c.redirect(back.startsWith('/app/list') ? back : '/app/list');
});

app.post('/app/list/store', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const store = String(f.store || '').replace(/,/g, '').trim().slice(0, 30);
  await c.env.DB.prepare('UPDATE shopping_items SET store = ? WHERE id = ? AND household_id = ?')
    .bind(store, String(f.id || ''), h.id).run();
  const stores = (h.stores || '').split(',').filter(Boolean);
  if (store && !stores.includes(store) && stores.length < 10) {
    await c.env.DB.prepare('UPDATE households SET stores = ? WHERE id = ?')
      .bind([...stores, store].join(','), h.id).run();
  }
  await bumpVersion(c.env, h.id);
  const back = String(f.back || '');
  return c.redirect(back.startsWith('/app/list') ? back : '/app/list');
});

app.post('/app/stores/delete', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const store = String(f.store || '');
  const stores = (h.stores || '').split(',').filter(Boolean);
  if (store && stores.includes(store)) {
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE households SET stores = ? WHERE id = ?')
        .bind(stores.filter((s) => s !== store).join(','), h.id),
      c.env.DB.prepare("UPDATE shopping_items SET store = '' WHERE household_id = ? AND store = ?").bind(h.id, store),
    ]);
    await bumpVersion(c.env, h.id);
  }
  return c.redirect('/app/list');
});

app.post('/app/list/remove', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  await c.env.DB.prepare('DELETE FROM shopping_items WHERE id = ? AND household_id = ?')
    .bind(String(f.id || ''), h.id).run();
  await bumpVersion(c.env, h.id);
  const back = String(f.back || '');
  return c.redirect(back.startsWith('/app/list') ? back : '/app/list');
});

app.post('/app/list/note', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const note = clip(String(f.note || '').trim(), 140);
  const label = clip(String(f.label || '').trim(), 200);
  const photo = sanitizeImageUrl(String(f.photo || '').trim());
  if (label) {
    await c.env.DB.prepare('UPDATE shopping_items SET label = ?, note = ?, photo_url = ? WHERE id = ? AND household_id = ?')
      .bind(label, note, photo, String(f.id || ''), h.id).run();
  } else await c.env.DB.prepare('UPDATE shopping_items SET note = ?, photo_url = ? WHERE id = ? AND household_id = ?')
    .bind(note, photo, String(f.id || ''), h.id).run();
  await bumpVersion(c.env, h.id);
  const back = String(f.back || '');
  return c.redirect(back.startsWith('/app/list') ? back : '/app/list');
});

app.post('/app/list/move', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const id = String(f.id || '');
  const item = await c.env.DB.prepare('SELECT id, category, checked FROM shopping_items WHERE id = ? AND household_id = ?').bind(id, h.id).first();
  if (item) {
    const rows = await c.env.DB.prepare('SELECT id FROM shopping_items WHERE household_id = ? AND category = ? AND checked = ? ORDER BY COALESCE(sort_index, 1000000), created_at')
      .bind(h.id, item.category, item.checked).all();
    const ids = swapAdjacent(rows.results.map((r) => r.id), id, String(f.dir));
    if (ids) {
      await c.env.DB.batch(ids.map((x, idx) => c.env.DB.prepare('UPDATE shopping_items SET sort_index = ? WHERE id = ? AND household_id = ?').bind(idx, x, h.id)));
      await bumpVersion(c.env, h.id);
    }
  }
  const back = String(f.back || '');
  return c.redirect(back.startsWith('/app/list') ? back : '/app/list');
});

app.post('/app/list/aisles', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const cat = String(f.category || '');
  const dir = String(f.dir) === 'up' ? -1 : 1;
  const used = await c.env.DB.prepare('SELECT DISTINCT category FROM shopping_items WHERE household_id = ?').bind(h.id).all();
  const order = sortCategories([...new Set([...STANDARD_CATEGORIES, ...used.results.map((r) => r.category)])], h.category_order);
  const i = order.indexOf(cat);
  const j = i + dir;
  if (i !== -1 && j >= 0 && j < order.length) {
    [order[i], order[j]] = [order[j], order[i]];
    await c.env.DB.prepare('UPDATE households SET category_order = ? WHERE id = ?').bind(JSON.stringify(order), h.id).run();
    await bumpVersion(c.env, h.id);
  }
  const back = String(f.back || '');
  return c.redirect(back.startsWith('/app/list') ? back : '/app/list');
});

app.post('/app/list/staples', async (c) => {
  const h = c.get('household');
  const [staples, pantry] = await Promise.all([
    c.env.DB.prepare('SELECT label, category FROM staples WHERE household_id = ?').bind(h.id).all(),
    c.env.DB.prepare("SELECT label FROM pantry_items WHERE household_id = ? AND level = 'stocked'").bind(h.id).all(),
  ]);
  const stockedKeys = new Set(pantry.results.map((p) => pantryKey(p.label)));
  const existing = await c.env.DB.prepare('SELECT id, label, checked FROM shopping_items WHERE household_id = ?').bind(h.id).all();
  let added = 0;
  let skipped = 0;
  for (const s of staples.results) {
    const key = ingredientKey(s.label);
    const hit = existing.results.find((r) => ingredientKey(r.label) === key);
    if (!hit && stockedKeys.has(pantryKey(s.label))) {
      skipped++;
      continue;
    }
    if (hit) {
      if (hit.checked) {
        await c.env.DB.prepare('UPDATE shopping_items SET checked = 0 WHERE id = ?').bind(hit.id).run();
        added++;
      }
    } else {
      await c.env.DB.prepare('INSERT INTO shopping_items (id, household_id, label, category) VALUES (?, ?, ?, ?)')
        .bind(uid(), h.id, s.label, s.category || categorize(s.label)).run();
      added++;
    }
  }
  if (added) await bumpVersion(c.env, h.id);
  return c.redirect(`/app/list?added=${added}&src=staples${skipped ? `&pantry=${skipped}` : ''}`);
});

app.post('/app/list/uncheck', async (c) => {
  const h = c.get('household');
  await c.env.DB.prepare('UPDATE shopping_items SET checked = 0 WHERE household_id = ? AND checked = 1').bind(h.id).run();
  await bumpVersion(c.env, h.id);
  return c.redirect('/app/list');
});

app.post('/app/list/clear', async (c) => {
  const h = c.get('household');
  await c.env.DB.prepare('DELETE FROM shopping_items WHERE household_id = ? AND checked = 1').bind(h.id).run();
  await bumpVersion(c.env, h.id);
  return c.redirect('/app/list');
});

const COMMON_ITEMS = ['Milk', 'Eggs', 'Bread', 'Butter', 'Cheese', 'Yogurt', 'Bananas', 'Apples', 'Tomatoes', 'Onions', 'Garlic', 'Potatoes', 'Carrots', 'Lettuce', 'Chicken breast', 'Beef mince', 'Rice', 'Pasta', 'Olive oil', 'Coffee', 'Tea', 'Sugar', 'Flour', 'Salt', 'Pepper', 'Toilet paper', 'Paper towels', 'Dish soap', 'Laundry detergent'];

function listBody(h, items, { editable, base, shareLink, notice, suggestions = [], canAdd = editable, stores = [], storeFilter = '', extraQuery = '', aislesOpen = false, weekRecipes = [] }) {
  const cats = [...new Set(items.map((i) => i.category))];
  const allCats = sortCategories([...new Set([...STANDARD_CATEGORIES, ...cats])], h.category_order);
  const qs = (store, aisles) => {
    const p = new URLSearchParams(extraQuery);
    if (store) p.set('store', store);
    if (aisles) p.set('aisles', '1');
    const s = p.toString();
    return s ? `?${s}` : '';
  };
  const back = `${base}${qs(storeFilter)}`;
  const open = items.filter((i) => !i.checked);
  const done = items.filter((i) => i.checked);
  const row = (i) => `
      <li class="flex items-center${i.checked ? ' print:hidden' : ''}">
        <form method="post" action="${base}/toggle" class="toggle-form flex-1 min-w-0">
          <input type="hidden" name="id" value="${i.id}">
          <input type="hidden" name="back" value="${back}">
          <button class="w-full min-w-0 flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-stone-50 ${i.checked ? 'text-stone-500' : ''}">
            <span class="shrink-0 w-5 h-5 rounded-md border ${i.checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300 bg-white'} flex items-center justify-center text-xs">${i.checked ? '✓' : ''}</span>
            ${i.photo_url ? `<img src="${esc(i.photo_url)}" alt="" loading="lazy" class="shrink-0 h-8 w-8 rounded-md object-cover print:hidden">` : ''}
            <span class="min-w-0 [overflow-wrap:anywhere] ${i.checked ? 'line-through' : ''}">${esc(convertUnits(i.label, h.units))}${i.sources ? `<span class="block text-xs text-stone-500">for ${esc(i.sources)}</span>` : ''}${i.note ? `<span class="block text-xs text-amber-700">✎ ${esc(i.note)}</span>` : ''}</span>
          </button>
        </form>
        ${editable ? `<form method="post" action="/app/list/store" class="print:hidden">
          <input type="hidden" name="id" value="${i.id}">
          <input type="hidden" name="back" value="${back}">
          <select name="store" data-autosubmit data-custom-prompt="New store name:" aria-label="Store" class="rounded border border-transparent hover:border-stone-300 bg-transparent text-xs text-stone-500 px-0.5 py-0.5 max-w-20">
            <option value=""${!i.store ? ' selected' : ''}>Any store</option>
            ${stores.map((s) => `<option value="${esc(s)}"${s === i.store ? ' selected' : ''}>${esc(s)}</option>`).join('')}
            <option value="__custom">New store…</option>
          </select>
        </form>
        <details class="relative print:hidden">
          <summary aria-label="Edit item" title="Edit item" class="cursor-pointer list-none px-1.5 py-1 text-sm ${i.note ? 'text-amber-600' : 'text-stone-300 hover:text-stone-500'}">✎</summary>
          <div class="absolute right-0 z-10 mt-1 w-64 space-y-1 rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
            <form method="post" action="/app/list/note" class="space-y-1">
              <input type="hidden" name="id" value="${i.id}">
              <input type="hidden" name="back" value="${back}">
              <input name="label" required value="${esc(i.label)}" maxlength="200" aria-label="Item name" autocomplete="off" class="w-full rounded border border-stone-300 px-2 py-1 text-xs">
              <input name="note" value="${esc(i.note || '')}" maxlength="140" aria-label="Item note" autocomplete="off" placeholder="Note (e.g. the big pack)" class="w-full rounded border border-stone-300 px-2 py-1 text-xs">
              <div class="flex gap-1">
                <input name="photo" type="url" value="${esc(i.photo_url || '')}" maxlength="500" aria-label="Photo URL" autocomplete="off" placeholder="Photo URL (https://…)" class="min-w-0 flex-1 rounded border border-stone-300 px-2 py-1 text-xs">
                <button class="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700">Save</button>
              </div>
            </form>
            <div class="flex gap-1 border-t border-stone-100 pt-1">
              <form method="post" action="/app/list/move" class="flex-1"><input type="hidden" name="id" value="${i.id}"><input type="hidden" name="dir" value="up"><input type="hidden" name="back" value="${back}"><button class="w-full rounded border border-stone-300 px-2 py-1 text-xs text-stone-600 hover:bg-stone-100">↑ Move up</button></form>
              <form method="post" action="/app/list/move" class="flex-1"><input type="hidden" name="id" value="${i.id}"><input type="hidden" name="dir" value="down"><input type="hidden" name="back" value="${back}"><button class="w-full rounded border border-stone-300 px-2 py-1 text-xs text-stone-600 hover:bg-stone-100">↓ Move down</button></form>
            </div>
            <form method="post" action="/app/list/remove" data-confirm="Remove “${esc(i.label)}” from the list?" class="border-t border-stone-100 pt-1"><input type="hidden" name="id" value="${i.id}"><input type="hidden" name="back" value="${back}"><button class="w-full rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">Delete item</button></form>
          </div>
        </details>
        <form method="post" action="/app/list/category" class="pr-1 print:hidden">
          <input type="hidden" name="id" value="${i.id}">
          <input type="hidden" name="back" value="${back}">
          <select name="category" data-autosubmit data-custom-prompt="New aisle / store section name:" aria-label="Move to category" class="rounded border border-transparent hover:border-stone-300 bg-transparent text-xs text-stone-500 px-0.5 py-0.5 max-w-24">
            ${allCats.map((cc) => `<option value="${esc(cc)}"${cc === i.category ? ' selected' : ''}>${esc(cc)}</option>`).join('')}
            <option value="__custom">New category…</option>
          </select>
        </form>` : ''}
      </li>`;
  return `
${notice ? `<p role="status" class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">${esc(notice)}</p>` : ''}
${weekRecipes.length ? `<div class="mb-4 flex flex-wrap items-center gap-1.5 print:hidden"><span class="text-xs text-stone-500">From this week's plan:</span>${weekRecipes.map((r) => `<a href="/app/recipes/${r.id}" class="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100">${esc(r.title)}</a>`).join('')}</div>` : ''}
<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
  <h1 class="text-2xl font-bold">Grocery list${items.length ? ` <span class="align-middle text-sm font-normal text-stone-500 tnum">${open.length ? `${open.length} to buy` : '<span class="celebrate inline-block">all done 🎉</span>'}${done.length ? ` · ${done.length} checked` : ''}</span>` : ''}</h1>
  <div class="flex flex-wrap gap-2 print:hidden">
    ${shareLink ? `<form method="post" action="/app/list/staples"><button class="px-3 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100 whitespace-nowrap">+ Add staples</button></form>
    <a href="/app/share" class="px-3 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 whitespace-nowrap">Share with family</a>` : `<button type="button" data-copy-list class="px-3 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100 whitespace-nowrap">Copy list</button>
    <button type="button" data-print class="px-3 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100">Print</button>`}
    ${editable ? `<details class="relative">
      <summary class="cursor-pointer list-none px-3 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100 whitespace-nowrap" aria-label="More list actions">⋯ More</summary>
      <div class="absolute right-0 z-10 mt-1 w-56 rounded-lg border border-stone-200 bg-white p-1.5 shadow-lg">
        ${shareLink ? `<button type="button" data-copy-list class="block w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-stone-100">Copy list</button>
        <button type="button" data-print class="block w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-stone-100">Print</button>
        <a href="/app/staples" class="block rounded-md px-2.5 py-1.5 text-sm hover:bg-stone-100">Edit staples</a>
        <a href="/app/pantry" class="block rounded-md px-2.5 py-1.5 text-sm hover:bg-stone-100">Pantry<span data-new="pantry" class="ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 align-middle" hidden>New</span></a>` : ''}
        <a href="${base}${qs(storeFilter, true)}" class="block rounded-md px-2.5 py-1.5 text-sm hover:bg-stone-100">Aisle order…</a>
        <form method="post" action="/app/list/clear" data-confirm="Remove all checked items? This can't be undone."><button class="block w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-stone-100">Clear checked</button></form>
        <form method="post" action="/app/settings/units" class="flex items-center gap-1 px-2.5 py-1.5">
          <input type="hidden" name="back" value="/app/list">
          <select name="units" data-autosubmit aria-label="Units" title="Display only — converts amounts between metric and imperial; your recipes stay as written and you can switch back anytime." class="w-full rounded-lg border border-stone-300 text-sm px-2 py-1 bg-white text-stone-600">
            <option value=""${!h.units ? ' selected' : ''}>Units: as written</option>
            <option value="metric"${h.units === 'metric' ? ' selected' : ''}>Units: metric</option>
            <option value="imperial"${h.units === 'imperial' ? ' selected' : ''}>Units: imperial</option>
          </select>
          <noscript><button class="px-2 py-1 rounded-lg border border-stone-300 text-sm hover:bg-stone-100">Set</button></noscript>
        </form>
      </div>
    </details>` : ''}
  </div>
</div>
${editable && aislesOpen ? `<div class="mb-4 max-w-sm rounded-xl border border-stone-200 bg-white p-3 shadow-sm print:hidden">
  <div class="flex items-center justify-between gap-2">
    <h2 class="text-sm font-semibold text-stone-800">Aisle order</h2>
    <a href="${base}${qs(storeFilter)}" class="rounded-md px-2 py-0.5 text-xs text-stone-500 hover:bg-stone-100">Done</a>
  </div>
  <p class="pb-1 text-xs text-stone-500">Match the order you walk your store.</p>
  ${allCats.map((cat, idx) => `<div class="flex items-center justify-between gap-2 px-1 py-0.5 text-sm">
    <span class="truncate">${esc(cat)}</span>
    <span class="flex gap-1">
      <form method="post" action="/app/list/aisles"><input type="hidden" name="category" value="${esc(cat)}"><input type="hidden" name="dir" value="up"><input type="hidden" name="back" value="${base}${qs(storeFilter, true)}"><button aria-label="Move ${esc(cat)} up"${idx === 0 ? ' disabled' : ''} class="px-1.5 py-0.5 rounded text-stone-500 hover:bg-stone-100 disabled:opacity-30">↑</button></form>
      <form method="post" action="/app/list/aisles"><input type="hidden" name="category" value="${esc(cat)}"><input type="hidden" name="dir" value="down"><input type="hidden" name="back" value="${base}${qs(storeFilter, true)}"><button aria-label="Move ${esc(cat)} down"${idx === allCats.length - 1 ? ' disabled' : ''} class="px-1.5 py-0.5 rounded text-stone-500 hover:bg-stone-100 disabled:opacity-30">↓</button></form>
    </span>
  </div>`).join('')}
</div>` : ''}
${stores.length ? `<div class="flex flex-wrap items-center gap-1.5 mb-4 print:hidden">
  <a href="${base}${qs('')}" class="px-2.5 py-1 rounded-full text-xs font-medium ${!storeFilter ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}">All stores</a>
  ${stores.map((s) => `<a href="${base}${qs(s)}" class="px-2.5 py-1 rounded-full text-xs font-medium ${s === storeFilter ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}">${esc(s)}</a>`).join('')}
  ${editable ? `<details class="relative">
    <summary class="cursor-pointer list-none px-2 py-1 rounded-full text-xs text-stone-500 hover:bg-stone-100">Edit stores…</summary>
    <div class="absolute right-0 z-10 mt-1 w-56 rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
      ${stores.map((s) => `<form method="post" action="/app/stores/delete" data-confirm="Remove store “${esc(s)}”? Items assigned to it go back to Any store." class="flex items-center justify-between gap-2 px-1 py-1 text-sm">
        <span>${esc(s)}</span>
        <input type="hidden" name="store" value="${esc(s)}">
        <button aria-label="Remove store ${esc(s)}" class="text-stone-500 hover:text-red-600">✕</button>
      </form>`).join('')}
    </div>
  </details>` : ''}
</div>` : ''}
${canAdd ? `
<form method="post" action="${base}/add" class="flex gap-2 mb-5 max-w-md print:hidden">
  <input type="hidden" name="back" value="${back}">
  <input name="label" required aria-label="Add item" placeholder="Add items (e.g. milk, eggs, 2 lemons)" list="item-suggestions" autocomplete="off" class="flex-1 rounded-lg border border-stone-300 px-3 py-2">
  <datalist id="item-suggestions">${suggestions.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>
  <button class="rounded-lg bg-emerald-600 text-white font-semibold px-4 hover:bg-emerald-700">Add</button>
</form>` : ''}
${(() => { const openCats = sortCategories([...new Set(open.map((i) => i.category))], h.category_order); return openCats.length >= 3 ? `<nav aria-label="Jump to aisle" class="flex flex-wrap gap-1.5 mb-4 max-w-2xl print:hidden">
  ${openCats.map((cat, idx) => `<a href="#cat-${idx}" class="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600 hover:bg-stone-200">${esc(cat)} <span class="text-stone-400">${open.filter((i) => i.category === cat).length}</span></a>`).join('')}
</nav>` : ''; })()}
<div id="list" data-version="${h.version}" data-base="${base}" class="space-y-5 max-w-2xl">
${items.length === 0 ? `<div class="py-10 text-center">
  <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true" class="mx-auto"><path d="M22 34 h44 l-6 34 a6 6 0 0 1 -6 6 h-20 a6 6 0 0 1 -6 -6 z" fill="#f5efe5" stroke="#aaa090" stroke-width="2.5"/><path d="M32 34 q0 -14 12 -14 q12 0 12 14" fill="none" stroke="#aaa090" stroke-width="2.5"/><circle cx="37" cy="52" r="5" fill="#f59e0b"/><circle cx="51" cy="56" r="5" fill="#84cc16"/></svg>
  <p class="mt-3 text-stone-500 text-sm">Nothing here yet — plan meals on your week first, then "Add week's ingredients" builds this list for you. Or add items and staples from the toolbar above.</p>
  ${editable ? `<div class="mt-4 flex flex-wrap justify-center gap-2 print:hidden">
    <a href="/app" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Open the planner</a>
  </div>` : ''}
</div>` : ''}
${sortCategories([...new Set(open.map((i) => i.category))], h.category_order).map((cat, idx) => `
  <section id="cat-${idx}" class="scroll-mt-4">
    <h2 class="text-xs uppercase tracking-wide font-semibold text-stone-500 mb-1.5">${esc(cat)}</h2>
    <ul class="rounded-xl bg-white border border-stone-200 divide-y divide-stone-100">
    ${open.filter((i) => i.category === cat).map(row).join('')}
    </ul>
  </section>`).join('')}
${done.length ? `
  <section class="print:hidden">
    <div class="flex items-center justify-between gap-2 mb-1.5">
      <h2 class="text-xs uppercase tracking-wide font-semibold text-stone-500">Checked off (${done.length})</h2>
      ${editable ? `<form method="post" action="/app/list/uncheck"><button class="rounded border border-stone-300 text-xs px-2 py-0.5 text-stone-600 hover:bg-stone-100">Uncheck all</button></form>` : ''}
    </div>
    <ul class="rounded-xl bg-stone-50 border border-stone-200 divide-y divide-stone-100">
    ${done.map(row).join('')}
    </ul>
  </section>` : ''}
</div>
`;
}

app.get('/app/staples', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const staples = await c.env.DB.prepare('SELECT * FROM staples WHERE household_id = ? ORDER BY category, created_at').bind(h.id).all();
  const body = `<div class="max-w-2xl">
<div class="flex flex-wrap items-center justify-between gap-3 mb-2">
  <h1 class="text-2xl font-bold">Staples</h1>
  <a href="/app/list" class="text-sm text-emerald-700 underline">Back to grocery list</a>
</div>
<p class="text-sm text-stone-600 mb-4">Items you always want on the list — they're added automatically every time you click “Add week's ingredients”.</p>
<form method="post" action="/app/staples/add" class="flex gap-2 mb-5 max-w-md">
  <input name="label" required aria-label="Add staple" placeholder="Add staple (e.g. milk)" autocomplete="off" class="flex-1 rounded-lg border border-stone-300 px-3 py-2">
  <button class="rounded-lg bg-emerald-600 text-white font-semibold px-4 hover:bg-emerald-700">Add</button>
</form>
${staples.results.length === 0 ? `<p class="text-stone-500 text-sm">No staples yet.</p>` : `<ul class="rounded-xl bg-white border border-stone-200 divide-y divide-stone-100">
${staples.results.map((s) => `<li class="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
  <span>${esc(s.label)}</span>
  <span class="flex items-center gap-2">
    <form method="post" action="/app/staples/category">
      <input type="hidden" name="id" value="${s.id}">
      <select name="category" data-autosubmit aria-label="Category for ${esc(s.label)}" class="rounded border border-stone-200 text-xs text-stone-600 px-1 py-0.5 bg-white">
        ${[...new Set([...STANDARD_CATEGORIES, s.category])].map((cat) => `<option${cat === s.category ? ' selected' : ''}>${esc(cat)}</option>`).join('')}
      </select>
    </form>
    <form method="post" action="/app/staples/delete"><input type="hidden" name="id" value="${s.id}"><button aria-label="Remove ${esc(s.label)}" class="text-stone-500 hover:text-red-600">✕</button></form>
  </span>
</li>`).join('')}
</ul>`}
</div>`;
  return c.html(page({ title: 'Staples', body, user, path: '/app/staples', noindex: true }));
});

app.post('/app/staples/add', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const label = clip(String(f.label || '').trim(), 200);
  if (label) {
    const existing = await c.env.DB.prepare('SELECT id FROM staples WHERE household_id = ? AND lower(label) = lower(?)')
      .bind(h.id, label).first();
    if (!existing) {
      await c.env.DB.prepare('INSERT INTO staples (id, household_id, label, category) VALUES (?, ?, ?, ?)')
        .bind(uid(), h.id, label, categorize(label)).run();
    }
  }
  return c.redirect('/app/staples');
});

app.post('/app/staples/category', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const category = String(f.category || '').trim().slice(0, 100);
  if (category) {
    await c.env.DB.prepare('UPDATE staples SET category = ? WHERE id = ? AND household_id = ?')
      .bind(category, String(f.id || ''), h.id).run();
  }
  return c.redirect('/app/staples');
});

app.post('/app/staples/delete', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  await c.env.DB.prepare('DELETE FROM staples WHERE id = ? AND household_id = ?').bind(String(f.id || ''), h.id).run();
  return c.redirect('/app/staples');
});

// ---------- pantry (what you already have at home) ----------
const PANTRY_LEVELS = ['stocked', 'low', 'out'];
const PANTRY_LEVEL_LABELS = { stocked: 'Stocked', low: 'Running low', out: 'Out' };

app.get('/app/pantry', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const items = await c.env.DB.prepare('SELECT * FROM pantry_items WHERE household_id = ? ORDER BY label COLLATE NOCASE').bind(h.id).all();
  const needed = items.results.filter((i) => i.level !== 'stocked');
  const added = c.req.query('added');
  const notice = added === undefined ? '' : Number(added) > 0
    ? `Added ${Number(added)} item${Number(added) === 1 ? '' : 's'} to the grocery list.`
    : 'Everything low or out is already on the list.';
  const body = `
${notice ? `<p role="status" class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">${esc(notice)}</p>` : ''}
<h1 class="text-2xl font-bold mb-1">Pantry</h1>
<p class="text-sm text-stone-500 mb-5 max-w-2xl">What you already have at home. <strong>Stocked</strong> items are skipped when "Add week's ingredients" builds your grocery list; mark them <strong>low</strong> or <strong>out</strong> after cooking and send them to the list in one tap.</p>
<div class="flex flex-wrap gap-2 mb-5">
  <form method="post" action="/app/pantry/add" class="flex gap-2 max-w-md">
    <input name="label" required maxlength="200" aria-label="Add pantry item" autocomplete="off" placeholder="Add what you have (e.g. rice, olive oil)" class="flex-1 rounded-lg border border-stone-300 px-3 py-2">
    <button class="rounded-lg bg-emerald-600 text-white font-semibold px-4 hover:bg-emerald-700">Add</button>
  </form>
  ${needed.length ? `<form method="post" action="/app/pantry/to-list"><button class="rounded-lg border border-emerald-600 text-emerald-700 text-sm font-semibold px-4 py-2 hover:bg-emerald-50">Add ${needed.length} low/out item${needed.length === 1 ? '' : 's'} to grocery list</button></form>` : ''}
  <a href="/app/list" class="rounded-lg border border-stone-300 text-sm px-4 py-2 hover:bg-stone-100">Grocery list</a>
</div>
${items.results.length === 0 ? `<p class="text-stone-500 text-sm">Nothing tracked yet — add the basics you always keep at home (rice, pasta, oil, spices…).</p>` : `<ul class="rounded-xl bg-white border border-stone-200 divide-y divide-stone-100 max-w-2xl">
${items.results.map((i) => `<li class="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
  <span class="min-w-0 break-words ${i.level === 'out' ? 'text-stone-400 line-through' : ''}">${esc(i.label)}</span>
  <span class="flex shrink-0 items-center gap-1.5">
    <form method="post" action="/app/pantry/level">
      <input type="hidden" name="id" value="${i.id}">
      <select name="level" data-autosubmit aria-label="Stock level for ${esc(i.label)}" class="rounded border ${i.level === 'stocked' ? 'border-emerald-300 text-emerald-700' : i.level === 'low' ? 'border-amber-300 text-amber-700' : 'border-red-200 text-red-600'} bg-transparent text-xs px-1 py-0.5">
        ${PANTRY_LEVELS.map((l) => `<option value="${l}"${l === i.level ? ' selected' : ''}>${PANTRY_LEVEL_LABELS[l]}</option>`).join('')}
      </select>
    </form>
    ${i.level === 'stocked' ? `<form method="post" action="/app/pantry/level"><input type="hidden" name="id" value="${i.id}"><input type="hidden" name="level" value="out"><button class="rounded border border-stone-300 px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-100">Used up</button></form>` : ''}
    <form method="post" action="/app/pantry/delete"><input type="hidden" name="id" value="${i.id}"><button aria-label="Remove ${esc(i.label)}" class="text-stone-500 hover:text-red-600">✕</button></form>
  </span>
</li>`).join('')}
</ul>`}`;
  return c.html(page({ title: 'Pantry', body, user, path: '/app/pantry', noindex: true }));
});

app.post('/app/pantry/add', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  for (const raw of splitListInput(clip(String(f.label || ''), 500))) {
    const label = clip(raw.trim(), 200);
    if (!label) continue;
    const existing = await c.env.DB.prepare('SELECT id FROM pantry_items WHERE household_id = ? AND lower(label) = lower(?)').bind(h.id, label).first();
    if (existing) {
      await c.env.DB.prepare("UPDATE pantry_items SET level = 'stocked', updated_at = datetime('now') WHERE id = ?").bind(existing.id).run();
    } else {
      await c.env.DB.prepare('INSERT INTO pantry_items (id, household_id, label) VALUES (?, ?, ?)').bind(uid(), h.id, label).run();
    }
  }
  return c.redirect('/app/pantry');
});

app.post('/app/pantry/level', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const level = String(f.level || '');
  if (PANTRY_LEVELS.includes(level)) {
    await c.env.DB.prepare("UPDATE pantry_items SET level = ?, updated_at = datetime('now') WHERE id = ? AND household_id = ?")
      .bind(level, String(f.id || ''), h.id).run();
  }
  return c.redirect('/app/pantry');
});

app.post('/app/pantry/delete', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  await c.env.DB.prepare('DELETE FROM pantry_items WHERE id = ? AND household_id = ?').bind(String(f.id || ''), h.id).run();
  return c.redirect('/app/pantry');
});

app.post('/app/pantry/to-list', async (c) => {
  const h = c.get('household');
  const needed = await c.env.DB.prepare("SELECT label FROM pantry_items WHERE household_id = ? AND level != 'stocked'").bind(h.id).all();
  const existing = await c.env.DB.prepare('SELECT id, label, checked FROM shopping_items WHERE household_id = ?').bind(h.id).all();
  let added = 0;
  for (const p of needed.results) {
    const key = pantryKey(p.label);
    const hit = existing.results.find((r) => pantryKey(r.label) === key);
    if (hit) {
      if (hit.checked) {
        await c.env.DB.prepare('UPDATE shopping_items SET checked = 0 WHERE id = ?').bind(hit.id).run();
        added++;
      }
    } else {
      await c.env.DB.prepare('INSERT INTO shopping_items (id, household_id, label, category) VALUES (?, ?, ?, ?)')
        .bind(uid(), h.id, p.label, categorize(p.label)).run();
      added++;
    }
  }
  if (added) await bumpVersion(c.env, h.id);
  return c.redirect(`/app/pantry?added=${added}`);
});

app.get('/app/list/version', async (c) => {
  const h = c.get('household');
  const row = await c.env.DB.prepare('SELECT version FROM households WHERE id = ?').bind(h.id).first();
  return c.json({ version: row?.version ?? 0 });
});

// ---------- share ----------
app.get('/app/share', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const link = `${c.env.SITE_URL}/s/${h.share_token}`;
  const body = `<div class="max-w-lg mx-auto py-10 text-center">
<h1 class="text-2xl font-bold">Share with your family</h1>
<p class="mt-2 text-stone-600">Anyone with this link can see this week's plan, check off grocery items, and 👍/👎 planned meals — no account or app needed.</p>
<div class="mt-6 flex gap-2">
  <input readonly aria-label="Share link" value="${esc(link)}" id="share-url" class="flex-1 rounded-lg border border-stone-300 px-3 py-2.5 text-sm bg-white">
  <button type="button" data-copy="share-url" class="rounded-lg bg-emerald-600 text-white font-semibold px-4 hover:bg-emerald-700">Copy</button>
</div>
<form method="post" action="/app/share/rotate" class="mt-4" data-confirm="Create a new link? The current link will stop working for everyone.">
  <button class="text-sm text-stone-500 hover:text-red-600 hover:underline">Reset link (revokes the old one)</button>
</form>
<div class="mt-10 rounded-xl border border-stone-200 bg-white p-5 text-left">
  <h2 class="font-semibold">Meal plan in your calendar</h2>
  <p class="mt-1 text-sm text-stone-600">Subscribe to this feed in Google Calendar, Apple Calendar or Outlook to see planned meals as all-day events (last week through the next 4 weeks; resetting the share link also changes this URL).</p>
  <div class="mt-3 flex gap-2">
    <input readonly aria-label="Calendar feed URL" value="${esc(link)}/calendar.ics" id="cal-url" class="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white">
    <button type="button" data-copy="cal-url" class="rounded-lg bg-emerald-600 text-white font-semibold px-4 hover:bg-emerald-700">Copy</button>
  </div>
</div>
<a href="/app" class="inline-block mt-6 text-sm text-emerald-700 underline">Back to planner</a>
<div class="mt-6 rounded-xl border border-stone-200 bg-white p-5 text-left">
  <h2 class="font-semibold">Your data</h2>
  <p class="mt-1 text-sm text-stone-600">Your recipes are yours. Download the whole recipe box as JSON (schema.org Recipe format) — importable elsewhere, good as a backup.</p>
  <a href="/app/export.json" download="mealloop-recipes.json" class="mt-3 inline-block rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold hover:bg-stone-100">Download recipes (JSON)</a>
</div>
<div class="mt-6 rounded-xl border border-stone-200 bg-white p-5 text-left">
  <h2 class="font-semibold">Account</h2>
  <p class="mt-1 text-sm text-stone-600">Signed in as <strong>${esc(user.email)}</strong>.</p>
  <form method="post" action="/app/account/delete" class="mt-3" data-confirm="Permanently delete your account and ALL household data (recipes, plans, grocery list)? This cannot be undone and the share link will stop working.">
    <button class="text-sm text-red-600 hover:underline">Delete account &amp; all data</button>
  </form>
  <p class="mt-1.5 text-xs text-stone-500">Removes your recipes, meal plans, grocery list, staples, saved menus and login — immediately and permanently.</p>
</div>
</div>`;
  return c.html(page({ title: 'Share & account', body, user, path: '/app/share', noindex: true }));
});

app.get('/app/export.json', async (c) => {
  const h = c.get('household');
  const rows = await c.env.DB.prepare('SELECT * FROM recipes WHERE household_id = ? ORDER BY created_at').bind(h.id).all();
  const recipes = rows.results.map((r) => {
    const out = {
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      name: r.title,
      recipeIngredient: JSON.parse(r.ingredients_json || '[]'),
      recipeInstructions: JSON.parse(r.steps_json || '[]').map((s) => ({ '@type': 'HowToStep', text: s })),
      dateCreated: r.created_at,
    };
    if (r.description) out.description = r.description;
    if (r.source_url) out.url = r.source_url;
    if (r.image_url) out.image = r.image_url;
    if (r.servings) out.recipeYield = r.servings;
    if (r.prep_minutes) out.prepTime = `PT${r.prep_minutes}M`;
    if (r.cook_minutes) out.cookTime = `PT${r.cook_minutes}M`;
    if (r.tags) out.keywords = r.tags;
    if (r.notes) out.comment = r.notes;
    return out;
  });
  return c.json({ exportedAt: new Date().toISOString(), household: h.name, recipeCount: recipes.length, recipes }, 200, {
    'Content-Disposition': 'attachment; filename="mealloop-recipes.json"',
  });
});

app.get('/s/:token/calendar.ics', async (c) => {
  const h = await shareHousehold(c);
  if (!h) return c.notFound();
  const rows = await c.env.DB.prepare(
    `SELECT p.id, p.date, p.meal, p.note, p.scale, r.title FROM plan_entries p LEFT JOIN recipes r ON r.id = p.recipe_id
     WHERE p.household_id = ? AND p.date BETWEEN ? AND ? ORDER BY p.date, p.meal`
  ).bind(h.id, shiftDays(today(), -7), shiftDays(today(), 28)).all();
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const events = rows.results.map((e) => {
    const label = e.title ? `${e.title}${e.scale && e.scale !== 1 ? ` \u00d7${e.scale}` : ''}` : (e.note || 'Meal');
    const meal = e.meal.charAt(0).toUpperCase() + e.meal.slice(1);
    return [
      'BEGIN:VEVENT',
      `UID:${e.id}@mealloop.zalize.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${e.date.replace(/-/g, '')}`,
      `SUMMARY:${icsEscape(`${meal}: ${label}`)}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    ].join('\r\n');
  }).join('\r\n');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MealLoop//meal plan//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${icsEscape(`${h.name} \u2014 meal plan`)}`,
    'X-PUBLISHED-TTL:PT1H',
    events,
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n') + '\r\n';
  return c.body(ics, 200, { 'Content-Type': 'text/calendar; charset=utf-8' });
});

app.post('/app/share/rotate', async (c) => {
  const h = c.get('household');
  await c.env.DB.prepare('UPDATE households SET share_token = ? WHERE id = ?').bind(token(20), h.id).run();
  return c.redirect('/app/share');
});

app.post('/app/account/delete', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const members = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM household_members WHERE household_id = ?').bind(h.id).first();
  const stmts = [];
  if (Number(members?.n || 1) <= 1) {
    stmts.push(
      c.env.DB.prepare('DELETE FROM menu_entries WHERE menu_id IN (SELECT id FROM menus WHERE household_id = ?)').bind(h.id),
      c.env.DB.prepare('DELETE FROM menus WHERE household_id = ?').bind(h.id),
      c.env.DB.prepare('DELETE FROM staples WHERE household_id = ?').bind(h.id),
      c.env.DB.prepare('DELETE FROM pantry_items WHERE household_id = ?').bind(h.id),
      c.env.DB.prepare('DELETE FROM plan_reactions WHERE plan_entry_id IN (SELECT id FROM plan_entries WHERE household_id = ?)').bind(h.id),
      c.env.DB.prepare('DELETE FROM plan_entries WHERE household_id = ?').bind(h.id),
      c.env.DB.prepare('DELETE FROM shopping_items WHERE household_id = ?').bind(h.id),
      c.env.DB.prepare('DELETE FROM recipes WHERE household_id = ?').bind(h.id),
      c.env.DB.prepare('DELETE FROM household_members WHERE household_id = ?').bind(h.id),
      c.env.DB.prepare('DELETE FROM households WHERE id = ?').bind(h.id)
    );
  } else {
    stmts.push(c.env.DB.prepare('DELETE FROM household_members WHERE household_id = ? AND user_id = ?').bind(h.id, user.id));
  }
  stmts.push(
    c.env.DB.prepare('DELETE FROM email_intents WHERE email = ?').bind(user.email),
    c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id)
  );
  await c.env.DB.batch(stmts);
  await logout(c);
  c.header('Set-Cookie', clearCookie());
  return c.redirect('/');
});

async function shareHousehold(c) {
  return c.env.DB.prepare('SELECT * FROM households WHERE share_token = ?').bind(c.req.param('token')).first();
}

app.get('/s/:token', async (c) => {
  const h = await shareHousehold(c);
  if (!h) return c.notFound();
  const weekParam = String(c.req.query('week') || '');
  const week = /^\d{4}-\d{2}-\d{2}$/.test(weekParam) ? weekParam : undefined;
  const days = weekDates(week);
  const isCurrent = days[0] === weekDates()[0];
  let voter = getVoter(c);
  if (!voter || !/^[a-z0-9]{1,40}$/.test(voter)) {
    voter = token();
    c.header('Set-Cookie', voterCookie(voter));
  }
  const [entries, items, reactions] = await Promise.all([
    c.env.DB.prepare('SELECT p.*, r.title AS recipe_title FROM plan_entries p LEFT JOIN recipes r ON r.id = p.recipe_id WHERE p.household_id = ? AND p.date BETWEEN ? AND ? ORDER BY p.date').bind(h.id, days[0], days[6]).all(),
    c.env.DB.prepare('SELECT * FROM shopping_items WHERE household_id = ? ORDER BY category, COALESCE(sort_index, 1000000), created_at').bind(h.id).all(),
    c.env.DB.prepare('SELECT r.plan_entry_id, r.reaction, COUNT(*) n, MAX(r.voter = ?) mine FROM plan_reactions r JOIN plan_entries p ON p.id = r.plan_entry_id WHERE p.household_id = ? AND p.date BETWEEN ? AND ? GROUP BY r.plan_entry_id, r.reaction').bind(voter, h.id, days[0], days[6]).all(),
  ]);
  const reactFor = (entryId, kind) => reactions.results.find((r) => r.plan_entry_id === entryId && r.reaction === kind);
  const reactHtml = (e) => {
    const up = reactFor(e.id, 'up');
    const down = reactFor(e.id, 'down');
    const btn = (kind, r, glyph) => `<form method="post" action="/s/${h.share_token}/react" class="inline"><input type="hidden" name="entry" value="${e.id}"><input type="hidden" name="reaction" value="${kind}">${week ? `<input type="hidden" name="week" value="${days[0]}">` : ''}<button aria-label="${kind === 'up' ? 'Looking forward to this' : 'Not a fan of this'}" aria-pressed="${r?.mine ? 'true' : 'false'}" class="rounded-md px-1.5 py-0.5 text-xs ${r?.mine ? 'bg-emerald-100 text-emerald-800' : 'text-stone-400 hover:bg-stone-100'}">${glyph}${r?.n ? ` ${r.n}` : ''}</button></form>`;
    return `<span class="ml-1 inline-flex gap-0.5 align-middle print:hidden">${btn('up', up, '\u{1F44D}')}${btn('down', down, '\u{1F44E}')}</span>`;
  };
  const planHtml = `
<section class="mb-8">
  <h1 class="text-2xl font-bold mb-1">${esc(h.name)} — ${isCurrent ? 'this week' : `week of ${dayLabel(days[0])}`}</h1>
  <p class="text-sm text-stone-500 mb-2">Shared family plan · tap 👍/👎 on meals, check items below to sync with everyone</p>
  <p class="mb-4 text-sm flex items-center gap-3">
    <a class="text-emerald-700 hover:underline" data-swipe-prev href="/s/${h.share_token}?week=${shiftDays(days[0], -7)}">← Previous week</a>
    ${isCurrent ? '' : `<a class="text-emerald-700 hover:underline" href="/s/${h.share_token}">This week</a>`}
    <a class="text-emerald-700 hover:underline" data-swipe-next href="/s/${h.share_token}?week=${shiftDays(days[0], 7)}">Next week →</a>
  </p>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
  ${days.map((d) => {
    const es = entries.results.filter((e) => e.date === d);
    return `<div class="rounded-xl ${d < today() ? 'bg-stone-100 print:bg-white' : 'bg-white'} border ${d === today() ? 'border-emerald-500 ring-1 ring-emerald-200' : 'border-stone-200'} p-3">
      <h2 class="text-sm font-semibold${d === today() ? ' text-emerald-700' : ''}">${dayLabel(d)}</h2>
      ${es.length ? es.map((e) => `<p class="mt-1.5 text-sm"><span class="text-[10px] uppercase text-stone-500 mr-1">${e.meal}</span>${e.recipe_id ? `<a class="text-emerald-700 hover:underline" href="/s/${h.share_token}/r/${e.recipe_id}">${esc(e.recipe_title)}</a>` : esc(e.note)}${reactHtml(e)}</p>`).join('') : '<p class="mt-1.5 text-xs text-stone-500">Nothing planned</p>'}
    </div>`;
  }).join('')}
  </div>
</section>`;
  const stores = (h.stores || '').split(',').filter(Boolean);
  const storeFilter = stores.includes(c.req.query('store')) ? c.req.query('store') : '';
  const shown = storeFilter ? items.results.filter((i) => !i.store || i.store === storeFilter) : items.results;
  const ctaHtml = `
<aside class="mt-10 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center print:hidden">
  <p class="text-sm text-emerald-900">This live plan &amp; grocery list is made with <strong>MealLoop</strong> — plan your own family's week in minutes.</p>
  <a href="/" class="mt-2 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Start yours — free during beta</a>
</aside>`;
  const body = planHtml + listBody(h, shown, { editable: false, canAdd: true, base: `/s/${h.share_token}`, shareLink: false, suggestions: COMMON_ITEMS, stores, storeFilter, extraQuery: week ? `week=${week}` : '' }) + ctaHtml;
  return c.html(page({ title: `${h.name} — meal plan`, body, path: `/s/${h.share_token}`, noindex: true }));
});

app.get('/s/:token/r/:id', async (c) => {
  const h = await shareHousehold(c);
  if (!h) return c.notFound();
  const r = await c.env.DB.prepare('SELECT * FROM recipes WHERE id = ? AND household_id = ?').bind(c.req.param('id'), h.id).first();
  if (!r) return c.notFound();
  const body = `<p class="mb-4 text-sm print:hidden" data-poll data-version="${h.version}" data-base="/s/${h.share_token}"><a class="text-emerald-700 underline" href="/s/${h.share_token}">← Back to ${esc(h.name)}'s week</a></p>` + recipeBody(r, false, h.units);
  return c.html(page({ title: r.title, body, path: `/s/${h.share_token}/r/${r.id}`, noindex: true }));
});

app.post('/s/:token/react', async (c) => {
  const h = await shareHousehold(c);
  if (!h) return c.notFound();
  let voter = getVoter(c);
  if (!voter || !/^[a-z0-9]{1,40}$/.test(voter)) {
    voter = token();
    c.header('Set-Cookie', voterCookie(voter));
  }
  const f = await c.req.parseBody();
  const reaction = String(f.reaction || '');
  const entryId = String(f.entry || '');
  if (reaction !== 'up' && reaction !== 'down') return c.notFound();
  const entry = await c.env.DB.prepare('SELECT id FROM plan_entries WHERE id = ? AND household_id = ?').bind(entryId, h.id).first();
  if (!entry) return c.notFound();
  const existing = await c.env.DB.prepare('SELECT id, reaction FROM plan_reactions WHERE plan_entry_id = ? AND voter = ?').bind(entryId, voter).first();
  if (existing && existing.reaction === reaction) {
    await c.env.DB.prepare('DELETE FROM plan_reactions WHERE id = ?').bind(existing.id).run();
  } else if (existing) {
    await c.env.DB.prepare('UPDATE plan_reactions SET reaction = ? WHERE id = ?').bind(reaction, existing.id).run();
  } else {
    await c.env.DB.prepare('INSERT INTO plan_reactions (id, plan_entry_id, voter, reaction) VALUES (?, ?, ?, ?)').bind(uid(), entryId, voter, reaction).run();
  }
  await bumpVersion(c.env, h.id);
  const week = String(f.week || '');
  return c.redirect(`/s/${h.share_token}${/^\d{4}-\d{2}-\d{2}$/.test(week) ? `?week=${week}` : ''}`);
});

app.post('/s/:token/toggle', async (c) => {
  const h = await shareHousehold(c);
  if (!h) return c.notFound();
  const f = await c.req.parseBody();
  await c.env.DB.prepare('UPDATE shopping_items SET checked = 1 - checked WHERE id = ? AND household_id = ?').bind(String(f.id || ''), h.id).run();
  await bumpVersion(c.env, h.id);
  if (c.req.header('X-Requested-With') === 'fetch') return c.json({ ok: true });
  const back = String(f.back || '');
  return c.redirect(back.startsWith(`/s/${h.share_token}`) ? back : `/s/${h.share_token}`);
});

app.post('/s/:token/add', async (c) => {
  const h = await shareHousehold(c);
  if (!h) return c.notFound();
  const f = await c.req.parseBody();
  const labels = splitListInput(clip(String(f.label || ''), 500));
  const count = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM shopping_items WHERE household_id = ?').bind(h.id).first();
  let room = 500 - count.n;
  for (const label of labels) {
    if (room <= 0) break;
    await addListItem(c.env, h.id, clip(label, 200));
    room--;
  }
  const back = String(f.back || '');
  return c.redirect(back.startsWith(`/s/${h.share_token}`) ? back : `/s/${h.share_token}`);
});

app.get('/s/:token/version', async (c) => {
  const h = await shareHousehold(c);
  if (!h) return c.notFound();
  return c.json({ version: h.version });
});

// ---------- Ops: aggregate stats readout (secret-gated; used because the D1 HTTP API
// is not always reachable from ops tooling — exposes only the same first-party
// aggregate counters the app already stores, never user data) ----------
app.get('/ops/stats', async (c) => {
  const auth = c.req.header('authorization') || '';
  const key = c.env.ADMIN_STATS_KEY;
  if (!key || auth !== `Bearer ${key}`) return c.notFound();
  const days = Math.min(90, Math.max(1, parseInt(c.req.query('days') || '7', 10) || 7));
  const since = `-${days} days`;
  const [paths, terms, intents, reactions, referrers] = await Promise.all([
    c.env.DB.prepare("SELECT path, SUM(views) views FROM analytics_daily WHERE day >= date('now', ?) GROUP BY path ORDER BY views DESC LIMIT 40").bind(since).all(),
    c.env.DB.prepare("SELECT term, SUM(count) count FROM search_terms WHERE day >= date('now', ?) GROUP BY term ORDER BY count DESC LIMIT 40").bind(since).all(),
    c.env.DB.prepare('SELECT COUNT(*) total, SUM(confirmed) confirmed, SUM(unsubscribed_at IS NOT NULL) unsubscribed FROM email_intents').first(),
    c.env.DB.prepare("SELECT reaction, COUNT(*) n, COUNT(DISTINCT voter) voters FROM plan_reactions WHERE created_at >= datetime('now', ?) GROUP BY reaction").bind(since).all(),
    c.env.DB.prepare("SELECT host, SUM(views) views FROM referrers_daily WHERE day >= date('now', ?) GROUP BY host ORDER BY views DESC LIMIT 40").bind(since).all(),
  ]);
  return c.json({ days, paths: paths.results, search_terms: terms.results, email_intents: intents, reactions: reactions.results, referrers: referrers.results });
});

// Applies pending schema migrations via the Worker's D1 binding (same D1 HTTP
// API outage workaround as /ops/stats). Idempotent DDL only, same key gate.
app.post('/ops/migrate', async (c) => {
  const auth = c.req.header('authorization') || '';
  const key = c.env.ADMIN_STATS_KEY;
  if (!key || auth !== `Bearer ${key}`) return c.notFound();
  await c.env.DB.exec("CREATE TABLE IF NOT EXISTS pantry_items (id TEXT PRIMARY KEY, household_id TEXT NOT NULL REFERENCES households(id), label TEXT NOT NULL, level TEXT NOT NULL DEFAULT 'stocked', updated_at TEXT NOT NULL DEFAULT (datetime('now')))");
  await c.env.DB.exec('CREATE INDEX IF NOT EXISTS idx_pantry_household ON pantry_items(household_id)');
  await c.env.DB.exec("CREATE TABLE IF NOT EXISTS plan_reactions (id TEXT PRIMARY KEY, plan_entry_id TEXT NOT NULL REFERENCES plan_entries(id), voter TEXT NOT NULL, reaction TEXT NOT NULL CHECK (reaction IN ('up','down')), created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(plan_entry_id, voter))");
  await c.env.DB.exec('CREATE INDEX IF NOT EXISTS idx_plan_reactions_entry ON plan_reactions(plan_entry_id)');
  await c.env.DB.exec('CREATE TABLE IF NOT EXISTS referrers_daily (day TEXT NOT NULL, host TEXT NOT NULL, views INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, host))');
  return c.json({ ok: true });
});

// Deletes disposable QA accounts (acceptance-review test accounts) with the
// same cascade as self-serve account deletion. Only matches known QA email
// patterns; same key gate as /ops/stats.
app.post('/ops/cleanup-qa', async (c) => {
  const auth = c.req.header('authorization') || '';
  const key = c.env.ADMIN_STATS_KEY;
  if (!key || auth !== `Bearer ${key}`) return c.notFound();
  const users = await c.env.DB.prepare("SELECT id, email FROM users WHERE email LIKE 'delivered+qa%@resend.dev' OR email LIKE 'qa+%@example.com'").all();
  const deleted = [];
  for (const u of users.results) {
    const memberships = await c.env.DB.prepare('SELECT household_id FROM household_members WHERE user_id = ?').bind(u.id).all();
    const stmts = [];
    for (const m of memberships.results) {
      const members = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM household_members WHERE household_id = ?').bind(m.household_id).first();
      if (Number(members?.n || 1) <= 1) {
        stmts.push(
          c.env.DB.prepare('DELETE FROM menu_entries WHERE menu_id IN (SELECT id FROM menus WHERE household_id = ?)').bind(m.household_id),
          c.env.DB.prepare('DELETE FROM menus WHERE household_id = ?').bind(m.household_id),
          c.env.DB.prepare('DELETE FROM staples WHERE household_id = ?').bind(m.household_id),
          c.env.DB.prepare('DELETE FROM pantry_items WHERE household_id = ?').bind(m.household_id),
          c.env.DB.prepare('DELETE FROM plan_reactions WHERE plan_entry_id IN (SELECT id FROM plan_entries WHERE household_id = ?)').bind(m.household_id),
          c.env.DB.prepare('DELETE FROM plan_entries WHERE household_id = ?').bind(m.household_id),
          c.env.DB.prepare('DELETE FROM shopping_items WHERE household_id = ?').bind(m.household_id),
          c.env.DB.prepare('DELETE FROM recipes WHERE household_id = ?').bind(m.household_id),
          c.env.DB.prepare('DELETE FROM household_members WHERE household_id = ?').bind(m.household_id),
          c.env.DB.prepare('DELETE FROM households WHERE id = ?').bind(m.household_id)
        );
      } else {
        stmts.push(c.env.DB.prepare('DELETE FROM household_members WHERE household_id = ? AND user_id = ?').bind(m.household_id, u.id));
      }
    }
    stmts.push(
      c.env.DB.prepare('DELETE FROM email_intents WHERE email = ?').bind(u.email),
      c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(u.id)
    );
    await c.env.DB.batch(stmts);
    deleted.push(u.email);
  }
  return c.json({ deleted });
});

// ---------- SEO ----------
app.get('/robots.txt', (c) =>
  c.text(`User-agent: *\nAllow: /\nDisallow: /app\nDisallow: /s/\nSitemap: ${c.env.SITE_URL}/sitemap.xml\n`)
);

function sitePaths() {
  return ['/', '/pricing', '/faq', '/guides', '/about', '/press', '/privacy', '/terms', ...GUIDES.map((g) => `/guides/${g.slug}`)];
}

app.get('/sitemap.xml', (c) => {
  const urls = sitePaths();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${c.env.SITE_URL}${u}</loc></url>`).join('\n')}
</urlset>`;
  return c.body(xml, 200, { 'Content-Type': 'application/xml' });
});

app.get('/indexnow-key.txt', (c) => c.text(c.env.INDEXNOW_KEY || ''));
app.get('/:key{[a-f0-9]{32}\\.txt}', (c) => {
  const key = c.req.param('key').replace('.txt', '');
  if (c.env.INDEXNOW_KEY && key === c.env.INDEXNOW_KEY) return c.text(key);
  return c.notFound();
});

app.notFound((c) =>
  c.html(page({ title: 'Not found', body: `<div class="py-24 text-center"><h1 class="text-3xl font-bold">404</h1><p class="mt-2 text-stone-600">That page doesn't exist.</p><a class="mt-4 inline-block text-emerald-700 underline" href="/">Go home</a></div>`, path: '/404', noindex: true }), 404)
);

// Weekly IndexNow push of every indexable URL (same pattern as ShelfMark's
// runIndexNow: full sitemap in batches, fired from the cron trigger).
async function runIndexNow(env) {
  if (!env.INDEXNOW_KEY) return;
  const urls = sitePaths().map((p) => env.SITE_URL + p);
  for (let i = 0; i < urls.length; i += 8000) {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(env.SITE_URL).hostname,
        key: env.INDEXNOW_KEY,
        urlList: urls.slice(i, i + 8000)
      })
    });
  }
}

export default {
  fetch: app.fetch,
  scheduled: (event, env, ctx) => ctx.waitUntil(runIndexNow(env))
};
