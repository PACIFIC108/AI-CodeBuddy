const directCompanionReply = (query, title) => {
  const text = String(query || '').trim().toLowerCase();
  const problem = title ? ` on “${title}”` : '';
  if (/^(hi|hello|hey|yo|good (morning|afternoon|evening))( there)?[!.? ]*$/.test(text)) {
    return `Hi! I’m here to work through the problem${problem} with you. Ask for a small hint, an explanation, debugging help, or a dry run—I'll guide you without jumping straight to the answer.`;
  }
  if (/\b(thanks?|thank you)\b/.test(text)) return 'You’re welcome! Keep going—you can ask for the next small nudge whenever you need it.';
  if (/\b(who are you|what can you do)\b/.test(text)) {
    return 'I’m your DSA practice companion. I can give progressive hints, explain concepts or your code, debug a failed approach, dry-run an example, and review your practice progress.';
  }
  if (/\b(goodbye|bye)\b/.test(text)) return 'See you next problem. Nice work staying with it!';
  return null;
};

const contextForIntent = ({ intent, query, title, question, language, code, codeReferenced, problemReferenced }) => {
  const sections = [`Latest user message:\n${query}`];
  const alwaysNeedsProblem = ['hint', 'debug', 'dryrun', 'fix', 'solution'].includes(intent);
  if (alwaysNeedsProblem || problemReferenced || codeReferenced) {
    sections.unshift(`Problem title: ${title}\nLanguage: ${language}\nProblem statement:\n${question}`);
  }
  if (['hint', 'debug', 'dryrun', 'fix', 'solution'].includes(intent) || codeReferenced) sections.push(`User code:\n${code || '(no code extracted)'}`);
  return sections.join('\n\n');
};

module.exports = { directCompanionReply, contextForIntent };
