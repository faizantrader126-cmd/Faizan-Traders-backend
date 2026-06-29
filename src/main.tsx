import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { getSavedTheme, applyThemeToDOM } from './lib/theme';

// Apply saved theme color configuration instantly before rendering
applyThemeToDOM(getSavedTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
