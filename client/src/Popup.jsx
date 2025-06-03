import React, { useEffect,useState } from 'react';
import {
  User,
  Trash2,
  Bot,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import robo from '/bot.jpg'; 
import { saveUsername,
	clearChatHistory, 
	getUsername 
} from '../storage';
import axios from 'axios';



const Popup = () => {
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState(false);
	const Reload=()=>{
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		  if (tabs[0]?.id) {
		    chrome.tabs.reload(tabs[0].id);
		  }
		});
	}
	 
	useEffect(() => {
		const fetchTitle= async ()=>{
       chrome.runtime.sendMessage({ type: "get_title" }, (response) => {
      console.log("title from IndexedDB:", response?.title);
      setTitle(response?.title || '');
    });
 }
  fetchTitle();
}, []);

	 useEffect(() => {
	  const fetchUsername = async () => {
	    const user = await getUsername();
	    if (user) {
	      setUsername(user);
	      setSaved(true);
	    } else {
	      setUsername(''); 
	    }
	  };

	  fetchUsername();
	}, []);

 const saveusername = async () => {
    if (username.trim()) {
      await saveUsername(username);
      Reload();
      setSaved(true);
    }
  };

 const clearusername = async () => {
   chrome.runtime.sendMessage({ type: "clear_user" }, (response) => {
		 console.log("usercleared from IndexedDB:", response.msg);
		});
	   Reload();
      setUsername('');
      setSaved(false);
  };

  const clearChat = async () => {
    chrome.runtime.sendMessage({type:"delete_chat",title:title},(response)=>{
    	console.log(response);
    	Reload();
    })
  };

  const deleteUserHistory = async () => {console.log([title])
	 	try{
	 	  await axios.delete(`http://localhost:5000/api/submission/${username}/${title}`);
	 	   console.log('deletion successfull')
	    }catch(err){
	    	console.log({Error:err});
	    }
  };


  return (
    <div className="w-[360px] h-[400px] bg-white rounded-xl shadow-xl p-4 font-sans text-black">
      <div className="flex flex-col items-center space-y-2">
        <img src={robo} alt="Bot" className="h-20 rounded-full shadow-md" />
        <h1 className="text-2xl font-extrabold mt-2">
          AI <span className="text-orange-600">AlgoBuddy</span>
        </h1>
        <p className="text-sm text-gray-600 -mt-1 mb-2">
          Your LeetCode Copilot for DSA Excellence 🚀
        </p>

        {!saved && (
          <>
            <div className="flex items-center w-full gap-2 border rounded-md px-3 py-2 mt-2">
              <User className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter LeetCode username"
                className="w-full outline-none text-sm"
              />
            </div>
            <button
              onClick={saveusername}
              className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-md
				    ${!!username 
				      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
				      : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Username
            </button>
          </>
        )}

        {saved && (
          <div className="w-full mt-4 space-y-2">
            <div className="text-sm text-center text-green-600 flex items-center justify-center gap-1">
              <Bot className="w-4 h-4" />
              Welcome back, <strong>{username}</strong>!
            </div>

            <button
              onClick={clearChat}
              className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600"
            >
              <Trash2 className="w-4 h-4" />
              Clear Chat
            </button>
            <button
              onClick={deleteUserHistory}
              className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded-md hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
              Delete Current Submission History
            </button>
            <button
              onClick={clearusername}
              className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white py-2 rounded-md hover:bg-gray-800"
            >
              <LogOut className="w-4 h-4" />
              Leave
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;
