const MONACO_REQUEST = 'ai-codebuddy:request-monaco';
const MONACO_RESPONSE = 'ai-codebuddy:monaco-response';
const MONACO_APPLY = 'ai-codebuddy:apply-monaco-patch';
const MONACO_APPLIED = 'ai-codebuddy:monaco-patch-result';

const requestMonacoSnapshot = (timeoutMs = 250) => new Promise(resolve => {
  let timeout;
  const finish = snapshot => {
    clearTimeout(timeout);
    document.removeEventListener(MONACO_RESPONSE, onResponse);
    resolve(snapshot);
  };
  const onResponse = event => finish(event.detail || {});
  document.addEventListener(MONACO_RESPONSE, onResponse, { once: true });
  document.dispatchEvent(new Event(MONACO_REQUEST));
  timeout = setTimeout(() => finish({}), timeoutMs);
});

const problemTitle = () => {
  const match = /\/problems\/([^/]+)/.exec(window.location.pathname);
  return match?.[1] || '';
};

const problemStatement = () => {
  const element = document.querySelector('[data-track-load="description_content"]')
    || document.querySelector('[data-cy="question-content"]')
    || document.querySelector('meta[name="description"]');
  return (element?.textContent || element?.getAttribute?.('content') || '').trim();
};

const visibleLanguage = () => {
  const element = document.querySelector('[data-e2e-locator="console-select-language"]')
    || document.querySelector('[data-cy="lang-select"]')
    || document.querySelector('#editor button[aria-haspopup="dialog"]');
  return element?.textContent?.trim() || '';
};

const testCases = () => Array.from(document.querySelectorAll(
  '[data-e2e-locator="console-testcase"] .cm-content, [data-cy="testcase"] .cm-content',
)).map(element => element.textContent || '').filter(Boolean);

const verdict = () => {
  const element = document.querySelector('[data-e2e-locator="submission-result"]');
  return element?.innerText?.trim().split('\n')[0] || '';
};

export const isLeetCodeProblemPage = () => window.location.pathname.startsWith('/problems/');

export const readLeetCodeContext = async () => {
  const monaco = await requestMonacoSnapshot();
  return {
    title: problemTitle(),
    problemStatement: problemStatement(),
    code: monaco.code || '',
    language: monaco.language || visibleLanguage() || 'Unknown',
    editorModelUri: monaco.uri || '',
    editorVersionId: monaco.versionId || 0,
    editorSource: monaco.code ? 'monaco-model' : 'unavailable',
    testCases: testCases(),
    verdict: verdict(),
  };
};

export const applyLeetCodePatch = (patch, timeoutMs = 2000) => new Promise((resolve, reject) => {
  let timeout;
  const finish = result => {
    clearTimeout(timeout);
    document.removeEventListener(MONACO_APPLIED, onResult);
    if (result?.ok) resolve(result);
    else reject(new Error(result?.error || 'The editor did not accept the patch.'));
  };
  const onResult = event => finish(event.detail);
  document.addEventListener(MONACO_APPLIED, onResult, { once: true });
  document.dispatchEvent(new CustomEvent(MONACO_APPLY, { detail: patch }));
  timeout = setTimeout(() => finish({ ok: false, error: 'Editor patch timed out.' }), timeoutMs);
});
