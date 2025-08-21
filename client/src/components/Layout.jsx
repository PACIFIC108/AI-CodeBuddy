import React, { useState, useEffect, useRef } from 'react';
import { SendHorizonal, Bot } from 'lucide-react';
import axios from 'axios';
import {
  extractProblemTitle,
  extractProblemStatement,
  extractCode,
  extractLanguage,
  extractTestCases,
  extractVerdict
} from './utils';

const Layout = () => {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [userName, setUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({
    title: '',
    code: '',
    language: '',
    problemStatement: '',
    testCases: [],
  });

  const Currentdata = useRef(context); 
  const chatEndRef = useRef(null);
  const backendUrl = 'http://localhost:5000/api';

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get username from background script
  useEffect(() => {
    chrome.runtime.sendMessage({ type: "get_username" }, (response) => {
      if (response?.username) setUsername(response.username);
    });
  }, []);

  // Load chat history for current problem title
  useEffect(() => {
    if (!context.title) return;
    chrome.runtime.sendMessage({ type: "get_chat", title: context.title }, (response) => {
      if (Array.isArray(response)) {
        setMessages(response);
      }
    });
  }, [context.title]);

  // Save chat history to background script whenever messages change
  useEffect(() => {
    if (context.title) {
      chrome.runtime.sendMessage({ type: "save_chat", title: context.title, content: messages }, (response) => {
        console.log('Chat Saved', response.success);
      });
    }
  }, [messages, context.title]);

  // Track user in backend and observe DOM changes
  useEffect(() => {
    let observer;
    let timeoutId;

    if (userName) {
      axios.post(`${backendUrl}/user/${userName}`)
        .then(() => console.log('Successfully username saved'))
        .catch(() => console.error('username not saved'));
    }

    const startObserving = () => {
      if (!window.location.href.includes("/problems/")) return;

      observer = new MutationObserver(() => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          const data = {
            title: extractProblemTitle() || '',
            code: extractCode() || '',
            language: extractLanguage() || '',
            problemStatement: extractProblemStatement() || '',
            testCases: extractTestCases() || []
          };

          const verdictData = extractVerdict() || '';

          if (userName && verdictData) {
            try {
              await axios.post(`${backendUrl}/submission/submit`, {
                user: userName,
                title: data.title,
                code: data.code,
                language: data.language,
                verdict: verdictData
              });
              console.log('Submission Successful');
            } catch (err) {
              console.log('Submission Failed');
            }
          }

          if (data.title) {
            chrome.runtime.sendMessage({ type: "save_title", title: data.title });
          }

          // Only update state if data changed
          if (JSON.stringify(data) !== JSON.stringify(Currentdata.current)) {
            setContext(data);
            Currentdata.current = data;
          }
        }, 500);
      });

      observer.observe(document.body, { childList: true, subtree: true });
    };

    startObserving();

    // Cleanup on component unmount
    return () => {
      if (observer) observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [userName]);

  // Toggle chatbox open/close
  const toggleExpand = () => {
    setExpanded((prev) => !prev);
  };

  // Handle user query -> send to backend -> AI response
  const handleAsk = async () => {
    if (!query.trim()) return;
    if (!userName) {
      setMessages(prev => [...prev, { role: 'bot', content: 'Please enter your Leetcode username.' }]);
      return;
    }

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    chrome.runtime.sendMessage({ type: "get_chat", title: context.title }, (response) => {
      const history = Array.isArray(response) ? response : [];
      axios.post(`${backendUrl}/analyze`, {
        userId: userName,
        question: context.problemStatement,
        code: context.code,
        language: context.language,
        title: context.title,
        input: context.testCases,
        query: query,
        chat: history
      })
        .then((res) => {
          const data = res.data;
          const aiReply =
            data.history ||
            data.explain ||
            data.debug ||
            data.progress ||
            data.hint ||
            data.reply ||
            'No response.';

          const botMessage = { role: 'bot', content: aiReply };
          setMessages(prev => [...prev, botMessage]);
        })
        .catch((err) => {
          console.error(err);
          setMessages(prev => [...prev, { role: 'bot', content: 'Failed to connect to AI.' }]);
        })
        .finally(() => {
          setQuery('');
          setLoading(false);
        });
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col items-end space-y-2">

        {expanded && (
          <>
            {/* Chat Bubble Area */}
            <div className="w-[320px] max-h-80 overflow-y-auto backdrop-blur-sm rounded-xl p-3 space-y-2">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'bot' && (
                    <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2 text-xs font-semibold">B</div>
                  )}
                  <div
                    className={`px-3 py-2 rounded-lg max-w-[75%] text-sm whitespace-pre-wrap ${msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-zinc-200 text-black rounded-bl-none'
                      }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 bg-zinc-800 text-white rounded-full flex items-center justify-center ml-2 text-xs font-semibold">U</div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="text-sm text-gray-400 text-center">Typing...</div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Box */}
            <div className="flex items-center space-x-2 mt-2 w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask for a hint, debug, progress..."
                className="flex-grow px-4 py-2 bg-zinc-900 text-white border border-zinc-700 rounded-md focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              />
              <button
                onClick={handleAsk}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                <SendHorizonal size={20} />
              </button>
            </div>
          </>
        )}

        {/* Floating Icon */}
        <button
          onClick={toggleExpand}
          className="group relative bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 
             text-white rounded-full w-14 h-14 flex items-center justify-center 
             shadow-lg hover:shadow-xl transition-all duration-300 ease-out 
             hover:scale-110"
        >
          {/* Icon */}
          <Bot size={28} className="transition-transform duration-300 group-hover:rotate-12" />

          {/* Glow ring */}
          <span className="absolute inset-0 rounded-full bg-blue-400/30 blur-xl opacity-0 
                   group-hover:opacity-100 transition duration-500"></span>

          {/* Tooltip */}
          <span className="absolute -top-10 px-3 py-1 text-xs font-medium text-white 
                   bg-gray-800 rounded-lg opacity-0 group-hover:opacity-100 
                   transition duration-300">
            Ask AI
          </span>
        </button>

      </div>
    </div>
  );
};

export default Layout;
