// ─────────────────────────────────────────────────────────────
// src/presets/globalPresets.ts | valet
// Central registry for presets shared across multiple pages.
// This module is imported once on startup, so every route
// can safely reference these presets without pulling in
// other showcase pages.
// ─────────────────────────────────────────────────────────────
import { definePreset } from '@archway/valet';

/*───────────────────────────────────────────────────────────*/
/* Shared layout preset – used by *many* demo pages          */
definePreset('showcaseStack', (t) => `
  margin    : ${t.spacing(1)};
  padding   : ${t.spacing(1)};
`);
