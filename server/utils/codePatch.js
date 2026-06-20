const parseCodePatch = (response, originalCode) => {
  const text = String(response || '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('The AI provider did not return a valid code patch.');

  let parsed;
  try { parsed = JSON.parse(text.slice(start, end + 1)); } catch {
    throw new Error('The AI provider returned malformed patch data. Please try again.');
  }
  const updatedCode = typeof parsed.updatedCode === 'string' ? parsed.updatedCode.trimEnd() : '';
  const summary = typeof parsed.summary === 'string' ? parsed.summary.trim().slice(0, 500) : '';
  const explanation = typeof parsed.explanation === 'string' ? parsed.explanation.trim().slice(0, 2000) : '';
  if (!updatedCode || updatedCode.length > 50000) throw new Error('The proposed code patch is empty or too large.');
  if (updatedCode.trim() === String(originalCode || '').trim()) throw new Error('The model did not propose any code change.');
  return {
    summary: summary || 'Suggested code correction',
    explanation: explanation || 'Review the proposed change before applying it.',
    updatedCode,
  };
};

module.exports = { parseCodePatch };
