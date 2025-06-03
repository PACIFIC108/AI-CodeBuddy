import { clearChatHistory, clearUsername, getChatHistory, getTitle, getUsername,saveChatHistory,saveTitle } from "./storage";

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'get_username') {
    getUsername().then(user => {
      sendResponse({ username: user || '' });
    });
    return true;
  }
  if (message.type === 'clear_user') {
    clearUsername().then(msg => {
      sendResponse({ msg: msg || '' });
    });
    return true;
  }
});



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'get_title') {
    getTitle().then(title => {
      sendResponse({ title: title || '' });
    }).catch(err=>{console.log(err)})
    return true; 
  }

  if (message.type === 'save_title') {
    saveTitle(message.title).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

});



chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  if(message.type === 'save_chat'){
     saveChatHistory(message.content,message.title)
     .then(()=>sendResponse({success:true}))
     return true;
  }
  else if(message.type === 'get_chat'){

     getChatHistory(message.title)
     .then((res)=>{sendResponse(res)})
     return true;
  }
  else if(message.type ==='delete_chat'){
     clearChatHistory(message.title)
     .then(()=>sendResponse({success:true}))
     return true;
  }
});














// chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
//   if (request.type === "analyze") {
//     const payload = {
//       user: request.userId,
//       query: request.query,
//       code: request.code,
//       input: request.input,
//       language: request.language,
//       question: request.question,
//       title: request.title
//     };

//     try {
//       const res = await axios.post('http://localhost:5000/api/analyze', {
//         userId: payload.user,
//         question: payload.question,
//         code: payload.code,
//         language: payload.language,
//         title: payload.title,
//         input: payload.input,
//         query: payload.query
//       });

//       const data = res.data;
//       const aiReply = data.history || data.explain || data.debug || data.progress || data.hint || data.reply || 'No response.';

//       sendResponse({ success: true, reply: aiReply });
//     } catch (error) {
//       console.error("Error in background:", error.message);
//       sendResponse({ success: false, error: "Failed to get AI response." });
//     }

//     return true; 
//   }
// });
