export const sendRuntimeMessage = message => new Promise((resolve, reject) => {
  chrome.runtime.sendMessage(message, response => {
    if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
    if (!response?.ok) return reject(new Error(response?.error || 'Extension request failed.'));
    resolve(response.data);
  });
});
