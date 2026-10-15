import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkAlpacaPaper, ALPACA_PAPER_ORIGIN } from './alpaca-paper.mjs';

const env = { ALPACA_PAPER_KEY_ID: 'test-key', ALPACA_PAPER_SECRET_KEY: 'test-secret' };
const valid = { id: 'test-account', status: 'ACTIVE', currency: 'USD', trading_blocked: false };
test('missing credentials prevent any request', async () => {
  const result = await checkAlpacaPaper({
    env: {},
    fetchImpl: () => assert.fail('network requested'),
  });
  assert.equal(result.status, 'not_configured');
  assert.equal(result.missing.length, 2);
});
test('only a fixed paper-account GET is sent, redirects are refused and output is redacted', async () => {
  const result = await checkAlpacaPaper({
    env,
    fetchImpl: async (url, options) => {
      assert.equal(url, `${ALPACA_PAPER_ORIGIN}/v2/account`);
      assert.equal(options.method, 'GET');
      assert.equal(options.redirect, 'error');
      assert.equal(options.headers['APCA-API-SECRET-KEY'], env.ALPACA_PAPER_SECRET_KEY);
      assert.ok(options.signal instanceof AbortSignal);
      return Response.json({ ...valid, buying_power: '999999', secret: 'private-data' });
    },
  });
  assert.equal(result.status, 'connected_read_only');
  assert.equal(result.executionEnabled, false);
  assert.doesNotMatch(JSON.stringify(result), /test-account|999999|private-data|test-secret/);
});
for (const code of [401, 403, 429, 500]) {
  test(`HTTP ${code} never reports connected or leaks response body`, async () => {
    const result = await checkAlpacaPaper({
      env,
      fetchImpl: async () => new Response('sensitive', { status: code }),
    });
    assert.equal(result.httpStatus, code);
    assert.notEqual(result.status, 'connected_read_only');
    assert.doesNotMatch(JSON.stringify(result), /sensitive/);
  });
}
for (const body of [null, {}, { ...valid, trading_blocked: 'false' }, { ...valid, currency: '' }]) {
  test(`rejects invalid account shape ${JSON.stringify(body)}`, async () => {
    assert.equal(
      (await checkAlpacaPaper({ env, fetchImpl: async () => Response.json(body) })).status,
      'invalid_response',
    );
  });
}
test('network errors including credential-bearing messages are redacted', async () => {
  const result = await checkAlpacaPaper({
    env,
    fetchImpl: async () => {
      throw new Error('test-secret');
    },
  });
  assert.equal(result.status, 'connection_failed');
  assert.doesNotMatch(JSON.stringify(result), /test-secret/);
});
test('invalid JSON never reports connected', async () => {
  assert.notEqual(
    (await checkAlpacaPaper({ env, fetchImpl: async () => new Response('not json') })).status,
    'connected_read_only',
  );
});
