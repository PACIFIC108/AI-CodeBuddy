const REQUEST_EVENT = 'ai-codebuddy:request-monaco';
const RESPONSE_EVENT = 'ai-codebuddy:monaco-response';
const APPLY_EVENT = 'ai-codebuddy:apply-monaco-patch';
const APPLIED_EVENT = 'ai-codebuddy:monaco-patch-result';

const CODE_LANGUAGES = new Set([
  'c', 'cpp', 'csharp', 'dart', 'go', 'java', 'javascript', 'kotlin', 'php',
  'python', 'python3', 'ruby', 'rust', 'scala', 'swift', 'typescript',
]);
let lastFocusedModel;
const observedEditors = new WeakSet();

const findFocusedModel = () => {
  const editors = window.monaco?.editor?.getEditors?.() || [];
  for (const editor of editors) {
    if (!observedEditors.has(editor)) {
      observedEditors.add(editor);
      editor.onDidFocusEditorText?.(() => { lastFocusedModel = editor.getModel?.(); });
      editor.onDidDispose?.(() => {
        if (lastFocusedModel?.isDisposed?.()) lastFocusedModel = undefined;
      });
    }
    if (editor.hasTextFocus?.()) lastFocusedModel = editor.getModel?.();
  }
  return lastFocusedModel;
};

const serializeModel = model => ({
  code: model?.getValue?.() || '',
  language: model?.getLanguageId?.() || '',
  uri: model?.uri?.toString?.() || '',
  versionId: model?.getVersionId?.() || 0,
});

const readActiveCodeModel = () => {
  const focusedModel = findFocusedModel();
  if (focusedModel && !focusedModel.isDisposed?.()) return serializeModel(focusedModel);
  const models = window.monaco?.editor?.getModels?.() || [];
  const candidates = models.map(model => {
    const code = model.getValue();
    const language = model.getLanguageId();
    const uri = model.uri?.toString() || '';
    let score = Math.min(model.getLineCount(), 100);
    if (CODE_LANGUAGES.has(language)) score += 1000;
    if (/test|input|output|console/i.test(uri)) score -= 500;
    if (!code.trim()) score -= 1000;
    return { code, language, uri, versionId: model.getVersionId(), score };
  }).sort((left, right) => right.score - left.score);
  return candidates[0] || { code: '', language: '', uri: '' };
};

document.addEventListener(REQUEST_EVENT, () => {
  const snapshot = readActiveCodeModel();
  document.dispatchEvent(new CustomEvent(RESPONSE_EVENT, {
    detail: { code: snapshot.code, language: snapshot.language, uri: snapshot.uri },
}));
});

document.addEventListener(APPLY_EVENT, event => {
  try {
    const patch = event.detail || {};
    const models = window.monaco?.editor?.getModels?.() || [];
    const model = models.find(item => item.uri?.toString() === patch.expectedModelUri) || findFocusedModel();
    if (!model || model.isDisposed?.()) throw new Error('The active Monaco editor model is unavailable.');
    const currentCode = model.getValue();
    if (currentCode !== patch.expectedCode) {
      throw new Error('The editor changed after this suggestion. Ask for a fresh fix before applying it.');
    }
    if (typeof patch.updatedCode !== 'string' || !patch.updatedCode.trim()) throw new Error('The proposed replacement code is empty.');
    model.pushStackElement();
    model.pushEditOperations([], [{
      range: model.getFullModelRange(),
      text: patch.updatedCode,
      forceMoveMarkers: true,
    }], () => null);
    model.pushStackElement();
    document.dispatchEvent(new CustomEvent(APPLIED_EVENT, {
      detail: {
        ok: true,
        versionId: model.getVersionId(),
        previousVersionId: patch.expectedVersionId,
      },
    }));
  } catch (error) {
    document.dispatchEvent(new CustomEvent(APPLIED_EVENT, {
      detail: { ok: false, error: error.message },
    }));
  }
});
