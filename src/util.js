export function uid() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
}

export function token(len = 24) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return [...bytes].map((b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
}

export function esc(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function weekDates(startParam) {
  const base = startParam ? new Date(startParam + 'T00:00:00Z') : new Date();
  const day = base.getUTCDay(); // 0 Sun
  const monday = new Date(base);
  monday.setUTCDate(base.getUTCDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const CATEGORY_RULES = [
  ['Canned & Sauces', /\b(stock|broth|passata|sauce|canned|paste|beans|soup|vinegar|soy)/i],
  ['Produce', /\b(onion|garlic|tomato(es)?|lettuce|spinach|basil|cilantro|parsley|pepper[s]?|carrot|celery|potato|lemon|lime|apple|banana|avocado|cucumber|zucchini|broccoli|mushroom|ginger|scallion|herb)/i],
  ['Meat & Seafood', /\b(chicken|beef|pork|lamb|turkey|bacon|sausage|ham|prosciutto|pancetta|chorizo|mince|fish|salmon|shrimp|prawn|tuna|steak)/i],
  ['Dairy & Eggs', /\b(milk|butter|cheese|cream|yogurt|egg[s]?|mozzarella|parmesan|provolone|cheddar)/i],
  ['Bakery & Grains', /\b(bread|flour|pasta|rice|noodle|tortilla|panko|crumb|oat|quinoa)/i],
  ['Spices & Baking', /\b(salt|sugar|spice|cumin|paprika|oregano|cinnamon|baking|yeast|vanilla|pepper\b)/i],
  ['Oils & Condiments', /\b(oil|olive oil|mayo|mustard|ketchup|honey|syrup)/i],
];

export function categorize(label) {
  for (const [cat, re] of CATEGORY_RULES) if (re.test(label)) return cat;
  return 'Other';
}

export const STANDARD_CATEGORIES = [...CATEGORY_RULES.map(([cat]) => cat), 'Other'];

const UNITS = 'g|kg|ml|l|oz|lb|lbs|tbsp|tsp|cup|cups|clove|cloves|can|cans|pack|packs|sprig|sprigs|slice|slices|bunch|bunches|handful';
const VULGAR = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };
const TIGHT_UNITS = new Set(['g', 'ml', 'oz']);
const UNIT_ALIASES = { lbs: 'lb', cups: 'cup', cloves: 'clove', cans: 'can', packs: 'pack', sprigs: 'sprig', slices: 'slice', bunches: 'bunch' };
const UNIT_SCALE = { kg: ['g', 1000], l: ['ml', 1000] };
const COUNT_UNITS = new Set(['cup', 'clove', 'can', 'pack', 'sprig', 'slice', 'bunch']);

function canonicalUnit(unit, qty) {
  if (!unit) return { unit, qty };
  let u = UNIT_ALIASES[unit] || unit;
  if (UNIT_SCALE[u] && qty != null) {
    const [to, factor] = UNIT_SCALE[u];
    return { unit: to, qty: qty * factor };
  }
  return { unit: u, qty };
}

// "750g lean beef mince" -> { qty: 750, unit: 'g', name: 'lean beef mince' }
export function parseIngredient(label) {
  const raw = String(label).trim();
  // Range quantities ("2-3 sprigs rosemary") can't be scaled or summed safely.
  if (/^\d+(?:[.,]\d+)?\s*[-–—]\s*\d/.test(raw)) return { qty: null, unit: null, name: raw };
  const m = raw.match(new RegExp(`^(\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:[.,]\\d+)?|[${Object.keys(VULGAR).join('')}])\\s*(${UNITS})?\\b\\.?\\s*(.*)$`, 'i'));
  if (!m || !m[3]) return { qty: null, unit: null, name: raw };
  const { unit, qty } = canonicalUnit(m[2] ? m[2].toLowerCase() : null, toNumber(m[1]));
  return { qty, unit, name: m[3].trim() };
}

function toNumber(s) {
  if (VULGAR[s] !== undefined) return VULGAR[s];
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return Number(s.replace(',', '.'));
}

function singular(word) {
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  if (/(oes|ches|shes|sses|xes|zes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1);
  return word;
}

function plural(word) {
  if (/(s|x|z|ch|sh)$/i.test(word)) return word + 'es';
  if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + 'ies';
  if (/[^aeiou]o$/i.test(word)) return word + 'es';
  return word + 's';
}

function nameKey(name) {
  const clean = name.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
  return clean.split(' ').map(singular).join(' ');
}

export function formatIngredient({ qty, unit, name }) {
  if (qty == null) return name;
  const n = Math.round(qty * 100) / 100;
  if (!unit) {
    const words = name.split(' ');
    // Only adjust plurality of short plain names ("onion", "red onion") — long
    // descriptive names ("celery sticks finely chopped") must pass through as-is.
    if (words.length <= 2) {
      const last = words[words.length - 1];
      words[words.length - 1] = n === 1 ? singular(last) : (singular(last) === last ? plural(last) : last);
    }
    return `${n} ${words.join(' ')}`;
  }
  const u = COUNT_UNITS.has(unit) && n !== 1 ? (unit === 'bunch' ? 'bunches' : `${unit}s`) : unit;
  return TIGHT_UNITS.has(u) ? `${n}${u} ${name}` : `${n} ${u} ${name}`;
}

// "750g beef" × 2 -> "1500g beef"; labels without a quantity pass through unchanged.
export function scaleIngredient(label, factor) {
  if (!factor || factor === 1) return String(label);
  const parsed = parseIngredient(label);
  if (parsed.qty == null) return String(label);
  return formatIngredient({ ...parsed, qty: parsed.qty * factor });
}

// Sums quantities of the same ingredient+unit; keeps unparsed labels as-is.
export function mergeIngredients(labels) {
  const out = [];
  const index = new Map();
  for (const label of labels) {
    const parsed = parseIngredient(label);
    const key = `${nameKey(parsed.name)}|${parsed.unit || ''}`;
    const at = index.get(key);
    if (at === undefined) {
      index.set(key, out.push(parsed) - 1);
    } else if (parsed.qty != null && out[at].qty != null) {
      out[at].qty += parsed.qty;
    }
    // same key but unquantifiable on either side: treat as duplicate, keep first
  }
  return out.map(formatIngredient);
}
