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
