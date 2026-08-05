// Server-side recipe import: fetch a URL and extract schema.org/Recipe JSON-LD.
import puppeteer from '@cloudflare/puppeteer';

export async function importRecipeFromUrl(url, env) {
  try {
    return await fetchAndExtract(url, url);
  } catch (e) {
    if (!/blocks automated access/.test(e.message) || !env?.BROWSER) throw e;
    // Fallback: render with a real headless browser for sites that block datacenter fetches.
    return browserExtract(url, env);
  }
}

async function browserExtract(url, env) {
  const browser = await puppeteer.launch(env.BROWSER);
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 }).catch(() => {});
    const html = await page.content();
    console.log(`browserExtract ${url}: html=${html.length} title=${(html.match(/<title[^>]*>([^<]*)/i) || [])[1] || ''}`);
    const recipe = extractRecipe(html);
    if (!recipe) throw new Error('no recipe data was found on that page — you can add it manually below');
    recipe.source_url = url;
    return recipe;
  } finally {
    await browser.close();
  }
}

async function fetchAndExtract(fetchUrl, sourceUrl, extraHeaders = {}) {
  const res = await fetch(fetchUrl, {
    headers: {
      ...extraHeaders,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Upgrade-Insecure-Requests': '1',
    },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(
      res.status === 403 || res.status === 429
        ? 'this site blocks automated access — you can copy the recipe in manually below'
        : `the page could not be loaded (HTTP ${res.status})`
    );
  }
  const html = await res.text();
  const recipe = extractRecipe(html);
  if (!recipe) throw new Error('no recipe data was found on that page — you can add it manually below');
  recipe.source_url = sourceUrl;
  return recipe;
}

export function extractRecipe(html) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [, raw] of blocks) {
    let data;
    try {
      data = JSON.parse(raw.trim());
    } catch {
      continue;
    }
    const node = findRecipeNode(data);
    if (node) return normalize(node);
  }
  return null;
}

function toArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function findRecipeNode(data) {
  const queue = Array.isArray(data) ? [...data] : [data];
  while (queue.length) {
    const node = queue.shift();
    if (!node || typeof node !== 'object') continue;
    const type = node['@type'];
    const types = Array.isArray(type) ? type : [type];
    if (types.includes('Recipe')) return node;
    if (Array.isArray(node['@graph'])) queue.push(...node['@graph']);
    if (Array.isArray(node.mainEntity)) queue.push(...node.mainEntity);
    else if (node.mainEntity) queue.push(node.mainEntity);
  }
  return null;
}

function normalize(node) {
  const ingredients = toArray(node.recipeIngredient || node.ingredients).map((s) => clean(String(s)));
  const steps = flattenInstructions(node.recipeInstructions);
  return {
    title: clean(text(node.name)) || 'Untitled recipe',
    description: clean(text(node.description)).slice(0, 500),
    image_url: firstImage(node.image),
    prep_minutes: isoDurationToMinutes(node.prepTime),
    cook_minutes: isoDurationToMinutes(node.cookTime),
    servings: clean(text(Array.isArray(node.recipeYield) ? node.recipeYield[0] : node.recipeYield)).slice(0, 40) || null,
    ingredients,
    steps,
  };
}

function flattenInstructions(ins) {
  const out = [];
  const walk = (item) => {
    if (!item) return;
    if (typeof item === 'string') return void out.push(clean(item));
    if (Array.isArray(item)) return void item.forEach(walk);
    if (item['@type'] === 'HowToSection') return void walk(item.itemListElement);
    if (item.text || item.name) out.push(clean(text(item.text || item.name)));
  };
  walk(ins);
  return out.filter(Boolean);
}

function firstImage(img) {
  if (!img) return null;
  if (typeof img === 'string') return img;
  if (Array.isArray(img)) return firstImage(img[0]);
  return img.url || null;
}

function isoDurationToMinutes(d) {
  if (!d || typeof d !== 'string') return null;
  const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return null;
  return (parseInt(m[1] || 0, 10) * 60 + parseInt(m[2] || 0, 10)) || null;
}

function text(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return v.text || v.name || '';
}

function clean(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&nbsp;', ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
