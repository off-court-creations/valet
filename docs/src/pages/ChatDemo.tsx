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
import monkey from '../assets/monkey.jpg';

export default function ChatDemoPage() {
  const navigate = useNavigate();
  const { theme, toggleMode } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! How can I help you?' },
    { role: 'user', content: 'Tell me about valet.' },
    { role: 'assistant', content: 'It\'s a tiny React UI kit focused on AI driven interfaces.' },
    { role: 'user', content: 'Nice, how can I contribute?' },
    { role: 'assistant', content: 'Check the repository README for guidelines.' },
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

        <Chat
          messages={messages}
          onSend={handleSend}
          constrainHeight
          userAvatar="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
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
