// ─────────────────────────────────────────────────────────────
// src/pages/components/primitives/TypographyDemoPage.tsx  | valet-docs
// Comprehensive Typography 1.0 examples: weights, tracking, leading,
// optical sizing, fluid sizes, loader/axes, and best practices.
// ─────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import {
  Surface,
  Stack,
  Typography,
  Panel,
  Button,
  Table,
  useTheme,
  CodeBlock,
  Grid,
  Divider,
  Tabs,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import PageHero from '../../../components/PageHero';

export default function TypographyDemoPage() {
  const { theme, toggleMode, setTheme } = useTheme();
  const navigate = useNavigate();

  interface Row {
    prop: ReactNode;
    type: ReactNode;
    default: ReactNode;
    description: ReactNode;
  }

  const columns: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Type', accessor: 'type' },
    { header: 'Default', accessor: 'default' },
    { header: 'Description', accessor: 'description' },
  ];

  const data: Row[] = [
    {
      prop: <code>variant</code>,
      type: (
        <code>
          &#39;h1&#39; | &#39;h2&#39; | &#39;h3&#39; | &#39;h4&#39; | &#39;h5&#39; | &#39;h6&#39; |
          &#39;body&#39; | &#39;subtitle&#39; | &#39;button&#39;
        </code>
      ),
      default: <code>&#39;body&#39;</code>,
      description: 'Typography style preset (semantic variant)',
    },
    {
      prop: <code>weight</code>,
      type: (
        <code>
          number | &#39;regular&#39; | &#39;medium&#39; | &#39;semibold&#39; | &#39;bold&#39;
        </code>
      ),
      default: <code>400</code>,
      description: 'Preferred way to set font weight; clamps 100..900',
    },
    {
      prop: <code>bold</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Deprecated in favor of weight (maps to 700)',
    },
    {
      prop: <code>italic</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Italic font style',
    },
    {
      prop: <code>tracking</code>,
      type: <code>number | &#39;tight&#39; | &#39;normal&#39; | &#39;loose&#39;</code>,
      default: <code>&#39;normal&#39;</code>,
      description: 'Letter-spacing; numbers treated as px',
    },
    {
      prop: <code>leading</code>,
      type: <code>number | &#39;tight&#39; | &#39;normal&#39; | &#39;loose&#39;</code>,
      default: <code>1.4</code>,
      description: 'Unitless line-height (1 for button)',
    },
    {
      prop: <code>optical</code>,
      type: <code>&#39;auto&#39; | number</code>,
      default: <code>&#39;auto&#39;</code>,
      description: 'Optical sizing: CSS font-optical-sizing or opsz axis',
    },
    {
      prop: <code>fluid</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Use clamp() from theme.typographyFluid when available',
    },
    {
      prop: <code>autoSize</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Use breakpoint size for variant (xs–xl)',
    },
    {
      prop: <code>scale</code>,
      type: <code>number</code>,
      default: <code>-</code>,
      description: 'Multiply the computed size (after fluid/autoSize)',
    },
    {
      prop: <code>fontSize</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Explicit CSS font-size override',
    },
    {
      prop: <code>family</code>,
      type: <code>&#39;heading&#39; | &#39;body&#39; | &#39;mono&#39; | &#39;button&#39;</code>,
      default: <code>-</code>,
      description: 'Select a theme font family',
    },
    {
      prop: <code>fontFamily</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Override font family (discouraged; prefer family)',
    },
    {
      prop: <code>color</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Text color; defaults to var(--valet-text-color)',
    },
    {
      prop: <code>centered</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Center-align and auto-margin element',
    },
    {
      prop: <code>noSelect</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Disable text selection (user-select: none)',
    },
    {
      prop: <code>whitespace</code>,
      type: <code>&#39;normal&#39; | &#39;pre&#39; | &#39;pre-wrap&#39; | &#39;pre-line&#39;</code>,
      default: <code>&#39;normal&#39;</code>,
      description: 'Controls line breaking and whitespace handling',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>-</code>,
      description: 'Apply style presets (define via definePreset())',
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero
          title='Typography'
          subtitle='Clear, responsive text for apps — with fluid sizes and variable font power.'
        />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Typography variant='h3'>Variants</Typography>
            <Panel sx={{ borderRadius: theme.radius(2) }}>
              <Typography variant='h1'>variant=&quot;h1&quot;</Typography>
              <Typography variant='h2'>variant=&quot;h2&quot;</Typography>
              <Typography variant='h3'>variant=&quot;h3&quot;</Typography>
              <Typography variant='h4'>variant=&quot;h4&quot;</Typography>
              <Typography variant='h5'>variant=&quot;h5&quot;</Typography>
              <Typography variant='h6'>variant=&quot;h6&quot;</Typography>
              <Typography variant='subtitle'>variant=&quot;subtitle&quot;</Typography>
              <Typography variant='body'>variant=&quot;body&quot;</Typography>
              <Typography variant='button'>variant=&quot;button&quot;</Typography>
            </Panel>

            <Divider pad={1} />
            <Typography variant='h3'>Styling props</Typography>
            <Panel
              fullWidth
              sx={{ borderRadius: theme.radius(2), background: theme.colors['backgroundAlt'] }}
            >
              <Typography variant='body'>(regular body text)</Typography>
              <Typography
                variant='body'
                bold
              >
                bold
              </Typography>
              <Typography
                variant='body'
                italic
              >
                italic
              </Typography>
              <Typography
                variant='body'
                bold
                italic
              >
                bold italic
              </Typography>
              <Typography
                variant='body'
                centered
              >
                centered text
              </Typography>
            </Panel>

            {/* 3–4. Sizing & Overrides ---------------------------------------- */}
            <Divider pad={1} />
            <Typography variant='h3'>Sizing &amp; Overrides</Typography>
            <Panel sx={{ borderRadius: theme.radius(2) }}>
              <Typography>
                Use <code>autoSize</code> to follow breakpoints and <code>scale</code> to nudge the
                computed size. When necessary, apply an explicit <code>fontSize</code> override —
                but prefer tokens and responsive sizing to keep type cohesive.
              </Typography>
              <Divider pad={1} />
              <Grid
                columns={3}
                gap={1}
              >
                <Panel compact>
                  <Typography variant='subtitle'>autoSize</Typography>
                  <Typography autoSize>Body autoSize — resizes by breakpoint</Typography>
                  <Typography
                    variant='h2'
                    autoSize
                  >
                    H2 autoSize — resizes by breakpoint
                  </Typography>
                </Panel>
                <Panel compact>
                  <Typography variant='subtitle'>scale (multiplier)</Typography>
                  <Typography scale={0.9}>scale=0.9 — slightly smaller</Typography>
                  <Typography scale={1.1}>scale=1.1 — slightly larger</Typography>
                  <Typography
                    autoSize
                    scale={1.25}
                  >
                    autoSize + scale=1.25
                  </Typography>
                </Panel>
                <Panel compact>
                  <Typography variant='subtitle'>Responsive compare</Typography>
                  <Typography autoSize>Resize the viewport to see sizes adapt.</Typography>
                  <Typography
                    autoSize
                    scale={1.1}
                  >
                    Scaled + responsive together
                  </Typography>
                </Panel>
              </Grid>
              <Divider pad={1} />
              <Grid
                columns={3}
                gap={1}
              >
                <Panel compact>
                  <Typography variant='subtitle'>Explicit fontSize (body)</Typography>
                  <Typography fontSize='0.875rem'>fontSize=&#39;0.875rem&#39;</Typography>
                  <Typography fontSize='1rem'>fontSize=&#39;1rem&#39;</Typography>
                  <Typography fontSize='1.25rem'>fontSize=&#39;1.25rem&#39;</Typography>
                </Panel>
                <Panel compact>
                  <Typography variant='subtitle'>Explicit fontSize (headings)</Typography>
                  <Typography
                    variant='h3'
                    fontSize='1.75rem'
                  >
                    H3 @ 1.75rem
                  </Typography>
                  <Typography
                    variant='h2'
                    fontSize='2.25rem'
                  >
                    H2 @ 2.25rem
                  </Typography>
                  <Typography
                    variant='h1'
                    fontSize='2.75rem'
                  >
                    H1 @ 2.75rem
                  </Typography>
                </Panel>
                <Panel
                  compact
                  background={theme.colors['tertiary']}
                >
                  <Typography variant='h4'>Tips</Typography>
                  <Typography>• Prefer autoSize + scale for rhythm.</Typography>
                  <Typography>• Use fontSize overrides sparingly.</Typography>
                  <Typography>• Keep hierarchy consistent across breakpoints.</Typography>
                </Panel>
              </Grid>
            </Panel>

            {/* Families & Font family ---------------------------------------- */}
            <>
              <Divider pad={1} />
              <Typography variant='h3'>Families &amp; Font family</Typography>
              <Panel sx={{ borderRadius: theme.radius(2) }}>
                <Typography>
                  Choose a <code>family</code> from the theme for cohesion, or set
                  <code> fontFamily</code> directly for exceptional cases. Configure families via
                  <code> useInitialTheme</code> for best performance and consistency.
                </Typography>
                <Divider pad={1} />
                <Grid
                  columns={3}
                  gap={1}
                >
                  <Panel compact>
                    <Typography variant='subtitle'>Theme families</Typography>
                    <Typography
                      family='heading'
                      fontSize='1.5rem'
                    >
                      family=&#39;heading&#39;, 1.5rem
                    </Typography>
                    <Typography
                      family='mono'
                      fontSize='1rem'
                    >
                      family=&#39;mono&#39;, 1rem
                    </Typography>
                    <Typography
                      family='button'
                      fontSize='1.1rem'
                    >
                      family=&#39;button&#39;, 1.1rem
                    </Typography>
                  </Panel>
                  <Panel compact>
                    <Typography variant='subtitle'>Direct fontFamily</Typography>
                    <Typography
                      fontFamily='Poppins'
                      fontSize='1.25rem'
                    >
                      fontFamily=&#39;Poppins&#39;, 1.25rem
                    </Typography>
                    <Typography
                      fontFamily='Georgia'
                      fontSize='1.1rem'
                    >
                      fontFamily=&#39;Georgia&#39;, 1.1rem
                    </Typography>
                    <Typography
                      fontFamily='JetBrains Mono'
                      fontSize='0.95rem'
                    >
                      fontFamily=&#39;JetBrains Mono&#39;, 0.95rem
                    </Typography>
                  </Panel>
                  <Panel
                    compact
                    background={theme.colors['backgroundAlt']}
                  >
                    <Typography variant='h4'>Notes</Typography>
                    <Typography>• Prefer family over raw fontFamily.</Typography>
                    <Typography>• Define families with useInitialTheme for loading.</Typography>
                    <Typography>• Pair families with size/weight consistently.</Typography>
                  </Panel>
                </Grid>
              </Panel>
            </>

            <Divider pad={1} />
            <Typography variant='h3'>Colour override &amp; adaptation</Typography>
            <Panel sx={{ borderRadius: theme.radius(2) }}>
              <Typography color='#e91e63'>color=&quot;#e91e63&quot;</Typography>
              <Panel background={theme.colors['primary']}>
                <Typography variant='h6'>Inside Panel inherits text colour</Typography>
              </Panel>
              <Button>
                <Typography
                  variant='button'
                  bold
                >
                  Typography inside Button
                </Typography>
              </Button>
            </Panel>

            <Divider pad={1} />
            <Typography variant='h3'>Theme coupling</Typography>
            <Panel
              sx={{ borderRadius: theme.radius(2), background: theme.colors['backgroundAlt'] }}
            >
              <Button
                variant='outlined'
                onClick={toggleMode}
              >
                Toggle light / dark mode
              </Button>
            </Panel>
            <Divider pad={1} />
            <Typography variant='h3'>Weight</Typography>
            <Panel sx={{ borderRadius: theme.radius(2) }}>
              <Typography>
                Weight is the thickness of strokes (100–900). Use it to communicate hierarchy and
                emphasis.
              </Typography>
              <Divider pad={1} />
              <Grid
                columns={3}
                gap={1}
              >
                <Panel
                  compact
                  background={theme.colors['tertiary']}
                >
                  <Typography variant='h4'>Tips</Typography>
                  <Typography>• Headlines: semibold/bold</Typography>
                  <Typography>• Labels: medium (500)</Typography>
                  <Typography>• Body: regular (400)</Typography>
                  <Typography>• Use bold sparingly</Typography>
                </Panel>
                <Panel compact>
                  <Typography variant='subtitle'>h4 weights</Typography>
                  <Typography
                    variant='h4'
                    weight={300}
                  >
                    Weight 300 – whisper
                  </Typography>
                  <Typography variant='h4'>Weight 400 – regular</Typography>
                  <Typography
                    variant='h4'
                    weight={500}
                  >
                    Weight 500 – medium
                  </Typography>
                  <Typography
                    variant='h4'
                    weight={600}
                  >
                    Weight 600 – semibold
                  </Typography>
                  <Typography
                    variant='h4'
                    weight={700}
                  >
                    Weight 700 – bold
                  </Typography>
                </Panel>
                <Panel compact>
                  <Typography variant='subtitle'>body weights</Typography>
                  <Typography
                    variant='body'
                    weight={300}
                  >
                    Paragraph tone (300)
                  </Typography>
                  <Typography variant='body'>Paragraph tone (400)</Typography>
                  <Typography
                    variant='body'
                    weight={500}
                  >
                    Paragraph tone (500)
                  </Typography>
                </Panel>
              </Grid>
            </Panel>

            <Divider pad={1} />
            <Typography variant='h3'>Tracking</Typography>
            <Panel sx={{ borderRadius: theme.radius(2) }}>
              <Typography>
                Tracking adjusts space between letters. Keep body text normal; tighten large
                headings a touch; loosen all‑caps slightly to reduce visual density.
              </Typography>
              <Divider pad={1} />
              <Grid
                columns={3}
                gap={1}
              >
                <Panel
                  compact
                  background={theme.colors['tertiary']}
                >
                  <Typography variant='h4'>Tips</Typography>
                  <Typography>• Body: normal</Typography>
                  <Typography>• Headings: slight tight</Typography>
                  <Typography>• ALL‑CAPS: slight loose</Typography>
                </Panel>
                <Panel compact>
                  <Typography variant='subtitle'>Named presets</Typography>
                  <Typography
                    variant='h4'
                    tracking='tight'
                  >
                    Heading — tracking=&#39;tight&#39;
                  </Typography>
                  <Typography
                    variant='body'
                    tracking='normal'
                  >
                    Body — tracking=&#39;normal&#39;
                  </Typography>
                  <Typography
                    variant='h5'
                    tracking='loose'
                  >
                    ALL CAPS — tracking=&#39;loose&#39;
                  </Typography>
                </Panel>
                <Panel compact>
                  <Typography variant='subtitle'>Numeric (px)</Typography>
                  <Typography
                    variant='h4'
                    tracking={-0.5}
                  >
                    Heading — tracking={-0.5}
                  </Typography>
                  <Typography
                    variant='h4'
                    tracking={0.5}
                  >
                    Heading — tracking={0.5}
                  </Typography>
                  <Typography
                    variant='body'
                    tracking={1}
                  >
                    Body — tracking={1}
                  </Typography>
                </Panel>
              </Grid>
            </Panel>

            <Divider pad={1} />
            <Typography variant='h3'>Leading (line‑height)</Typography>
            <Panel sx={{ borderRadius: theme.radius(2) }}>
              <Typography>
                Leading is the vertical space between lines. It sets the reading cadence: tighter
                for large headings, roomier for long paragraphs. Compare the multi‑line examples
                below.
              </Typography>
              <Divider pad={1} />
              <Grid
                columns={3}
                gap={1}
              >
                <Panel compact>
                  <Typography variant='subtitle'>leading=&#39;tight&#39; (≈ 1.2)</Typography>
                  <Typography
                    whitespace='pre-line'
                    leading='tight'
                  >
                    {
                      'Breath is close between lines\nA compact look for titles\nUse carefully for short blocks'
                    }
                  </Typography>
                </Panel>
                <Panel compact>
                  <Typography variant='subtitle'>leading=1.4 (default body)</Typography>
                  <Typography
                    whitespace='pre-line'
                    leading={1.4}
                  >
                    {
                      'Comfortable for most content\nBalances density and clarity\nIdeal for UI text blocks'
                    }
                  </Typography>
                </Panel>
                <Panel compact>
                  <Typography variant='subtitle'>leading=1.6 (roomy)</Typography>
                  <Typography
                    whitespace='pre-line'
                    leading={1.6}
                  >
                    {
                      'Great for long paragraphs\nEases scanning across lines\nReduces fatigue on dense pages'
                    }
                  </Typography>
                </Panel>
              </Grid>
              <Divider pad={1} />
              <Grid
                columns={2}
                gap={1}
              >
                <Panel compact>
                  <Typography variant='subtitle'>Headline + tight leading</Typography>
                  <Typography
                    variant='h2'
                    leading='tight'
                    tracking='tight'
                    whitespace='pre-line'
                  >
                    {'Craft clear hierarchy\nKeep titles crisp'}
                  </Typography>
                </Panel>
                <Panel compact>
                  <Typography variant='subtitle'>Paragraph + roomy leading</Typography>
                  <Typography
                    whitespace='pre-line'
                    leading={1.8}
                  >
                    {
                      'When blocks run several lines,\nadding extra leading helps\nwords breathe and stories read.'
                    }
                  </Typography>
                </Panel>
              </Grid>
            </Panel>
            <Divider pad={1} />
            <Typography variant='h3'>Optical sizing</Typography>
            <Panel sx={{ borderRadius: theme.radius(2) }}>
              <Typography>
                Some variable fonts support the <code>opsz</code> axis that subtly reshapes glyphs
                for small vs large sizes. <b>optical=&#39;auto&#39;</b> uses CSS{' '}
                <code>font-optical-sizing</code>
                to follow the current font size; numeric values set opsz explicitly.{' '}
                <b>optical=&#39;none&#39;</b>
                disables it.
              </Typography>
              <Divider pad={1} />
              <Grid
                columns={3}
                gap={1}
              >
                <Panel compact>
                  <Typography variant='subtitle'>Small text (body, 0.875rem)</Typography>
                  <Typography
                    fontSize='0.875rem'
                    optical='auto'
                  >
                    optical=&#39;auto&#39; — tuned
                  </Typography>
                  <Typography
                    fontSize='0.875rem'
                    optical='none'
                  >
                    optical=&#39;none&#39; — off
                  </Typography>
                  <Typography
                    fontSize='0.875rem'
                    optical={12}
                  >
                    optical={12} — fixed opsz
                  </Typography>
                </Panel>
                <Panel compact>
                  <Typography variant='subtitle'>Large text (h2)</Typography>
                  <Typography
                    variant='h2'
                    optical='auto'
                  >
                    optical=&#39;auto&#39; — tuned
                  </Typography>
                  <Typography
                    variant='h2'
                    optical='none'
                  >
                    optical=&#39;none&#39; — off
                  </Typography>
                  <Typography
                    variant='h2'
                    optical={28}
                  >
                    optical={28} — fixed opsz
                  </Typography>
                </Panel>
                <Panel
                  compact
                  background={theme.colors['tertiary']}
                >
                  <Typography variant='h4'>Notes</Typography>
                  <Typography>• Only fonts with opsz support respond.</Typography>
                  <Typography>
                    • Prefer optical=&#39;auto&#39; unless you need a fixed mood.
                  </Typography>
                  <Typography>• Pair with weight/tracking, not as a replacement.</Typography>
                </Panel>
              </Grid>
            </Panel>
            <Divider pad={1} />
            <Typography variant='h3'>Fluid sizes</Typography>
            <Panel sx={{ borderRadius: theme.radius(2) }}>
              <Typography>
                <b>Fluid sizing</b> makes type scale smoothly between a min and max as the viewport
                grows — like tying the font size to a gentle volume knob. We encode this with CSS{' '}
                <code>clamp()</code> via <code>typographyFluid</code> tokens. If tokens aren’t set,
                we fall back to the precise breakpoint sizes.
              </Typography>
              <Divider pad={1} />
              <Typography variant='subtitle'>Enable fluid tokens for this demo:</Typography>
              <Button
                onClick={() =>
                  setTheme({
                    typographyFluid: {
                      h1: { min: '1.75rem', max: '3rem', vwFrom: 360, vwTo: 1280 },
                      body: { min: '0.95rem', max: '1.1rem', vwFrom: 360, vwTo: 1280 },
                    },
                  })
                }
              >
                Apply fluid tokens
              </Button>
              <Divider pad={1} />
              <Grid
                columns={2}
                gap={1}
              >
                <Panel
                  compact
                  background={theme.colors['tertiary']}
                >
                  <Typography variant='h4'>Why fluid?</Typography>
                  <Typography>
                    Smoothly scales text between min and max for consistent vibes across devices.
                  </Typography>
                </Panel>
                <Panel compact>
                  <Typography
                    variant='h1'
                    fluid
                  >
                    h1 fluid (resize viewport)
                  </Typography>
                  <Typography
                    variant='body'
                    fluid
                  >
                    body fluid (resize viewport)
                  </Typography>
                </Panel>
              </Grid>
              <Divider pad={1} />
              <Typography variant='subtitle'>
                Fluid compiles to CSS clamp(); falls back to breakpoint sizes.
              </Typography>
            </Panel>

            <Divider pad={1} />
            <Typography variant='h3'>Code snippets</Typography>
            <Panel
              sx={{ borderRadius: theme.radius(2), background: theme.colors['backgroundAlt'] }}
            >
              <CodeBlock
                language='tsx'
                code={`// Fluid tokens in theme
setTheme({
  typographyFluid: {
    h1: { min: '1.75rem', max: '3rem', vwFrom: 360, vwTo: 1280 },
    body: { min: '0.95rem', max: '1.1rem', vwFrom: 360, vwTo: 1280 },
  },
});

// In component
<Typography variant="h1" fluid>Fluid headline</Typography>
<Typography variant="body" tracking="tight" leading={1.5} weight={450}>
  Tuned paragraph
</Typography>`}
              />
            </Panel>
          </Tabs.Panel>

          <Tabs.Tab label='Fonts & Performance' />
          <Tabs.Panel>
            <Panel
              sx={{ borderRadius: theme.radius(2), background: theme.colors['backgroundAlt'] }}
            >
              <Typography variant='h3'>First paint CSS</Typography>
              <Typography>Import fallback tokens once in your app entry:</Typography>
              <CodeBlock
                language='ts'
                code={`import '@archway/valet/styles.css';`}
              />
            </Panel>

            <Typography variant='h3'>useInitialTheme – variable fonts</Typography>
            <CodeBlock
              language='tsx'
              code={`useInitialTheme(
  {
    fonts: {
      heading: { family: 'Kumbh Sans', axes: { wght: { min: 300, max: 800 }, ital: true }, subsets: ['latin'] },
      body: { family: 'Inter', axes: { wght: [300,400,500,600,700], opsz: [10, 28] }, subsets: ['latin'] },
      mono: 'JetBrains Mono',
      button: 'Kumbh Sans',
    },
  },
  [
    { family: 'Inter', text: 'The quick brown fox 0123456789' }, // extras for speed
  ],
  { display: 'swap' }
);`}
            />

            <Typography variant='h3'>useGoogleFonts – extras</Typography>
            <CodeBlock
              language='tsx'
              code={`useGoogleFonts([
  'JetBrains Mono',
  { family: 'Inter', axes: { wght: { min: 300, max: 800 } }, subsets: ['latin'] },
]);`}
            />

            <Typography variant='h3'>Portals inherit Surface font vars</Typography>
            <Panel
              sx={{ borderRadius: theme.radius(2), background: theme.colors['backgroundAlt'] }}
            >
              <CodeBlock
                language='ts'
                code={`import { inheritSurfaceFontVars } from '@archway/valet';

const portalRoot = document.getElementById('portal')!;
inheritSurfaceFontVars(portalRoot);`}
              />
            </Panel>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <Panel sx={{ borderRadius: theme.radius(2) }}>
              <Typography variant='h3'>Prop reference</Typography>
              <Table
                data={data}
                columns={columns}
                constrainHeight={false}
              />
            </Panel>
          </Tabs.Panel>
        </Tabs>

        {/* Back nav --------------------------------------------------------- */}
        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>

        {/* Best Practices -------------------------------------------------- */}
        <Panel fullWidth>
          <Typography variant='h4'>Best Practices</Typography>
          <Typography>
            - Match semantics to variants. Heading variants render semantic <code>h1–h6</code>
            elements; keep heading levels hierarchical and avoid skipping from <code>h1</code> to
            <code> h4</code>, etc. Prefer a single <code>h1</code> per page view.
          </Typography>
          <Typography>
            - Use tokens, not pixels. Prefer <code>autoSize</code>, <code>scale</code>, and theme
            typography tokens over hard‑coded <code>fontSize</code> so type adapts to density and
            breakpoints.
          </Typography>
          <Typography>
            - Choose families from the theme. Use <code>family</code> (heading/body/mono/button) or
            define fonts via <code>useInitialTheme</code>; only use <code>fontFamily</code>{' '}
            overrides for special cases.
          </Typography>
          <Typography>
            - Maintain contrast. Set <code>color</code> via theme tokens or surrounding containers (
            <code>Panel</code>) to ensure accessible contrast in light/dark modes.
          </Typography>
          <Typography>
            - Don’t fake interactivity. Avoid attaching click handlers to Typography to mimic
            buttons/links; wrap it in <code>Button</code> or <code>&lt;a&gt;</code> for correct
            semantics and focus behaviour.
          </Typography>
          <Typography>
            - Whitespace control. Use <code>whitespace</code> and <code>noSelect</code> for code,
            labels, and UI text to keep wrapping and selection intentional.
          </Typography>
        </Panel>
      </Stack>
    </Surface>
  );
}
