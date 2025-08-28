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
}

export interface ValetExample {
  id: string;
  title?: string;
  code: string;
  lang?: 'tsx' | 'js' | 'css';
  source?: { file: string; line?: number };
}

export interface ValetComponentDoc {
  name: string;
  category: string;
  slug: string;
  summary: string;
  description?: string;
  props: ValetProp[];
  domPassthrough?: { element: 'div' | 'button' | 'input' | 'span' | string; omitted?: string[] };
  cssVars?: string[];
  bestPractices?: string[];
  examples?: ValetExample[];
  docsUrl?: string;
  sourceFiles: string[];
  version: string;
}

