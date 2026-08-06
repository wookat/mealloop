import test from 'node:test';
import assert from 'node:assert/strict';
import { page } from '../src/layout.js';

test('page() og:type, robots and canonical meta', () => {
  const base = { title: 'T', description: 'D', body: '' };
  const website = page({ ...base, path: '/guides' });
  assert.ok(website.includes('<meta property="og:type" content="website">'));
  assert.ok(!website.includes('name="robots"'));
  assert.ok(website.includes('<link rel="canonical" href="https://mealloop.zalize.com/guides">'));

  const article = page({ ...base, path: '/guides/x', ogType: 'article' });
  assert.ok(article.includes('<meta property="og:type" content="article">'));

  const bogus = page({ ...base, ogType: 'profile' });
  assert.ok(bogus.includes('<meta property="og:type" content="website">'));

  const hidden = page({ ...base, noindex: true });
  assert.ok(hidden.includes('<meta name="robots" content="noindex">'));
});
