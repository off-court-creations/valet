// ─────────────────────────────────────────────────────────────
// src/pages/components/RichChat.tsx | valet-docs
// Minimal RichChat docs page with MCP reference
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Button, useTheme, Tabs } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';
import ReferenceSection from '../../../components/ReferenceSection';

export default function RichChatPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Rich Chat' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Typography>
              RichChat supports JSX content in messages (including embedded forms). Use
              <code>onFormSubmit</code> to handle form replies and <code>onSend</code> for normal
              messages.
            </Typography>
            <Button
              size='lg'
              onClick={() => navigate('/rich-chat-demo')}
              sx={{ marginTop: theme.spacing(1) }}
            >
              View Example →
            </Button>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection slug='components/widgets/richchat' />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Surface>
  );
}
