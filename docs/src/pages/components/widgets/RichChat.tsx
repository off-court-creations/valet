// ─────────────────────────────────────────────────────────────
// src/pages/components/RichChat.tsx | valet-docs
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Tabs, Table, Button, useTheme } from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';

export default function RichChatPage() {
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
      type: <code>RichMessage[]</code>,
      default: <code>-</code>,
      description: 'Conversation history with JSX content',
    },
    {
      prop: <code>onFormSubmit</code>,
      type: <code>(value: string, index: number) =&gt; void</code>,
      default: <code>-</code>,
      description: 'Called when a form message submits',
    },
    {
      prop: <code>onSend</code>,
      type: <code>(m: RichMessage) =&gt; void</code>,
      default: <code>-</code>,
      description: 'Called when user sends a message',
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
          RichChat
        </Typography>
        <Typography variant='subtitle'>Embeddable chat with local UI components</Typography>
        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              <Typography>RichChat allows JSX content in messages for custom layouts.</Typography>
              <Typography>
                It builds on <code>LLMChat</code> but lets you embed forms and interactive widgets
                directly within the conversation.
              </Typography>
              <Typography>
                Each message may define a <code>form</code> component to collect a response. When
                submitted, <code>onFormSubmit</code> receives the value and index.
              </Typography>
              <Typography>The compose area is disabled while a form is active.</Typography>
              <Typography>
                RichChat excels at onboarding flows or demos where you need the user to fill in a
                few structured fields along the way.
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
          onClick={() => navigate('/rich-chat-demo')}
          style={{ marginTop: theme.spacing(1) }}
        >
          View Example →
        </Button>
      </Stack>
    </Surface>
  );
}
