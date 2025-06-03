const express = require('express');
const router = express.Router();
const axios = require('axios');
const {askOpenAI} = require('../utils/openaiHelper');


router.post('/', async (req, res) => {
  try {
    const { title,question, code, language, testCases,chat } = req.body;

    let prompt = `You're an expert coding assistant. A user is solving the following problem:\n\n"${question}"\n\n`;
    prompt += `They submitted this ${language} code:\n\n${code}\n\n`;
    // if (error) {
    //   prompt += `The code failed with this error:\n${error}\n\n`;
    // }
    if (testCases && testCases.length > 0) {
      prompt += `Here are some test cases the code failed on:\n${JSON.stringify(testCases, null, 2)}\n\n`;
    }
    prompt += `Analyze the code and explain why it failed. Give specific and understandable reasons.Analyze what likely went wrong. Then, explain clearly what the error means and what the student should consider changing and suggest what the user might be misunderstanding. Do not rewrite the full solution. Your goal is to educate, not fix the code.`;

    const response = await askOpenAI({
      prompt,
      temp:0.4,
      cont:'You are a helpful debugging assistant for competitive programmers.',
      chat
    })
    

    res.status(200).json({ explanation: response });
  } catch (err) {
    console.error('Error in /api/debug:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to analyze code' });
  }
});

module.exports = router;
