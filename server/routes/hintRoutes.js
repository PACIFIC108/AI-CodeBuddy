const express = require('express');
const router = express.Router();
const axios = require('axios');
const {askOpenAI} = require('../utils/openaiHelper')

//post method for hint
router.post('/',async (req,res)=>{
	try{
		const { title,question, code, query, language,chat } = req.body;
		const prompt = process.env.hintPROMPT
				.replace('__title__',title)
				.replace('__question__',question)
				.replace('__code__',code)
				.replace('__query__',query)
				.replace('__language__',language)
				.replace('__query__',query);
		
		const response = await askOpenAI({
			prompt,
			temp:.5,
			cont:'You are a helpful and concise programming assistant.',
			chat
		});

		res.status(200).json({hint:response});
	}catch(err){
		res.status(500).json({error:'Failed to generate hint'});
	}
});


module.exports = router;