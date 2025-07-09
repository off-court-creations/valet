// ─────────────────────────────────────────────────────────────
// src/components/Chat.tsx  | valet
// OpenAI style chat component with height constraint
// ─────────────────────────────────────────────────────────────
import React, {
  useState,
  useRef,
  useId,
  useEffect,
  useLayoutEffect,
} from 'react';
import { styled }          from '../css/createStyled';
import { useTheme }        from '../system/themeStore';
import { useSurface }      from '../system/surfaceStore';
import { preset }          from '../css/stylePresets';
import IconButton          from './IconButton';
import TextField           from './TextField';
import Panel               from './Panel';
import Typography          from './Typography';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
/* Types                                                      */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string;
  name?: string;
}

export interface ChatProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'>,
    Presettable {
  messages: ChatMessage[];
  onSend?: (message: ChatMessage) => void;
  placeholder?: string;
  disableInput?: boolean;
  constrainHeight?: boolean;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
const Wrapper = styled('div')<{ $gap: string }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => $gap};
`;

const Messages = styled('div')<{ $gap: string }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => $gap};
`;

const Row = styled('div')<{
  $from: 'user' | 'assistant' | 'system' | 'function' | 'tool';
  $pad: string;
}>`
  display: flex;
  justify-content: ${({ $from }) => ($from === 'user' ? 'flex-end' : 'flex-start')};
  padding-inline: ${({ $pad }) => $pad};
`;

const InputRow = styled('form')<{ $gap: string }>`
  display: flex;
  align-items: flex-end;
  gap: ${({ $gap }) => $gap};
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                  */
export const Chat: React.FC<ChatProps> = ({
  messages,
  onSend,
  placeholder = 'Message…',
  disableInput = false,
  constrainHeight = true,
  preset: p,
  className,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const surface = useSurface();
  const wrapRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();
  const [maxHeight, setMaxHeight] = useState<number>();
  const [shouldConstrain, setShouldConstrain] = useState(false);
  const constraintRef = useRef(false);

  const [text, setText] = useState('');

  const calcCutoff = () => {
    if (typeof document === 'undefined') return 32;
    const fs = parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    return (isNaN(fs) ? 16 : fs) * 2;
  };

  const update = () => {
    const node = wrapRef.current;
    const surfEl = surface.element;
    if (!node || !surfEl) return;
    const sRect = surfEl.getBoundingClientRect();
    const nRect = node.getBoundingClientRect();
    const top = Math.round(nRect.top - sRect.top + surfEl.scrollTop);
    const bottomSpace = Math.round(
      surfEl.scrollHeight - (nRect.bottom - sRect.top + surfEl.scrollTop),
    );
    const available = Math.round(surface.height - top - bottomSpace);
    const cutoff = calcCutoff();

    const next = available >= cutoff;
    if (next) {
      if (!constraintRef.current) {
        surfEl.scrollTop = 0;
        surfEl.scrollLeft = 0;
      }
      constraintRef.current = true;
      setShouldConstrain(true);
      setMaxHeight(Math.max(0, available));
    } else {
      constraintRef.current = false;
      setShouldConstrain(false);
      setMaxHeight(undefined);
    }
  };

  useEffect(() => {
    if (!constrainHeight) {
      constraintRef.current = false;
      setShouldConstrain(false);
      setMaxHeight(undefined);
    } else {
      constraintRef.current = false;
    }
  }, [constrainHeight]);

  useLayoutEffect(() => {
    if (!constrainHeight || !wrapRef.current || !surface.element) return;
    const node = wrapRef.current;
    surface.registerChild(uniqueId, node, update);
    const ro = new ResizeObserver(update);
    ro.observe(node);
    update();
    return () => {
      surface.unregisterChild(uniqueId);
      ro.disconnect();
    };
  }, [constrainHeight, surface.element]);

  useLayoutEffect(() => {
    if (!constrainHeight || !wrapRef.current || !surface.element) return;
    update();
  }, [constrainHeight, surface.height, surface.element]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const msg: ChatMessage = { role: 'user', content: text.trim() };
    onSend?.(msg);
    setText('');
  };

  const presetClasses = p ? preset(p) : '';

  return (
    <Wrapper
      {...rest}
      ref={wrapRef}
      $gap={theme.spacing(1)}
      style={{ ...style, overflow: 'hidden' }}
      className={[presetClasses, className].filter(Boolean).join(' ')}
    >
      <Messages
        $gap={theme.spacing(0.5)}
        style={shouldConstrain ? { overflowY: 'auto', maxHeight } : undefined}
      >
        {messages.map((m, i) => (
          <Row key={i} $from={m.role} $pad={theme.spacing(1)}>
            <Panel fullWidth compact variant={m.role === 'user' ? 'alt' : 'main'}>
              {m.name && (
                <Typography variant="subtitle" bold>
                  {m.name}
                </Typography>
              )}
              <Typography>{m.content}</Typography>
            </Panel>
          </Row>
        ))}
      </Messages>
      {!disableInput && (
        <InputRow onSubmit={handleSubmit} $gap={theme.spacing(0.5)}>
          <TextField
            as="textarea"
            name="chat-message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder={placeholder}
            style={{ flex: 1 }}
          />
          <IconButton icon="mdi:send" type="submit" aria-label="Send" />
        </InputRow>
      )}
    </Wrapper>
  );
};

export default Chat;
