// ─────────────────────────────────────────────────────────────
// src/pages/components/primitives/TypographyDemoPage.tsx  | valet-docs
// Comprehensive Typography 1.0 examples: weights, tracking, leading,
// optical sizing, fluid sizes, loader/axes, and best practices.
// ─────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import BestPractices from '../../../components/BestPractices';
import { getBestPractices } from '../../../utils/sidecar';
import TypographyMeta from '../../../../../src/components/primitives/Typography.meta.json';
import type { Theme } from '@archway/valet';
import {
  Surface,
  Stack,
  Typography,
  Panel,
  Button,
  useTheme,
  CodeBlock,
  Grid,
  Divider,
  Tabs,
} from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import PageHero from '../../../components/PageHero';

export default function TypographyDemoPage() {
  const { theme, toggleMode, setTheme } = useTheme();
  const navigate = useNavigate();

  // MCP-driven reference tables used; manual data removed

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
            <Typography variant='h3'>Family Defaults</Typography>
            <Panel sx={{ borderRadius: theme.radius(2) }}>
              <Typography>
                You can define default <code>leading</code> (line-height) and <code>tracking</code>
                (letter-spacing) per family. These apply when a variant token is not set and no
                explicit prop is provided. Precedence: props ⟶ variant tokens ⟶ family defaults ⟶
                component defaults.
              </Typography>
              <Divider pad={1} />
              <Grid
                columns={2}
                gap={1}
              >
                <Panel compact>
                  <Typography variant='subtitle'>Runtime tweak</Typography>
                  <Button
                    onClick={() =>
                      setTheme({
                        typographyFamilies: {
                          heading: { letterSpacing: { h1: '-0.025em' } },
                          body: { lineHeight: { body: 1.55 } },
                        },
                      } as Partial<Theme>)
                    }
                  >
                    Apply family defaults
                  </Button>
                  <Divider pad={1} />
                  <Typography variant='h1'>Adjusted H1 spacing</Typography>
                  <Typography>
                    Body paragraph with tweaked line-height improves readability at comfortable
                    density.
                  </Typography>
                </Panel>
                <Panel
                  compact
                  background={theme.colors['backgroundAlt']}
                >
                  <Typography variant='h4'>Init via code</Typography>
                  <CodeBlock
                    language='tsx'
                    code={`useInitialTheme({
  typographyFamilies: {
    heading: {
      lineHeight: { h1: 1.15, h2: 1.15, h3: 1.15, h4: 1.2, h5: 1.2, h6: 1.2 },
      letterSpacing: { h1: '-0.02em', h2: '-0.015em', h3: '-0.01em' },
    },
    body: { lineHeight: { body: 1.5, subtitle: 1.35 }, letterSpacing: { body: '0em' } },
    mono: { lineHeight: { body: 1.45 }, letterSpacing: { body: '0em' } },
    button: { lineHeight: { button: 1 }, letterSpacing: { button: '0.02em' } },
  },
});`}
                  />
                </Panel>
              </Grid>
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

            {/* Theme Families ------------------------------------------------ */}
            <Divider pad={1} />
            <Typography variant='h3'>Theme Families</Typography>
            <Panel sx={{ borderRadius: theme.radius(2) }}>
              <Typography>
                The <code>family</code> prop selects a named, theme‑managed font stack. These are
                configured via <code>useInitialTheme</code> so weights, axes, and subsets load once
                and stay consistent across your app. Built‑in families:
                <code> heading</code>, <code>body</code>, <code>mono</code>, and <code>button</code>
                .
              </Typography>
              <Divider pad={1} />
              <Grid
                columns={3}
                gap={1}
              >
                <Panel compact>
                  <Typography variant='subtitle'>All families at a glance</Typography>
                  <Typography
                    family='heading'
                    fontSize='1.5rem'
                  >
                    heading — display/headlines
                  </Typography>
                  <Typography
                    family='body'
                    fontSize='1.125rem'
                  >
                    body — paragraphs/UI copy
                  </Typography>
                  <Typography
                    family='mono'
                    fontSize='1rem'
                  >
                    mono — code/nums/tables
                  </Typography>
                  <Typography
                    family='button'
                    fontSize='1.1rem'
                  >
                    button — labels/controls
                  </Typography>
                </Panel>
                <Panel compact>
                  <Typography variant='subtitle'>Recommended pairings</Typography>
                  <Typography
                    variant='h2'
                    family='heading'
                  >
                    Heading set in heading family
                  </Typography>
                  <Typography
                    variant='body'
                    family='body'
                  >
                    Body copy set in body family
                  </Typography>
                  <Typography
                    variant='body'
                    family='mono'
                  >
                    Inline code — mono family
                  </Typography>
                  <Button>
                    <Typography
                      variant='button'
                      family='button'
                    >
                      Button label
                    </Typography>
                  </Button>
                </Panel>
                <Panel
                  compact
                  background={theme.colors['tertiary']}
                >
                  <Typography variant='h4'>Why use family?</Typography>
                  <Typography>• Single source of truth for fonts.</Typography>
                  <Typography>• Axes/weights preloaded for performance.</Typography>
                  <Typography>• Consistent typography across components.</Typography>
                </Panel>
              </Grid>
              <Divider pad={1} />
              <Grid
                columns={2}
                gap={1}
              >
                <Panel compact>
                  <Typography variant='subtitle'>Variants with families</Typography>
                  <Typography
                    variant='h3'
                    family='heading'
                    tracking='tight'
                  >
                    Tight headline
                  </Typography>
                  <Typography
                    variant='subtitle'
                    family='body'
                    weight='medium'
                  >
                    Supportive subtitle
                  </Typography>
                  <Typography
                    variant='body'
                    family='body'
                    leading={1.6}
                  >
                    Body text uses the body family by default for readability across densities.
                  </Typography>
                  <Typography
                    variant='body'
                    family='mono'
                  >
                    const x = 42;
                  </Typography>
                </Panel>
                <Panel compact>
                  <Typography variant='subtitle'>Weights per family</Typography>
                  <Typography
                    family='heading'
                    weight={600}
                  >
                    Heading 600
                  </Typography>
                  <Typography
                    family='body'
                    weight={400}
                  >
                    Body 400
                  </Typography>
                  <Typography
                    family='mono'
                    weight={500}
                  >
                    Mono 500
                  </Typography>
                  <Typography
                    family='button'
                    weight='semibold'
                  >
                    Button semibold
                  </Typography>
                </Panel>
              </Grid>
            </Panel>

            {/* Raw Font Family (override) ---------------------------------- */}
            <Divider pad={1} />
            <Typography variant='h3'>Raw Font Family (override)</Typography>
            <Panel sx={{ borderRadius: theme.radius(2) }}>
              <Typography>
                The <code>fontFamily</code> prop sets a CSS font stack directly. Use this for
                exceptional cases or experiments. Unlike <code>family</code>, the theme does not
                manage loading, axes, or subsets here — ensure fonts are loaded (e.g.
                <code> useGoogleFonts</code>) to avoid flashes and mismatches.
              </Typography>
              <Divider pad={1} />
              <Grid
                columns={3}
                gap={1}
              >
                <Panel compact>
                  <Typography variant='subtitle'>Common overrides</Typography>
                  <Typography
                    fontFamily='Poppins'
                    fontSize='1.25rem'
                    weight={600}
                  >
                    Poppins 600
                  </Typography>
                  <Typography
                    fontFamily='Georgia'
                    fontSize='1.1rem'
                    italic
                  >
                    Georgia italic
                  </Typography>
                  <Typography
                    fontFamily='JetBrains Mono'
                    fontSize='0.95rem'
                  >
                    JetBrains Mono
                  </Typography>
                </Panel>
                <Panel compact>
                  <Typography variant='subtitle'>System stacks</Typography>
                  <Typography fontFamily='system-ui, -apple-system, Segoe UI, Roboto'>
                    system-ui stack
                  </Typography>
                  <Typography fontFamily='ui-serif, Georgia, Cambria, Times New Roman, Times'>
                    serif stack
                  </Typography>
                  <Typography fontFamily='ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas'>
                    monospace stack
                  </Typography>
                </Panel>
                <Panel
                  compact
                  background={theme.colors['backgroundAlt']}
                >
                  <Typography variant='h4'>Notes</Typography>
                  <Typography>
                    • Prefer <code>family</code> for cohesive theming.
                  </Typography>
                  <Typography>
                    • Use <code>useGoogleFonts</code> to load overrides.
                  </Typography>
                  <Typography>• Overrides bypass theme weight/axis tuning.</Typography>
                </Panel>
              </Grid>
            </Panel>

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
            <ReferenceSection slug='components/primitives/typography' />
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

        <BestPractices items={getBestPractices(TypographyMeta)} />
      </Stack>
    </Surface>
  );
}
