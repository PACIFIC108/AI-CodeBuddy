const configuredUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const API_BASE_URL = configuredUrl.replace(/\/$/, '');

export const PROVIDER_DEFAULTS = {
  openrouter: {
    label: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    modelPlaceholder: 'e.g. openai/gpt-4.1-mini',
  },
  openai: {
    label: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    modelPlaceholder: 'e.g. gpt-4.1-mini',
  },
  custom: {
    label: 'OpenAI-compatible',
    baseURL: '',
    modelPlaceholder: 'Provider model ID',
  },
};
