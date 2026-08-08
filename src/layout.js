import { esc } from './util.js';

export function page({ title, description, body, user, path = '/', noindex = false, ogType = 'website' }) {
  const desc = description || 'Family meal planning with real-time sync. Import recipes, plan your week, share one grocery list. All features free during the open beta.';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · MealLoop</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="${ogType === 'article' ? 'article' : 'website'}">
<meta property="og:site_name" content="MealLoop">
<meta property="og:title" content="${esc(title)} · MealLoop">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="https://mealloop.zalize.com${esc(path)}">
<meta property="og:image" content="https://mealloop.zalize.com/og-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://mealloop.zalize.com${esc(path)}">
<link rel="preload" href="/fonts/nunito-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icon-192.png">
<meta name="theme-color" content="#059669">
<script src="/app.js" defer></script>
</head>
<body class="min-h-screen bg-stone-50 text-stone-800 antialiased flex flex-col">
<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-emerald-600 focus:px-3 focus:py-2 focus:text-white">Skip to content</a>
<header class="border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-20 print:hidden">
  <div class="max-w-5xl mx-auto px-2 sm:px-4 h-14 flex items-center justify-between">
    <a href="/" class="flex items-center gap-1.5 font-bold text-base sm:text-lg text-emerald-700">
      <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="33" r="13.5" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="32" cy="33" r="4" fill="#f59e0b"/><path d="M48 15.5 A23 23 0 1 0 55 33" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M46.5 6.5 L48 15.5 L39 17" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span class="font-display">MealLoop</span>
    </a>
    <nav class="flex items-center gap-1 sm:gap-3 text-sm">
      ${user
        ? `<a href="/app" ${path === '/app' ? 'aria-current="page" class="px-2 sm:px-3 py-1.5 rounded-lg bg-stone-100 font-medium"' : 'class="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-stone-100"'}>Planner</a>
           <a href="/app/recipes" ${path.startsWith('/app/recipes') ? 'aria-current="page" class="px-2 sm:px-3 py-1.5 rounded-lg bg-stone-100 font-medium"' : 'class="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-stone-100"'}>Recipes</a>
           <a href="/app/list" ${path.startsWith('/app/list') ? 'aria-current="page" class="px-2 sm:px-3 py-1.5 rounded-lg bg-stone-100 font-medium"' : 'class="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-stone-100"'}>List</a>
           <form method="post" action="/logout" class="inline"><button class="px-2 sm:px-3 py-1.5 rounded-lg text-stone-500 hover:bg-stone-100 whitespace-nowrap">Log out</button></form>`
        : `<a href="/pricing" ${path === '/pricing' ? 'aria-current="page" class="px-2 sm:px-3 py-1.5 rounded-lg bg-stone-100 font-medium"' : 'class="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-stone-100"'}>Pricing</a>
           <a href="/login" class="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-stone-100">Log in</a>
           <a href="/login" class="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 whitespace-nowrap">Start free trial</a>`}
    </nav>
  </div>
</header>
<main id="main" class="flex-1 w-full max-w-5xl mx-auto px-4 py-6">${body}</main>
<footer class="border-t border-stone-200 bg-white mt-10 print:hidden">
  <div class="max-w-5xl mx-auto px-4 py-8 text-sm text-stone-500 space-y-3">
    <div class="flex flex-wrap gap-x-5 gap-y-2">
      <a class="hover:text-stone-700" href="/pricing">Pricing</a>
      <a class="hover:text-stone-700" href="/guides">Guides</a>
      <a class="hover:text-stone-700" href="/about">About</a>
      <a class="hover:text-stone-700" href="/press">Press</a>
      <a class="hover:text-stone-700" href="/privacy">Privacy</a>
      <a class="hover:text-stone-700" href="/terms">Terms</a>
    </div>
    <p>More from us:
      <a class="underline hover:text-stone-700" href="https://astrosage.zalize.com" rel="noopener">AstroSage</a> ·
      <a class="underline hover:text-stone-700" href="https://subsleuth.zalize.com" rel="noopener">SubSleuth</a> ·
      <a class="underline hover:text-stone-700" href="https://cv.zalize.com" rel="noopener">CV Builder</a> ·
      <a class="underline hover:text-stone-700" href="https://watchdeck.zalize.com" rel="noopener">WatchDeck</a>
    </p>
    <p>© ${new Date().getFullYear()} MealLoop. Family meal planning — in open beta, all features free during beta. No ads, no cookie-based tracking.</p>
  </div>
</footer>
</body>
</html>`;
}
