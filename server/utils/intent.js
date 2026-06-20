const detectIntent = query => {
  const text = String(query || '').trim().toLowerCase();
  if (/^(hi|hello|hey|yo|good (morning|afternoon|evening))( there)?[!.? ]*$/.test(text)) return 'conversation';
  if (/\b(thanks?|thank you|who are you|what can you do|goodbye|bye|motivat|overwhelmed|frustrated|feel stupid|give up)\b/.test(text)) return 'conversation';
  if (/\b(fix|correct|repair|edit|modify)\s+(?:(?:this|my|the)\s+)?(?:code|implementation|solution|bug|error|it)\b|\b(update|change)\s+(?:this|my|the)\s+(?:code|implementation|solution)\b|^(?:can you |please )?fix(?: it)?[?.! ]*$/.test(text)) return 'fix';
  if (/\b(full solution|complete solution|solve (it|this|the problem)|write (the |a )?(full |complete )?code|give me (the )?code)\b/.test(text)) return 'solution';
  if (/\b(dry[ -]?run|trace|step through|simulate)\b/.test(text)) return 'dryrun';
  if (/\b(debug|error|wrong answer|fail|fails|failing|failed|bug|runtime|compile|counterexample|test ?case|breaks?|why.*not work|where.*wrong|what.*wrong|check.*(?:code|editor|ide))\b/.test(text)) return 'debug';
  if (/\b(progress|skill level|recommend|what.*practice|weak topics?)\b/.test(text)) return 'progress';
  if (/\b(history|submissions?|previous problems?)\b/.test(text)) return 'history';
  if (/\b(explain|walk me through|what does|how does|help me understand)\b/.test(text)) return 'explain';
  if (/\b(hint|nudge|approach|stuck|help|idea)\b/.test(text)) return 'hint';
  return 'general';
};

const referencesCode = query => /\b(my|this|the)\s+(code|function|loop|implementation|variable|line|approach)|\b(line|variable|function|editor|ide)\b|\bwhat am i doing\b|\b(present|already|there)\s+(?:in|inside)\s+(?:the\s+)?(?:editor|ide)\b/i.test(String(query || ''));
const referencesProblem = query => /\b(this|the|current)\s+(problem|question)|\bproblem statement\b/i.test(String(query || ''));

module.exports = { detectIntent, referencesCode, referencesProblem };
