// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/primitives/AvatarDemo.tsx  | valet-docs
// Showcase of Avatar component using the reusable ComponentMetaPage (5 tabs)
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Stack,
  Typography,
  Avatar,
  Button,
  TextField,
  FormControl,
  createFormStore,
  Select,
  Panel,
} from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import AvatarMeta from '../../../../../src/components/primitives/Avatar.meta.json';

interface EmailForm {
  email: string;
  [key: string]: unknown;
}

const useEmailForm = createFormStore<EmailForm>({
  email: '',
});

export default function AvatarDemoPage() {
  const [email, setEmail] = useState('support@gravatar.com');
  const [pgSize, setPgSize] = useState<'xs' | 's' | 'm' | 'l' | 'xl'>('m');
  const [pgVariant, setPgVariant] = useState<'plain' | 'outline'>('plain');

  const usageContent = (
    <Stack>
      <Typography variant='subtitle'>Gravatar wrapper with custom photo support</Typography>

      <Typography variant='h3'>1. Try your Gravatar</Typography>
      <FormControl
        useStore={useEmailForm}
        onSubmitValues={(vals) => setEmail(vals.email as string)}
      >
        <Stack direction='row'>
          <Avatar email={email} />
          <TextField
            name='email'
            type='email'
            placeholder='you@example.com'
          />
          <Button type='submit'>Show</Button>
        </Stack>
      </FormControl>

      <Typography variant='h3'>2. Default example</Typography>
      <Avatar
        email='support@gravatar.com'
        size='l'
      />

      <Typography variant='h3'>3. Custom src</Typography>
      <Avatar
        src='https://avatars.githubusercontent.com/u/9919?s=200&v=4'
        size='l'
        alt='GitHub'
      />

      <Typography variant='h3'>4. Sizes</Typography>
      <Stack direction='row'>
        {(['xl', 'l', 'm', 's', 'xs'] as const).map((s) => (
          <Stack
            key={s}
            gap={0.5}
            sx={{ alignItems: 'center' }}
          >
            <Avatar
              email='support@gravatar.com'
              size={s}
            />
            <Typography variant='body'>{s}</Typography>
          </Stack>
        ))}
      </Stack>

      <Typography variant='h3'>5. Outline</Typography>
      <Avatar
        email='support@gravatar.com'
        size='l'
        variant='outline'
      />
    </Stack>
  );

  const playgroundContent = (
    <Stack gap={1}>
      <Panel fullWidth>
        <Typography variant='subtitle'>Playground</Typography>
        <Stack
          direction='row'
          gap={1}
          sx={{ alignItems: 'center' }}
        >
          <Select
            placeholder='size'
            value={pgSize}
            onChange={(v) => setPgSize(v as typeof pgSize)}
            sx={{ width: 140 }}
          >
            <Select.Option value='xs'>xs</Select.Option>
            <Select.Option value='s'>s</Select.Option>
            <Select.Option value='m'>m</Select.Option>
            <Select.Option value='l'>l</Select.Option>
            <Select.Option value='xl'>xl</Select.Option>
          </Select>
          <Select
            placeholder='variant'
            value={pgVariant}
            onChange={(v) => setPgVariant(v as typeof pgVariant)}
            sx={{ width: 160 }}
          >
            <Select.Option value='plain'>plain</Select.Option>
            <Select.Option value='outline'>outline</Select.Option>
          </Select>
          <Typography variant='body'>Email: {email}</Typography>
        </Stack>
      </Panel>
      <Stack
        gap={0.5}
        sx={{ alignItems: 'center' }}
      >
        <Avatar
          email={email}
          size={pgSize}
          variant={pgVariant}
        />
        <Typography variant='subtitle'>Preview</Typography>
      </Stack>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Avatar'
      subtitle='Compact identity image via Gravatar or custom src.'
      slug='components/primitives/avatar'
      meta={AvatarMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
  );
}
