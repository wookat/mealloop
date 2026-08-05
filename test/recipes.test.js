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
