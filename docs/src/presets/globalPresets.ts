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
// Fancy card-like container
definePreset('fancyHolder', (t) => `
    background   : ${t.colors['primary']};
    color        : ${t.colors['primaryText']};
    border-radius: 20px;
    box-shadow   : 0 6px 16px ${t.colors['text']}22;
    padding      : ${t.spacing(1)};
    margin       : ${t.spacing(1)};
  `);

// Frosted-glass effect (needs backdrop-filter support)
definePreset('glassHolder', (t) => `
    background      : ${t.colors['background']}CC;
    backdrop-filter : blur(6px) saturate(180%);
    border          : 1px solid ${t.colors['text']}22;
    padding         : ${t.spacing(1)};
    border-radius   : 12px;
  `);

// Loud gradient banner
definePreset('gradientHolder', () => `
    background: linear-gradient(135deg,#ff6b6b 0%,#f7b267 50%,#4bd0d2 100%);
    color     : #ffffff;
    padding   : 32px;
    border-radius: 8px;
    text-align: center;
  `);

definePreset('codePanel', (t) => `
    padding         : ${t.spacing(1)};
    margin-bottom : ${t.spacing(4)} !important;
  `);
