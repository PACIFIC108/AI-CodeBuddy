const OpenAI = require('openai');

const askOpenAI = async ({prompt,temp,cont,chat = []})=>{
	// try{
		// return prompt;
	const chatMessages = Array.isArray(chat)?chat:[];
	

		const openai = new OpenAI({
		  baseURL: "https://openrouter.ai/api/v1",
		  apiKey: process.env.OPENAI_API_KEY, 
		});

		const response = await openai.chat.completions.create({
		  model: "qwen/qwen-2.5-72b-instruct:free",
		  messages: [
		    { role: "system", content: cont },
		    // ...chatMessages,
		    { role: "user", content: prompt }
		  ],
		  temperature: temp,
		});
// console.log(response)
	return response?.choices?.[0]?.message?.content || 'No response from AI.';
	// }catch(err){
	// 	throw new Error('Failed to get response from OpenAI');
	// }
};


module.exports = {askOpenAI};