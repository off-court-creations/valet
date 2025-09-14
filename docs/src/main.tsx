// ─────────────────────────────────────────────────────────────
// src/main.tsx  | valet-docs
// Bootstraps React + valet, *plus* eagerly registers presets.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// Ensure initial paint uses valet’s CSS variable fallbacks
import '../../styles.css';

/* Load all global presets *before* the app renders ---------- */
import './presets/globalPresets';

import { App } from './App';

/* Mount ------------------------------------------------------ */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
