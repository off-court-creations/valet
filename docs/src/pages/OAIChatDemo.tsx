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
  Snackbar,
  useAI,
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
  const [noKey, setNoKey] = useState(false);

  const handleSend = async (m: ChatMessage) => {
    if (!useAI.getState().apiKey) {
      setNoKey(true);
      return;
    }
    const history = [...messages, m];
    setMessages([...history, { role: 'assistant', content: '', typing: true }]);
    try {
      const res = await sendChat(history);
      const reply = res.choices[0]?.message as ChatMessage | undefined;
      if (reply)
        setMessages(prev => {
          const next = [...prev];
          const idx = next.findIndex(x => x.typing);
          if (idx >= 0) next[idx] = { ...reply, animate: true } as ChatMessage;
          else next.push({ ...reply, animate: true } as ChatMessage);
          return next;
        });
    } catch (err: any) {
      const msg = String(err.message || err);
      if (msg.includes('No API key set')) {
        setNoKey(true);
      } else {
        setMessages(prev => {
          const next = [...prev];
          const idx = next.findIndex(x => x.typing);
          if (idx >= 0)
            next[idx] = { role: 'assistant', content: msg, animate: true };
          else
            next.push({ role: 'assistant', content: msg, animate: true });
          return next;
        });
      }
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
        {noKey && (
          <Snackbar
            message="No API key set"
            onClose={() => setNoKey(false)}
          />
        )}

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
