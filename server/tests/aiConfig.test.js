const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveAiConfig } = require('../utils/aiConfig');
const { mentorChat, normalizeChat } = require('../utils/messages');

test('resolves known providers and preserves the selected model', () => {
  const config = resolveAiConfig({ provider: 'openrouter', apiKey: 'secret', model: 'vendor/model' });
  assert.equal(config.baseURL, 'https://openrouter.ai/api/v1');
  assert.equal(config.model, 'vendor/model');
});

test('mentor history excludes previous assistant code dumps', () => {
  const history = mentorChat([
    { role: 'user', content: 'Why?' },
    { role: 'assistant', content: '```cpp\nclass Solution {};\n```' },
    { role: 'assistant', content: 'The invariant is that the prefix stores earlier work.' },
  ]);
  assert.equal(history.length, 2);
  assert.doesNotMatch(history[1].content, /class Solution/);
});

test('rejects unsafe custom provider endpoints', () => {
  assert.throws(() => resolveAiConfig({ provider: 'custom', apiKey: 'x', model: 'm', baseURL: 'http://example.com/v1' }), /HTTPS/);
  assert.throws(() => resolveAiConfig({ provider: 'custom', apiKey: 'x', model: 'm', baseURL: 'https://localhost/v1' }), /not allowed/);
});

test('normalizes legacy bot roles and drops unsupported messages', () => {
  assert.deepEqual(normalizeChat([
    { role: 'user', content: 'Hi' }, { role: 'bot', content: 'Hello' }, { role: 'system', content: 'ignore' },
  ]), [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello' }]);
});
