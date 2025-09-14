// ─────────────────────────────────────────────────────────────
// src/pages/components/LLMChat.tsx | valet-docs
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Tabs, Button, useTheme } from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';

import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';

export default function LLMChatPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Reference handled by ReferenceSection

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='LLM Chat' />
        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              <Typography>
                LLMChat renders a scrollable chat history and an optional compose area. Provide an
                array of <code>ChatMessage</code> objects via the
                <code>messages</code> prop and update it when the user sends a message.
              </Typography>
              <Typography>
                The component focuses on minimal ceremony so your users can start chatting with an
                AI quickly. Styling hooks are provided via the
                <code>preset</code> prop so it fits naturally within your product.
              </Typography>
              <Typography>
                Use <code>onSend</code> to forward user input to your API. The helper
                <code>sendChat</code> communicates with OpenAI or Anthropic.
              </Typography>
              <Typography>
                When <code>constrainHeight</code> is true the chat fits inside the surrounding
                <code>{'<Surface>'}</code>. Avatars and model selection are optional.
              </Typography>
              <Typography>
                LLMChat works well for prototypes or integrated workflows when you need a
                straightforward conversational widget.
              </Typography>
            </Stack>
          </Tabs.Panel>
          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection slug='components/widgets/llmchat' />
          </Tabs.Panel>
        </Tabs>
        <Button
          size='lg'
          onClick={() => navigate('/chat-demo')}
          sx={{ marginTop: theme.spacing(1) }}
        >
          View Example →
        </Button>
      </Stack>
    </Surface>
  );
}
