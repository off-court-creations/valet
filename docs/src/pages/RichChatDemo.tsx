// ─────────────────────────────────────────────────────────────────────────────
// src/pages/RichChatDemo.tsx | valet
// Demo for <RichChat /> component
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
import present from '../assets/present.jpg';
import monkey from '../assets/monkey.jpg';

export default function RichChatDemoPage() {
  const navigate = useNavigate();
  const { theme, toggleMode } = useTheme();
  const [messages, setMessages] = useState<RichMessage[]>([
    {
      role: 'assistant',
      content: (
        <Stack>
          <Typography>Do you like valet?</Typography>
          <Stack direction="row">
            <Button onClick={() => handleChoice('Yes')}>Yes</Button>
            <Button onClick={() => handleChoice('No')}>No</Button>
          </Stack>
        </Stack>
      ),
    },
  ]);

  function handleChoice(ans: string) {
    setMessages(prev => [
      ...prev,
      { role: 'user', content: ans, animate: true },
      {
        role: 'assistant',
        content: `You answered ${ans.toLowerCase()}.`,
        animate: true,
      },
    ]);
  }

  const handleSend = (m: RichMessage) => {
    const text = String(m.content).toLowerCase();
    const num = parseInt(text);
    if (!isNaN(num)) {
      setMessages(prev => [
        ...prev,
        m,
        {
          role: 'assistant',
          content: `Cool, ${num} dog${num === 1 ? '' : 's'}!`,
          animate: true,
        },
      ]);
    } else {
      setMessages(prev => [...prev, m]);
    }
  };

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>
          RichChat Showcase
        </Typography>
        <Typography variant="subtitle">Demonstrates embedded components</Typography>

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

