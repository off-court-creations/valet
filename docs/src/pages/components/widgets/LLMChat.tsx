// ─────────────────────────────────────────────────────────────
// src/pages/components/LLMChat.tsx | valet-docs
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Tabs, Table, Button, useTheme } from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';

export default function LLMChatPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  interface Row {
    prop: ReactNode;
    type: ReactNode;
    default: ReactNode;
    description: ReactNode;
  }

  const columns: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Type', accessor: 'type' },
    { header: 'Default', accessor: 'default' },
    { header: 'Description', accessor: 'description' },
  ];

  const data: Row[] = [
    {
      prop: <code>messages</code>,
      type: <code>ChatMessage[]</code>,
      default: <code>-</code>,
      description: 'Conversation history',
    },
    {
      prop: <code>onSend</code>,
      type: <code>(m: ChatMessage) =&gt; void</code>,
      default: <code>-</code>,
      description: 'Called when user submits a message',
    },
    {
      prop: <code>userAvatar</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'URL for user avatar image',
    },
    {
      prop: <code>systemAvatar</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'URL for assistant avatar image',
    },
    {
      prop: <code>placeholder</code>,
      type: <code>string</code>,
      default: <code>&#39;Message…&#39;</code>,
      description: 'Input placeholder',
    },
    {
      prop: <code>disableInput</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Hide the compose bar',
    },
    {
      prop: <code>constrainHeight</code>,
      type: <code>boolean</code>,
      default: <code>true</code>,
      description: 'Fit within surface height',
    },
    {
      prop: <code>apiKey</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Override global API key',
    },
    {
      prop: <code>provider</code>,
      type: <code>AIProvider</code>,
      default: <code>-</code>,
      description: 'Model provider',
    },
    {
      prop: <code>model</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Model name',
    },
    {
      prop: <code>onModelChange</code>,
      type: <code>(m: string) =&gt; void</code>,
      default: <code>-</code>,
      description: 'Handle model changes',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>-</code>,
      description: 'Apply style presets',
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          LLMChat
        </Typography>
        <Typography variant='subtitle'>Conversation UI for large language models</Typography>
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
            <Table
              data={data}
              columns={columns}
              constrainHeight={false}
            />
          </Tabs.Panel>
        </Tabs>
        <Button
          size='lg'
          onClick={() => navigate('/chat-demo')}
          style={{ marginTop: theme.spacing(1) }}
        >
          View Example →
        </Button>
      </Stack>
    </Surface>
  );
}
