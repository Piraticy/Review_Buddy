import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    let hasReloadedForUpdate = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hasReloadedForUpdate) return;
      hasReloadedForUpdate = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register(new URL('sw.js', document.baseURI).toString(), { updateViaCache: 'none' })
      .then((registration) => {
        registration.update();

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => undefined);
          }
        });

        window.setInterval(() => {
          registration.update().catch(() => undefined);
        }, 5 * 60 * 1000);
      })
      .catch(() => undefined);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
