import test from 'node:test';
import assert from 'node:assert';
import { extractRecipe } from '../src/recipes.js';
import { categorize, weekDates } from '../src/util.js';

test('extracts schema.org Recipe from JSON-LD', () => {
  const html = `<html><head><script type="application/ld+json">
  {"@context":"https://schema.org","@graph":[{"@type":["Recipe"],"name":"Chicken Parmesan",
  "description":"Crispy chicken.","image":["https://x/img.jpg"],"prepTime":"PT15M","cookTime":"PT20M",
  "recipeYield":["4"],"recipeIngredient":["4 chicken breasts","1 cup panko"],
  "recipeInstructions":[{"@type":"HowToStep","text":"Pound chicken."},{"@type":"HowToStep","text":"Bread and fry."}]}]}
  </script></head><body></body></html>`;
  const r = extractRecipe(html);
  assert.equal(r.title, 'Chicken Parmesan');
  assert.equal(r.prep_minutes, 15);
  assert.equal(r.cook_minutes, 20);
  assert.deepEqual(r.ingredients, ['4 chicken breasts', '1 cup panko']);
  assert.equal(r.steps.length, 2);
  assert.equal(r.image_url, 'https://x/img.jpg');
});

test('handles HowToSection and string instructions', () => {
  const html = `<script type="application/ld+json">{"@type":"Recipe","name":"Soup",
  "recipeInstructions":[{"@type":"HowToSection","itemListElement":[{"@type":"HowToStep","text":"Chop."}]},"Simmer."]}</script>`;
  const r = extractRecipe(html);
  assert.deepEqual(r.steps, ['Chop.', 'Simmer.']);
});

test('returns null when no recipe present', () => {
  assert.equal(extractRecipe('<html><body>hi</body></html>'), null);
});

test('categorize groups grocery items', () => {
  assert.equal(categorize('2 skinless boneless chicken breasts'), 'Meat & Seafood');
  assert.equal(categorize('1 cup grated Parmesan cheese'), 'Dairy & Eggs');
  assert.equal(categorize('fresh basil'), 'Produce');
  assert.equal(categorize('mystery item'), 'Other');
});

test('weekDates returns Monday-start 7 days', () => {
  const days = weekDates('2026-08-05');
  assert.equal(days.length, 7);
  assert.equal(days[0], '2026-08-03');
  assert.equal(days[6], '2026-08-09');
});

test('isPublicHttpUrl rejects internal targets and accepts public sites', async () => {
  const { isPublicHttpUrl } = await import('../src/recipes.js');
  assert.equal(isPublicHttpUrl('https://www.bbcgoodfood.com/recipes/classic-lasagne-0'), true);
  assert.equal(isPublicHttpUrl('http://localhost:8787/x'), false);
  assert.equal(isPublicHttpUrl('http://169.254.169.254/latest/meta-data'), false);
  assert.equal(isPublicHttpUrl('http://10.0.0.1/'), false);
  assert.equal(isPublicHttpUrl('http://[::1]/'), false);
  assert.equal(isPublicHttpUrl('ftp://example.com/'), false);
  assert.equal(isPublicHttpUrl('http://intranet/'), false);
  assert.equal(isPublicHttpUrl('http://foo.internal/'), false);
});

test('mergeIngredients sums duplicate quantities and dedupes', async () => {
  const { mergeIngredients } = await import('../src/util.js');
  assert.deepEqual(
    mergeIngredients(['2 tbsp olive oil', '1 tbsp olive oil', '750g beef mince', '250g beef mince', 'nutmeg', 'nutmeg', '1/2 cup milk', '½ cup milk']),
    ['3 tbsp olive oil', '1000g beef mince', 'nutmeg', '1 cup milk']
  );
  assert.deepEqual(mergeIngredients(['2 onions', '1 onion']), ['3 onions']);
  assert.deepEqual(mergeIngredients(['1 kg potatoes', '500g potatoes']), ['1500g potatoes']);
  assert.deepEqual(mergeIngredients(['1 cup flour', '2 cups flour']), ['3 cups flour']);
  assert.deepEqual(mergeIngredients(['1 lb butter', '1 lbs butter']), ['2 lb butter']);
  assert.deepEqual(mergeIngredients(['2 tomatoes', '1 tomato', '3 berries', '1 berry']), ['3 tomatoes', '4 berries']);
});

test('scaleIngredient multiplies quantities and passes through unquantified labels', async () => {
  const { scaleIngredient } = await import('../src/util.js');
  assert.equal(scaleIngredient('750g beef mince', 2), '1500g beef mince');
  assert.equal(scaleIngredient('1 cup milk', 2), '2 cups milk');
  assert.equal(scaleIngredient('2 onions', 0.5), '1 onion');
  assert.equal(scaleIngredient('1 onion', 2), '2 onions');
  assert.equal(scaleIngredient('1 tomato', 3), '3 tomatoes');
  assert.equal(scaleIngredient('nutmeg', 3), 'nutmeg');
  assert.equal(scaleIngredient('2 tbsp olive oil', 1), '2 tbsp olive oil');
});

test('descriptive names and ranges are not mangled by scaling', async () => {
  const { scaleIngredient, parseIngredient } = await import('../src/util.js');
  assert.equal(scaleIngredient('8 rashers smoked streaky bacon finely chopped', 2), '16 rashers smoked streaky bacon finely chopped');
  assert.equal(scaleIngredient('12 cherry tomatoes sliced in half', 2), '24 cherry tomatoes sliced in half');
  assert.equal(scaleIngredient('2-3 sprigs rosemary leaves picked and chopped', 2), '2-3 sprigs rosemary leaves picked and chopped');
  assert.equal(parseIngredient('2-3 sprigs rosemary').qty, null);
  assert.equal(scaleIngredient('1 red onion', 2), '2 red onions');
});
