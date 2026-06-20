const express = require('express');
const HINT = require('../models/hintUsed');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { askOpenAI } = require('../utils/openaiHelper');
const { detectIntent, referencesCode, referencesProblem } = require('../utils/intent');
const { directCompanionReply, contextForIntent } = require('../utils/mentor');
const { mentorChat } = require('../utils/messages');
const { looksLikeFullSolution, shouldGuardResponse } = require('../utils/responseGuard');
const { parseCodePatch } = require('../utils/codePatch');
const { validateAnalyze } = require('../middleware/validate');
const {
  debugPROMPT, dryrunPROMPT, explainPROMPT, fixPROMPT, hintPROMPT, mentorPROMPT, progressPROMPT, solutionPROMPT,
} = require('../prompts/prompt');

const router = express.Router();
const fill = (template, values) => Object.entries(values).reduce(
  (result, [key, value]) => result.replaceAll(`__${key}__`, String(value ?? '')), template,
);

router.post('/', validateAnalyze, async (req, res) => {
  try {
    const { userId, question, code, language, title, input, query, chat, aiConfig } = req.body;
    const detectedIntent = detectIntent(query);
    const codeReferenced = referencesCode(query);
    const problemReferenced = referencesProblem(query);
    const intent = detectedIntent === 'general' && (codeReferenced || problemReferenced) ? 'explain' : detectedIntent;
    const mentorContext = { intent, query, title, question, language, code, codeReferenced, problemReferenced };
    let prompt;
    let system;
    let responseKey;

    if (intent === 'history') {
      const submissions = await Submission.find({ user: userId }).sort({ updatedAt: -1 }).limit(50).lean();
      return res.json({ history: submissions.length ? JSON.stringify(submissions, null, 2) : 'No submission history yet.' });
    }

    if (intent === 'conversation') {
      const directReply = directCompanionReply(query, title);
      if (directReply) return res.json({ reply: directReply });
      prompt = `Latest user message:\n${query}`;
      system = mentorPROMPT;
      responseKey = 'reply';
    }

    if (intent === 'progress') {
      const user = await User.findOne({ name: userId }).populate('history').lean();
      const history = user?.history || [];
      const solved = history.filter(item => item.verdict === 'Accepted' && !item.type).map(item => item.questionId);
      const struggled = history.filter(item => item.verdict === 'Accepted' && item.type).map(item => item.questionId);
      const failed = history.filter(item => item.verdict !== 'Accepted').map(item => item.questionId);
      prompt = fill(progressPROMPT, {
        solvedTitles: solved.join('\n') || 'None yet', failedTitles: failed.join('\n') || 'None yet',
        struggledTitles: struggled.join('\n') || 'None yet',
      });
      system = 'You are a concise DSA progress coach. Base claims only on the supplied history.';
      responseKey = 'progress';
    } else if (intent === 'hint') {
      await HINT.findOneAndUpdate(
        { userID: userId, questionId: title }, { status: true }, { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      prompt = fill(hintPROMPT, { title, question, code, query, language });
      system = 'You are a concise programming tutor. Do not reveal a full solution unless explicitly requested.';
      responseKey = 'hint';
    } else if (intent === 'debug') {
      prompt = `Latest user request:\n${query}\n\nProblem:\n${question}\n\nLanguage: ${language}\nCode:\n${code || '(no code extracted)'}\n\nExisting test inputs:\n${JSON.stringify(input || [], null, 2)}\n\n${debugPROMPT}`;
      system = 'You are a careful debugging tutor. Ground every claim in the supplied code and context.';
      responseKey = 'debug';
    } else if (intent === 'dryrun') {
      prompt = `${fill(dryrunPROMPT, { language, code, input: JSON.stringify(input || [], null, 2), question })}\n\nLatest user request:\n${query}`;
      system = 'You simulate code precisely, line by line.';
      responseKey = 'explain';
    } else if (intent === 'explain') {
      prompt = `${contextForIntent(mentorContext)}\n\n${explainPROMPT}`;
      system = mentorPROMPT;
      responseKey = 'explain';
    } else if (intent === 'fix') {
      if (!code) return res.status(400).json({ error: 'Editor code is unavailable, so a safe patch cannot be created.' });
      prompt = `${contextForIntent(mentorContext)}\n\nExisting test inputs:\n${JSON.stringify(input || [], null, 2)}\n\n${fixPROMPT}`;
      system = 'You are a precise code repair assistant. Return only the requested JSON patch and preserve the learner’s approach.';
      responseKey = 'patch';
    } else if (intent === 'solution') {
      prompt = `${contextForIntent(mentorContext)}\n\n${solutionPROMPT}`;
      system = 'You are an educational DSA mentor. A complete solution is allowed only because the latest message explicitly requested it.';
      responseKey = 'reply';
    } else if (intent === 'conversation') {
      // Prompt was prepared above for non-canned supportive conversation.
    } else {
      prompt = contextForIntent(mentorContext);
      system = mentorPROMPT;
      responseKey = 'reply';
    }

    const contextualChat = ['conversation', 'general', 'explain'].includes(intent) ? mentorChat(chat) : chat;
    let answer = await askOpenAI({ prompt, temp: 0.4, cont: system, chat: contextualChat, aiConfig });
    if (intent === 'fix') return res.json({ patch: parseCodePatch(answer, code) });
    if (shouldGuardResponse(intent) && looksLikeFullSolution(answer)) {
      answer = await askOpenAI({
        prompt: `Rewrite the response below as concise mentoring guidance. Preserve the useful reasoning, but remove the complete implementation and all long code blocks. Give the learner only the next concepts or debugging steps.\n\nResponse to rewrite:\n${answer}`,
        temp: 0.2,
        cont: 'You are a learning-safety editor. Return guidance only, with no complete solution or long code block.',
        chat: [],
        aiConfig,
      });
      if (looksLikeFullSolution(answer)) {
        answer = 'I was about to reveal too much of the implementation. Let’s keep this useful for learning: ask me for a small hint, an explanation of one part, or debugging help for your current approach.';
      }
    }
    res.json({ [responseKey]: answer });
  } catch (error) {
    console.error('Analyze error:', error.message);
    const clientError = /required|provider|model|API key|URL|HTTPS|allowed/.test(error.message);
    res.status(clientError ? 400 : 502).json({ error: error.message });
  }
});

module.exports = router;
