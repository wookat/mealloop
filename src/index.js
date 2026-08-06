import { Hono } from 'hono';
import { page } from './layout.js';
import { getUser, sendMagicCode, verifyCode, logout, sessionCookie, clearCookie } from './auth.js';
import { importRecipeFromUrl } from './recipes.js';
import { uid, token, esc, weekDates, categorize, today, mergeIngredients, scaleIngredient, ingredientKey, STANDARD_CATEGORIES } from './util.js';
import { GUIDES } from './guides.js';

const app = new Hono();

// ---------- security headers + first-party cookie-free analytics ----------
app.use('*', async (c, next) => {
  await next();
  try {
    c.res = new Response(c.res.body, c.res);
    c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    c.res.headers.set('X-Frame-Options', 'DENY');
    c.res.headers.set('X-Content-Type-Options', 'nosniff');
    c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.res.headers.set('Content-Security-Policy', "default-src 'self'; img-src * data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'");
  } catch {}
  try {
    const ct = c.res.headers.get('content-type') || '';
    if (c.req.method === 'GET' && ct.includes('text/html') && c.res.status === 200) {
      const raw = new URL(c.req.url).pathname;
      // Never persist share tokens in analytics.
      const path = raw.startsWith('/s/') ? '/s' : raw.split('/').slice(0, 3).join('/') || '/';
      c.executionCtx.waitUntil(
        c.env.DB.prepare(
          'INSERT INTO analytics_daily (day, path, views) VALUES (?, ?, 1) ON CONFLICT(day, path) DO UPDATE SET views = views + 1'
        ).bind(today(), path).run()
      );
    }
  } catch {}
});

// ---------- marketing ----------
app.get('/', async (c) => {
  const user = await getUser(c);
  const body = `
<section class="py-10 sm:py-16 text-center">
  <p class="inline-block mb-4 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold tracking-wide">FREE · NO APP REQUIRED · NO ADS</p>
  <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900 max-w-2xl mx-auto">What's for dinner? <span class="text-emerald-600">Decide once, together.</span></h1>
  <p class="mt-4 text-lg text-stone-600 max-w-xl mx-auto">Import recipes from any site, plan your week, and share one live grocery list with your whole family — with a single link. No accounts needed for them.</p>
  <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
    <a href="${user ? '/app' : '/login'}" class="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-lg hover:bg-emerald-700 shadow-sm">${user ? 'Open your planner' : 'Start planning — free'}</a>
    <a href="/guides" class="px-6 py-3 rounded-xl border border-stone-300 font-semibold text-lg hover:bg-stone-100">How it works</a>
  </div>
</section>
<section class="grid sm:grid-cols-3 gap-4 py-8">
  ${[
    ['Import from any recipe site', 'Paste a URL — we pull the title, photo, ingredients and steps automatically. Steps stay readable right here.'],
    ['One live grocery list', 'Ingredients from your weekly plan are grouped by store aisle. Checking an item syncs for everyone in seconds.'],
    ['Share with a link', 'Your family sees the week and the list with one link — no app install, no sign-up, no subscription.'],
  ].map(([t, d]) => `
  <div class="rounded-2xl bg-white border border-stone-200 p-5">
    <h3 class="font-semibold text-stone-900">${t}</h3>
    <p class="mt-1.5 text-sm text-stone-600">${d}</p>
  </div>`).join('')}
</section>
<section class="rounded-2xl bg-emerald-700 text-white p-6 sm:p-8 my-8">
  <h2 class="text-xl font-bold">Get new features first</h2>
  <p class="text-emerald-100 text-sm mt-1">Leave your email and we'll let you know when meal rotation, leftovers tracking and more launch.</p>
  <form method="post" action="/subscribe" class="mt-4 flex flex-col sm:flex-row gap-2 max-w-md">
    <input type="email" name="email" required aria-label="Email address" placeholder="you@example.com" class="flex-1 rounded-lg px-3 py-2.5 text-stone-900 bg-white">
    <button class="rounded-lg bg-white text-emerald-700 font-semibold px-5 py-2.5 hover:bg-emerald-50">Notify me</button>
  </form>
  <p class="text-emerald-100 text-xs mt-2">Product updates only — unsubscribe any time. See our <a class="underline" href="/privacy">privacy policy</a>.</p>
</section>`;
  return c.html(page({ title: 'Family meal planning with real-time sync', description: 'Free family meal planner: import recipes from any site, plan your week, share one live grocery list with a single link.', body, user, path: '/' }));
});

app.post('/subscribe', async (c) => {
  const form = await c.req.parseBody();
  const email = String(form.email || '').trim().toLowerCase();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    const seen = await c.env.DB.prepare('SELECT id FROM email_intents WHERE email = ?').bind(email).first();
    if (!seen) await c.env.DB.prepare('INSERT INTO email_intents (id, email, source) VALUES (?, ?, ?)').bind(uid(), email, 'landing').run();
  }
  return c.html(page({ title: 'Thanks', body: `<div class="py-20 text-center"><h1 class="text-2xl font-bold">You're on the list 🎉</h1><p class="mt-2 text-stone-600">We'll email you when new features ship.</p><a class="mt-6 inline-block text-emerald-700 underline" href="/">Back home</a></div>`, path: '/subscribe', noindex: true }));
});

app.get('/privacy', (c) =>
  c.html(page({ title: 'Privacy', path: '/privacy', body: legalBody('Privacy Policy', `
<p>MealLoop is designed to be privacy-first. Controller: MealLoop (Zalize), contact <a class="text-emerald-700 underline" href="mailto:mealloop@zalize.com">mealloop@zalize.com</a>.</p>
<h2 class="font-semibold text-lg pt-2">What we collect and why</h2>
<ul class="list-disc pl-5 space-y-1">
<li><strong>Email address</strong> — to send login codes and run your account. Legal basis: performance of a contract (Art. 6(1)(b) GDPR).</li>
<li><strong>Your meal-planning content</strong> (recipes, plan entries, grocery items, household name) — to provide the service. Legal basis: contract.</li>
<li><strong>Product-update emails</strong>, only if you submit the signup form. Legal basis: consent (Art. 6(1)(a)); withdraw anytime by emailing us.</li>
<li><strong>Aggregate page counts</strong> (date + page path only, cookie-free, no IP, no device or user identifiers, no third-party trackers, no ads). Legal basis: legitimate interest in measuring usage (Art. 6(1)(f)).</li>
</ul>
<h2 class="font-semibold text-lg pt-2">Cookies</h2>
<p>One strictly necessary cookie (<code>ml_session</code>, HttpOnly/Secure/SameSite=Lax, 30 days) is set only after you log in. No analytics or advertising cookies, so no consent banner is required.</p>
<h2 class="font-semibold text-lg pt-2">Processors and data location</h2>
<ul class="list-disc pl-5 space-y-1">
<li><strong>Cloudflare, Inc.</strong> — hosting, database (D1), key-value storage and headless rendering for recipe import.</li>
<li><strong>Resend (Plus Five Five, Inc.)</strong> — transactional email delivery of login codes.</li>
<li>Both may process data in the US under Standard Contractual Clauses / the EU-US Data Privacy Framework.</li>
</ul>
<h2 class="font-semibold text-lg pt-2">Retention</h2>
<ul class="list-disc pl-5 space-y-1">
<li>Login codes: 10 minutes. Session tokens: 30 days (or until you log out).</li>
<li>Account and meal-planning content: until you ask us to delete it.</li>
<li>Newsletter emails: until you unsubscribe. Aggregate page counts: 24 months (they contain no personal data).</li>
</ul>
<h2 class="font-semibold text-lg pt-2">Your rights</h2>
<p>You have the right to access, rectify, erase, restrict or object to processing, to data portability, to withdraw consent, and to lodge a complaint with your supervisory authority. Email <a class="text-emerald-700 underline" href="mailto:mealloop@zalize.com">mealloop@zalize.com</a> and we will respond within 30 days.</p>
<h2 class="font-semibold text-lg pt-2">Sharing</h2>
<p>We never sell your data. Anyone holding your household's share link can see that week's plan and grocery list without logging in — share it only with people you trust, and use "Reset link" on the Share page to revoke it.</p>
<p>MealLoop is not intended for children under 16.</p>`) }))
);

app.get('/terms', (c) =>
  c.html(page({ title: 'Terms', path: '/terms', body: legalBody('Terms of Service', `
<p>MealLoop is provided free of charge, "as is", without warranty of any kind.</p>
<ul class="list-disc pl-5 space-y-1">
<li>You retain ownership of the content you add. Imported recipes remain the property of their original publishers; we store them for your personal household use and always link back to the source.</li>
<li>Do not use MealLoop for unlawful content or to abuse the import service.</li>
<li>We may update these terms; continued use constitutes acceptance.</li>
</ul>`) }))
);

function legalBody(title, inner) {
  return `<article class="prose-sm max-w-2xl mx-auto py-8 space-y-4"><h1 class="text-2xl font-bold">${title}</h1>${inner}<p class="text-stone-500 text-sm">Last updated: 2026-08-05</p></article>`;
}

// ---------- pSEO guides ----------
app.get('/guides', (c) => {
  const body = `<div class="py-8 max-w-2xl mx-auto">
<h1 class="text-3xl font-bold">Meal planning guides</h1>
<p class="mt-2 text-stone-600">Practical guides for planning family meals without the chaos.</p>
<ul class="mt-6 space-y-3">
${GUIDES.map((g) => `<li class="rounded-xl bg-white border border-stone-200 p-4 hover:border-emerald-400"><a href="/guides/${g.slug}"><h2 class="font-semibold text-emerald-700">${esc(g.title)}</h2><p class="text-sm text-stone-600 mt-1">${esc(g.excerpt)}</p></a></li>`).join('')}
</ul></div>`;
  return c.html(page({ title: 'Meal planning guides', description: 'Practical guides for planning family meals: weekly planning, grocery lists, recipe import and more.', body, path: '/guides' }));
});

app.get('/guides/:slug', (c) => {
  const g = GUIDES.find((x) => x.slug === c.req.param('slug'));
  if (!g) return c.notFound();
  const body = `<article class="py-8 max-w-2xl mx-auto space-y-4">
<h1 class="text-3xl font-bold">${esc(g.title)}</h1>
${g.body}
<div class="rounded-xl bg-emerald-50 border border-emerald-200 p-4 mt-6"><p class="font-medium text-emerald-900">Try it with MealLoop — free, no app needed.</p><a href="/login" class="inline-block mt-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700">Start planning</a></div>
</article>`;
  return c.html(page({ title: g.title, description: g.excerpt, body, path: `/guides/${g.slug}` }));
});

// ---------- auth ----------
app.get('/login', async (c) => {
  const user = await getUser(c);
  if (user) return c.redirect('/app');
  const body = loginBody('');
  return c.html(page({ title: 'Log in', body, path: '/login', noindex: true }));
});

function loginBody(msg, email = '') {
  return `<div class="max-w-sm mx-auto py-14">
<h1 class="text-2xl font-bold text-center">Log in or sign up</h1>
<p class="text-center text-stone-600 text-sm mt-1">We'll email you a 6-digit code. No password needed.</p>
${msg ? `<p class="mt-4 text-center text-sm rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2">${esc(msg)}</p>` : ''}
${email
    ? `<form method="post" action="/verify" class="mt-6 space-y-3">
        <input type="hidden" name="email" value="${esc(email)}">
        <input name="code" aria-label="6-digit code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required autofocus placeholder="6-digit code" class="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-center text-xl tracking-[0.4em]">
        <button class="w-full rounded-lg bg-emerald-600 text-white font-semibold py-2.5 hover:bg-emerald-700">Verify & continue</button>
      </form>`
    : `<form method="post" action="/login" class="mt-6 space-y-3">
        <input type="email" name="email" required aria-label="Email address" autofocus placeholder="you@example.com" class="w-full rounded-lg border border-stone-300 px-3 py-2.5">
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
  const ok = await sendMagicCode(c.env, email);
  return c.html(page({ title: 'Enter code', body: loginBody(ok ? `Code sent to ${email}. Check your inbox.` : 'Could not send email right now — please try again in a minute.', ok ? email : ''), path: '/login', noindex: true }));
});

app.post('/verify', async (c) => {
  const form = await c.req.parseBody();
  const email = String(form.email || '').trim().toLowerCase();
  const sess = await verifyCode(c.env, email, String(form.code || ''));
  if (!sess) {
    return c.html(page({ title: 'Enter code', body: loginBody('Invalid or expired code. Try again.', email), path: '/login', noindex: true }));
  }
  c.header('Set-Cookie', sessionCookie(sess));
  return c.redirect('/app');
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
  if (!user) return c.redirect('/login');
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
  const [entries, recipes] = await Promise.all([
    c.env.DB.prepare('SELECT p.*, r.title AS recipe_title FROM plan_entries p LEFT JOIN recipes r ON r.id = p.recipe_id WHERE p.household_id = ? AND p.date BETWEEN ? AND ?')
      .bind(h.id, days[0], days[6]).all(),
    c.env.DB.prepare('SELECT id, title FROM recipes WHERE household_id = ? ORDER BY created_at DESC LIMIT 200').bind(h.id).all(),
  ]);
  const prevWeek = shiftDays(days[0], -7);
  const nextWeek = shiftDays(days[0], 7);
  const menus = await c.env.DB.prepare('SELECT id, name FROM menus WHERE household_id = ? ORDER BY created_at DESC LIMIT 50').bind(h.id).all();
  const body = `
<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
  <h1 class="text-2xl font-bold">Week of ${dayLabel(days[0])}</h1>
  <div class="flex items-center gap-2 text-sm">
    <a href="/app?week=${prevWeek}" class="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100">← Prev</a>
    <a href="/app" class="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100">Today</a>
    <a href="/app?week=${nextWeek}" class="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100">Next →</a>
    <form method="post" action="/app/settings/snacks" class="inline"><input type="hidden" name="week" value="${days[0]}"><button class="px-3 py-1.5 rounded-lg border ${h.snacks ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-stone-300 hover:bg-stone-100'}">${h.snacks ? '✓ Snacks row' : '+ Snacks row'}</button></form>
  </div>
</div>
${recipes.results.length === 0 ? `
<div class="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
  <h2 class="font-semibold text-emerald-900">Start with one recipe</h2>
  <p class="mt-1 text-sm text-emerald-800">Import a recipe by pasting its URL — then you can drop it into any day below and its ingredients flow into your grocery list.</p>
  <a href="/app/recipes" class="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Add your first recipe</a>
</div>` : ''}
<div class="mb-4 flex flex-wrap gap-2">
  <form method="post" action="/app/plan/to-list" class="inline">
    <input type="hidden" name="from" value="${days[0]}"><input type="hidden" name="to" value="${days[6]}">
    <button class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">Add week's ingredients to grocery list</button>
  </form>
  <a href="/app/share" class="px-4 py-2 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-50">Share with family</a>
  ${entries.results.length === 0 ? `<form method="post" action="/app/plan/copy-week" class="inline">
    <input type="hidden" name="week" value="${days[0]}">
    <button class="px-4 py-2 rounded-lg border border-stone-300 text-sm hover:bg-stone-100">Copy last week's plan</button>
  </form>` : ''}
</div>
<div class="mb-5 flex flex-wrap items-center gap-2 text-sm">
  ${entries.results.length ? `<form method="post" action="/app/menus" class="flex gap-2">
    <input type="hidden" name="week" value="${days[0]}">
    <input name="name" required maxlength="60" aria-label="Menu name" placeholder="Save this week as menu…" class="rounded-lg border border-stone-300 px-3 py-1.5 w-52">
    <button class="rounded-lg border border-stone-300 px-3 py-1.5 hover:bg-stone-100">Save menu</button>
  </form>` : ''}
  ${menus.results.length && entries.results.length === 0 ? `<form method="post" action="/app/menus/apply" class="flex gap-2">
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
</div>
<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
${days.map((d) => `
  <div class="rounded-xl bg-white border ${d === today() ? 'border-emerald-500 ring-1 ring-emerald-200' : 'border-stone-200'} p-3">
    <h3 class="text-sm font-semibold ${d === today() ? 'text-emerald-700' : 'text-stone-700'}">${dayLabel(d)}</h3>
    ${mealsFor(h).map((meal) => {
      const es = entries.results.filter((e) => e.date === d && e.meal === meal);
      return `<div class="mt-2">
        <p class="text-[11px] uppercase tracking-wide text-stone-500">${meal}</p>
        ${es.map((e) => `
          <div class="mt-1 flex items-start justify-between gap-1 rounded-lg bg-stone-50 border border-stone-200 px-2 py-1.5 text-sm">
            <span>${e.recipe_id ? `<a class="text-emerald-700 hover:underline" href="/app/recipes/${e.recipe_id}">${esc(e.recipe_title)}</a>${e.scale && e.scale !== 1 ? ` <span class="text-xs text-stone-500">×${e.scale}</span>` : ''}` : esc(e.note)}</span>
            <form method="post" action="/app/plan/delete"><input type="hidden" name="id" value="${e.id}"><input type="hidden" name="week" value="${days[0]}"><button aria-label="Remove" class="text-stone-500 hover:text-red-600">✕</button></form>
          </div>`).join('')}
        <details class="mt-1">
          <summary class="text-xs text-stone-500 cursor-pointer hover:text-emerald-700">+ add</summary>
          <form method="post" action="/app/plan" class="mt-1 space-y-1">
            <input type="hidden" name="date" value="${d}"><input type="hidden" name="meal" value="${meal}"><input type="hidden" name="week" value="${days[0]}">
            ${recipes.results.length
              ? `<select name="recipe_id" aria-label="Recipe" class="w-full rounded border border-stone-300 text-sm px-1 py-1">
              <option value="">— pick recipe —</option>
              ${recipes.results.map((r) => `<option value="${r.id}">${esc(r.title)}</option>`).join('')}
            </select>
            <select name="scale" class="w-full rounded border border-stone-300 text-sm px-1 py-1" aria-label="Servings scale">
              ${SCALES.map((s) => `<option value="${s}"${s === 1 ? ' selected' : ''}>${s === 1 ? 'Normal servings (×1)' : `Scale ingredients ×${s}`}</option>`).join('')}
            </select>`
              : `<p class="text-xs text-stone-500">No recipes yet — <a class="text-emerald-700 underline" href="/app/recipes">import one</a>, or just type a note:</p>`}
            <input name="note" aria-label="Note" placeholder="or type a note (e.g. Leftovers)" class="w-full rounded border border-stone-300 text-sm px-2 py-1">
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
  const note = String(f.note || '').trim().slice(0, 120) || null;
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
  await c.env.DB.prepare('DELETE FROM plan_entries WHERE id = ? AND household_id = ?').bind(String(f.id || ''), h.id).run();
  await bumpVersion(c.env, h.id);
  return c.redirect(`/app?week=${f.week || ''}`);
});

app.post('/app/plan/copy-week', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const week = String(f.week || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) return c.redirect('/app');
  const days = weekDates(week);
  const prevDays = weekDates(shiftDays(week, -7));
  const prev = await c.env.DB.prepare('SELECT * FROM plan_entries WHERE household_id = ? AND date BETWEEN ? AND ?')
    .bind(h.id, prevDays[0], prevDays[6]).all();
  const stmts = prev.results.map((e) =>
    c.env.DB.prepare('INSERT INTO plan_entries (id, household_id, date, meal, recipe_id, note, scale) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(uid(), h.id, days[prevDays.indexOf(e.date)], e.meal, e.recipe_id, e.note, e.scale)
  );
  if (stmts.length) {
    await c.env.DB.batch(stmts);
    await bumpVersion(c.env, h.id);
  }
  return c.redirect(`/app?week=${week}`);
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

app.post('/app/menus/apply', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const week = String(f.week || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) return c.redirect('/app');
  const menu = await c.env.DB.prepare('SELECT id FROM menus WHERE id = ? AND household_id = ?').bind(String(f.menu_id || ''), h.id).first();
  if (!menu) return c.redirect(`/app?week=${week}`);
  const days = weekDates(week);
  const entries = await c.env.DB.prepare('SELECT * FROM menu_entries WHERE menu_id = ?').bind(menu.id).all();
  const stmts = entries.results
    .filter((e) => e.dow >= 0 && e.dow <= 6)
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
  return c.redirect(`/app?week=${String(f.week || '')}`);
});

app.post('/app/plan/to-list', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const rows = await c.env.DB.prepare(
    `SELECT r.id, r.ingredients_json, MAX(p.scale) AS scale FROM plan_entries p JOIN recipes r ON r.id = p.recipe_id
     WHERE p.household_id = ? AND p.date BETWEEN ? AND ? GROUP BY r.id`
  ).bind(h.id, String(f.from || ''), String(f.to || '')).all();
  // Merge duplicate ingredients across recipes (summing quantities). Existing
  // list items matching by normalized key are updated (unchecked) or kept
  // (checked) instead of duplicated, so the button stays idempotent even when
  // scales change between clicks.
  const labels = [];
  for (const row of rows.results) {
    for (const ing of JSON.parse(row.ingredients_json || '[]')) {
      const label = String(ing).slice(0, 200);
      if (label) labels.push(scaleIngredient(label, row.scale));
    }
  }
  const merged = mergeIngredients(labels);
  const staples = await c.env.DB.prepare('SELECT label FROM staples WHERE household_id = ?').bind(h.id).all();
  for (const s of staples.results) if (!merged.some((m) => m.toLowerCase() === s.label.toLowerCase())) merged.push(s.label);
  const existing = await c.env.DB.prepare('SELECT id, label, checked FROM shopping_items WHERE household_id = ?').bind(h.id).all();
  const byKey = new Map();
  for (const r of existing.results) if (!byKey.has(ingredientKey(r.label))) byKey.set(ingredientKey(r.label), r);
  const stmts = [];
  let added = 0;
  const seen = new Set();
  for (const label of merged) {
    const key = ingredientKey(label);
    if (seen.has(key)) continue;
    seen.add(key);
    const hit = byKey.get(key);
    if (hit) {
      if (!hit.checked && hit.label !== label) {
        stmts.push(c.env.DB.prepare('UPDATE shopping_items SET label = ? WHERE id = ?').bind(label, hit.id));
      }
      continue;
    }
    added++;
    stmts.push(
      c.env.DB.prepare('INSERT INTO shopping_items (id, household_id, label, category) VALUES (?, ?, ?, ?)')
        .bind(uid(), h.id, label, categorize(label))
    );
  }
  if (stmts.length) await c.env.DB.batch(stmts);
  await bumpVersion(c.env, h.id);
  return c.redirect(`/app/list?added=${added}`);
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

// ---------- recipes ----------
app.get('/app/recipes', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const err = c.req.query('err');
  const q = String(c.req.query('q') || '').trim().slice(0, 100);
  const tag = normalizeTag(String(c.req.query('tag') || ''));
  const recipes = q
    ? await c.env.DB.prepare("SELECT * FROM recipes WHERE household_id = ? AND (title LIKE ? OR ingredients_json LIKE ?) ORDER BY favorite DESC, created_at DESC")
        .bind(h.id, `%${q}%`, `%${q}%`).all()
    : tag
      ? await c.env.DB.prepare("SELECT * FROM recipes WHERE household_id = ? AND (',' || tags || ',') LIKE ? ORDER BY favorite DESC, created_at DESC")
          .bind(h.id, `%,${tag},%`).all()
      : await c.env.DB.prepare('SELECT * FROM recipes WHERE household_id = ? ORDER BY favorite DESC, created_at DESC').bind(h.id).all();
  const allTags = await c.env.DB.prepare('SELECT tags FROM recipes WHERE household_id = ? AND tags != \'\'').bind(h.id).all();
  const tagSet = [...new Set(allTags.results.flatMap((r) => r.tags.split(',')).filter(Boolean))].sort();
  const body = `
<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
  <h1 class="text-2xl font-bold">Recipes</h1>
  <form method="get" action="/app/recipes" class="flex gap-2">
    <input type="search" name="q" aria-label="Search recipes" value="${esc(q)}" placeholder="Search title or ingredient…" class="rounded-lg border border-stone-300 px-3 py-1.5 text-sm w-56">
    <button class="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100">Search</button>
  </form>
</div>
${err ? `<p class="mb-3 text-sm rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2">${esc(err)}</p>` : ''}
${tagSet.length ? `<div class="flex flex-wrap gap-1.5 mb-4">
  ${tag ? `<a href="/app/recipes" class="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-200 text-stone-700 hover:bg-stone-300">✕ Clear filter</a>` : ''}
  ${tagSet.map((t) => `<a href="/app/recipes?tag=${encodeURIComponent(t)}" class="px-2.5 py-1 rounded-full text-xs font-medium ${t === tag ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}">#${esc(t)}</a>`).join('')}
</div>` : ''}
<form method="post" action="/app/recipes/import" class="flex flex-col sm:flex-row gap-2 mb-6">
  <input type="url" name="url" required aria-label="Recipe URL" value="${esc(String(c.req.query('url') || ''))}" placeholder="Paste a recipe URL (e.g. from BBC Good Food, Serious Eats…)" class="flex-1 rounded-lg border border-stone-300 px-3 py-2.5">
  <button class="rounded-lg bg-emerald-600 text-white font-semibold px-5 py-2.5 hover:bg-emerald-700">Import recipe</button>
</form>
<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
${recipes.results.map((r) => `
  <a href="/app/recipes/${r.id}" class="rounded-xl bg-white border border-stone-200 overflow-hidden hover:border-emerald-400">
    ${r.image_url ? `<img src="${esc(r.image_url)}" alt="" class="h-36 w-full object-cover" loading="lazy">` : `<div class="h-36 w-full bg-stone-100 flex items-center justify-center text-stone-300 text-4xl">🍽</div>`}
    <div class="p-3">
      <h3 class="font-semibold leading-snug">${r.favorite ? '<span class="text-amber-500">★</span> ' : ''}${esc(r.title)}</h3>
      <p class="text-xs text-stone-500 mt-1">${[r.prep_minutes && `Prep ${r.prep_minutes}m`, r.cook_minutes && `Cook ${r.cook_minutes}m`, r.servings && esc(r.servings)].filter(Boolean).join(' · ')}</p>
      ${r.tags ? `<p class="mt-1.5 flex flex-wrap gap-1">${r.tags.split(',').filter(Boolean).map((t) => `<span class="px-1.5 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-800">#${esc(t)}</span>`).join('')}</p>` : ''}
    </div>
  </a>`).join('')}
</div>
${recipes.results.length === 0 ? (q || tag ? `<p class="text-stone-500 text-sm">No recipes match “${esc(q || `#${tag}`)}” — <a class="text-emerald-700 underline" href="/app/recipes">show all</a>.</p>` : `<p class="text-stone-500 text-sm">No recipes yet — paste a URL above to import your first one.</p>`) : ''}
<details class="mt-8">
  <summary class="cursor-pointer text-sm text-stone-500 hover:text-emerald-700">Or add a recipe manually</summary>
  <form method="post" action="/app/recipes/new" class="mt-3 max-w-lg space-y-2">
    <input name="title" required aria-label="Title" placeholder="Title" class="w-full rounded-lg border border-stone-300 px-3 py-2">
    <textarea name="ingredients" aria-label="Ingredients" rows="5" placeholder="Ingredients — one per line" class="w-full rounded-lg border border-stone-300 px-3 py-2"></textarea>
    <textarea name="steps" aria-label="Steps" rows="5" placeholder="Steps — one per line" class="w-full rounded-lg border border-stone-300 px-3 py-2"></textarea>
    <button class="rounded-lg bg-emerald-600 text-white font-semibold px-5 py-2 hover:bg-emerald-700">Save recipe</button>
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
      ? "We couldn't fetch that page — the site may be blocking automated access or the link may be wrong. You can add the recipe manually below."
      : /No recipe/i.test(e.message)
        ? "We couldn't find a recipe on that page — try the recipe's own page, or add it manually below."
        : `Import failed: ${e.message}`;
    return c.redirect(`/app/recipes?err=${encodeURIComponent(friendly)}&url=${encodeURIComponent(url.slice(0, 300))}`);
  }
});

app.post('/app/recipes/new', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const f = await c.req.parseBody();
  const title = String(f.title || '').trim().slice(0, 200);
  if (!title) return c.redirect('/app/recipes');
  const ingredients = String(f.ingredients || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const steps = String(f.steps || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const id = uid();
  await c.env.DB.prepare(
    'INSERT INTO recipes (id, household_id, title, ingredients_json, steps_json, created_by) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, h.id, title, JSON.stringify(ingredients), JSON.stringify(steps), user.id).run();
  return c.redirect(`/app/recipes/${id}`);
});

app.get('/app/recipes/:id', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const r = await c.env.DB.prepare('SELECT * FROM recipes WHERE id = ? AND household_id = ?').bind(c.req.param('id'), h.id).first();
  if (!r) return c.notFound();
  const body = recipeBody(r, true);
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

app.post('/app/recipes/:id/delete', async (c) => {
  const h = c.get('household');
  const id = c.req.param('id');
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM plan_entries WHERE recipe_id = ? AND household_id = ?').bind(id, h.id),
    c.env.DB.prepare('DELETE FROM recipes WHERE id = ? AND household_id = ?').bind(id, h.id),
  ]);
  await bumpVersion(c.env, h.id);
  return c.redirect('/app/recipes');
});

function recipeBody(r, canEdit) {
  const ingredients = JSON.parse(r.ingredients_json || '[]');
  const steps = JSON.parse(r.steps_json || '[]');
  return `<article class="max-w-2xl mx-auto">
${r.image_url ? `<img src="${esc(r.image_url)}" alt="" class="rounded-2xl w-full max-h-80 object-cover mb-4">` : ''}
<h1 class="text-3xl font-bold">${esc(r.title)}</h1>
<p class="text-sm text-stone-500 mt-1">${[r.prep_minutes && `Prep ${r.prep_minutes} min`, r.cook_minutes && `Cook ${r.cook_minutes} min`, r.servings && esc(r.servings)].filter(Boolean).join(' · ')}</p>
${r.description ? `<p class="mt-3 text-stone-600">${esc(r.description)}</p>` : ''}
${r.source_url ? `<p class="mt-2 text-sm"><a class="text-emerald-700 underline" href="${esc(r.source_url)}" rel="noopener nofollow">Original source</a></p>` : ''}
<div class="grid sm:grid-cols-2 gap-6 mt-6">
  <section>
    <h2 class="font-semibold text-lg mb-2">Ingredients</h2>
    <ul class="space-y-1.5 text-sm">${ingredients.map((i) => `<li class="flex gap-2"><span class="text-emerald-600 mt-0.5">•</span><span>${esc(i)}</span></li>`).join('')}</ul>
  </section>
  <section>
    <h2 class="font-semibold text-lg mb-2">Steps</h2>
    <ol class="space-y-2.5 text-sm list-none">${steps.map((s, i) => `<li class="flex gap-2.5"><span class="shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">${i + 1}</span><span>${esc(s)}</span></li>`).join('')}</ol>
  </section>
</div>
${canEdit ? `<div class="mt-8 flex flex-wrap items-center gap-3">
  <a href="/app" class="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Add to your week plan</a>
  <form method="post" action="/app/recipes/${r.id}/favorite"><button class="rounded-lg border px-4 py-2 text-sm font-semibold ${r.favorite ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-stone-300 hover:bg-stone-100'}">${r.favorite ? '★ Favourited' : '☆ Favourite'}</button></form>
</div>
<form method="post" action="/app/recipes/${r.id}/tags" class="mt-4 flex gap-2 max-w-md">
  <input name="tags" aria-label="Tags" value="${esc((r.tags || '').split(',').filter(Boolean).join(', '))}" placeholder="Tags, comma-separated (e.g. quick, vegetarian)" class="flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-sm">
  <button class="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100">Save tags</button>
</form>` : ''}
${canEdit ? `<form method="post" action="/app/recipes/${r.id}/delete" class="mt-4" data-confirm="Delete this recipe?"><button class="text-sm text-red-600 hover:underline">Delete recipe</button></form>` : ''}
</article>`;
}

// ---------- grocery list ----------
app.get('/app/list', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const [items, staples] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM shopping_items WHERE household_id = ? ORDER BY category, created_at').bind(h.id).all(),
    c.env.DB.prepare('SELECT label FROM staples WHERE household_id = ?').bind(h.id).all(),
  ]);
  const suggestions = [...new Set([...staples.results.map((s) => s.label), ...COMMON_ITEMS])];
  const added = c.req.query('added');
  const notice = added === undefined ? '' : Number(added) > 0
    ? `Added ${Number(added)} new item${Number(added) === 1 ? '' : 's'} from this week's plan.`
    : "Everything from this week's plan is already on the list.";
  const body = listBody(h, items.results, { editable: true, base: '/app/list', shareLink: true, notice, suggestions });
  return c.html(page({ title: 'Grocery list', body, user, path: '/app/list', noindex: true }));
});

app.post('/app/list/add', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const label = String(f.label || '').trim().slice(0, 200);
  if (label) {
    await c.env.DB.prepare('INSERT INTO shopping_items (id, household_id, label, category) VALUES (?, ?, ?, ?)')
      .bind(uid(), h.id, label, categorize(label)).run();
    await bumpVersion(c.env, h.id);
  }
  return c.redirect('/app/list');
});

app.post('/app/list/toggle', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  await c.env.DB.prepare('UPDATE shopping_items SET checked = 1 - checked WHERE id = ? AND household_id = ?').bind(String(f.id || ''), h.id).run();
  await bumpVersion(c.env, h.id);
  if (c.req.header('X-Requested-With') === 'fetch') return c.json({ ok: true });
  return c.redirect('/app/list');
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
  return c.redirect('/app/list');
});

app.post('/app/list/clear', async (c) => {
  const h = c.get('household');
  await c.env.DB.prepare('DELETE FROM shopping_items WHERE household_id = ? AND checked = 1').bind(h.id).run();
  await bumpVersion(c.env, h.id);
  return c.redirect('/app/list');
});

const COMMON_ITEMS = ['Milk', 'Eggs', 'Bread', 'Butter', 'Cheese', 'Yogurt', 'Bananas', 'Apples', 'Tomatoes', 'Onions', 'Garlic', 'Potatoes', 'Carrots', 'Lettuce', 'Chicken breast', 'Beef mince', 'Rice', 'Pasta', 'Olive oil', 'Coffee', 'Tea', 'Sugar', 'Flour', 'Salt', 'Pepper', 'Toilet paper', 'Paper towels', 'Dish soap', 'Laundry detergent'];

function listBody(h, items, { editable, base, shareLink, notice, suggestions = [] }) {
  const cats = [...new Set(items.map((i) => i.category))];
  const allCats = [...new Set([...STANDARD_CATEGORIES, ...cats])];
  return `
${notice ? `<p class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">${esc(notice)}</p>` : ''}
<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
  <h1 class="text-2xl font-bold">Grocery list</h1>
  <div class="flex gap-2 print:hidden">
    <button type="button" data-copy-list class="px-3 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100 whitespace-nowrap">Copy list</button>
    <button type="button" data-print class="px-3 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100">Print</button>
    ${shareLink ? `<a href="/app/staples" class="px-3 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100">Staples</a>
    <a href="/app/share" class="px-3 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 whitespace-nowrap">Share with family</a>` : ''}
    ${editable ? `<form method="post" action="/app/list/clear"><button class="px-3 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100 whitespace-nowrap">Clear checked</button></form>` : ''}
  </div>
</div>
${editable ? `
<form method="post" action="/app/list/add" class="flex gap-2 mb-5 max-w-md print:hidden">
  <input name="label" required aria-label="Add item" placeholder="Add item (e.g. 2 lemons)" list="item-suggestions" autocomplete="off" class="flex-1 rounded-lg border border-stone-300 px-3 py-2">
  <datalist id="item-suggestions">${suggestions.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>
  <button class="rounded-lg bg-emerald-600 text-white font-semibold px-4 hover:bg-emerald-700">Add</button>
</form>` : ''}
<div id="list" data-version="${h.version}" data-base="${base}" class="space-y-5 max-w-2xl">
${cats.length === 0 ? `<p class="text-stone-500 text-sm">List is empty. Plan your week and click "Add week's ingredients", or add items manually.</p>` : ''}
${cats.map((cat) => `
  <section>
    <h2 class="text-xs uppercase tracking-wide font-semibold text-stone-500 mb-1.5">${esc(cat)}</h2>
    <ul class="rounded-xl bg-white border border-stone-200 divide-y divide-stone-100">
    ${items.filter((i) => i.category === cat).map((i) => `
      <li class="flex items-center${i.checked ? ' print:hidden' : ''}">
        <form method="post" action="${base}/toggle" class="toggle-form flex-1">
          <input type="hidden" name="id" value="${i.id}">
          <button class="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-stone-50 ${i.checked ? 'text-stone-500' : ''}">
            <span class="shrink-0 w-5 h-5 rounded-md border ${i.checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300 bg-white'} flex items-center justify-center text-xs">${i.checked ? '✓' : ''}</span>
            <span class="${i.checked ? 'line-through' : ''}">${esc(i.label)}</span>
          </button>
        </form>
        ${editable ? `<form method="post" action="/app/list/category" class="pr-2 print:hidden">
          <input type="hidden" name="id" value="${i.id}">
          <select name="category" data-autosubmit data-custom-prompt="New aisle / store section name:" aria-label="Move to category" class="rounded border border-transparent hover:border-stone-300 bg-transparent text-xs text-stone-400 px-1 py-0.5 max-w-28">
            ${allCats.map((cc) => `<option value="${esc(cc)}"${cc === i.category ? ' selected' : ''}>${esc(cc)}</option>`).join('')}
            <option value="__custom">New category…</option>
          </select>
        </form>` : ''}
      </li>`).join('')}
    </ul>
  </section>`).join('')}
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
  <input name="label" required aria-label="Add staple" placeholder="Add staple (e.g. milk)" class="flex-1 rounded-lg border border-stone-300 px-3 py-2">
  <button class="rounded-lg bg-emerald-600 text-white font-semibold px-4 hover:bg-emerald-700">Add</button>
</form>
${staples.results.length === 0 ? `<p class="text-stone-500 text-sm">No staples yet.</p>` : `<ul class="rounded-xl bg-white border border-stone-200 divide-y divide-stone-100">
${staples.results.map((s) => `<li class="flex items-center justify-between px-3 py-2.5 text-sm">
  <span>${esc(s.label)} <span class="ml-2 text-xs text-stone-400">${esc(s.category)}</span></span>
  <form method="post" action="/app/staples/delete"><input type="hidden" name="id" value="${s.id}"><button aria-label="Remove" class="text-stone-400 hover:text-red-600">✕</button></form>
</li>`).join('')}
</ul>`}
</div>`;
  return c.html(page({ title: 'Staples', body, user, path: '/app/staples', noindex: true }));
});

app.post('/app/staples/add', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const label = String(f.label || '').trim().slice(0, 200);
  if (label) {
    await c.env.DB.prepare('INSERT INTO staples (id, household_id, label, category) VALUES (?, ?, ?, ?)')
      .bind(uid(), h.id, label, categorize(label)).run();
  }
  return c.redirect('/app/staples');
});

app.post('/app/staples/delete', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  await c.env.DB.prepare('DELETE FROM staples WHERE id = ? AND household_id = ?').bind(String(f.id || ''), h.id).run();
  return c.redirect('/app/staples');
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
<p class="mt-2 text-stone-600">Anyone with this link can see this week's plan and check off grocery items — no account or app needed.</p>
<div class="mt-6 flex gap-2">
  <input readonly aria-label="Share link" value="${esc(link)}" id="share-url" class="flex-1 rounded-lg border border-stone-300 px-3 py-2.5 text-sm bg-white">
  <button type="button" data-copy="share-url" class="rounded-lg bg-emerald-600 text-white font-semibold px-4 hover:bg-emerald-700">Copy</button>
</div>
<form method="post" action="/app/share/rotate" class="mt-4" data-confirm="Create a new link? The current link will stop working for everyone.">
  <button class="text-sm text-stone-500 hover:text-red-600 hover:underline">Reset link (revokes the old one)</button>
</form>
<a href="/app" class="inline-block mt-6 text-sm text-emerald-700 underline">Back to planner</a>
</div>`;
  return c.html(page({ title: 'Share', body, user, path: '/app/share', noindex: true }));
});

app.post('/app/share/rotate', async (c) => {
  const h = c.get('household');
  await c.env.DB.prepare('UPDATE households SET share_token = ? WHERE id = ?').bind(token(20), h.id).run();
  return c.redirect('/app/share');
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
  const [entries, items] = await Promise.all([
    c.env.DB.prepare('SELECT p.*, r.title AS recipe_title FROM plan_entries p LEFT JOIN recipes r ON r.id = p.recipe_id WHERE p.household_id = ? AND p.date BETWEEN ? AND ? ORDER BY p.date').bind(h.id, days[0], days[6]).all(),
    c.env.DB.prepare('SELECT * FROM shopping_items WHERE household_id = ? ORDER BY category, created_at').bind(h.id).all(),
  ]);
  const planHtml = `
<section class="mb-8">
  <h1 class="text-2xl font-bold mb-1">${esc(h.name)} — ${isCurrent ? 'this week' : `week of ${dayLabel(days[0])}`}</h1>
  <p class="text-sm text-stone-500 mb-2">Shared read-only plan · check items below to sync with everyone</p>
  <p class="mb-4 text-sm flex items-center gap-3">
    <a class="text-emerald-700 hover:underline" href="/s/${h.share_token}?week=${shiftDays(days[0], -7)}">← Previous week</a>
    ${isCurrent ? '' : `<a class="text-emerald-700 hover:underline" href="/s/${h.share_token}">This week</a>`}
    <a class="text-emerald-700 hover:underline" href="/s/${h.share_token}?week=${shiftDays(days[0], 7)}">Next week →</a>
  </p>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
  ${days.map((d) => {
    const es = entries.results.filter((e) => e.date === d);
    return `<div class="rounded-xl bg-white border ${d === today() ? 'border-emerald-500' : 'border-stone-200'} p-3">
      <h3 class="text-sm font-semibold">${dayLabel(d)}</h3>
      ${es.length ? es.map((e) => `<p class="mt-1.5 text-sm"><span class="text-[10px] uppercase text-stone-500 mr-1">${e.meal}</span>${e.recipe_id ? `<a class="text-emerald-700 hover:underline" href="/s/${h.share_token}/r/${e.recipe_id}">${esc(e.recipe_title)}</a>` : esc(e.note)}</p>`).join('') : '<p class="mt-1.5 text-xs text-stone-500">Nothing planned</p>'}
    </div>`;
  }).join('')}
  </div>
</section>`;
  const body = planHtml + listBody(h, items.results, { editable: false, base: `/s/${h.share_token}`, shareLink: false });
  return c.html(page({ title: `${h.name} — meal plan`, body, path: `/s/${h.share_token}`, noindex: true }));
});

app.get('/s/:token/r/:id', async (c) => {
  const h = await shareHousehold(c);
  if (!h) return c.notFound();
  const r = await c.env.DB.prepare('SELECT * FROM recipes WHERE id = ? AND household_id = ?').bind(c.req.param('id'), h.id).first();
  if (!r) return c.notFound();
  const body = `<p class="mb-4 text-sm"><a class="text-emerald-700 underline" href="/s/${h.share_token}">← Back to ${esc(h.name)}'s week</a></p>` + recipeBody(r, false);
  return c.html(page({ title: r.title, body, path: `/s/${h.share_token}/r/${r.id}`, noindex: true }));
});

app.post('/s/:token/toggle', async (c) => {
  const h = await shareHousehold(c);
  if (!h) return c.notFound();
  const f = await c.req.parseBody();
  await c.env.DB.prepare('UPDATE shopping_items SET checked = 1 - checked WHERE id = ? AND household_id = ?').bind(String(f.id || ''), h.id).run();
  await bumpVersion(c.env, h.id);
  if (c.req.header('X-Requested-With') === 'fetch') return c.json({ ok: true });
  return c.redirect(`/s/${h.share_token}`);
});

app.get('/s/:token/version', async (c) => {
  const h = await shareHousehold(c);
  if (!h) return c.notFound();
  return c.json({ version: h.version });
});

// ---------- SEO ----------
app.get('/robots.txt', (c) =>
  c.text(`User-agent: *\nAllow: /\nDisallow: /app\nDisallow: /s/\nSitemap: ${c.env.SITE_URL}/sitemap.xml\n`)
);

app.get('/sitemap.xml', (c) => {
  const urls = ['/', '/guides', '/privacy', '/terms', ...GUIDES.map((g) => `/guides/${g.slug}`)];
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

export default app;
