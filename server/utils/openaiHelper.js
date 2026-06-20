const OpenAI = require('openai');
const { resolveAiConfig } = require('./aiConfig');
const { normalizeChat } = require('./messages');

const askOpenAI = async ({ prompt, temp = 0.7, cont = '', chat = [], aiConfig }) => {
  try {
    const config = resolveAiConfig(aiConfig);
    const openai = new OpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey,
      timeout: 30000,
      maxRetries: 2,
    });
    const messages = [
      ...(cont ? [{ role: 'system', content: cont }] : []),
      ...normalizeChat(chat),
      { role: 'user', content: prompt },
    ];
    const response = await openai.chat.completions.create({
      model: config.model,
      messages,
      temperature: temp,
    });
    return response?.choices?.[0]?.message?.content?.trim() || 'No response from AI.';
  } catch (error) {
    console.error('AI provider error:', error.message);
    if (/required|provider|model|API key|URL|HTTPS|allowed/.test(error.message)) throw error;
    throw new Error('The configured AI provider could not complete the request.');
  }
};

module.exports = { askOpenAI };
