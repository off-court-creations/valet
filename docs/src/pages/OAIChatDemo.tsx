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
  sendChat,
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
    { role: 'system', content: 'You are a helpful assistant.' },
  ]);

  const handleSend = async (m: ChatMessage) => {
    const history = [...messages, m];
    setMessages(history);
    try {
      const res = await sendChat(history);
      const reply = res.choices[0]?.message as ChatMessage | undefined;
      if (reply) setMessages(prev => [...prev, reply]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: String(err.message || err) },
      ]);
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
