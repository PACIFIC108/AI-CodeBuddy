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


