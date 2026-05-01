import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const UPDATE_REQUEST_KEY = 'review-buddy-update-requested';
    const notifyUpdateReady = () => {
      window.dispatchEvent(new Event('review-buddy-update-ready'));
    };

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (window.sessionStorage.getItem(UPDATE_REQUEST_KEY) !== 'true') {
        return;
      }

      window.sessionStorage.removeItem(UPDATE_REQUEST_KEY);
      window.location.reload();
    });

    navigator.serviceWorker
      .register(new URL('sw.js', document.baseURI).toString(), { updateViaCache: 'none' })
      .then((registration) => {
        if (registration.waiting) {
          notifyUpdateReady();
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              notifyUpdateReady();
            }
          });
        });

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
