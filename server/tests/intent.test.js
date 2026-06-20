const test = require('node:test');
const assert = require('node:assert/strict');
const { detectIntent, referencesCode, referencesProblem } = require('../utils/intent');

test('detects supported assistant intents without an LLM call', () => {
  assert.equal(detectIntent('Give me a small hint'), 'hint');
  assert.equal(detectIntent('Why is this wrong answer failing?'), 'debug');
  assert.equal(detectIntent('Give me a test case where it fails'), 'debug');
  assert.equal(detectIntent('Check the code present in the IDE'), 'debug');
  assert.equal(detectIntent('Dry-run this for [1, 2]'), 'dryrun');
  assert.equal(detectIntent('Show my progress'), 'progress');
  assert.equal(detectIntent('List previous submissions'), 'history');
  assert.equal(detectIntent('Hello there'), 'conversation');
  assert.equal(detectIntent('What can you do?'), 'conversation');
  assert.equal(detectIntent('Explain binary search'), 'explain');
  assert.equal(detectIntent('Give me the full solution'), 'solution');
  assert.equal(detectIntent('Fix my code but keep my approach'), 'fix');
  assert.equal(detectIntent('What should I fix conceptually?'), 'general');
  assert.equal(detectIntent('Hi, give me a hint'), 'hint');
});

test('detects when the latest message actually references page context', () => {
  assert.equal(referencesCode('Explain my code'), true);
  assert.equal(referencesCode('Explain binary search'), false);
  assert.equal(referencesCode('It is already present in the IDE'), true);
  assert.equal(referencesProblem('What does this problem mean?'), true);
  assert.equal(referencesProblem('What is a prefix sum?'), false);
});
