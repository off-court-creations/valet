// ─────────────────────────────────────────────────────────────
// src/components/primitives/Avatar.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'Avatar',
  aliases: ['avatar', 'badge'],
  usage: {
    purpose: 'Visual identity for people, teams, or entities.',
    whenToUse: [
      'Show user profile images or initials',
      'Compact identity chips in lists, menus, and headers',
    ],
    whenNotToUse: ['Content imagery (use Image)'],
    alternatives: ['Image', 'Icon'],
  },
});
