import test from 'node:test';
import assert from 'node:assert/strict';
import { sendMagicCode } from '../src/auth.js';

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    async get(k) { return store.has(k) ? store.get(k) : null; },
    async put(k, v) { store.set(k, v); },
    async delete(k) { store.delete(k); },
  };
}

function withFetch(impl, fn) {
  const orig = globalThis.fetch;
  globalThis.fetch = impl;
  return fn().finally(() => { globalThis.fetch = orig; });
}

const day = new Date().toISOString().slice(0, 10);

test('sendMagicCode sends and only stores the code after a successful send', async () => {
  const KV = fakeKV();
  let calls = 0;
  await withFetch(async () => { calls++; return new Response('{}', { status: 200 }); }, async () => {
    const r = await sendMagicCode({ KV, RESEND_API_KEY: 'x' }, 'a@b.com', '1.2.3.4');
    assert.equal(r, 'ok');
  });
  assert.equal(calls, 1);
  assert.match(KV.store.get('code:a@b.com'), /^\d{6}$/);
  assert.equal(KV.store.get('mailip:1.2.3.4'), '1');
  assert.equal(KV.store.get(`mailday:${day}`), '1');
});

test('per-IP hourly limit blocks before calling the provider', async () => {
  const KV = fakeKV({ 'mailip:9.9.9.9': '10' });
  let calls = 0;
  await withFetch(async () => { calls++; return new Response('{}', { status: 200 }); }, async () => {
    const r = await sendMagicCode({ KV, RESEND_API_KEY: 'x' }, 'c@d.com', '9.9.9.9');
    assert.equal(r, 'limit');
  });
  assert.equal(calls, 0);
  assert.equal(KV.store.has('code:c@d.com'), false);
});

test('global daily circuit breaker returns quota without sending', async () => {
  const KV = fakeKV({ [`mailday:${day}`]: '90' });
  let calls = 0;
  await withFetch(async () => { calls++; return new Response('{}', { status: 200 }); }, async () => {
    const r = await sendMagicCode({ KV, RESEND_API_KEY: 'x' }, 'e@f.com', '5.5.5.5');
    assert.equal(r, 'quota');
  });
  assert.equal(calls, 0);
});

test('failed provider send leaves no usable code', async () => {
  const KV = fakeKV();
  await withFetch(async () => new Response('nope', { status: 500 }), async () => {
    const r = await sendMagicCode({ KV, RESEND_API_KEY: 'x' }, 'g@h.com', '6.6.6.6');
    assert.equal(r, 'fail');
  });
  assert.equal(KV.store.has('code:g@h.com'), false);
});
