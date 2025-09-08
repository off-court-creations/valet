// ─────────────────────────────────────────────────────────────
// src/components/layout/AppBar.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'AppBar',
  aliases: ['navbar', 'appbar', 'footer'],
  usage: {
    purpose: 'Primary navigation and actions anchored to the top or bottom of a Surface.',
    whenToUse: [
      'Global navigation, branding, and quick actions',
      'Sticky headers that remain visible during scroll',
      'Provide a home for search, menus, or primary CTAs',
    ],
    whenNotToUse: [
      'Dialog/tool palettes (use Drawer or Modal)',
      'Section headers inside content (use Typography or a Panel header)',
    ],
    alternatives: ['Drawer', 'Tabs', 'Panel'],
  },
});
