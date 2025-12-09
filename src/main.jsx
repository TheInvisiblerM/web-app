import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}

// ---- PWA Install Button Event ----
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById("install-btn");
  if (installBtn) installBtn.style.display = "block";
});

window.addEventListener("appinstalled", () => {
  const installBtn = document.getElementById("install-btn");
  if (installBtn) installBtn.style.display = "none";
});

// Trigger Install
window.installPWA = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
};
