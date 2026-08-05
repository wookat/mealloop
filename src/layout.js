import { esc } from './util.js';

export function page({ title, description, body, user, path = '/', noindex = false }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · MealLoop</title>
<meta name="description" content="${esc(description || 'Family meal planning with real-time sync. Import recipes, plan your week, share one grocery list — free.')}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<link rel="canonical" href="https://mealloop.zalize.com${esc(path)}">
<link rel="stylesheet" href="/styles.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
</head>
<body class="min-h-screen bg-stone-50 text-stone-800 antialiased flex flex-col">
<header class="border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-20">
  <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2 font-bold text-lg text-emerald-700">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18" stroke-dasharray="3 3"/><path d="M8 12h8M12 8v8"/></svg>
      MealLoop
    </a>
    <nav class="flex items-center gap-1 sm:gap-3 text-sm">
      ${user
        ? `<a href="/app" class="px-3 py-1.5 rounded-lg hover:bg-stone-100">Planner</a>
           <a href="/app/recipes" class="px-3 py-1.5 rounded-lg hover:bg-stone-100">Recipes</a>
           <a href="/app/list" class="px-3 py-1.5 rounded-lg hover:bg-stone-100">List</a>
           <form method="post" action="/logout" class="inline"><button class="px-3 py-1.5 rounded-lg text-stone-500 hover:bg-stone-100">Log out</button></form>`
        : `<a href="/login" class="px-3 py-1.5 rounded-lg hover:bg-stone-100">Log in</a>
           <a href="/login" class="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700">Get started free</a>`}
    </nav>
  </div>
</header>
<main class="flex-1 w-full max-w-5xl mx-auto px-4 py-6">${body}</main>
<footer class="border-t border-stone-200 bg-white mt-10">
  <div class="max-w-5xl mx-auto px-4 py-8 text-sm text-stone-500 space-y-3">
    <div class="flex flex-wrap gap-x-5 gap-y-2">
      <a class="hover:text-stone-700" href="/guides">Guides</a>
      <a class="hover:text-stone-700" href="/privacy">Privacy</a>
      <a class="hover:text-stone-700" href="/terms">Terms</a>
    </div>
    <p>More from us:
      <a class="underline hover:text-stone-700" href="https://astrosage.zalize.com" rel="noopener">AstroSage</a> ·
      <a class="underline hover:text-stone-700" href="https://subsleuth.zalize.com" rel="noopener">SubSleuth</a> ·
      <a class="underline hover:text-stone-700" href="https://cv.zalize.com" rel="noopener">CV Builder</a> ·
      <a class="underline hover:text-stone-700" href="https://watchdeck.zalize.com" rel="noopener">WatchDeck</a>
    </p>
    <p>© ${new Date().getFullYear()} MealLoop. Free family meal planning. No ads, no cookies-based tracking.</p>
  </div>
</footer>
</body>
</html>`;
}
