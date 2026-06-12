import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { useInitialTheme, Surface, Stack, Typography } from "@archway/valet";

const page = (p) => lazy(() => p().then((m) => ({ default: m.default })));

const QuickstartPage = page(() => import("@/pages/start/Quickstart"));
const SecondPage = page(() => import("@/pages/second/SecondPage"));

export function App() {
  useInitialTheme(
    {
      fonts: {
        heading: "Kumbh Sans",
        body: "Inter",
        mono: "JetBrains Mono",
        button: "Kumbh Sans",
      },
    },
    ["Kumbh Sans", "JetBrains Mono", "Inter"],
    {
      // The three families are self-hosted via @fontsource (see main.jsx), so
      // skip every request to fonts.googleapis.com — injectRemote:false makes
      // valet resolve them from the installed faces instead.
      injectRemote: false,
      // Follow the OS light/dark preference at boot and remember the visitor's
      // explicit toggle across reloads ('valet-mode' in localStorage).
      mode: "system",
      persistMode: true,
    },
  );

  const Fallback = (
    <Surface>
      <Stack sx={{ padding: "2rem", alignItems: "center" }}>
        <Typography variant="subtitle">Loading…</Typography>
      </Stack>
    </Surface>
  );

  return (
    <Suspense fallback={Fallback}>
      <Routes>
        <Route path="/" element={<QuickstartPage />} />
        <Route path="/secondpage" element={<SecondPage />} />
      </Routes>
    </Suspense>
  );
}
