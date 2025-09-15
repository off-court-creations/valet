// ─────────────────────────────────────────────────────────────
// docs/src/types/babel-standalone.d.ts  | valet-docs
// Minimal module declaration for @babel/standalone in browser builds
// ─────────────────────────────────────────────────────────────
declare module '@babel/standalone' {
  export type TransformOptions = {
    filename?: string;
    presets?: unknown[];
  };
  export function transform(code: string, options?: TransformOptions): { code: string };
  export const version: string;
}
