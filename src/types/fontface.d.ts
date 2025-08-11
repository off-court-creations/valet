// src/types/fontface.d.ts
export {};

declare global {
  interface FontFaceSet {
    add(font: FontFace): void;
    delete(font: FontFace): boolean;
  }
}
