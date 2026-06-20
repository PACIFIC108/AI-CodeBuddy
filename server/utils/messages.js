const normalizeChat = chat => (Array.isArray(chat) ? chat : [])
  .slice(-20)
  .map(message => ({
    role: message?.role === 'bot' ? 'assistant' : message?.role,
    content: String(message?.content || '').slice(0, 8000),
  }))
  .filter(message => ['user', 'assistant'].includes(message.role) && message.content);

const mentorChat = chat => normalizeChat(chat)
  .slice(-8)
  .filter(message => message.role === 'user' || (!/```|class\s+Solution|#include\s*</i.test(message.content) && message.content.length <= 1500));

module.exports = { normalizeChat, mentorChat };
