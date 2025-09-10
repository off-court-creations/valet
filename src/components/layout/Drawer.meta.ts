// ─────────────────────────────────────────────────────────────
// src/components/layout/Drawer.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'Drawer',
  aliases: ['drawer', 'sidenav', 'side-nav', 'sidebar'],
  usage: {
    purpose: 'Off‑canvas panel for navigation and contextual tools.',
    whenToUse: [
      'Secondary navigation, filters, or details alongside primary content',
      'Responsive navigation that collapses on small screens',
      'Non‑blocking utilities that can be dismissed',
    ],
    whenNotToUse: ['Critical blocking decisions (use Modal)', 'Transient feedback (use Snackbar)'],
    alternatives: ['Modal', 'AppBar', 'Panel'],
  },
});
