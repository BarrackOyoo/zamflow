import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';  // ← add this
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* Tell React-Router it lives under /zamflow/ */}
    <BrowserRouter basename="/zamflow">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);