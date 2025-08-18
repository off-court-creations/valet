// ─────────────────────────────────────────────────────────────────────────────
// src/pages/LLMChatDemo.tsx | valet-docs
// Simple showcase for <LLMChat /> component
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  LLMChat,
  sendChat,
  Snackbar,
  useAIKey,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import type { ChatMessage } from '@archway/valet';
import monkey from '../../../assets/monkey.jpg';
import present from '../../../assets/present.jpg';

/** Local UI-only extensions used by the demo (not part of the core ChatMessage type) */
type UIChatMessage = ChatMessage & {
  typing?: boolean;
  animate?: boolean;
};

export default function LLMChatDemoPage() {
  const navigate = useNavigate();
  const { theme, toggleMode } = useTheme();

  const [messages, setMessages] = useState<UIChatMessage[]>([
    { role: 'system', content: 'You are a helpful assistant.' },
  ]);

  const [noKey, setNoKey] = useState(false);

  const handleSend = async (m: ChatMessage) => {
    if (!useAIKey.getState().apiKey) {
      setNoKey(true);
      return;
    }

    // Keep UI state with UI extensions…
    const uiHistory: UIChatMessage[] = [...messages, m];
    setMessages([...uiHistory, { role: 'assistant', content: '', typing: true }]);

    // …but send a clean history that matches the core ChatMessage shape.
    // With exactOptionalPropertyTypes enabled, omit `name` when undefined.
    const historyForAPI: ChatMessage[] = uiHistory.map(({ role, content, name }) => {
      const base: ChatMessage = { role, content };
      return name !== undefined ? { ...base, name } : base;
    });

    try {
      const res = await sendChat(historyForAPI);
      const reply = res.choices?.[0]?.message as ChatMessage | undefined;

      if (reply) {
        setMessages((prev) => {
          const next = [...prev];
          const idx = next.findIndex((x) => x.typing);
          const animatedReply: UIChatMessage = { ...reply, animate: true };
          if (idx >= 0) next[idx] = animatedReply;
          else next.push(animatedReply);
          return next;
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('No API key set yet')) {
        setNoKey(true);
      } else {
        setMessages((prev) => {
          const next = [...prev];
          const idx = next.findIndex((x) => x.typing);
          const errorMsg: UIChatMessage = { role: 'assistant', content: msg, animate: true };
          if (idx >= 0) next[idx] = errorMsg;
          else next.push(errorMsg);
          return next;
        });
      }
    }
  };

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Chat Showcase
        </Typography>
        <Typography variant='subtitle'>LLMChat component demo</Typography>

        <LLMChat
          messages={messages}
          onSend={handleSend}
          constrainHeight
          userAvatar={present}
          systemAvatar={monkey}
        />

        {noKey && (
          <Snackbar
            message='No API key set yet'
            onClose={() => setNoKey(false)}
          />
        )}

        <Button
          variant='outlined'
          onClick={toggleMode}
        >
          Toggle light / dark mode
        </Button>

        <Button
          size='lg'
          onClick={() => navigate('/llmchat')}
          sx={{ marginTop: theme.spacing(1) }}
        >
          Docs →
        </Button>

        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
