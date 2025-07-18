// ─────────────────────────────────────────────────────────────────────────────
// src/pages/OAIChatDemo.tsx | valet
// Simple showcase for <OAIChat /> component
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  OAIChat,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';
import type { ChatMessage } from '@archway/valet';
import monkey from '../assets/monkey.jpg';
import present from '../assets/present.jpg';

export default function OAIChatDemoPage() {
  const navigate = useNavigate();
  const { theme, toggleMode } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! How can I help you?' },
    { role: 'user', content: 'Tell me about valet.' },
    { role: 'assistant', content: 'It\'s a tiny React UI kit focused on AI driven interfaces.' },
    { role: 'user', content: 'Nice, how can I contribute?' },
    { role: 'assistant', content: 'Check the repository README for guidelines.' },
    {
      role: 'assistant',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus luctus, metus ut fermentum aliquet, turpis ligula tristique turpis, at viverra orci elit in lorem. Donec eget massa vitae lorem suscipit porttitor. Sed venenatis elit vel odio tempor, eget facilisis lorem suscipit. Mauris at dui non orci pulvinar euismod. Donec ultricies, nisl a varius sagittis, velit nunc gravida risus, quis facilisis massa nunc ut sapien.',
    },
  ]);

  const handleSend = (m: ChatMessage) => {
    setMessages(prev => [...prev, m, { role: 'assistant', content: `Echo: ${m.content}` }]);
  };

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>
          Chat Showcase
        </Typography>
        <Typography variant="subtitle">
          OAIChat component with OpenAI style messages
        </Typography>

        <OAIChat
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
