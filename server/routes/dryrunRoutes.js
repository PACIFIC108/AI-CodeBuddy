const express = require('express');
const router = express.Router();
const axios = require('axios');
const {askOpenAI} = require('../utils/openaiHelper');


router.post('/', async (req, res) => {
  try {
    const { title, code, language,question, input,chat } = req.body;

    const prompt = process.env.dryrunPROMPT
          .replace('__language__',language)
          .replace('__code__',code)
          .replace('__input__',JSON.stringify(input, null, 2))
          .replace('__question__',question);

    const response = await askOpenAI({
      prompt,
      temp:0.3,
      cont:'You are a helpful assistant that simulates code line-by-line.',
      chat
    })
    

    res.status(200).json({ dryRun: response });
  } catch (err) {
    console.error('Error in /api/dryrun:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to simulate dry run' });
  }
});

module.exports = router;
