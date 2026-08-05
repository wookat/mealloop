# MealLoop v1 Production Test Plan (https://mealloop.zalize.com)

Setup done: /etc/hosts → 104.21.0.1; Mail.tm mailbox mealloop-qa-4405@web-library.net; KV fallback for code via wrangler (`code:<email>` in namespace a02f5b9e979e4f9fb8dbe95a0cd4f983).

Record all browser tests. Evidence via screenshots.

## T1 Landing + SEO
- GET / in Chrome: hero "What's for dinner? Decide once, together.", CTA "Start planning — free", footer links (Privacy/Terms/Guides). PASS iff visible.
- Mobile viewport (390px via devtools device toolbar OR window resize): layout stacks, no horizontal overflow.
- /robots.txt contains `Disallow: /app` + Sitemap line; /sitemap.xml lists /guides/* URLs; /guides page lists guides; open one guide page → title + CTA box. (curl for robots/sitemap OK, guides in browser.)

## T2 Magic-code login
- /login → enter mealloop-qa-4405@web-library.net → "Email me a code" → page shows "Code sent to ...".
- Fetch code from Mail.tm API (fallback: wrangler kv get). Enter code → "Verify & continue".
- PASS iff redirected to /app showing "Week of YYYY-MM-DD" planner grid (7 day cards, breakfast/lunch/dinner slots).

## T3 Recipe import
- /app/recipes → paste https://www.allrecipes.com/recipe/223042/chicken-parmesan/ → "Import recipe".
- PASS iff redirected to /app/recipes/<id> showing title "Chicken Parmesan" (or similar), an image, non-empty Ingredients list and numbered Steps, "Original source" link.

## T4 Planner
- /app → on a day card, expand "+ add" under dinner, pick imported recipe → Add. PASS iff entry appears in that slot as green link.
- Add second entry with free-text note "Leftovers" via note field. PASS iff appears as text.
- Delete the note entry via ✕. PASS iff removed after reload.

## T5 Grocery list generation + optimistic check-off
- Click "Add week's ingredients to grocery list" → redirected to /app/list.
- PASS iff items grouped under aisle headers (e.g. MEAT & SEAFOOD, DAIRY, PANTRY per util.categorize) matching chicken-parm ingredients.
- Click an item: checkbox turns green + strikethrough instantly (screenshot immediately; devtools network confirms POST /app/list/toggle returns {ok:true} — verify no full page reload happened by observing check applied without navigation).
- Check 2 items → "Clear checked" → PASS iff those items gone, unchecked remain.

## T6 Share link + 5s version sync
- /app/share → copy link /s/<token>.
- Open /s/<token> in incognito window: week plan cards visible incl. planned dinner entry; grocery list visible; NO login required; no "Add item" form (read-only except checkboxes).
- Sync: in incognito, check an item; within ~5-10s the logged-in /app/list tab should auto-reload showing that item checked. PASS iff observed without manual refresh.

## T7 Mobile responsiveness of /app and /app/list (hard criterion)
- Devtools device toolbar ~390x844: /app day cards stack single column, buttons usable, no horizontal scroll; /app/list items full-width tappable. Screenshot each.

## Security/compliance spot checks (shell, not recorded)
- GET /app without cookie → 302 to /login.
- /s/badtoken → 404.
- /privacy and /terms return 200 with policy text.
- Recipe title with HTML is escaped (manual recipe titled `<img src=x onerror=alert(1)>` — page must show literal text, no broken img). Delete it after.
