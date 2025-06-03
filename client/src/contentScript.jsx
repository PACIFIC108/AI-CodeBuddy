import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; 


const container = document.createElement('div');
container.id = 'ai-hint-extension-root';

document.body.appendChild(container);

const root = ReactDOM.createRoot(container);
root.render(
   <React.StrictMode>
    <App />
   </React.StrictMode>
);


		
		