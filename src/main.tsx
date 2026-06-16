import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import TrackingPage from './TrackingPage.tsx';
import { Toaster } from 'sonner';
import './index.css';

const path = window.location.pathname;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster 
      position="bottom-right"
      theme="dark"
      toastOptions={{
        style: {
          background: '#0c1214',
          border: '1px solid #b79152',
          color: '#eae9e5',
          fontFamily: 'Inter, sans-serif'
        },
        className: 'shadow-[0_8px_30px_rgb(0,0,0,0.6)]',
      }}
    />
    {path.startsWith('/tracking') ? <TrackingPage /> : <App />}
  </StrictMode>,
);
