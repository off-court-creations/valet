// ─────────────────────────────────────────────────────────────────────────────
// src/pages/ChatDemo.tsx
// Simple showcase for <Chat /> component
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Chat,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import type { ChatMessage } from '@archway/valet';

export default function ChatDemoPage() {
  const navigate = useNavigate();
  const { theme, toggleMode } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! How can I help you?' },
  ]);

  const handleSend = (m: ChatMessage) => {
    setMessages(prev => [...prev, m, { role: 'assistant', content: `Echo: ${m.content}` }]);
  };

  return (
    <Surface>
      <Stack spacing={1} preset="showcaseStack">
        <Typography variant="h2" bold>
          Chat Showcase
        </Typography>
        <Typography variant="subtitle">
          Chat component with OpenAI style messages
        </Typography>

        <Chat messages={messages} onSend={handleSend} constrainHeight />

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
