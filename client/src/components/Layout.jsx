import React, { useState,useEffect,useRef } from 'react';
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

  const Currentdata = useRef({
    title: '',
    code: '',
    language: '',
    problemStatement: '',
    testCases: [],
  });
  const chatEndRef = useRef(null);
  const backendUrl = 'http://localhost:5000/api';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  useEffect(() => {
    chrome.runtime.sendMessage({ type: "get_username" }, (response) => {
      setUsername(response.username);
     });

  }, []);

   useEffect(() => {
    chrome.runtime.sendMessage({ type: "get_chat",title:context.title }, (response) => {
      setMessages(response);
     });

  }, [context.title]);
   

  useEffect(()=>{
    chrome.runtime.sendMessage({ type:"save_chat",title:context.title,content:messages },(response)=>{
        console.log('Chat Saved',response.success);
    });
  },[messages,context.title]);
 

  useEffect(() => {
    if(userName){
       axios.post(`${backendUrl}/user/${userName}`)
        .then(()=>console.log('Successfully username saved'))
        .catch(()=>console.error('username not saved'));
     }

    let timeoutId;
    const observer = new MutationObserver( () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async ()=>{

        const data = {
          title: extractProblemTitle() || '',
          code: extractCode() || '',
          language: extractLanguage() || '',
          problemStatement: extractProblemStatement() || '',
          testCases: extractTestCases() || []
        };

        const verdictData = extractVerdict() || '';
         // {verdictData && (
         //  verdictId.current = verdictId.current <= verdictData[0] 
         //    ? verdictId.current 
         //    : verdictData[0]
         // )}
        // console.log([verdictData,userName,data.title])
        if(userName && verdictData ){
          // verdictId.current = verdictData[0];
          try{
              await axios.post(`${backendUrl}/submission/submit`,{
                user:userName, 
                title:data.title,
                code:data.code, 
                language:data.language, 
                verdict:verdictData
             })
              console.log('Submission Successfull')
          }catch(err){
            console.log('Submission Failed');
          }
        }
        if(data.title){
          chrome.runtime.sendMessage({ type: "save_title", title: data.title });
        }
        if(data !== Currentdata.current){
          setContext(data);
          Currentdata.current = data;
        }
      },500);

    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
      return () => observer.disconnect() // Cleanup on unmount
  }, [userName]);

  const toggleExpand = () => {
    // setMessages([]);
    setExpanded(!expanded);
  };

  const handleAsk = async () => {
    if (!query.trim()) return;
    if(!userName){
     setMessages(prev => [...prev, { role: 'bot', content: 'Please enter your Leetcode username.' }]);
      return;
    } 

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
       
       chrome.runtime.sendMessage({ type: "get_chat", title:context.title }, (response) => {
         const history = response;
       // console.log('132',response)
         axios.post(`${backendUrl}/analyze`, {
            userId:userName, 
            question:context.problemStatement, 
            code:context.code, 
            language:context.language, 
            title:context.title, 
            input:context.testCases,
            query:query,
            chat:history
        })
        .then((res)=>{
       // console.log(res.data);
        const data = res.data;
        const aiReply = data.history || data.explain || data.debug || data.progress || data.hint || data.reply || 'No response.';

        const botMessage = { role: 'bot', content: aiReply };
        setMessages(prev => [...prev, botMessage]);
      })
      . catch ((err) =>{
        console.error(err);
        setMessages(prev => [...prev, { role: 'bot', content: 'Failed to connect to AI.' }]);
      })
      .finally(()=>{
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
                    className={`px-3 py-2 rounded-lg max-w-[75%] text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
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

            {/* Input Box - Dark, minimal */}
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
          className="bg-blue-600 text-white rounded-full w-12 h-12 flex flex-col items-center justify-center shadow-md hover:bg-blue-700 transition"
        >
          <Bot size={30}/>
          <p>Ask Me</p>
        </button>
      </div>
    </div>
  );
};

export default Layout;
