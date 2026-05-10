import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AppProvider } from './contexts/AppContext';
import { AppUIProvider } from './contexts/AppUIContext';

const originalConsoleError = console.error;
console.error = (...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('`value` prop on `select` should not be null') || 
      msg.includes('A component is changing an uncontrolled')) {
    console.warn("Suppressed React null value component warning.");
    return;
  }
  originalConsoleError.apply(console, args);
};

console.log('MAIN TSX EXECUTING - DEBUG 2026-05-03');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppUIProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AppUIProvider>
  </StrictMode>,
);
