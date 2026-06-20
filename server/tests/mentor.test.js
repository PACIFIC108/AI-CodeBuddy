const test = require('node:test');
const assert = require('node:assert/strict');
const { directCompanionReply, contextForIntent } = require('../utils/mentor');

const pageContext = {
  title: 'two-sum',
  question: 'Find two values that sum to target.',
  language: 'cpp',
  code: 'class Solution { /* private learner code */ };',
};

test('greets learners without invoking a coding model', () => {
  const reply = directCompanionReply('hi', pageContext.title);
  assert.match(reply, /Hi!/);
  assert.match(reply, /small hint/);
  assert.doesNotMatch(reply, /class Solution/);
});

test('casual and conceptual messages do not receive page code by default', () => {
  const prompt = contextForIntent({
    ...pageContext, intent: 'general', query: 'What is a prefix sum?',
    codeReferenced: false, problemReferenced: false,
  });
  assert.match(prompt, /prefix sum/);
  assert.doesNotMatch(prompt, /private learner code|Problem statement/);
});

test('code-referencing explanations receive the relevant page context', () => {
  const prompt = contextForIntent({
    ...pageContext, intent: 'explain', query: 'Explain my code',
    codeReferenced: true, problemReferenced: false,
  });
  assert.match(prompt, /private learner code/);
  assert.match(prompt, /Find two values/);
});
