const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCodePatch } = require('../utils/codePatch');

test('parses a structured editor patch', () => {
  const patch = parseCodePatch(JSON.stringify({
    summary: 'Correct the loop boundary',
    explanation: 'The final element was skipped.',
    updatedCode: 'for (int i = 0; i < n; ++i) {}',
  }), 'for (int i = 0; i < n - 1; ++i) {}');
  assert.equal(patch.summary, 'Correct the loop boundary');
  assert.match(patch.updatedCode, /i < n/);
});

test('rejects unchanged and malformed patches', () => {
  assert.throws(() => parseCodePatch('{"updatedCode":"same"}', 'same'), /did not propose/);
  assert.throws(() => parseCodePatch('not json', 'code'), /valid code patch/);
});
