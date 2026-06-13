// ─────────────────────────────────────────────────────────────
// src/main.tsx  | valet-docs
// Bootstraps React + valet, *plus* eagerly registers presets.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// Ensure initial paint uses valet’s CSS variable fallbacks
import '../../styles.css';

/* Self-host every webfont the docs use (weights 400 + 700) so the brand look
   is preserved with ZERO requests to fonts.googleapis.com / fonts.gstatic.com.
   The three built-in valet families resolve via injectRemote:false in App.tsx;
   Poppins is the only Google demo family DemoFontLoader pulls in. */
import '@fontsource/kumbh-sans/400.css';
import '@fontsource/kumbh-sans/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/700.css';

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
