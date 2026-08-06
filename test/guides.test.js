import test from 'node:test';
import assert from 'node:assert';
import { GUIDES } from '../src/guides.js';

test('guides have unique slugs and complete metadata', () => {
  const slugs = GUIDES.map((g) => g.slug);
  assert.strictEqual(new Set(slugs).size, slugs.length);
  for (const g of GUIDES) {
    assert.match(g.slug, /^[a-z0-9-]+$/);
    assert.ok(g.title.length > 10 && g.title.length <= 90);
    assert.ok(g.excerpt.length > 20 && g.excerpt.length <= 160);
    assert.ok(g.body.includes('<h2') && g.body.includes('<p'));
  }
});
