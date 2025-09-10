// ─────────────────────────────────────────────────────────────
// src/components/widgets/Dropzone.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'Dropzone',
  aliases: ['dropzone', 'upload', 'uploader'],
  usage: {
    purpose: 'Drag‑and‑drop file selection with previews and validation.',
    whenToUse: [
      'Upload flows where drag‑and‑drop improves efficiency',
      'Accepting multiple files with type/size validation',
    ],
    whenNotToUse: [
      'Simple single‑file inputs where a native picker suffices',
      'Uploads that require custom resumable logic (wrap with your uploader)',
    ],
    alternatives: ['TextField (type=file)'],
  },
});
