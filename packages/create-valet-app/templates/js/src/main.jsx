import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Self-host the three built-in valet families (weights 400 + 700) so the brand
// look is preserved with zero requests to Google's servers. useInitialTheme is
// configured with injectRemote:false so these named families resolve from these
// installed @fontsource faces instead of fonts.googleapis.com.
import "@fontsource/kumbh-sans/400.css";
import "@fontsource/kumbh-sans/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";

// Load global presets before app renders
import "@/presets/globalPresets";

import { App } from "@/App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
