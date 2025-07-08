// src/pages/AvatarDemo.tsx
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
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface EmailForm {
  email: string;
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
      <Stack spacing={1} preset="showcaseStack">
        <Typography variant="h2" bold>
          Avatar Showcase
        </Typography>
        <Typography variant="subtitle">
          Gravatar wrapper with custom photo support
        </Typography>

        <Typography variant="h3">1. Try your Gravatar</Typography>
        <FormControl
          useStore={useEmailForm}
          onSubmitValues={(vals) => setEmail(vals.email)}
          style={{ display: 'flex', flexDirection: 'row', gap: theme.spacing(1) }}
        >
          <TextField name="email" type="email" placeholder="you@example.com" />
          <Button type="submit">Show</Button>
        </FormControl>
        <Avatar email={email} size={64} />
        <Typography variant="h3">2. Default example</Typography>
        <Avatar email="support@gravatar.com" size={64} />
        <Typography variant="h3">3. Custom src</Typography>
        <Avatar
          src="https://avatars.githubusercontent.com/u/9919?s=200&v=4"
          size={64}
          alt="GitHub"
        />

        <Button
          size="lg"
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
