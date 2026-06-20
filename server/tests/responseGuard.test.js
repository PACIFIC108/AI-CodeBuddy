const test = require('node:test');
const assert = require('node:assert/strict');
const { looksLikeFullSolution, shouldGuardResponse } = require('../utils/responseGuard');

test('detects complete implementations but permits small teaching snippets', () => {
  const fullSolution = `\`\`\`cpp
class Solution {
public:
  int solve(vector<int>& values) {
    int answer = 0;
    for (int value : values) {
      answer += value;
    }
    return answer;
  }
};
\`\`\``;
  assert.equal(looksLikeFullSolution(fullSolution), true);
  assert.equal(looksLikeFullSolution('A small example is `prefix[i] = prefix[i-1] + a[i]`.'), false);
  assert.equal(shouldGuardResponse('hint'), true);
  assert.equal(shouldGuardResponse('solution'), false);
});
