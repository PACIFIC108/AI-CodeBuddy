const looksLikeFullSolution = response => {
  const text = String(response || '');
  const fencedBlocks = [...text.matchAll(/```[\w+-]*\n([\s\S]*?)```/g)].map(match => match[1]);
  if (fencedBlocks.some(block => block.split('\n').length >= 12 || /class\s+Solution|public\s+static\s+void\s+main/i.test(block))) return true;
  return /class\s+Solution/i.test(text) && text.split('\n').length >= 12;
};

const shouldGuardResponse = intent => !['solution', 'dryrun'].includes(intent);

module.exports = { looksLikeFullSolution, shouldGuardResponse };
