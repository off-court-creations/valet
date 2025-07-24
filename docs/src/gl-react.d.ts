declare module 'gl-react' {
  import type { ComponentType } from 'react';
  export const Shaders: any;
  export const Node: ComponentType<any>;
  export const GLSL: (source: TemplateStringsArray | string) => string;
}
declare module 'gl-react-dom' {
  import type { ComponentType } from 'react';
  export const Surface: ComponentType<any>;
}
