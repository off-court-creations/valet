// ─────────────────────────────────────────────────────────────
// src/main.tsx
// Bootstraps React + Valet, *plus* eagerly registers presets.
// ─────────────────────────────────────────────────────────────
import React            from 'react';
import ReactDOM         from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

/* Load all global presets *before* the app renders ---------- */
import './presets/globalPresets';

import { App } from './App';

/* Mount ------------------------------------------------------ */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
