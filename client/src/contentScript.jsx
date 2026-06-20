import ReactDOM from 'react-dom/client';
import App from './App';
import widgetStyles from './index.css?inline';
import { applyLeetCodePatch, isLeetCodeProblemPage, readLeetCodeContext } from './integrations/leetcode';
import { sendRuntimeMessage } from './runtime';

let root;
let container;
let shadowRoot;
let currentContext;
let lastSubmission = '';
let scanTimer;
let scanning = false;

const unmount = () => {
  root?.unmount();
  container?.remove();
  root = undefined;
  container = undefined;
  shadowRoot = undefined;
  currentContext = undefined;
};

const ensureMounted = context => {
  if (!root) {
    container = document.createElement('div');
    container.id = 'ai-codebuddy-root';
    Object.assign(container.style, { all: 'initial' });
    document.body.appendChild(container);
    shadowRoot = container.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = widgetStyles;
    const mountPoint = document.createElement('div');
    shadowRoot.append(style, mountPoint);
    root = ReactDOM.createRoot(mountPoint);
  }
  root.render(<App context={context} />);
};

const scan = async () => {
  if (scanning) return;
  scanning = true;
  try {
    if (!isLeetCodeProblemPage()) return unmount();
    const snapshot = await readLeetCodeContext();
    const { verdict, ...context } = snapshot;
    if (JSON.stringify(context) !== JSON.stringify(currentContext)) {
      currentContext = context;
      ensureMounted(context);
      if (context.title) await sendRuntimeMessage({ type: 'save_title', title: context.title });
    }
    const fingerprint = verdict && context.code ? `${context.title}:${verdict}:${context.code}` : '';
    if (fingerprint && fingerprint !== lastSubmission) {
      lastSubmission = fingerprint;
      await sendRuntimeMessage({
        type: 'record_submission',
        submission: { title: context.title, code: context.code, language: context.language, verdict },
      });
    }
  } catch (error) {
    console.warn('AI AlgoBuddy page integration:', error.message);
  } finally {
    scanning = false;
  }
};

const scheduleScan = () => {
  clearTimeout(scanTimer);
  scanTimer = setTimeout(scan, 400);
};

scan();
const pageObserver = new MutationObserver(scheduleScan);
pageObserver.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'apply_editor_patch') return false;
  void sender;
  applyLeetCodePatch(message.patch)
    .then(result => sendResponse({ ok: true, data: result }))
    .catch(error => sendResponse({ ok: false, error: error.message }));
  return true;
});
