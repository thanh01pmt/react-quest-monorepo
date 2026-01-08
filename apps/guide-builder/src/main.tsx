import React from 'react'
import ReactDOM from 'react-dom/client'
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { questPlayerResources } from '@repo/quest-player';
import App from './App.tsx'
import './index.css'

i18n
  .use(initReactI18next)
  .init({
    resources: questPlayerResources,
    lng: 'vi',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
