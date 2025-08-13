// ─────────────────────────────────────────────────────────────
// src/pages/AvatarDemo.tsx | valet-docs
// Showcase of Avatar component
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Typography,
  Avatar,
  Button,
  TextField,
  FormControl,
  createFormStore,
  useTheme,
  Tabs,
  Table,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';
import { useState } from 'react';

interface EmailForm {
  email: string;
  [key: string]: unknown;
}

const useEmailForm = createFormStore<EmailForm>({
  email: '',
});

export default function AvatarDemoPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('support@gravatar.com');

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
      prop: <code>src</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Image URL override',
    },
    {
      prop: <code>email</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Email used for Gravatar lookup',
    },
    {
      prop: <code>size</code>,
      type: (
        <code>&apos;xs&apos; | &apos;s&apos; | &apos;m&apos; | &apos;l&apos; | &apos;xl&apos;</code>
      ),
      default: <code>&apos;m&apos;</code>,
      description: 'Relative size token',
    },
    {
      prop: <code>variant</code>,
      type: <code>&apos;plain&apos; | &apos;outline&apos;</code>,
      default: <code>&apos;plain&apos;</code>,
      description: 'Visual style variant',
    },
    {
      prop: <code>gravatarDefault</code>,
      type: <code>string</code>,
      default: <code>&apos;identicon&apos;</code>,
      description: 'Fallback style when no avatar exists',
    },
    {
      prop: <code>alt</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Image alt text',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>-</code>,
      description: 'Apply style presets',
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant='h2'>Avatar</Typography>

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
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

            {/* 4. Sizes --------------------------------------------------------- */}
            <Typography variant='h3'>4. Sizes</Typography>
            <Stack direction='row'>
              {(['xl', 'l', 'm', 's', 'xs'] as const).map((s) => (
                <Stack
                  key={s}
                  gap={0.5}
                  style={{ alignItems: 'center' }}
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
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <Typography variant='h3'>Prop reference</Typography>
            <Table
              data={data}
              columns={columns}
              constrainHeight={false}
            />
          </Tabs.Panel>
        </Tabs>

        <Button
          size='lg'
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
