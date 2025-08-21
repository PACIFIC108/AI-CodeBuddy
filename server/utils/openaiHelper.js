const OpenAI = require("openai");

const askOpenAI = async ({ prompt, temp = 0.7, cont = "", chat = [] }) => {
	try {
		
		const openai = new OpenAI({
			baseURL: "https://openrouter.ai/api/v1",
			apiKey: process.env.OPENAI_API_KEY,
		});

		
		const chatMessages = [
			...(cont ? [{ role: "system", content: cont }] : []), 
			...chat,
			{ role: "user", content: prompt }, 
		];

	
		const response = await openai.chat.completions.create({
			model: "qwen/qwen-2.5-72b-instruct:free",
			messages: chatMessages,
			temperature: temp,
		});

		return (
			response?.choices?.[0]?.message?.content?.trim() ||
			"No response from AI."
		);
	} catch (err) {
		console.error("❌ OpenAI API error:", err.message);
		throw new Error("Failed to get response from OpenAI");
	}
};

module.exports = { askOpenAI };
