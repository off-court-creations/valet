// ─────────────────────────────────────────────────────────────
// src/components/widgets/RichChat.tsx  | valet
// Local chat component with embeddable content; add fontFamily prop
// patched: height constraint logic aligned with Table/Accordion; account for input/footer height
// ─────────────────────────────────────────────────────────────
import React, { useState, useRef, useId, useEffect, useLayoutEffect, useCallback } from 'react';
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
import type { Presettable, Sx } from '../../types';

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
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit' | 'style'>,
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
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
const Wrapper = styled('div')<{ $gap: string }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => $gap};
  min-height: 0; /* allow children to shrink inside flex column */
`;

const Messages = styled('div')<{ $gap: string; $pad: string }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => $gap};
  padding: ${({ $pad }) => $pad};
  box-sizing: border-box;
  min-height: 0; /* enable internal scrolling when constrained */
`;

const Row = styled('div')<{
  $from: 'user' | 'assistant' | 'system' | 'function' | 'tool';
  $left: string;
  $right: string;
}>`
  display: flex;
  align-items: center;
  justify-content: ${({ $from }) => ($from === 'user' ? 'flex-end' : 'flex-start')};
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
  sx,
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

  const { element, width, height, registerChild, unregisterChild } = surface;

  const portrait = height > width;
  const wrapRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLFormElement>(null);
  const uniqueId = useId();
  const [maxHeight, setMaxHeight] = useState<number>();
  // Constrain messages area height; keep input visible.
  // Avoid scroll locking by keeping scrollbars active; no squelch frames
  const constraintRef = useRef(false);
  // Retained for parity with other constrained components; not used in RichChat's
  // "take remaining page height" behavior.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const bottomRef = useRef(0);
  const rafRef = useRef<number>(0);
  const prevHeightRef = useRef<number | undefined>(undefined);
  const prevConstrainedRef = useRef(false);

  const [text, setText] = useState('');

  const inputDisabled = disableInput || messages.some((m) => m.form);

  // cutoff logic no longer used; we always constrain

  const runUpdate = useCallback(() => {
    const node = wrapRef.current;
    const msgs = messagesRef.current;
    const surfEl = element;
    if (!node || !surfEl || !msgs) return;
    const sRect = surfEl.getBoundingClientRect();
    const nRect = node.getBoundingClientRect();
    const top = Math.round(nRect.top - sRect.top + surfEl.scrollTop);
    // For RichChat we WANT it to take the remainder of the page,
    // pushing below content past the fold if necessary.
    // So we ignore dynamic bottom siblings and compute against screen bottom.
    const availableForWrapper = Math.round(height - top);

    // Measure footer/input height and the actual CSS row gap (px) so messages get the remainder
    const footerH = inputDisabled
      ? 0
      : Math.round(inputRef.current?.getBoundingClientRect().height ?? 0);
    let gapPx = 0;
    try {
      const styles = getComputedStyle(node);
      const rowGap = parseFloat(styles.rowGap || styles.gap || '0');
      gapPx = Number.isFinite(rowGap) ? rowGap : 0;
    } catch {
      gapPx = 0;
    }

    const availableForMessages = Math.max(0, availableForWrapper - footerH - gapPx);

    // Always constrain RichChat so the input stays visible and
    // the messages list becomes the scroll container.
    // Do not force parent Surface scroll position; allow user scroll
    // and rely solely on internal Messages scrolling.
    constraintRef.current = true;
    prevConstrainedRef.current = true;
    const newHeight = Math.max(1, availableForMessages); // ensure overflow engages
    if (prevHeightRef.current !== newHeight) {
      prevHeightRef.current = newHeight;
      setMaxHeight(newHeight);
    }
  }, [element, height, inputDisabled]);

  const update = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      runUpdate();
    });
  }, [runUpdate]);

  useEffect(() => {
    if (!constrainHeight) {
      constraintRef.current = false;
      setMaxHeight(undefined);
    } else {
      // force refresh when re-enabling constraints
      constraintRef.current = false;
      runUpdate();
    }
  }, [constrainHeight, runUpdate]);

  useLayoutEffect(() => {
    if (!wrapRef.current || !element) return;
    const node = wrapRef.current;
    registerChild(uniqueId, node, update);
    const ro = new ResizeObserver(update);
    ro.observe(node);
    // Also observe messages and input for internal content changes
    const roInner = new ResizeObserver(update);
    if (messagesRef.current) roInner.observe(messagesRef.current);
    if (inputRef.current) roInner.observe(inputRef.current);
    update();
    return () => {
      unregisterChild(uniqueId);
      ro.disconnect();
      roInner.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [element, uniqueId, registerChild, unregisterChild, update]);

  useLayoutEffect(() => {
    if (!wrapRef.current || !element) return;
    update();
  }, [element, update]);

  // Recalculate when input presence toggles (form messages)
  useLayoutEffect(() => {
    if (!wrapRef.current || !element) return;
    update();
  }, [inputDisabled, element, update]);

  // Auto-scroll to bottom when new messages arrive if scrolling is possible
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    // Only act when there is vertical overflow (scrollbar present)
    const shouldScroll = el.scrollHeight > el.clientHeight;
    if (!shouldScroll) return;
    // Defer to next frame to ensure layout reflects newly rendered message
    const id = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(id);
  }, [messages.length]);

  const doSubmit = () => {
    if (!text.trim()) return;
    const msg: RichMessage = { role: 'user', content: text.trim() };
    onSend?.(msg);
    setText('');
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    doSubmit();
  };

  const presetClasses = p ? preset(p) : '';
  const cls = [presetClasses, className].filter(Boolean).join(' ') || undefined;

  return (
    <Panel
      {...rest}
      fullWidth
      variant='alt'
      sx={{ overflowY: 'visible', overflowX: 'hidden', ...sx }}
      className={cls}
    >
      <Wrapper
        ref={wrapRef}
        $gap={theme.spacing(3)}
        style={{ overflow: 'hidden' }}
      >
        <Messages
          ref={messagesRef}
          $gap={theme.spacing(1.5)}
          $pad={theme.spacing(1.5)}
          style={{
            overflowY: 'auto',
            maxHeight,
            scrollbarGutter: 'stable',
            touchAction: 'auto',
          }}
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
                      size='s'
                      variant='outline'
                      sx={{ marginRight: theme.spacing(1) }}
                    />
                  )}
                  <Panel
                    variant='main'
                    background={m.role === 'user' ? theme.colors.primary : undefined}
                    sx={{
                      maxWidth: 'min(75%, 48rem)',
                      width: 'fit-content',
                      borderRadius: theme.spacing(1),
                      padding: theme.spacing(2),
                      animation: m.animate ? `${fadeIn} 0.2s ease-out` : undefined,
                      position: 'relative',
                    }}
                  >
                    <div>
                      {m.name && (
                        <Typography
                          variant='subtitle'
                          bold
                        >
                          {m.name}
                        </Typography>
                      )}
                      {m.typing ? (
                        <Typing
                          $color={m.role === 'user' ? theme.colors.primaryText : theme.colors.text}
                        >
                          <span />
                          <span />
                          <span />
                        </Typing>
                      ) : (
                        content
                      )}
                      {Form && <Form onSubmit={(v: string) => onFormSubmit?.(v, i)} />}
                    </div>
                  </Panel>
                  {m.role === 'user' && userAvatar && (
                    <Avatar
                      src={userAvatar}
                      size='s'
                      variant='outline'
                      sx={{ marginLeft: theme.spacing(1) }}
                    />
                  )}
                </Row>
              );
            })}
        </Messages>

        {!inputDisabled && (
          <form
            ref={inputRef}
            onSubmit={handleSubmit}
            style={{ width: '100%' }}
          >
            <Stack
              direction='row'
              compact
            >
              <TextField
                as='textarea'
                name='chat-message'
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    doSubmit();
                  }
                }}
                rows={1}
                placeholder={placeholder}
                fullWidth
                fontFamily={fontFamily}
              />
              <IconButton
                icon='carbon:send'
                type='submit'
                aria-label='Send'
              />
            </Stack>
          </form>
        )}
      </Wrapper>
    </Panel>
  );
};

export default RichChat;
