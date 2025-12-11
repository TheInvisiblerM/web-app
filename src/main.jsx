import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// إنشاء الجذر
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// تسجيل Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(err => {
        console.error('SW registration failed: ', err);
      });
  });
}

// ---- PWA Install Handling ----
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // منع ظهور نافذة التثبيت التلقائي
  e.preventDefault();
  deferredPrompt = e;

  // اظهار زر التثبيت إذا موجود
  const installBtn = document.getElementById('install-btn');
  if (installBtn) installBtn.style.display = 'block';
});

// عند تثبيت التطبيق
window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
  const installBtn = document.getElementById('install-btn');
  if (installBtn) installBtn.style.display = 'none';
});

// دالة لتفعيل التثبيت عند الضغط على الزر
window.installPWA = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const choiceResult = await deferredPrompt.userChoice;
  if (choiceResult.outcome === 'accepted') {
    console.log('User accepted the install prompt');
  } else {
    console.log('User dismissed the install prompt');
  }
  deferredPrompt = null;
};
