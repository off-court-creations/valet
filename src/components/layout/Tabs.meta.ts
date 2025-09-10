// ─────────────────────────────────────────────────────────────
// src/components/layout/Tabs.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'Tabs',
  aliases: ['tabs'],
  usage: {
    purpose: 'Switch between peer sections within the same context.',
    whenToUse: [
      'Group related views that do not require navigation changes',
      'Users switch between small sets of content panes',
    ],
    whenNotToUse: [
      'Linear, required progression (use Stepper)',
      'Navigation across routes (use your router)',
      'Deep content sections that need their own URL and back stack',
    ],
    alternatives: ['Stepper', 'Accordion'],
  },
});
