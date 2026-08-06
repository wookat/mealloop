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
