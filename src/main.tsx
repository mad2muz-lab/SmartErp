import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerServiceWorker } from './utils/pwa';
import './utils/saudiRiyalSymbol.css';
import '@emran-alhaddad/saudi-riyal-font/index.css';

// Essential PWA setup only - minimal for fast loading
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
