import { useEffect, useState } from 'react';
import { Bot, CheckCircle2, KeyRound, LogOut, Trash2, User } from 'lucide-react';
import robo from '/bot.jpg';
import { PROVIDER_DEFAULTS } from './config';
import { sendRuntimeMessage } from './runtime';

const Popup = () => {
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const [savedUser, setSavedUser] = useState(false);
  const [status, setStatus] = useState('');
  const [settings, setSettings] = useState({
    provider: 'openrouter', apiKey: '', model: '', baseURL: '',
  });

  const reloadActiveTab = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]?.id) chrome.tabs.reload(tabs[0].id);
    });
  };

  useEffect(() => {
    Promise.all([
      sendRuntimeMessage({ type: 'get_title' }),
      sendRuntimeMessage({ type: 'get_username' }),
      sendRuntimeMessage({ type: 'get_ai_settings' }),
    ]).then(([titleResult, userResult, aiSettings]) => {
      setTitle(titleResult.title || '');
      setUsername(userResult.username || '');
      setSavedUser(Boolean(userResult.username));
      setSettings(aiSettings);
    });
  }, []);

  const saveProfile = async () => {
    if (!username.trim()) return;
    await sendRuntimeMessage({ type: 'save_username', username: username.trim() });
    setSavedUser(true);
    setStatus('Username saved.');
    reloadActiveTab();
  };

  const saveProvider = async () => {
    const normalized = {
      ...settings,
      apiKey: settings.apiKey.trim(),
      model: settings.model.trim(),
      baseURL: settings.provider === 'custom' ? settings.baseURL.trim() : '',
    };
    if (!normalized.apiKey || !normalized.model || (normalized.provider === 'custom' && !normalized.baseURL)) {
      setStatus('API key, model, and custom URL (when selected) are required.');
      return;
    }
    await sendRuntimeMessage({ type: 'save_ai_settings', settings: normalized });
    setSettings(normalized);
    setStatus('AI provider saved locally.');
    reloadActiveTab();
  };

  const clearUsername = () => {
    sendRuntimeMessage({ type: 'clear_user' }).then(() => {
      setUsername('');
      setSavedUser(false);
      setStatus('Username removed.');
      reloadActiveTab();
    });
  };

  const clearChat = () => {
    sendRuntimeMessage({ type: 'delete_chat', title }).then(() => {
      setStatus('Chat cleared.');
      reloadActiveTab();
    });
  };

  const deleteUserHistory = async () => {
    if (!username || !title) return;
    try {
      await sendRuntimeMessage({ type: 'delete_submission', title });
      setStatus('Current problem history deleted.');
    } catch {
      setStatus('Could not delete submission history.');
    }
  };

  const provider = PROVIDER_DEFAULTS[settings.provider];

  return (
    <div className="w-[360px] h-[560px] max-h-[580px] overflow-y-auto bg-white p-3 font-sans text-black box-border">
      <div className="flex flex-col items-center gap-1.5 min-w-0">
        <img src={robo} alt="AI AlgoBuddy" className="h-12 rounded-full shadow-md" />
        <h1 className="text-xl font-extrabold">AI <span className="text-orange-600">AlgoBuddy</span></h1>
        <p className="text-xs text-gray-600">Your in-page DSA learning assistant</p>

        <section className="w-full min-w-0 border-t pt-2 mt-1 space-y-1.5">
          <label className="text-xs font-semibold flex items-center gap-1"><User size={14} /> LeetCode username</label>
          <div className="flex min-w-0 gap-2">
            <input className="min-w-0 flex-1 border rounded px-3 py-2 text-sm" value={username}
              onChange={event => setUsername(event.target.value)} placeholder="Username" />
            <button onClick={saveProfile} disabled={!username.trim()}
              className="w-10 shrink-0 flex items-center justify-center bg-blue-600 disabled:bg-gray-300 text-white rounded" title="Save username">
              <CheckCircle2 size={17} />
            </button>
          </div>
        </section>

        <section className="w-full min-w-0 border-t pt-2 mt-1 space-y-1.5">
          <label className="text-xs font-semibold flex items-center gap-1"><KeyRound size={14} /> AI provider</label>
          <select className="w-full border rounded px-3 py-2 text-sm" value={settings.provider}
            onChange={event => setSettings(current => ({ ...current, provider: event.target.value, baseURL: '' }))}>
            {Object.entries(PROVIDER_DEFAULTS).map(([value, item]) =>
              <option key={value} value={value}>{item.label}</option>)}
          </select>
          {settings.provider === 'custom' && (
            <input className="w-full border rounded px-3 py-2 text-sm" value={settings.baseURL}
              onChange={event => setSettings(current => ({ ...current, baseURL: event.target.value }))}
              placeholder="https://provider.example.com/v1" />
          )}
          <input type="password" autoComplete="off" className="w-full border rounded px-3 py-2 text-sm"
            value={settings.apiKey} onChange={event => setSettings(current => ({ ...current, apiKey: event.target.value }))}
            placeholder={`${provider.label} API key`} />
          <input className="w-full border rounded px-3 py-2 text-sm" value={settings.model}
            onChange={event => setSettings(current => ({ ...current, model: event.target.value }))}
            placeholder={provider.modelPlaceholder} />
          <button onClick={saveProvider} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded text-sm">
            Save AI configuration
          </button>
          <p className="text-[10px] leading-4 text-gray-500">Stored in this browser and sent to your backend only when you ask AI.</p>
        </section>

        {savedUser && (
          <section className="w-full border-t pt-2 mt-1 grid grid-cols-2 gap-2">
            <button onClick={clearChat} className="flex items-center justify-center gap-1 bg-yellow-500 text-white py-2 rounded text-xs">
              <Trash2 size={14} /> Clear chat
            </button>
            <button onClick={deleteUserHistory} className="flex items-center justify-center gap-1 bg-red-500 text-white py-2 rounded text-xs">
              <Trash2 size={14} /> Delete history
            </button>
            <button onClick={clearUsername} className="col-span-2 flex items-center justify-center gap-1 bg-gray-700 text-white py-2 rounded text-xs">
              <LogOut size={14} /> Remove username
            </button>
          </section>
        )}

        {status && <div className="w-full text-center text-xs text-blue-700 bg-blue-50 rounded p-2"><Bot size={13} className="inline mr-1" />{status}</div>}
      </div>
    </div>
  );
};

export default Popup;
