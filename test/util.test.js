import test from 'node:test';
import assert from 'node:assert/strict';
import { icsEscape } from '../src/util.js';

test('icsEscape escapes RFC 5545 TEXT special characters', () => {
  assert.equal(icsEscape('pasta, salad & bread'), 'pasta\\, salad & bread');
  assert.equal(icsEscape('one;two'), 'one\\;two');
  assert.equal(icsEscape('back\\slash'), 'back\\\\slash');
  assert.equal(icsEscape('line1\nline2'), 'line1\\nline2');
  assert.equal(icsEscape('crlf\r\nend'), 'crlf\\nend');
  assert.equal(icsEscape('a\\b;c,d\ne'), 'a\\\\b\\;c\\,d\\ne');
  assert.equal(icsEscape(null), '');
  assert.equal(icsEscape('plain text'), 'plain text');
});

import { copyName } from '../src/util.js';

test('copyName prefixes and truncates to 60 chars', () => {
  assert.equal(copyName('Busy week'), 'Copy of Busy week');
  const long = 'X'.repeat(60);
  const out = copyName(long);
  assert.equal(out.length, 60);
  assert.ok(out.startsWith('Copy of X'));
  assert.equal(copyName(''), 'Copy of ');
});

import { splitListInput } from '../src/util.js';

test('splitListInput splits on commas but keeps decimal commas', () => {
  assert.deepEqual(splitListInput('milk, eggs, bread'), ['milk', 'eggs', 'bread']);
  assert.deepEqual(splitListInput('1,5 kg flour'), ['1,5 kg flour']);
  assert.deepEqual(splitListInput('2 lemons'), ['2 lemons']);
  assert.deepEqual(splitListInput('milk,, ,eggs'), ['milk', 'eggs']);
  assert.deepEqual(splitListInput('butter, 1,5 l milk, jam'), ['butter', '1,5 l milk', 'jam']);
  assert.deepEqual(splitListInput(''), []);
  assert.equal(splitListInput(Array.from({ length: 30 }, (_, i) => `item${i}`).join(', ')).length, 20);
});

test('clip truncates without splitting surrogate pairs', async () => {
  const { clip } = await import('../src/util.js');
  assert.equal(clip('hello', 10), 'hello');
  assert.equal(clip('hello world', 5), 'hello');
  assert.equal(clip('a'.repeat(3) + '🍕', 4), 'aaa');
  assert.equal(clip('a'.repeat(3) + '🍕', 5), 'aaa🍕');
  assert.equal(clip('🍕🍕🍕', 3), '🍕');
  assert.equal(clip('', 5), '');
  assert.equal(clip(null, 5), '');
});
