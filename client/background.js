import {
  clearAiSettings, clearChatHistory, clearUsername, getAiSettings, getChatHistory,
  getTitle, getUsername, migrateLegacyStorage, saveAiSettings, saveChatHistory, saveTitle, saveUsername,
} from './storage';
import { API_BASE_URL } from './src/config';

const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Backend request failed (${response.status}).`);
  return data;
};

const migrationReady = migrateLegacyStorage();

const handleMessage = async (message, sender) => {
  await migrationReady;
  switch (message.type) {
    case 'get_username': return { username: (await getUsername()) || '' };
    case 'save_username':
      await saveUsername(message.username);
      return { success: true };
    case 'clear_user':
      await clearUsername();
      return { success: true };
    case 'get_ai_settings': return getAiSettings();
    case 'save_ai_settings':
      await saveAiSettings(message.settings);
      return { success: true };
    case 'clear_ai_settings':
      await clearAiSettings();
      return { success: true };
    case 'get_title': return { title: (await getTitle()) || '' };
    case 'save_title':
      await saveTitle(message.title);
      return { success: true };
    case 'save_chat':
      await saveChatHistory(message.content, message.title);
      return { success: true };
    case 'get_chat': return getChatHistory(message.title);
    case 'delete_chat':
      await clearChatHistory(message.title);
      return { success: true };
    case 'register_user': {
      const username = await getUsername();
      if (!username) throw new Error('A username is required.');
      return apiRequest(`/user/${encodeURIComponent(username)}`, { method: 'POST' });
    }
    case 'record_submission': {
      const username = await getUsername();
      if (!username) return { skipped: true };
      return apiRequest('/submission/submit', {
        method: 'POST', body: { user: username, ...message.submission },
      });
    }
    case 'analyze': {
      const [username, aiConfig] = await Promise.all([getUsername(), getAiSettings()]);
      if (!username) throw new Error('Please save your LeetCode username in the extension popup.');
      if (!aiConfig.apiKey || !aiConfig.model) throw new Error('Please configure your AI provider, API key, and model.');
      return apiRequest('/analyze', {
        method: 'POST', body: { ...message.payload, userId: username, aiConfig },
      });
    }
    case 'delete_submission': {
      const username = await getUsername();
      if (!username || !message.title) throw new Error('Username and problem title are required.');
      return apiRequest(`/submission/${encodeURIComponent(username)}/${encodeURIComponent(message.title)}`, { method: 'DELETE' });
    }
    case 'apply_editor_patch': {
      if (!sender.tab?.id) throw new Error('The editor tab is unavailable.');
      const response = await chrome.tabs.sendMessage(sender.tab.id, {
        type: 'apply_editor_patch', patch: message.patch,
      });
      if (!response?.ok) throw new Error(response?.error || 'The editor rejected the patch.');
      return response.data;
    }
    default: throw new Error('Unknown extension request.');
  }
};

chrome.runtime.onMessage.addListener((...args) => {
  const [message, sender, sendResponse] = args;
  handleMessage(message, sender)
    .then(data => sendResponse({ ok: true, data }))
    .catch(error => sendResponse({ ok: false, error: error.message }));
  return true;
});
