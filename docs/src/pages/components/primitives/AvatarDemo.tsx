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
} from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import AvatarMeta from '../../../../../src/components/primitives/Avatar.meta.json';
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

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Avatar' />

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
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection slug='components/primitives/avatar' />
          </Tabs.Panel>
        </Tabs>

        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>

        <CuratedExamples examples={getExamples(AvatarMeta)} />
        <BestPractices items={getBestPractices(AvatarMeta)} />
      </Stack>
    </Surface>
  );
}
