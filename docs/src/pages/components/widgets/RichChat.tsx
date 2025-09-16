// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/widgets/RichChat.tsx  | valet-docs
// Migrated to ComponentMetaPage – usage + reference with link to demo
// ─────────────────────────────────────────────────────────────
import { Stack, Typography, Button, useTheme } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import RichChatMeta from '../../../../../src/components/widgets/RichChat.meta.json';

export default function RichChatPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const usage = (
    <Stack>
      <Typography>
        RichChat supports JSX content in messages (including embedded forms). Use
        <code> onFormSubmit </code> to handle form replies and <code> onSend </code> for normal
        messages.
      </Typography>
      <Button
        size='lg'
        onClick={() => navigate('/rich-chat-demo')}
        sx={{ marginTop: theme.spacing(1) }}
      >
        View Interactive Demo →
      </Button>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Rich Chat'
      subtitle='Threaded assistant UI with rich JSX messages and forms'
      slug='components/widgets/richchat'
      meta={RichChatMeta}
      usage={usage}
    />
  );
}
