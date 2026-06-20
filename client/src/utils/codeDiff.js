export const createCodeDiff = (originalCode, updatedCode, contextLines = 2) => {
  const before = String(originalCode || '').split('\n');
  const after = String(updatedCode || '').split('\n');
  let prefix = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < before.length - prefix && suffix < after.length - prefix
    && before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) suffix += 1;
  return {
    before: before.slice(Math.max(0, prefix - contextLines), prefix),
    removed: before.slice(prefix, before.length - suffix),
    added: after.slice(prefix, after.length - suffix),
    after: after.slice(after.length - suffix, Math.min(after.length, after.length - suffix + contextLines)),
  };
};
