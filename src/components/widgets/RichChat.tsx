// ─────────────────────────────────────────────────────────────
// src/components/widgets/RichChat.tsx  | valet
// Local, deterministic chat component with embed support
// ─────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from 'react';
import { styled, keyframes } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import IconButton from '../fields/IconButton';
import TextField from '../fields/TextField';
import Stack from '../layout/Stack';
import Panel from '../layout/Panel';
import Typography from '../primitives/Typography';
import Avatar from '../primitives/Avatar';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Types                                                      */
export interface RichMessage {
  role: 'system' | 'user' | 'assistant';
  content: React.ReactNode;
  name?: string;
  typing?: boolean;
  animate?: boolean;
}

export interface RichChatProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'>,
    Presettable {
  messages: RichMessage[];
  onSend?: (message: RichMessage) => void;
  userAvatar?: string;
  systemAvatar?: string;
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
  max-height: 100%;
`;

const Messages = styled('div')<{ $gap: string }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => $gap};
  flex: 1;
`;

const Row = styled('div')<{
  $from: 'user' | 'assistant' | 'system';
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
  & span:nth-child(2) { animation-delay: 0.2s; }
  & span:nth-child(3) { animation-delay: 0.4s; }
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                  */
export const RichChat: React.FC<RichChatProps> = ({
  messages,
  onSend,
  userAvatar,
  systemAvatar,
  placeholder = 'Message…',
  disableInput = false,
  constrainHeight = true,
  preset: p,
  className,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const [portrait, setPortrait] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false,
  );
  useEffect(() => {
    const handler = () =>
      setPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [text, setText] = useState('');

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
      <Wrapper ref={wrapRef} $gap={theme.spacing(3)} style={{ overflow: 'hidden' }}>
        <Messages
          $gap={theme.spacing(1.5)}
          style={constrainHeight ? { overflowY: 'auto' } : undefined}
        >
          {messages
            .filter(m => m.role !== 'system')
            .map((m, i) => {
              const sidePad = portrait ? theme.spacing(8) : theme.spacing(24);
              const avatarPad = theme.spacing(1);
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
                      style={{ marginRight: theme.spacing(1) }}
                    />
                  )}
                  <Panel
                    compact
                    variant="main"
                    background={m.role === 'user' ? theme.colors.primary : undefined}
                    style={{
                      maxWidth: '100%',
                      width: 'fit-content',
                      borderRadius: theme.spacing(0.5),
                      animation: m.animate ? `${fadeIn} 0.2s ease-out` : undefined,
                    }}
                  >
                    {m.name && (
                      <Typography variant="subtitle" bold>
                        {m.name}
                      </Typography>
                    )}
                    {m.typing ? (
                      <Typing $color={m.role === 'user' ? theme.colors.primaryText : theme.colors.text}>
                        <span />
                        <span />
                        <span />
                      </Typing>
                    ) : typeof m.content === 'string' ? (
                      <Typography>{m.content}</Typography>
                    ) : (
                      m.content
                    )}
                  </Panel>
                  {m.role === 'user' && userAvatar && (
                    <Avatar
                      src={userAvatar}
                      size="s"
                      style={{ marginLeft: theme.spacing(1) }}
                    />
                  )}
                </Row>
              );
            })}
        </Messages>

        {!disableInput && (
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

