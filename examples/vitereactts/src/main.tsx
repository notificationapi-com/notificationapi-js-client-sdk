import React from 'react';
import ReactDOM from 'react-dom/client';
import NotificationAPIComponent from './NotificationAPIComponent.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NotificationAPIComponent userId="sahand" />
  </React.StrictMode>
);
