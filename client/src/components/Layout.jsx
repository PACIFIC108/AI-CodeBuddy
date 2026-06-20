import { useEffect, useRef, useState } from 'react';
import { Bot, SendHorizontal } from 'lucide-react';
import { sendRuntimeMessage } from '../runtime';
import { createCodeDiff } from '../utils/codeDiff';

const normalizeMessages = messages => (Array.isArray(messages) ? messages : [])
  .filter(message => message && typeof message.content === 'string')
  .map(message => ({ ...message, role: message.role === 'bot' ? 'assistant' : message.role }))
  .filter(message => ['user', 'assistant'].includes(message.role));

const Layout = ({ context }) => {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatReady, setChatReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingPatch, setPendingPatch] = useState(null);
  const [applyingPatch, setApplyingPatch] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  useEffect(() => {
    sendRuntimeMessage({ type: 'register_user' }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!context?.title) return;
    let cancelled = false;
    setChatReady(false);
    setPendingPatch(null);
    sendRuntimeMessage({ type: 'get_chat', title: context.title })
      .then(history => { if (!cancelled) setMessages(normalizeMessages(history)); })
      .finally(() => { if (!cancelled) setChatReady(true); });
    return () => { cancelled = true; };
  }, [context?.title]);

  useEffect(() => {
    if (!chatReady || !context?.title) return;
    sendRuntimeMessage({ type: 'save_chat', title: context.title, content: messages }).catch(() => {});
  }, [messages, context?.title, chatReady]);

  const addAssistantMessage = content => setMessages(current => [...current, { role: 'assistant', content }]);

  const handleAsk = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || loading) return;
    const history = messages;
    const editorSnapshot = {
      expectedCode: context.code,
      expectedVersionId: context.editorVersionId,
      expectedModelUri: context.editorModelUri,
    };
    setMessages(current => [...current, { role: 'user', content: trimmedQuery }]);
    setQuery('');
    setLoading(true);
    try {
      const data = await sendRuntimeMessage({
        type: 'analyze',
        payload: {
          question: context.problemStatement,
          code: context.code,
          language: context.language,
          title: context.title,
          input: context.testCases,
          query: trimmedQuery,
          chat: history,
        },
      });
      if (data.patch) {
        setPendingPatch({
          ...data.patch,
          ...editorSnapshot,
          diff: createCodeDiff(editorSnapshot.expectedCode, data.patch.updatedCode),
        });
        addAssistantMessage(`${data.patch.summary}\n\n${data.patch.explanation}\n\nReview the proposed change below, then choose Apply or Reject.`);
      } else {
        addAssistantMessage(data.history || data.explain || data.debug || data.progress || data.hint || data.reply || 'No response.');
      }
    } catch (error) {
      if (/editor changed|fresh fix/i.test(error.message)) setPendingPatch(null);
      addAssistantMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyPatch = async () => {
    if (!pendingPatch || applyingPatch) return;
    setApplyingPatch(true);
    try {
      await sendRuntimeMessage({
        type: 'apply_editor_patch',
        patch: {
          expectedCode: pendingPatch.expectedCode,
          expectedVersionId: pendingPatch.expectedVersionId,
          expectedModelUri: pendingPatch.expectedModelUri,
          updatedCode: pendingPatch.updatedCode,
        },
      });
      setPendingPatch(null);
      addAssistantMessage('Applied the suggested change. You can undo it normally in Monaco with Ctrl+Z.');
    } catch (error) {
      addAssistantMessage(error.message);
    } finally {
      setApplyingPatch(false);
    }
  };

  const rejectPatch = () => {
    setPendingPatch(null);
    addAssistantMessage('Patch rejected. Your editor was not changed.');
  };

  return (
    <div className="fixed bottom-[84px] right-4 z-[2147483647] max-w-[calc(100vw-24px)]">
      <div className="flex max-w-full flex-col items-end gap-2">
        {expanded && <>
          <div className="w-[min(360px,calc(100vw-24px))] max-h-[min(420px,calc(100vh-210px))] overflow-y-auto overscroll-contain bg-zinc-950/95 shadow-2xl rounded-xl p-3 space-y-2 border border-zinc-700 box-border">
            <div className={`text-[11px] rounded px-2 py-1 ${context.editorSource === 'monaco-model' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>
              {context.editorSource === 'monaco-model'
                ? `Editor: ${context.code.split('\n').length} lines | ${context.language} | Problem: ${context.problemStatement ? 'loaded' : 'missing'} | Inputs: ${context.testCases.length}`
                : 'Editor model unavailable—code will not be sent until extraction succeeds.'}
            </div>
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3 py-2 rounded-lg max-w-[82%] text-sm leading-5 whitespace-pre-wrap break-words ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-black'}`}>
                  {message.content}
                </div>
              </div>
            ))}
            {pendingPatch && (
              <div className="rounded-lg border border-zinc-600 bg-zinc-900 p-2 text-xs text-zinc-100">
                <div className="mb-2 font-semibold">Proposed editor change</div>
                <div className="max-h-52 overflow-auto rounded bg-black/50 font-mono leading-5">
                  {pendingPatch.diff.before.map((line, index) => <div key={`before-${index}`} className="px-2 text-zinc-400">&nbsp; {line}</div>)}
                  {pendingPatch.diff.removed.slice(0, 40).map((line, index) => <div key={`removed-${index}`} className="bg-red-950 px-2 text-red-300">- {line}</div>)}
                  {pendingPatch.diff.removed.length > 40 && <div className="px-2 text-zinc-400">… more removed lines</div>}
                  {pendingPatch.diff.added.slice(0, 40).map((line, index) => <div key={`added-${index}`} className="bg-emerald-950 px-2 text-emerald-300">+ {line}</div>)}
                  {pendingPatch.diff.added.length > 40 && <div className="px-2 text-zinc-400">… more added lines</div>}
                  {pendingPatch.diff.after.map((line, index) => <div key={`after-${index}`} className="px-2 text-zinc-400">&nbsp; {line}</div>)}
                </div>
                <div className="mt-2 flex gap-2">
                  <button onClick={applyPatch} disabled={applyingPatch} className="flex-1 rounded bg-emerald-600 px-3 py-2 font-semibold text-white disabled:bg-zinc-600">
                    {applyingPatch ? 'Applying…' : 'Apply'}
                  </button>
                  <button onClick={rejectPatch} disabled={applyingPatch} className="flex-1 rounded bg-zinc-700 px-3 py-2 font-semibold text-white disabled:opacity-50">
                    Reject
                  </button>
                </div>
              </div>
            )}
            {loading && <div className="text-sm text-gray-400">Thinking…</div>}
            <div ref={chatEndRef} />
          </div>
          <div className="flex items-center gap-2 w-[min(360px,calc(100vw-24px))] max-w-full">
            <input value={query} onChange={event => setQuery(event.target.value)}
              onKeyDown={event => event.key === 'Enter' && handleAsk()} placeholder="Ask for a hint, debug, progress…"
              className="min-w-0 flex-1 px-3 py-2 bg-zinc-950 text-white border border-zinc-700 rounded-md outline-none box-border" />
            <button onClick={handleAsk} disabled={loading} className="shrink-0 p-2 bg-blue-600 disabled:bg-gray-500 text-white rounded-md">
              <SendHorizontal size={20} />
            </button>
          </div>
        </>}
        <button onClick={() => setExpanded(value => !value)} aria-label="Toggle AI AlgoBuddy"
          className="shrink-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:scale-105 transition">
          <Bot size={28} />
        </button>
      </div>
    </div>
  );
};

export default Layout;
