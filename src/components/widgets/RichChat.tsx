// ─────────────────────────────────────────────────────────────
// src/components/widgets/RichChat.tsx  | valet
// Local chat component with embeddable content; add fontFamily prop
// ─────────────────────────────────────────────────────────────
import React, {
  useState,
  useRef,
  useId,
  useEffect,
  useLayoutEffect,
} from 'react';
import { styled, keyframes } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { useSurface } from '../../system/surfaceStore';
import { shallow } from 'zustand/shallow';
import { preset } from '../../css/stylePresets';
import IconButton from '../fields/IconButton';
import TextField from '../fields/TextField';
import Stack from '../layout/Stack';
import Panel from '../layout/Panel';
import Typography from '../primitives/Typography';
import Markdown from './Markdown';
import Avatar from '../primitives/Avatar';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Types                                                      */
export interface RichMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: React.ReactNode;
  /** Optional interactive form to collect a canned response */
  form?: React.ComponentType<{ onSubmit: (value: string) => void }>;
  name?: string;
  typing?: boolean;
  animate?: boolean;
}

export interface RichChatProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'>,
    Presettable {
  messages: RichMessage[];
  /** Called when a form message collects a response */
  onFormSubmit?: (value: string, index: number) => void;
  onSend?: (message: RichMessage) => void;
  userAvatar?: string;
  systemAvatar?: string;
  placeholder?: string;
  disableInput?: boolean;
  constrainHeight?: boolean;
  /** Override input font */
  fontFamily?: string;
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
  $left: string;
  $right: string;
}>`
  display: flex;
  align-items: center;
  justify-content: ${({ $from }) =>
    $from === 'user' ? 'flex-end' : 'flex-start'};
  padding-left: ${({ $left }) => $left};
  padding-right: ${({ $right }) => $right};
`;

const typingDot = keyframes`
  0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-0.1rem); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(0.25rem); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Typing = styled('div')<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  & span {
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 50%;
    background: ${({ $color }) => $color};
    animation: ${typingDot} 1s infinite;
  }
  & span:nth-child(2) {
    animation-delay: 0.2s;
  }
  & span:nth-child(3) {
    animation-delay: 0.4s;
  }
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                  */
export const RichChat: React.FC<RichChatProps> = ({
  messages,
  onSend,
  onFormSubmit,
  userAvatar,
  systemAvatar,
  placeholder = 'Message…',
  disableInput = false,
  constrainHeight = true,
  fontFamily,
  preset: p,
  className,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const surface = useSurface(
    (s) => ({
      element: s.element,
      width: s.width,
      height: s.height,
      registerChild: s.registerChild,
      unregisterChild: s.unregisterChild,
    }),
    shallow,
  );
  const portrait = surface.height > surface.width;
  const wrapRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();
  const [maxHeight, setMaxHeight] = useState<number>();
  const [shouldConstrain, setShouldConstrain] = useState(false);
  const constraintRef = useRef(false);

  const [text, setText] = useState('');

  const inputDisabled = disableInput || messages.some((m) => m.form);

  const calcCutoff = () => {
    if (typeof document === 'undefined') return 32;
    const fs = parseFloat(getComputedStyle(document.documentElement).fontSize);
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
    const msg: RichMessage = { role: 'user', content: text.trim() };
    onSend?.(msg);
    setText('');
  };

  const presetClasses = p ? preset(p) : '';
  const cls = [presetClasses, className].filter(Boolean).join(' ') || undefined;

  return (
    <Panel
      {...rest}
      compact
      fullWidth
      variant="alt"
      style={style}
      className={cls}
    >
      <Wrapper
        ref={wrapRef}
        $gap={theme.spacing(3)}
        style={{ overflow: 'hidden' }}
      >
        <Messages
          $gap={theme.spacing(1.5)}
          style={shouldConstrain ? { overflowY: 'auto', maxHeight } : undefined}
        >
          {messages
            .filter((m) => m.role !== 'system')
            .map((m, i) => {
              const sidePad = portrait ? theme.spacing(8) : theme.spacing(24);
              const avatarPad = theme.spacing(1);
              const content =
                typeof m.content === 'string' ? (
                  m.role === 'assistant' ? (
                    <Markdown
                      data={m.content}
                      codeBackground={theme.colors.background}
                    />
                  ) : (
                    <Typography>{m.content}</Typography>
                  )
                ) : (
                  m.content
                );
              const Form = m.form;
              return (
                <Row
                  key={i}
                  $from={m.role}
                  $left={m.role === 'user' ? sidePad : avatarPad}
                  $right={m.role === 'user' ? avatarPad : sidePad}
                >
                  {m.role !== 'user' && systemAvatar && (
                    <Avatar
                      src={systemAvatar}
                      size="s"
                      variant="outline"
                      style={{ marginRight: theme.spacing(1) }}
                    />
                  )}
                  <Panel
                    compact
                    variant="main"
                    background={
                      m.role === 'user' ? theme.colors.primary : undefined
                    }
                    style={{
                      maxWidth: '100%',
                      width: 'fit-content',
                      borderRadius: theme.spacing(0.5),
                      animation: m.animate
                        ? `${fadeIn} 0.2s ease-out`
                        : undefined,
                      position: 'relative',
                    }}
                  >
                    <div>
                      {m.name && (
                        <Typography variant="subtitle" bold>
                          {m.name}
                        </Typography>
                      )}
                      {m.typing ? (
                        <Typing
                          $color={
                            m.role === 'user'
                              ? theme.colors.primaryText
                              : theme.colors.text
                          }
                        >
                          <span />
                          <span />
                          <span />
                        </Typing>
                      ) : (
                        content
                      )}
                      {Form && (
                        <Form onSubmit={(v: string) => onFormSubmit?.(v, i)} />
                      )}
                    </div>
                  </Panel>
                  {m.role === 'user' && userAvatar && (
                    <Avatar
                      src={userAvatar}
                      size="s"
                      variant="outline"
                      style={{ marginLeft: theme.spacing(1) }}
                    />
                  )}
                </Row>
              );
            })}
        </Messages>

        {!inputDisabled && (
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Stack direction="row" spacing={1} compact>
              <TextField
                as="textarea"
                name="chat-message"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                rows={1}
                placeholder={placeholder}
                fullWidth
                fontFamily={fontFamily}
              />
              <IconButton icon="carbon:send" type="submit" aria-label="Send" />
            </Stack>
          </form>
        )}
      </Wrapper>
    </Panel>
  );
};

export default RichChat;
