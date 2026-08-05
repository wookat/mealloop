import { Hono } from 'hono';
import { page } from './layout.js';
import { getUser, sendMagicCode, verifyCode, logout, sessionCookie, clearCookie } from './auth.js';
import { importRecipeFromUrl } from './recipes.js';
import { uid, token, esc, weekDates, categorize, today } from './util.js';
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
    c.res.headers.set('Content-Security-Policy', "default-src 'self'; img-src * data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'");
  } catch {}
  try {
    const ct = c.res.headers.get('content-type') || '';
    if (c.req.method === 'GET' && ct.includes('text/html') && c.res.status === 200) {
      const path = new URL(c.req.url).pathname.split('/').slice(0, 3).join('/') || '/';
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
    <input type="email" name="email" required placeholder="you@example.com" class="flex-1 rounded-lg px-3 py-2.5 text-stone-900 bg-white">
    <button class="rounded-lg bg-white text-emerald-700 font-semibold px-5 py-2.5 hover:bg-emerald-50">Notify me</button>
  </form>
</section>`;
  return c.html(page({ title: 'Family meal planning with real-time sync', description: 'Free family meal planner: import recipes from any site, plan your week, share one live grocery list with a single link.', body, user, path: '/' }));
});

app.post('/subscribe', async (c) => {
  const form = await c.req.parseBody();
  const email = String(form.email || '').trim().toLowerCase();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    await c.env.DB.prepare('INSERT INTO email_intents (id, email, source) VALUES (?, ?, ?)').bind(uid(), email, 'landing').run();
  }
  return c.html(page({ title: 'Thanks', body: `<div class="py-20 text-center"><h1 class="text-2xl font-bold">You're on the list 🎉</h1><p class="mt-2 text-stone-600">We'll email you when new features ship.</p><a class="mt-6 inline-block text-emerald-700 underline" href="/">Back home</a></div>`, path: '/subscribe', noindex: true }));
});

app.get('/privacy', (c) =>
  c.html(page({ title: 'Privacy', path: '/privacy', body: legalBody('Privacy Policy', `
<p>MealLoop is designed to be privacy-first:</p>
<ul class="list-disc pl-5 space-y-1">
<li>We collect only your email address (for login) and the meal-planning content you create.</li>
<li>Analytics are first-party, aggregate and cookie-free: we count page views per day per path. No individual tracking, no third-party trackers, no ads.</li>
<li>The only cookie we set is a session cookie after you log in. It is strictly necessary for the service.</li>
<li>We never sell or share your data. Email is used solely for login codes and, if you opted in, product updates.</li>
<li>You may delete your account and data anytime by emailing mealloop@zalize.com.</li>
</ul>`) }))
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
        <input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required autofocus placeholder="6-digit code" class="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-center text-xl tracking-[0.4em]">
        <button class="w-full rounded-lg bg-emerald-600 text-white font-semibold py-2.5 hover:bg-emerald-700">Verify & continue</button>
      </form>`
    : `<form method="post" action="/login" class="mt-6 space-y-3">
        <input type="email" name="email" required autofocus placeholder="you@example.com" class="w-full rounded-lg border border-stone-300 px-3 py-2.5">
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
const MEALS = ['breakfast', 'lunch', 'dinner'];

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
  const body = `
<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
  <h1 class="text-2xl font-bold">Week of ${days[0]}</h1>
  <div class="flex items-center gap-2 text-sm">
    <a href="/app?week=${prevWeek}" class="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100">← Prev</a>
    <a href="/app" class="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100">Today</a>
    <a href="/app?week=${nextWeek}" class="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100">Next →</a>
  </div>
</div>
<div class="mb-4 flex flex-wrap gap-2">
  <form method="post" action="/app/plan/to-list" class="inline">
    <input type="hidden" name="from" value="${days[0]}"><input type="hidden" name="to" value="${days[6]}">
    <button class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">Add week's ingredients to grocery list</button>
  </form>
  <a href="/app/share" class="px-4 py-2 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-50">Share with family</a>
</div>
<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
${days.map((d) => `
  <div class="rounded-xl bg-white border ${d === today() ? 'border-emerald-500 ring-1 ring-emerald-200' : 'border-stone-200'} p-3">
    <h3 class="text-sm font-semibold ${d === today() ? 'text-emerald-700' : 'text-stone-700'}">${dayLabel(d)}</h3>
    ${MEALS.map((meal) => {
      const es = entries.results.filter((e) => e.date === d && e.meal === meal);
      return `<div class="mt-2">
        <p class="text-[11px] uppercase tracking-wide text-stone-400">${meal}</p>
        ${es.map((e) => `
          <div class="mt-1 flex items-start justify-between gap-1 rounded-lg bg-stone-50 border border-stone-200 px-2 py-1.5 text-sm">
            <span>${e.recipe_id ? `<a class="text-emerald-700 hover:underline" href="/app/recipes/${e.recipe_id}">${esc(e.recipe_title)}</a>` : esc(e.note)}</span>
            <form method="post" action="/app/plan/delete"><input type="hidden" name="id" value="${e.id}"><input type="hidden" name="week" value="${days[0]}"><button aria-label="Remove" class="text-stone-400 hover:text-red-600">✕</button></form>
          </div>`).join('')}
        <details class="mt-1">
          <summary class="text-xs text-stone-400 cursor-pointer hover:text-emerald-700">+ add</summary>
          <form method="post" action="/app/plan" class="mt-1 space-y-1">
            <input type="hidden" name="date" value="${d}"><input type="hidden" name="meal" value="${meal}"><input type="hidden" name="week" value="${days[0]}">
            <select name="recipe_id" class="w-full rounded border border-stone-300 text-sm px-1 py-1">
              <option value="">— pick recipe —</option>
              ${recipes.results.map((r) => `<option value="${r.id}">${esc(r.title)}</option>`).join('')}
            </select>
            <input name="note" placeholder="or type a note (e.g. Leftovers)" class="w-full rounded border border-stone-300 text-sm px-2 py-1">
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
  if (/^\d{4}-\d{2}-\d{2}$/.test(date) && MEALS.includes(meal) && (recipeId || note)) {
    await c.env.DB.prepare('INSERT INTO plan_entries (id, household_id, date, meal, recipe_id, note) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(uid(), h.id, date, meal, recipeId, note).run();
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

app.post('/app/plan/to-list', async (c) => {
  const h = c.get('household');
  const f = await c.req.parseBody();
  const rows = await c.env.DB.prepare(
    `SELECT DISTINCT r.id, r.ingredients_json FROM plan_entries p JOIN recipes r ON r.id = p.recipe_id
     WHERE p.household_id = ? AND p.date BETWEEN ? AND ?`
  ).bind(h.id, String(f.from || ''), String(f.to || '')).all();
  const stmts = [];
  for (const row of rows.results) {
    for (const ing of JSON.parse(row.ingredients_json || '[]')) {
      stmts.push(
        c.env.DB.prepare('INSERT INTO shopping_items (id, household_id, label, category, recipe_id) VALUES (?, ?, ?, ?, ?)')
          .bind(uid(), h.id, ing.slice(0, 200), categorize(ing), row.id)
      );
    }
  }
  if (stmts.length) await c.env.DB.batch(stmts);
  await bumpVersion(c.env, h.id);
  return c.redirect('/app/list');
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
  const recipes = await c.env.DB.prepare('SELECT * FROM recipes WHERE household_id = ? ORDER BY created_at DESC').bind(h.id).all();
  const body = `
<h1 class="text-2xl font-bold mb-4">Recipes</h1>
${err ? `<p class="mb-3 text-sm rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2">${esc(err)}</p>` : ''}
<form method="post" action="/app/recipes/import" class="flex flex-col sm:flex-row gap-2 mb-6">
  <input type="url" name="url" required placeholder="Paste a recipe URL (e.g. from BBC Good Food, Serious Eats…)" class="flex-1 rounded-lg border border-stone-300 px-3 py-2.5">
  <button class="rounded-lg bg-emerald-600 text-white font-semibold px-5 py-2.5 hover:bg-emerald-700">Import recipe</button>
</form>
<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
${recipes.results.map((r) => `
  <a href="/app/recipes/${r.id}" class="rounded-xl bg-white border border-stone-200 overflow-hidden hover:border-emerald-400">
    ${r.image_url ? `<img src="${esc(r.image_url)}" alt="" class="h-36 w-full object-cover" loading="lazy">` : `<div class="h-36 w-full bg-stone-100 flex items-center justify-center text-stone-300 text-4xl">🍽</div>`}
    <div class="p-3">
      <h3 class="font-semibold leading-snug">${esc(r.title)}</h3>
      <p class="text-xs text-stone-500 mt-1">${[r.prep_minutes && `Prep ${r.prep_minutes}m`, r.cook_minutes && `Cook ${r.cook_minutes}m`, r.servings && esc(r.servings)].filter(Boolean).join(' · ')}</p>
    </div>
  </a>`).join('')}
</div>
${recipes.results.length === 0 ? `<p class="text-stone-500 text-sm">No recipes yet — paste a URL above to import your first one.</p>` : ''}
<details class="mt-8">
  <summary class="cursor-pointer text-sm text-stone-500 hover:text-emerald-700">Or add a recipe manually</summary>
  <form method="post" action="/app/recipes/new" class="mt-3 max-w-lg space-y-2">
    <input name="title" required placeholder="Title" class="w-full rounded-lg border border-stone-300 px-3 py-2">
    <textarea name="ingredients" rows="5" placeholder="Ingredients — one per line" class="w-full rounded-lg border border-stone-300 px-3 py-2"></textarea>
    <textarea name="steps" rows="5" placeholder="Steps — one per line" class="w-full rounded-lg border border-stone-300 px-3 py-2"></textarea>
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
    const r = await importRecipeFromUrl(url, c.env);
    const id = uid();
    await c.env.DB.prepare(
      `INSERT INTO recipes (id, household_id, title, source_url, image_url, description, prep_minutes, cook_minutes, servings, ingredients_json, steps_json, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, h.id, r.title, r.source_url, r.image_url, r.description, r.prep_minutes, r.cook_minutes, r.servings, JSON.stringify(r.ingredients), JSON.stringify(r.steps), user.id).run();
    return c.redirect(`/app/recipes/${id}`);
  } catch (e) {
    return c.redirect(`/app/recipes?err=${encodeURIComponent(`Import failed: ${e.message}`)}`);
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
${canEdit ? `<form method="post" action="/app/recipes/${r.id}/delete" class="mt-8" onsubmit="return confirm('Delete this recipe?')"><button class="text-sm text-red-600 hover:underline">Delete recipe</button></form>` : ''}
</article>`;
}

// ---------- grocery list ----------
app.get('/app/list', async (c) => {
  const user = c.get('user');
  const h = c.get('household');
  const items = await c.env.DB.prepare('SELECT * FROM shopping_items WHERE household_id = ? ORDER BY category, created_at').bind(h.id).all();
  const body = listBody(h, items.results, { editable: true, base: '/app/list', shareLink: true });
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

app.post('/app/list/clear', async (c) => {
  const h = c.get('household');
  await c.env.DB.prepare('DELETE FROM shopping_items WHERE household_id = ? AND checked = 1').bind(h.id).run();
  await bumpVersion(c.env, h.id);
  return c.redirect('/app/list');
});

function listBody(h, items, { editable, base, shareLink }) {
  const cats = [...new Set(items.map((i) => i.category))];
  return `
<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
  <h1 class="text-2xl font-bold">Grocery list</h1>
  <div class="flex gap-2">
    ${shareLink ? `<a href="/app/share" class="px-3 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-50">Share with family</a>` : ''}
    ${editable ? `<form method="post" action="/app/list/clear"><button class="px-3 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100">Clear checked</button></form>` : ''}
  </div>
</div>
${editable ? `
<form method="post" action="/app/list/add" class="flex gap-2 mb-5 max-w-md">
  <input name="label" required placeholder="Add item (e.g. 2 lemons)" class="flex-1 rounded-lg border border-stone-300 px-3 py-2">
  <button class="rounded-lg bg-emerald-600 text-white font-semibold px-4 hover:bg-emerald-700">Add</button>
</form>` : ''}
<div id="list" data-version="${h.version}" data-base="${base}" class="space-y-5 max-w-2xl">
${cats.length === 0 ? `<p class="text-stone-500 text-sm">List is empty. Plan your week and click "Add week's ingredients", or add items manually.</p>` : ''}
${cats.map((cat) => `
  <section>
    <h2 class="text-xs uppercase tracking-wide font-semibold text-stone-400 mb-1.5">${esc(cat)}</h2>
    <ul class="rounded-xl bg-white border border-stone-200 divide-y divide-stone-100">
    ${items.filter((i) => i.category === cat).map((i) => `
      <li>
        <form method="post" action="${base}/toggle" class="toggle-form">
          <input type="hidden" name="id" value="${i.id}">
          <button class="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-stone-50 ${i.checked ? 'text-stone-400' : ''}">
            <span class="shrink-0 w-5 h-5 rounded-md border ${i.checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300 bg-white'} flex items-center justify-center text-xs">${i.checked ? '✓' : ''}</span>
            <span class="${i.checked ? 'line-through' : ''}">${esc(i.label)}</span>
          </button>
        </form>
      </li>`).join('')}
    </ul>
  </section>`).join('')}
</div>
<script>
(function(){
  var list = document.getElementById('list');
  if(!list) return;
  var version = list.dataset.version, base = list.dataset.base;
  document.querySelectorAll('.toggle-form').forEach(function(f){
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var btn=f.querySelector('button'), box=f.querySelector('span'), label=f.querySelectorAll('span')[1];
      var on = box.classList.toggle('bg-emerald-600');
      box.classList.toggle('border-emerald-600'); box.classList.toggle('text-white'); box.classList.toggle('border-stone-300');
      box.textContent = on ? '\\u2713' : '';
      label.classList.toggle('line-through'); btn.classList.toggle('text-stone-400');
      fetch(base + '/toggle', {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded','X-Requested-With':'fetch'}, body:'id='+encodeURIComponent(f.querySelector('input[name=id]').value)});
    });
  });
  setInterval(function(){
    fetch(base + '/version', {headers:{'X-Requested-With':'fetch'}}).then(function(r){return r.json()}).then(function(d){
      if(String(d.version) !== String(version)) location.reload();
    }).catch(function(){});
  }, 5000);
})();
</script>`;
}

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
  <input readonly value="${esc(link)}" id="share-url" class="flex-1 rounded-lg border border-stone-300 px-3 py-2.5 text-sm bg-white">
  <button onclick="navigator.clipboard.writeText(document.getElementById('share-url').value);this.textContent='Copied!'" class="rounded-lg bg-emerald-600 text-white font-semibold px-4 hover:bg-emerald-700">Copy</button>
</div>
<a href="/app" class="inline-block mt-6 text-sm text-emerald-700 underline">Back to planner</a>
</div>`;
  return c.html(page({ title: 'Share', body, user, path: '/app/share', noindex: true }));
});

async function shareHousehold(c) {
  return c.env.DB.prepare('SELECT * FROM households WHERE share_token = ?').bind(c.req.param('token')).first();
}

app.get('/s/:token', async (c) => {
  const h = await shareHousehold(c);
  if (!h) return c.notFound();
  const days = weekDates();
  const [entries, items] = await Promise.all([
    c.env.DB.prepare('SELECT p.*, r.title AS recipe_title FROM plan_entries p LEFT JOIN recipes r ON r.id = p.recipe_id WHERE p.household_id = ? AND p.date BETWEEN ? AND ? ORDER BY p.date').bind(h.id, days[0], days[6]).all(),
    c.env.DB.prepare('SELECT * FROM shopping_items WHERE household_id = ? ORDER BY category, created_at').bind(h.id).all(),
  ]);
  const planHtml = `
<section class="mb-8">
  <h1 class="text-2xl font-bold mb-1">${esc(h.name)} — this week</h1>
  <p class="text-sm text-stone-500 mb-4">Shared read-only plan · check items below to sync with everyone</p>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
  ${days.map((d) => {
    const es = entries.results.filter((e) => e.date === d);
    return `<div class="rounded-xl bg-white border ${d === today() ? 'border-emerald-500' : 'border-stone-200'} p-3">
      <h3 class="text-sm font-semibold">${dayLabel(d)}</h3>
      ${es.length ? es.map((e) => `<p class="mt-1.5 text-sm"><span class="text-[10px] uppercase text-stone-400 mr-1">${e.meal}</span>${esc(e.recipe_title || e.note)}</p>`).join('') : '<p class="mt-1.5 text-xs text-stone-400">Nothing planned</p>'}
    </div>`;
  }).join('')}
  </div>
</section>`;
  const body = planHtml + listBody(h, items.results, { editable: false, base: `/s/${h.share_token}`, shareLink: false });
  return c.html(page({ title: `${h.name} — meal plan`, body, path: `/s/${h.share_token}`, noindex: true }));
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
