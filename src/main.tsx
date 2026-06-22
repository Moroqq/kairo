import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Локальный JetBrains Mono (с кириллицей) — одинаковый шрифт RU/EN, работает оффлайн в нативном приложении
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
