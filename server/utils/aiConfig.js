const net = require('node:net');

const PROVIDERS = {
  openrouter: 'https://openrouter.ai/api/v1',
  openai: 'https://api.openai.com/v1',
};

const isPrivateHost = hostname => {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local')) return true;
  if (net.isIP(host)) {
    return /^(10\.|127\.|169\.254\.|192\.168\.|0\.)/.test(host)
      || /^172\.(1[6-9]|2\d|3[01])\./.test(host)
      || host === '::1';
  }
  return false;
};

const resolveAiConfig = input => {
  const provider = String(input?.provider || '').toLowerCase();
  const apiKey = String(input?.apiKey || '').trim();
  const model = String(input?.model || '').trim();
  if (!['openrouter', 'openai', 'custom'].includes(provider)) throw new Error('Unsupported AI provider.');
  if (!apiKey || apiKey.length > 500) throw new Error('A valid AI API key is required.');
  if (!model || model.length > 200) throw new Error('A valid model ID is required.');

  let baseURL = PROVIDERS[provider];
  if (provider === 'custom') {
    let url;
    try { url = new URL(String(input.baseURL || '')); } catch { throw new Error('Custom provider URL is invalid.'); }
    if (url.protocol !== 'https:') throw new Error('Custom provider URL must use HTTPS.');
    if (url.username || url.password || isPrivateHost(url.hostname)) throw new Error('Custom provider URL is not allowed.');
    baseURL = url.toString().replace(/\/$/, '');
  }
  return { provider, apiKey, model, baseURL };
};

module.exports = { resolveAiConfig };
