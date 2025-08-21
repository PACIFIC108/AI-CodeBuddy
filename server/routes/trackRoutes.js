const express = require('express');
const router = express.Router();
const { askOpenAI } = require('../utils/openaiHelper');
const User = require('../models/User');
const { progressPROMPT } = require('../prompts/prompt');


router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ name: userId }).populate('history');
    if (!user) return res.status(400).json({ error: 'user not found' });

    const solved = user.history.filter(sub => sub.verdict === 'Accepted' && sub.type !== true);
    const struggled = user.history.filter(sub => sub.verdict === 'Accepted' && sub.type === true);
    const failed = user.history.filter(sub => sub.verdict !== 'Accepted');
    const solvedTitles = solved.map(sub => sub.questionId).join('\n');
    const failedTitles = failed.map(sub => sub.questionId).join('\n');
    const struggledTitles = struggled.map(sub => sub.questionId).join('\n');

    const prompt = progressPROMPT
      .replace('__solvedTitles__', solvedTitles)
      .replace('__failedTitles__', failedTitles)
      .replace('__struggledTitles__', struggledTitles);

    const response = await askOpenAI({
      prompt,
      temp: 0.5,
      cont: 'You are a helpful DSA progress tracker assistant.'
    });

    return res.status(200).json({ progress: response });

  } catch (err) {
    res.status(500).json({ error: 'Failed to analyze progress' });
  }
});


module.exports = router;