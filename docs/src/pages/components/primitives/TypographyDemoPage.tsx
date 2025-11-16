// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/primitives/TypographyDemoPage.tsx  | valet-docs
// Comprehensive Typography 1.0 examples: weights, tracking, leading,
// optical sizing, fluid sizes, loader/axes, and best practices.
// Now uses ComponentMetaPage (5-tab template).
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import TypographyMeta from '../../../../../src/components/primitives/Typography.meta.json';
import type { Theme } from '@archway/valet';
import {
  Stack,
  Typography,
  Panel,
  Button,
  useTheme,
  CodeBlock,
  Grid,
  Divider,
  Select,
  Iterator,
  Switch,
} from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';

export default function TypographyDemoPage() {
  const { theme, setTheme } = useTheme();

  // Playground controls
  const [variant, setVariant] = useState<
    'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle' | 'body' | 'button'
  >('body');
  const [autoSize, setAutoSize] = useState(false);
  const [scale, setScale] = useState<number>(1);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [centered, setCentered] = useState(false);

  const usageContent = (
    <>
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
          (letter-spacing) per family. These apply when a variant token is not set and no explicit
          prop is provided. Precedence: props ⟶ variant tokens ⟶ family defaults ⟶ component
          defaults.
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
              Body paragraph with tweaked line-height improves readability at comfortable density.
            </Typography>
          </Panel>
          <Panel
            compact
            color={theme.colors['backgroundAlt']}
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
        color={theme.colors['backgroundAlt']}
        sx={{ borderRadius: theme.radius(2) }}
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
          computed size. When necessary, apply an explicit <code>fontSize</code> override — but
          prefer tokens and responsive sizing to keep type cohesive.
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
            <Typography fontSize='0.875rem'>
              <code>fontSize=&apos;0.875rem&apos;</code>
            </Typography>
            <Typography fontSize='1rem'>
              <code>fontSize=&apos;1rem&apos;</code>
            </Typography>
            <Typography fontSize='1.25rem'>
              <code>fontSize=&apos;1.25rem&apos;</code>
            </Typography>
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
            color={theme.colors['tertiary']}
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
          configured via <code>useInitialTheme</code> so weights, axes, and subsets load once and
          stay consistent across your app. Built‑in families:
          <code> heading</code>, <code>body</code>, <code>mono</code>, and <code>button</code>.
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
            color={theme.colors['tertiary']}
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
            <Typography variant='subtitle'>Button family usage</Typography>
            <Button>
              <Typography
                variant='button'
                family='button'
              >
                CTA label
              </Typography>
            </Button>
            <Typography>
              Keep labels consistent by using the <code>button</code> family.
            </Typography>
          </Panel>
          <Panel compact>
            <Typography variant='subtitle'>Mono for code</Typography>
            <Typography
              family='mono'
              whitespace='pre'
            >
              {`const x = 42;\nconsole.log(x);`}
            </Typography>
          </Panel>
        </Grid>
      </Panel>

      {/* Weights -------------------------------------------------------- */}
      <Divider pad={1} />
      <Typography variant='h3'>Weights</Typography>
      <Panel sx={{ borderRadius: theme.radius(2) }}>
        <Grid
          columns={3}
          gap={1}
        >
          <Panel compact>
            <Typography variant='subtitle'>Aliases & numbers</Typography>
            <Typography weight={300}>weight=300</Typography>
            <Typography weight={400}>weight=400</Typography>
            <Typography weight={500}>weight=500</Typography>
            <Typography weight={600}>weight=600</Typography>
            <Typography weight={700}>weight=700</Typography>
          </Panel>
          <Panel compact>
            <Typography variant='subtitle'>Variants with weight</Typography>
            <Typography
              variant='h3'
              weight={500}
            >
              Heading 3 @500
            </Typography>
            <Typography
              variant='h4'
              weight={600}
            >
              Heading 4 @600
            </Typography>
            <Typography
              variant='subtitle'
              weight={700}
            >
              Subtitle @700
            </Typography>
          </Panel>
          <Panel
            compact
            color={theme.colors['tertiary']}
          >
            <Typography variant='h4'>Tips</Typography>
            <Typography>• Keep weight steps limited for rhythm.</Typography>
            <Typography>• Prefer tokenized weights where possible.</Typography>
          </Panel>
        </Grid>
      </Panel>

      {/* Tracking & Leading -------------------------------------------- */}
      <Divider pad={1} />
      <Typography variant='h3'>Tracking &amp; Leading</Typography>
      <Panel sx={{ borderRadius: theme.radius(2) }}>
        <Grid
          columns={3}
          gap={1}
        >
          <Panel compact>
            <Typography variant='subtitle'>Tracking presets</Typography>
            <Typography tracking='tight'>
              <code>tracking=&apos;tight&apos;</code>
            </Typography>
            <Typography tracking='normal'>
              <code>tracking=&apos;normal&apos;</code>
            </Typography>
            <Typography tracking='loose'>
              <code>tracking=&apos;loose&apos;</code>
            </Typography>
          </Panel>
          <Panel compact>
            <Typography variant='subtitle'>Leading presets</Typography>
            <Typography leading='tight'>
              <code>leading=&apos;tight&apos;</code>
            </Typography>
            <Typography leading='normal'>
              <code>leading=&apos;normal&apos;</code>
            </Typography>
            <Typography leading='loose'>
              <code>leading=&apos;loose&apos;</code>
            </Typography>
          </Panel>
          <Panel compact>
            <Typography variant='subtitle'>Custom values</Typography>
            <Typography tracking={-0.02}>tracking={-0.02}</Typography>
            <Typography leading={1.5}>leading={1.5}</Typography>
          </Panel>
        </Grid>
      </Panel>

      {/* Optical sizing ------------------------------------------------- */}
      <Divider pad={1} />
      <Typography variant='h3'>Optical sizing</Typography>
      <Panel sx={{ borderRadius: theme.radius(2) }}>
        <Grid
          columns={3}
          gap={1}
        >
          <Panel compact>
            <Typography variant='subtitle'>auto</Typography>
            <Typography optical='auto'>
              <code>optical=&apos;auto&apos;</code>
            </Typography>
          </Panel>
          <Panel compact>
            <Typography variant='subtitle'>none</Typography>
            <Typography optical='none'>
              <code>optical=&apos;none&apos;</code>
            </Typography>
          </Panel>
          <Panel compact>
            <Typography variant='subtitle'>explicit number</Typography>
            <Typography optical={14}>optical={14}</Typography>
          </Panel>
        </Grid>
      </Panel>

      {/* Fluid typography ---------------------------------------------- */}
      <Divider pad={1} />
      <Typography variant='h3'>Fluid typography</Typography>
      <Panel sx={{ borderRadius: theme.radius(2) }}>
        <Grid
          columns={2}
          gap={1}
        >
          <Panel
            compact
            color={theme.colors['tertiary']}
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
      <Panel sx={{ borderRadius: theme.radius(2), background: theme.colors['backgroundAlt'] }}>
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
    </>
  );

  const playgroundContent = (
    <Stack gap={1}>
      <Stack
        direction='row'
        wrap={false}
        gap={1}
      >
        <Stack gap={0.25}>
          <Typography variant='subtitle'>variant</Typography>
          <Select
            placeholder='variant'
            value={variant}
            onValueChange={(v) => setVariant(v as typeof variant)}
            sx={{ width: 180 }}
          >
            <Select.Option value='body'>body</Select.Option>
            <Select.Option value='subtitle'>subtitle</Select.Option>
            <Select.Option value='button'>button</Select.Option>
            <Select.Option value='h1'>h1</Select.Option>
            <Select.Option value='h2'>h2</Select.Option>
            <Select.Option value='h3'>h3</Select.Option>
            <Select.Option value='h4'>h4</Select.Option>
            <Select.Option value='h5'>h5</Select.Option>
            <Select.Option value='h6'>h6</Select.Option>
          </Select>
        </Stack>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>scale</Typography>
          <Iterator
            width={160}
            min={0.8}
            max={1.2}
            step={0.05}
            value={scale}
            onValueChange={(n) => setScale(n)}
            aria-label='Scale'
          />
        </Stack>
        <Stack
          direction='row'
          gap={1}
          sx={{ alignItems: 'center' }}
        >
          <Typography variant='subtitle'>autoSize</Typography>
          <Switch
            checked={autoSize}
            onValueChange={(v) => setAutoSize(!!v)}
            aria-label='autoSize'
          />
        </Stack>
        <Stack
          direction='row'
          gap={1}
          sx={{ alignItems: 'center' }}
        >
          <Typography variant='subtitle'>bold</Typography>
          <Switch
            checked={bold}
            onValueChange={(v) => setBold(!!v)}
            aria-label='bold'
          />
        </Stack>
        <Stack
          direction='row'
          gap={1}
          sx={{ alignItems: 'center' }}
        >
          <Typography variant='subtitle'>italic</Typography>
          <Switch
            checked={italic}
            onValueChange={(v) => setItalic(!!v)}
            aria-label='italic'
          />
        </Stack>
        <Stack
          direction='row'
          gap={1}
          sx={{ alignItems: 'center' }}
        >
          <Typography variant='subtitle'>centered</Typography>
          <Switch
            checked={centered}
            onValueChange={(v) => setCentered(!!v)}
            aria-label='centered'
          />
        </Stack>
      </Stack>
      <Panel fullWidth>
        <Typography
          variant={variant}
          autoSize={autoSize}
          scale={scale}
          bold={bold}
          italic={italic}
          centered={centered}
        >
          Preview text — adjust controls above.
        </Typography>
      </Panel>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Typography'
      subtitle='Clear, responsive text for apps — with fluid sizes and variable font power.'
      slug='components/primitives/typography'
      meta={TypographyMeta}
      usage={<Stack>{usageContent}</Stack>}
      playground={playgroundContent}
    />
  );
}
