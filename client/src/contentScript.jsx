import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; 

// Function to check if current page is a problem page
function isProblemPage() {
  return window.location.pathname.startsWith("/problems/");
}

if (isProblemPage()) {
  // Create container for your React app
  const container = document.createElement("div");
  container.id = "ai-codebuddy-root";

  //  isolate styles
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.right = "20px";
  container.style.zIndex = "999999"; // keep on top
  container.style.all = "initial";   // prevent page CSS overriding

  document.body.appendChild(container);

  // Mount  React app
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
