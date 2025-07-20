// ─────────────────────────────────────────────────────────────────────────────
// src/pages/RichChatDemo.tsx | valet
// Showcase for <RichChat /> component with local logic
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  RichChat,
  DateSelector,
  Iterator,
  IconButton,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';
import type { RichMessage } from '@archway/valet';
import monkey from '../assets/monkey.jpg';
import present from '../assets/present.jpg';

export default function RichChatDemoPage() {
  const navigate = useNavigate();
  const { theme, toggleMode } = useTheme();
  const backup = useRef<RichMessage[] | null>(null);
  const [step, setStep] = useState(0);
  const [scheduled, setScheduled] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<RichMessage[]>([
    {
      role: 'assistant',
      content: <Typography>Do you have a party scheduled?</Typography>,
      form: ({ onSubmit }) => (
        <Stack direction="row" spacing={1}>
          <Button onClick={() => onSubmit('Yes')}>Yes</Button>
          <Button onClick={() => onSubmit('No')}>No</Button>
        </Stack>
      ),
      animate: true,
    },
  ]);

  const DateForm = ({ onSubmit }: { onSubmit: (val: string) => void }) => {
    const [date, setDate] = useState('');
    return (
      <Stack direction="row" spacing={1}>
        <DateSelector value={date} onChange={setDate} />
        <IconButton
          icon="carbon:checkmark"
          aria-label="Confirm"
          onClick={() => onSubmit(date)}
        />
      </Stack>
    );
  };

  const AgeForm = ({ onSubmit }: { onSubmit: (val: string) => void }) => {
    const [age, setAge] = useState(7);
    return (
      <Stack direction="row" spacing={1}>
        <Iterator value={age} onChange={setAge} min={1} max={12} />
        <IconButton
          icon="carbon:checkmark"
          aria-label="Confirm"
          onClick={() => onSubmit(String(age))}
        />
      </Stack>
    );
  };

  const KidsForm = ({ onSubmit }: { onSubmit: (val: string) => void }) => {
    const [kids, setKids] = useState(15);
    return (
      <Stack direction="row" spacing={1}>
        <Iterator
          value={kids}
          onChange={setKids}
          min={5}
          max={45}
          step={5}
        />
        <IconButton
          icon="carbon:checkmark"
          aria-label="Confirm"
          onClick={() => onSubmit(String(kids))}
        />
      </Stack>
    );
  };

  const handleAnswer = (reply: string) => {
    setMessages(prev => {
      backup.current = [...prev];
      const base = prev.map((m, idx) => {
        if (idx === prev.length - 1) {
          const { form, ...rest } = m as any;
          return rest as RichMessage;
        }
        return m;
      });

      const userMsg: RichMessage = {
        role: 'user',
        content: reply,
        animate: true,
        onEdit: () => {
          if (backup.current) setMessages(backup.current);
        },
      };

      let next: RichMessage | null = null;

      if (step === 0) {
        const yes = reply === 'Yes';
        setScheduled(yes);
        next = yes
          ? {
              role: 'assistant',
              content: <Typography>When is the party?</Typography>,
              form: DateForm,
              animate: true,
            }
          : {
              role: 'assistant',
              content: <Typography>How old is your child turning?</Typography>,
              form: AgeForm,
              animate: true,
            };
        setStep(yes ? 1 : 2);
      } else if (step === 1) {
        next = {
          role: 'assistant',
          content: <Typography>How old is your child turning?</Typography>,
          form: AgeForm,
          animate: true,
        };
        setStep(2);
      } else if (step === 2) {
        next = {
          role: 'assistant',
          content: <Typography>What is your child's name?</Typography>,
          animate: true,
        };
        setStep(3);
      } else if (step === 4) {
        next = {
          role: 'assistant',
          content: <Typography>Thanks for the info!</Typography>,
          animate: true,
        };
        setStep(5);
      }

      return next ? [...base, userMsg, next] : [...base, userMsg];
    });
  };

  const handleSend = (m: RichMessage) => {
    setMessages(prev => {
      let nextMsgs = [...prev, m];
      if (step === 3) {
        nextMsgs = [
          ...nextMsgs,
          {
            role: 'assistant',
            content: <Typography>How many kids are coming?</Typography>,
            form: KidsForm,
            animate: true,
          },
        ];
        setStep(4);
      }
      return nextMsgs;
    });
  };

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>
          RichChat Demo
        </Typography>
        <Typography variant="subtitle">Local chat with embeddable components</Typography>

        <RichChat
          messages={messages}
          onSend={handleSend}
          onFormSubmit={reply => handleAnswer(reply)}
          constrainHeight
          userAvatar={present}
          systemAvatar={monkey}
        />

        <Button variant="outlined" onClick={toggleMode}>
          Toggle light / dark mode
        </Button>

        <Button
          size="lg"
          onClick={() => navigate('/richchat')}
          style={{ marginTop: theme.spacing(1) }}
        >
          Docs →
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
