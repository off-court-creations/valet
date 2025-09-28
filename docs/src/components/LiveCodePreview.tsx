// ─────────────────────────────────────────────────────────────
// docs/src/components/LiveCodePreview.tsx  | valet-docs
// Runtime TSX example renderer using @babel/standalone
// ─────────────────────────────────────────────────────────────
import * as React from 'react';
import { Box, Stack, Typography, useTheme, CodeBlock } from '@archway/valet';
import * as Valet from '@archway/valet';
import * as Babel from '@babel/standalone';

export type LiveCodePreviewProps = {
  title?: string | undefined;
  code: string;
  language?: string;
  runnable?: boolean;
};

function detectComponentNames(src: string): string[] {
  const names = new Set<string>();
  const source = typeof src === 'string' ? src : '';
  const tagRe = /<([A-Z][A-Za-z0-9]*)\b/gm;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(source))) {
    const tag = m?.[1];
    if (tag) names.add(tag);
  }
  // Common compound tags like Select.Option just need Select in scope
  const compoundRe = /<([A-Z][A-Za-z0-9]*)\.[A-Za-z0-9_]+\b/gm;
  while ((m = compoundRe.exec(source))) {
    const tag = m?.[1];
    if (tag) names.add(tag);
  }
  // Always include basic layout/typography as a safety net
  ['Box', 'Stack', 'Typography'].forEach((n) => names.add(n));
  return Array.from(names);
}

export default function LiveCodePreview({
  title,
  code,
  language = 'tsx',
  runnable = true,
}: LiveCodePreviewProps) {
  const { theme } = useTheme();
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!runnable && error) setError(null);
  }, [error, runnable]);

  const detected = React.useMemo(
    () => (runnable ? detectComponentNames(code) : []),
    [code, runnable],
  );

  const scope = React.useMemo(() => {
    if (!runnable) return {};
    const out: Record<string, unknown> = {};
    const v = Valet as unknown as Record<string, unknown>;
    for (const name of detected) {
      if (Object.prototype.hasOwnProperty.call(v, name)) out[name] = v[name];
    }
    return out;
  }, [detected, runnable]);

  const rendered = React.useMemo(() => {
    if (!runnable) return null;
    setError(null);
    try {
      const decl = detected.length ? `const { ${detected.join(', ')} } = scope;` : '';
      const wrapped = `function __Example(React, scope, theme) {\n${decl}\nreturn (${code});\n}`;
      const compiled = Babel.transform(wrapped, {
        filename: 'LiveExample.tsx',
        presets: [['react', { runtime: 'classic', development: false }], 'typescript'],
      }).code as string;
      // eslint-disable-next-line no-new-func
      const fn = new Function(
        'React',
        'scope',
        'theme',
        `${compiled}\nreturn __Example(React, scope, theme);`,
      );
      const node = fn(React, scope, theme);
      // Support three forms:
      // 1) JSX element literal -> render directly
      // 2) Function component (() => <...>) -> instantiate it
      // 3) Other values -> show as-is in a fragment
      if (React.isValidElement(node)) return node;
      if (typeof node === 'function') return React.createElement(node as React.ElementType);
      return React.createElement(React.Fragment, null, node as unknown as React.ReactNode);
    } catch (e) {
      setError((e as Error)?.message || 'Failed to render example');
      return null;
    }
  }, [code, detected, runnable, scope, theme]);

  return (
    <Stack gap={0.5}>
      {title && <Typography variant='subtitle'>{title}</Typography>}
      {runnable ? (
        <Stack
          direction='row'
          wrap
          gap={1}
        >
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            {error ? (
              <Typography
                variant='subtitle'
                sx={{ color: theme.colors['errorText'] }}
              >
                Preview error: {error}
              </Typography>
            ) : (
              rendered
            )}
          </div>
          <Box sx={{ flex: '1 1 320px', minWidth: 0 }}>
            <CodeBlock
              code={code}
              language={language}
            />
          </Box>
        </Stack>
      ) : (
        <Box sx={{ minWidth: 0 }}>
          <CodeBlock
            code={code}
            language={language}
          />
        </Box>
      )}
    </Stack>
  );
}
