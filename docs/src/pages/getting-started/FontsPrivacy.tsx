// ─────────────────────────────────────────────────────────────
// src/pages/getting-started/FontsPrivacy.tsx  | valet-docs
// Fonts & Privacy: GDPR posture, the three loading strategies,
// and the fail-safe font-wait timeout semantics (THEMING S11).
// Canonical route: /fonts-privacy (the library's dev notice links here).
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Typography,
  Panel,
  CodeBlock,
  Table,
  type TableColumn,
} from '@archway/valet';
import NavDrawer from '../../components/NavDrawer';
import type { DocMeta } from '../../types';

export const meta: DocMeta = {
  id: 'fonts-privacy',
  title: 'Fonts & Privacy',
  description:
    'How valet loads fonts and what that means for privacy/GDPR: why injectRemote exists, the three loading strategies (remote Google injection with a dev notice, injectRemote:false + self-hosted @fontsource, and explicit-fonts-only zero-config), what valet does and does not send, and the never-block 5s font-wait timeout.',
  pageType: 'concept',
  prerequisites: ['quickstart', 'theme-engine'],
  components: ['useInitialTheme', 'useGoogleFonts'],
  tldr: 'As of 1.0 valet does NOT fetch Google Fonts by default — injectRemote defaults to false, so a named Google family is treated as a local family (zero network). Three strategies: opt into remote injection with injectRemote:true (a once-per-session dev notice fires); pass injectRemote:false (the default) and self-host the same families via @fontsource (zero requests, identical look); or go explicit-fonts-only — useInitialTheme({}) names no font at all. Font waits resolve after 5s and never reject, so a hung CDN can never wedge your UI.',
};

/*───────────────────────────────────────────────────────────*/
/* Strategy comparison matrix                                */

interface StrategyRow {
  strategy: string;
  network: string;
  look: string;
  use: string;
}

const STRATEGIES: StrategyRow[] = [
  {
    strategy: 'Remote Google injection (opt-in: injectRemote:true)',
    network: 'Requests to fonts.googleapis.com + fonts.gstatic.com',
    look: 'Brand fonts load over the network',
    use: 'Prototypes and first-party apps where a Google Fonts request is acceptable. Opt in with injectRemote:true; a once-per-session dev notice fires.',
  },
  {
    strategy: 'injectRemote:false + self-host (@fontsource)',
    network: 'Zero third-party requests; faces served from your own bundle',
    look: 'Identical brand look — same families, self-hosted',
    use: 'Production / GDPR-sensitive apps that still want the valet brand fonts. The recommended privacy posture; what the docs and CVA templates ship.',
  },
  {
    strategy: 'Explicit-fonts-only (zero-config)',
    network: 'Zero requests — no font is named, so none is loaded',
    look: 'Falls back to whatever face the platform already has installed',
    use: 'The most conservative path: useInitialTheme({}) loads no webfont at all. Add a font only by naming it.',
  },
];

const STATUS_COLOR: Record<string, string> = {
  remote: '#EAB308',
  selfhost: '#22C55E',
  explicit: '#22C55E',
};

export default function FontsPrivacyPage() {
  const columns: TableColumn<StrategyRow>[] = [
    {
      header: 'Strategy',
      accessor: 'strategy',
      render: (row) => (
        <Typography
          variant='subtitle'
          weight='bold'
          sx={{
            color: row.strategy.startsWith('Remote')
              ? STATUS_COLOR['remote']
              : STATUS_COLOR['selfhost'],
          }}
        >
          {row.strategy}
        </Typography>
      ),
    },
    { header: 'Network', accessor: 'network' },
    { header: 'Look', accessor: 'look' },
    { header: 'When to use', accessor: 'use' },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack
        gap={2}
        sx={{ padding: '1rem', maxWidth: 1100 }}
      >
        <Typography
          variant='h2'
          weight='bold'
        >
          Fonts &amp; Privacy
        </Typography>
        <Typography>
          valet can load webfonts for you. Because one opt-in strategy reaches out to a third-party
          CDN (Google Fonts), this page is deliberately explicit about{' '}
          <strong>what can leave the page, why, and how each strategy behaves</strong> — so you can
          pick the loading strategy that fits your app and your jurisdiction.
        </Typography>

        <Panel
          fullWidth
          variant='outlined'
          pad={2}
        >
          <Typography>
            <strong>TL;DR.</strong> As of 1.0 valet does <strong>not</strong> fetch Google Fonts by
            default — <code>injectRemote</code> defaults to <code>false</code>, so a named Google
            family is treated as a local family (<strong>zero</strong> requests). Opt into remote
            injection with <code>injectRemote: true</code> (a once-per-session dev notice fires),
            self-host the same families with <code>@fontsource</code> for an identical look, or go{' '}
            <em>explicit-fonts-only</em> — <code>useInitialTheme({'{}'})</code> names no font and
            makes <strong>zero</strong> network requests, falling back to installed system faces.
            Either way, a font wait <strong>resolves after 5s and never rejects</strong>, so a slow
            or blocked CDN can never wedge your UI.
          </Typography>
        </Panel>

        {/* GDPR posture */}
        <Typography
          variant='h3'
          weight='bold'
        >
          The GDPR posture — why <code>injectRemote</code> exists
        </Typography>
        <Typography>
          When a browser fetches a font from <code>fonts.googleapis.com</code> /{' '}
          <code>fonts.gstatic.com</code>, the request carries the visitor’s IP address to a
          third-party processor. In 2022 a German court (<em>LG München I</em>, 3 O 17493/20) ruled
          that embedding Google Fonts this way — transmitting a visitor’s IP to Google without
          consent — violated the GDPR, and awarded damages against the site operator. The ruling
          created a class of risk that any EU-facing site dynamically loading Google Fonts now has
          to reason about.
        </Typography>
        <Typography>
          valet’s answer is to make the remote request <strong>controllable and honest</strong>,
          never silent:
        </Typography>
        <Stack
          gap={0.5}
          sx={{ paddingInlineStart: '1rem' }}
        >
          <Typography>
            • <strong>What valet sends:</strong> only when you opt into remote injection (
            <code>injectRemote: true</code>), valet appends <code>preconnect</code> hints plus a{' '}
            <code>fonts.googleapis.com/css2</code> stylesheet link. The browser then fetches the CSS
            and the font files — that is the request that carries the visitor IP to Google.
          </Typography>
          <Typography>
            • <strong>What valet never sends:</strong> valet itself makes no analytics, telemetry,
            or tracking calls. It transmits no email, no identifiers, and nothing to off-court
            servers. A font fetch is the <em>only</em> third-party request the theming layer can
            originate, and it is opt-in.
          </Typography>
          <Typography>
            • <strong>The honest default:</strong> as of 1.0 <code>injectRemote</code> defaults to{' '}
            <code>false</code> (privacy-by-default; it was <code>true</code> through 0.x), so a
            named Google family is treated as a <em>local</em> family and no request leaves the page
            unless you opt in with <code>injectRemote: true</code>. When you do, valet prints a{' '}
            <em>once-per-session</em> dev-only console notice the first time it injects a Google
            font, naming the request and pointing here. Production builds stay silent.
          </Typography>
        </Stack>

        {/* Three strategies */}
        <Typography
          variant='h3'
          weight='bold'
        >
          Three loading strategies
        </Typography>
        <Panel fullWidth>
          <Table
            data={STRATEGIES}
            columns={columns}
            striped
            dividers
            constrainHeight={false}
          />
        </Panel>

        {/* Strategy 1 */}
        <Typography
          variant='h4'
          weight='bold'
        >
          1 · Remote Google injection (opt-in: injectRemote:true)
        </Typography>
        <Typography>
          Name a font and opt in with <code>injectRemote: true</code> to let valet inject the Google
          Fonts stylesheet. This is the one strategy that originates the third-party request; a
          once-per-session dev notice reminds you it happened. (At 1.0 the default is{' '}
          <code>false</code>, so without this opt-in the same families resolve locally.)
        </Typography>
        <CodeBlock
          ariaLabel='Opt-in remote Google Fonts injection'
          code={`import { useInitialTheme } from '@archway/valet';

// injectRemote:true opts back into the remote fetch (default is false at 1.0).
// Injects preconnect + a fonts.googleapis.com stylesheet for these families.
// Dev console (once per session): "valet: loading Google Fonts from
// fonts.googleapis.com (remote third-party request)…"
useInitialTheme(
  { fonts: { heading: 'Kumbh Sans', body: 'Inter', mono: 'JetBrains Mono' } },
  [],
  { injectRemote: true },
);`}
        />

        {/* Strategy 2 */}
        <Typography
          variant='h4'
          weight='bold'
        >
          2 · <code>injectRemote:false</code> + self-hosted <code>@fontsource</code>
        </Typography>
        <Typography>
          Install the same families as packages, import their faces once, and tell valet not to
          inject the remote links. valet then resolves those Google-shaped family names from the{' '}
          <strong>already-installed</strong> faces via <code>FontFace</code> observation — same
          brand look, <strong>zero requests to Google</strong>. This is the posture the valet docs
          and the <code>create-valet-app</code> templates ship.
        </Typography>
        <CodeBlock
          ariaLabel='Self-hosting fonts with @fontsource and injectRemote:false'
          code={`// main.tsx — self-host the faces (weights 400 + 700)
import '@fontsource/kumbh-sans/400.css';
import '@fontsource/kumbh-sans/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';

// App.tsx — name the families, but skip every remote request
useInitialTheme(
  { fonts: { heading: 'Kumbh Sans', body: 'Inter', mono: 'JetBrains Mono' } },
  ['Kumbh Sans', 'Inter', 'JetBrains Mono'],
  { injectRemote: false, mode: 'system', persistMode: true },
);`}
        />
        <Typography>
          With <code>injectRemote:false</code>, string family names and <code>{'{ family }'}</code>{' '}
          requests are treated as <strong>local families</strong>: no <code>preconnect</code>, no{' '}
          <code>googleapis.com</code> links, no dev notice. Self-hosted <code>CustomFont</code>{' '}
          entries (<code>{'{ name, src }'}</code>) were always local and are unaffected.
        </Typography>

        {/* Strategy 3 */}
        <Typography
          variant='h4'
          weight='bold'
        >
          3 · Explicit-fonts-only (zero-config)
        </Typography>
        <Typography>
          The most conservative path. <code>useInitialTheme({'{}'})</code> names no font, so valet
          loads <strong>nothing</strong> — no link injection, no font-load cycle, and{' '}
          <strong>zero network requests</strong>. The theme’s built-in family <em>names</em> still
          apply; they simply fall back to whatever face the platform already has installed. Load a
          webfont only by naming it (or passing it in the <code>extras</code> array).
        </Typography>
        <CodeBlock
          ariaLabel='Explicit-fonts-only zero-config theme'
          code={`// Zero network: no font is named, so none is loaded.
useInitialTheme({});

// Opt back in per font — name exactly what you want loaded:
useInitialTheme({ fonts: { body: 'Inter' } });`}
        />
        <Typography>
          This differs from <code>injectRemote:false</code> in kind, not degree: explicit-fonts-only
          removes the request <em>site</em> entirely, where <code>injectRemote:false</code> keeps
          named families but resolves them locally. It is the truly unconditional GDPR path — there
          is no font request to consent to because there is no font request.
        </Typography>

        {/* Timeout semantics */}
        <Typography
          variant='h3'
          weight='bold'
        >
          Never-block timeout semantics
        </Typography>
        <Typography>
          Font loading must never be able to freeze an app, whatever the network does. valet’s wait
          is fail-safe by construction:
        </Typography>
        <Stack
          gap={0.5}
          sx={{ paddingInlineStart: '1rem' }}
        >
          <Typography>
            • <strong>Resolve-on-timeout (5s).</strong> The font wait races the loads against a{' '}
            <code>5000&nbsp;ms</code> timer. If a face hasn’t settled by then, the wait{' '}
            <strong>resolves anyway</strong> (it never rejects) and dev builds log which families
            timed out. A hung or blocked CDN delays nothing past five seconds.
          </Typography>
          <Typography>
            • <strong>Per-load never-rejects.</strong> An individual face that fails to load is
            swallowed with a dev warning — one bad font can’t take down the whole wait, and a
            rejected load can never leave the font store stuck in a loading state.
          </Typography>
          <Typography>
            • <strong>Never-started grace (500ms).</strong> A <code>Surface</code> that blocks on
            fonts has a 500&nbsp;ms grace before any load is even registered, so an app that names
            no font (or whose load never starts) is never gated waiting for something that will
            never arrive.
          </Typography>
        </Stack>
        <Panel
          fullWidth
          variant='outlined'
          pad={2}
        >
          <Typography>
            <strong>Bottom line.</strong> Choose your strategy by jurisdiction and brand needs:
            self-host with <code>injectRemote:false</code> for the valet look with zero third-party
            requests, or go explicit-fonts-only for the absolute minimum. Whatever you pick, the
            font pipeline degrades gracefully — it resolves, warns in dev, and never blocks.
          </Typography>
        </Panel>
      </Stack>
    </Surface>
  );
}
