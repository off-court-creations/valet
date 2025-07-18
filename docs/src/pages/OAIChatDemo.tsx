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
  sendChat,
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
    { role: 'system', content: 'You are a concise assistant for the valet docs.' },
  ]);

  const handleSend = async (m: ChatMessage) => {
    const next = [...messages, m];
    setMessages(next);
    try {
      const res = await sendChat(next);
      const reply = res.choices?.[0]?.message;
      if (reply) {
        setMessages(prev => [...prev, { role: reply.role as any, content: reply.content }]);
      }
    } catch (err) {
      console.error(err);
    }
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
