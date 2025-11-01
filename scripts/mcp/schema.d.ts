export interface ValetComponentIndexItem {
  name: string;
  category: string;
  summary: string;
  slug: string;
}

export interface ValetProp {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description?: string;
  deprecated?: true | { reason?: string; replacement?: string };
  source?: { file: string; line?: number };
  enumValues?: string[];
}

export interface ValetExample {
  id: string;
  title?: string;
  code: string;
  lang?: 'tsx' | 'js' | 'css';
  source?: { file: string; line?: number };
  runnable?: boolean;
  minimalProps?: Record<string, unknown>;
}

export interface ValetComponentDoc {
  name: string;
  category: string;
  slug: string;
  summary: string;
  status?: 'production' | 'stable' | 'experimental' | 'unstable' | 'deprecated';
  description?: string;
  usage?: {
    purpose?: string | string[];
    whenToUse?: string[];
    whenNotToUse?: string[];
    alternatives?: string[];
  };
  aliases?: string[];
  props: ValetProp[];
  domPassthrough?: { element: 'div' | 'button' | 'input' | 'span' | string; omitted?: string[] };
  cssVars?: string[];
  cssPresets?: string[];
  events?: Array<{ name: string; payloadType?: string; description?: string }>;
  actions?: Array<{ name: string; signature?: string; description?: string }>;
  slots?: Array<{ name: string; description?: string }>;
  bestPractices?: string[];
  examples?: ValetExample[];
  docsUrl?: string;
  sourceFiles: string[];
  version: string;
  schemaVersion?: string;
}
