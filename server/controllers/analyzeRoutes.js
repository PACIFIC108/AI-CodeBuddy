const express = require('express');
const router = express.Router();

const axios = require('axios');
const { askOpenAI } = require('../utils/openaiHelper');
const HINT = require('../models/hintUsed');
const { intentPROMPT } = require('../prompts/prompt');



router.post('/', async (req, res) => {
  try {
    const { userId, question, code, language, title, input, query, chat } = req.body;
     

    const intentPrompt = intentPROMPT.replace('__QUERY__', query);


    const intentRaw = await askOpenAI({
      prompt: intentPrompt,
      temp: 0.1,
      cont: 'You are a helpful intent classifier.',
      chat: chat
    });

    const intent = intentRaw.trim().toLowerCase();
    const baseURL = process.env.backend_URL;

    //  Hint
    if (intent === 'hint') {
      await HINT.create({
        questionId: title,
        status: true,
      });
      const { data } = await axios.post(`${baseURL}/hint`, {
        title,
        question, 
        code, 
        query, 
        language,
        chat
      });
      return res.json({ hint: data.hint });
    }

    //  Debug
    if (intent === 'debug') {
      const { data } = await axios.post(`${baseURL}/debug`, {
        question, 
        code, 
        language,  
        input,
        chat
      });
      return res.json({ debug: data.explanation });
    }

    //  Progress
    if (intent === 'progress') {
      const { data } = await axios.get(`${baseURL}/track/${userId}`);
      return res.json({ progress: data.progress });
    }

    //  History
    if (intent === 'history') {
      const { data } = await axios.get(`${baseURL}/submission/${userId}`);
      return res.json({ history: data });
    }

    //  Dry Run
    if (intent === 'dryrun') {
      const { data } = await axios.post(`${baseURL}/dryrun`, {
        code,
        language,
        question,
        input,
        chat
      });
      return res.json({ explain: data.dryRun });
    }
    //reply
    return res.json({ reply: intent });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error in analyzing query' });
  }
});

module.exports = router;
