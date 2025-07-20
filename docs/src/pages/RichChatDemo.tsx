// ─────────────────────────────────────────────────────────────────────────────
// src/pages/RichChatDemo.tsx | valet
// Showcase for <RichChat /> component with local logic
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  RichChat,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';
import type { RichMessage } from '@archway/valet';
import monkey from '../assets/monkey.jpg';
import present from '../assets/present.jpg';

export default function RichChatDemoPage() {
  const navigate = useNavigate();
  const { theme, toggleMode } = useTheme();
  const [messages, setMessages] = useState<RichMessage[]>([
    {
      role: 'assistant',
      content: (
        <Stack>
          <Typography>Do you like valet?</Typography>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => handleAnswer('Yes')}>Yes</Button>
            <Button onClick={() => handleAnswer('No')}>No</Button>
          </Stack>
        </Stack>
      ),
      animate: true,
    },
  ]);

  const handleAnswer = (reply: string) => {
    setMessages(prev => [
      ...prev,
      { role: 'user', content: reply, animate: true },
      {
        role: 'assistant',
        content:
          reply === 'Yes'
            ? 'Great! Thanks for checking out valet.'
            : "That's okay, maybe next time!",
        animate: true,
      },
    ]);
  };

  const handleSend = (m: RichMessage) => {
    setMessages(prev => [...prev, m]);
  };

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>
          RichChat Demo
        </Typography>
        <Typography variant="subtitle">Local chat with embeddable components</Typography>

        <RichChat
          messages={messages}
          onSend={handleSend}
          constrainHeight
          userAvatar={present}
          systemAvatar={monkey}
        />

        <Button variant="outlined" onClick={toggleMode}>
          Toggle light / dark mode
        </Button>

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
