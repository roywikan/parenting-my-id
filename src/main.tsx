import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initGlobalImageOptimizer } from './lib/imageOptimizerScript';

// Boot auto-image optimizer immediately
initGlobalImageOptimizer();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
