// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/field/ButtonDemoPage.tsx  | valet-docs
// Migrated to ComponentMetaPage – Usage, Best Practices, Reference
// ─────────────────────────────────────────────────────────────
import { Stack, Box, Typography, Button, Icon, useTheme } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import ButtonMeta from '../../../../../src/components/fields/Button.meta.json';

/*─────────────────────────────────────────────────────────────*/
export default function ButtonDemoPage() {
  const { theme, toggleMode } = useTheme();
  const usageContent = (
    <Stack>
      <Typography variant='subtitle'>Variants, sizes, palettes &amp; more</Typography>

      {/* 1 ▸ Variants */}
      <Typography variant='h3'>1. Variants</Typography>
      <Stack direction='row'>
        <Button>contained (default)</Button>
        <Button variant='outlined'>outlined</Button>
      </Stack>

      {/* 2 ▸ Sizes */}
      <Typography variant='h3'>2. Sizes</Typography>
      <Stack direction='row'>
        <Button size='xs'>xs</Button>
        <Button size='sm'>sm</Button>
        <Button>md (default)</Button>
        <Button size='lg'>lg</Button>
        <Button size='xl'>xl</Button>
      </Stack>
      <Stack direction='row'>
        <Button size='2rem'>2rem</Button>
        <Button size='32px'>32px</Button>
      </Stack>

      {/* 3 ▸ Full-width */}
      <Typography variant='h3'>3. fullWidth</Typography>
      <Box sx={{ maxWidth: 360 }}>
        <Button fullWidth>Stretch to parent</Button>
      </Box>

      {/* 4 ▸ centered */}
      <Typography variant='h3'>4. centered</Typography>
      <Stack
        pad={theme.spacing(1)}
        sx={{
          borderRadius: theme.radius(1),
          border: `1px dashed ${theme.colors['divider']}`,
          background: theme.colors['backgroundAlt'],
        }}
      >
        <Button>Default alignment</Button>
        <Button centered>Centered CTA</Button>
      </Stack>

      {/* 5 ▸ Palette tokens */}
      <Typography variant='h3'>5. Palette tokens</Typography>
      <Stack direction='row'>
        <Button color='primary'>primary</Button>
        <Button color='secondary'>secondary</Button>
        <Button color='tertiary'>tertiary</Button>
      </Stack>

      {/* 6 ▸ Custom colours */}
      <Typography variant='h3'>6. Custom backgrounds</Typography>
      <Stack direction='row'>
        <Button color='#9C27B0'>#9C27B0</Button>
        <Button color='#00BFA5'>#00BFA5</Button>
      </Stack>

      {/* 7 ▸ Icons & text */}
      <Typography variant='h3'>7. Icons &amp; text</Typography>
      <Button>
        <Icon
          icon='carbon:chat'
          sx={{ marginRight: theme.spacing(1) }}
        />
        With icon
      </Button>

      {/* 8 ▸ Outlined overrides */}
      <Typography variant='h3'>8. Outlined colour override</Typography>
      <Stack direction='row'>
        <Button variant='outlined'>default outline</Button>
        <Button
          variant='outlined'
          color='secondary'
        >
          secondary outline
        </Button>
        <Button
          variant='outlined'
          color='tertiary'
        >
          tertiary outline
        </Button>
        <Button
          variant='outlined'
          color='#e91e63'
        >
          <Typography>#e91e63 outline</Typography>
        </Button>
      </Stack>

      {/* 9 ▸ Disabled */}
      <Typography variant='h3'>9. Disabled</Typography>
      <Stack direction='row'>
        <Button disabled>contained</Button>
        <Button
          variant='outlined'
          disabled
        >
          outlined
        </Button>
        <Button
          color='secondary'
          disabled
        >
          palette
        </Button>
      </Stack>

      {/* 10 ▸ Custom label variants */}
      <Typography variant='h3'>10. Custom label variants</Typography>
      <Stack direction='row'>
        <Button>
          <Typography variant='h4'>h4 in button</Typography>
        </Button>
        <Button>
          <Typography variant='subtitle'>subtitle text</Typography>
        </Button>
        <Button variant='outlined'>
          <Typography variant='h5'>h5 outlined</Typography>
        </Button>
      </Stack>

      {/* 11 ▸ Theme toggle (LAST) */}
      <Typography variant='h3'>11. Theme toggle</Typography>
      <Button
        variant='outlined'
        onClick={toggleMode}
      >
        Toggle light / dark mode
      </Button>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Button'
      subtitle='Variants, sizes, palettes & more'
      slug='components/fields/button'
      meta={ButtonMeta}
      usage={usageContent}
    />
  );
}
