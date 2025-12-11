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

// تسجيل Service Worker بعد تحميل الصفحة
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
  e.preventDefault(); // منع نافذة التثبيت التلقائي
  deferredPrompt = e;

  // اظهار زر التثبيت إذا موجود
  const installBtn = document.getElementById('install-btn');
  if (installBtn) installBtn.style.display = 'block';
});

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
  console.log(`User choice: ${choiceResult.outcome}`);
  deferredPrompt = null;
};
