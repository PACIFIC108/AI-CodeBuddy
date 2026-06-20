const MAX = { username: 80, title: 200, code: 50000, question: 30000, query: 4000 };

const cleanString = (value, name, max, required = false) => {
  const result = typeof value === 'string' ? value.trim() : '';
  if (required && !result) throw new Error(`${name} is required.`);
  if (result.length > max) throw new Error(`${name} is too long.`);
  return result;
};

const validateAnalyze = (req, res, next) => {
  try {
    req.body.userId = cleanString(req.body.userId, 'Username', MAX.username, true);
    req.body.title = cleanString(req.body.title, 'Problem title', MAX.title, true);
    req.body.query = cleanString(req.body.query, 'Query', MAX.query, true);
    req.body.code = cleanString(req.body.code, 'Code', MAX.code);
    req.body.question = cleanString(req.body.question, 'Question', MAX.question);
    req.body.language = cleanString(req.body.language, 'Language', 80);
    next();
  } catch (error) { res.status(400).json({ error: error.message }); }
};

const validateSubmission = (req, res, next) => {
  try {
    req.body.user = cleanString(req.body.user, 'Username', MAX.username, true);
    req.body.title = cleanString(req.body.title, 'Problem title', MAX.title, true);
    req.body.code = cleanString(req.body.code, 'Code', MAX.code, true);
    req.body.language = cleanString(req.body.language, 'Language', 80, true);
    req.body.verdict = cleanString(req.body.verdict, 'Verdict', 200, true);
    next();
  } catch (error) { res.status(400).json({ error: error.message }); }
};

module.exports = { validateAnalyze, validateSubmission, cleanString };
