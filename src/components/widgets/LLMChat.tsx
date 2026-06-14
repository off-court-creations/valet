// ─────────────────────────────────────────────────────────────
// src/components/widgets/LLMChat.tsx  | valet
// LLM-style chat component with height constraint
//
// SCOPE: this is a PRESENTATIONAL shell. It renders the message list, a model
// picker, and an input box, and emits typed messages via `onSend` — it does
// NOT call the AI provider. There is no `sendChat` here; wiring the request
// (and owning the key) is the consumer's job. The model picker is seeded from
// the built-in `DEFAULT_MODELS` catalog below, which is a convenience default
// kept loosely current — override it with the `models` prop to advertise the
// exact set your integration supports (the catalog will drift from providers'
// real availability between releases). See src/system/aiKeyStore.ts for the
// dev-tool security posture of the key store this widget's KeyModal feeds.
// ─────────────────────────────────────────────────────────────
import React, {
  useState,
  useRef,
  useId,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
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
import KeyModal from './KeyModal';
import Select from '../fields/Select';
import { useAIKey, AIProvider } from '../../system/aiKeyStore';
import { useComponentStrings } from '../../system/locale';
import type { DeepPartialStrings, ValetStrings } from '../../system/locale';
import type { Presettable, Sx, SpacingProps } from '../../types';
import { CompactCtx, useCompact } from '../../system/compactContext';

/**
 * Built-in model catalog for the picker, keyed by provider. This is a
 * convenience default that is kept loosely current and WILL drift from each
 * provider's real availability between releases — pass the `models` prop to
 * advertise the exact set your integration supports.
 */
export const DEFAULT_MODELS: Record<AIProvider, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1'],
  anthropic: ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
};

/*───────────────────────────────────────────────────────────*/
/* Types                                                      */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string;
  name?: string;
  /** Show animated typing indicator */
  typing?: boolean;
  /** Apply fade animation when first rendered */
  animate?: boolean;
}

export interface ChatProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit' | 'style'>,
    Pick<SpacingProps, 'compact'>,
    Presettable {
  messages: ChatMessage[];
  onSend?: (message: ChatMessage) => void;
  /** Avatar image for user messages */
  userAvatar?: string;
  /** Avatar image for system / assistant messages */
  systemAvatar?: string;
  placeholder?: string;
  disableInput?: boolean;
  constrainHeight?: boolean;
  apiKey?: string;
  provider?: AIProvider;
  model?: string;
  onModelChange?: (m: string) => void;
  /**
   * Override the model picker's options. When omitted, the built-in
   * {@link DEFAULT_MODELS} catalog for the active provider is used. Supply
   * this to advertise the exact models your integration supports — the
   * built-in defaults are a convenience and drift from provider availability.
   */
  models?: string[];
  /**
   * Instance-level overrides for this component's i18n strings (the set-API-key
   * and send button aria-labels). Wins over the `ValetLocaleProvider` value,
   * which in turn wins over the built-in English defaults (A11Y S8 resolution
   * contract; see `src/system/locale.tsx`). The Connected/Disconnected status
   * text stays with the KeyModal flow (deferred pending Q8).
   */
  labels?: DeepPartialStrings<ValetStrings['llmChat']>;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
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
  justify-content: ${({ $from }) => ($from === 'user' ? 'flex-end' : 'flex-start')};
  padding-inline-start: ${({ $left }) => $left};
  padding-inline-end: ${({ $right }) => $right};
`;

const Bar = styled('div')<{ $bg: string; $text: string; $gap: string; $pad: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ $pad }) => $pad};
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  /* Consumers can space inner content explicitly; no blanket child padding */
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
  /* A11Y S5 — reduced motion: drop the bouncing dots but keep them
     visible at full opacity so the typing indicator still shows. */
  @media (prefers-reduced-motion: reduce) {
    & span {
      animation: none;
      opacity: 1;
    }
  }
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                  */
export const LLMChat: React.FC<ChatProps> = ({
  messages,
  onSend,
  userAvatar,
  systemAvatar,
  placeholder = 'Message…',
  disableInput = false,
  constrainHeight = true,
  apiKey: propKey,
  provider: propProvider,
  model: propModel,
  onModelChange,
  models: modelsProp,
  preset: p,
  className,
  labels,
  compact: compactProp,
  sx,
  ...rest
}) => {
  const { theme } = useTheme();
  const compact = useCompact(compactProp);
  const t = useComponentStrings('llmChat', labels);
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
  const { apiKey: storeKey, provider: storeProv, model: storeModel, setModel } = useAIKey();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const key = propKey ?? storeKey;
  const provider = (propProvider ?? storeProv) as AIProvider | null;
  // Effective picker options: caller `models` prop wins; otherwise the
  // provider's built-in DEFAULT_MODELS catalog (empty until a provider is set).
  const modelOptions = useMemo(
    () => modelsProp ?? (provider ? DEFAULT_MODELS[provider] : []),
    [modelsProp, provider],
  );
  const [model, setModelLocal] = useState(propModel ?? storeModel ?? modelOptions[0] ?? '');

  useEffect(() => {
    if (propModel) setModelLocal(propModel);
  }, [propModel]);

  useEffect(() => {
    if (!propModel && provider) {
      const m = storeModel ?? modelOptions[0] ?? '';
      setModelLocal(m);
    }
  }, [provider, storeModel, propModel, modelOptions]);

  const handleModelChange = (m: string) => {
    if (!propModel) {
      setModelLocal(m);
      setModel(m);
    }
    onModelChange?.(m);
  };

  const calcCutoff = () => {
    if (typeof document === 'undefined') return 32;
    const fs = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return (isNaN(fs) ? 16 : fs) * 2;
  };

  const update = useCallback(() => {
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
      // Do not reset parent scroll when enabling constraint.
      constraintRef.current = true;
      setShouldConstrain(true);
      setMaxHeight(Math.max(0, available));
    } else {
      constraintRef.current = false;
      setShouldConstrain(false);
      setMaxHeight(undefined);
    }
  }, [surface.element, surface.height]);

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
  }, [constrainHeight, surface, uniqueId, update]);

  useLayoutEffect(() => {
    if (!constrainHeight || !wrapRef.current || !surface.element) return;
    update();
  }, [constrainHeight, surface.height, surface.element, update]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const msg: ChatMessage = { role: 'user', content: text.trim() };
    onSend?.(msg);
    setText('');
  };

  const presetClasses = p ? preset(p) : '';

  const cls = [presetClasses, className].filter(Boolean).join(' ') || undefined;

  // A11Y S2: the message list is a live log. While the assistant is composing
  // (any rendered message carries `typing`), mark it busy so assistive tech
  // holds announcements until the turn settles.
  const isTyping = messages.some((m) => m.role !== 'system' && m.typing);

  return (
    <>
      {!propKey && (
        <KeyModal
          open={showKeyModal}
          onClose={() => setShowKeyModal(false)}
        />
      )}
      <Panel
        {...rest}
        compact
        fullWidth
        variant='outlined'
        sx={sx}
        className={cls}
      >
        <CompactCtx.Provider value={compact}>
          <Bar
            $bg={theme.colors.secondary}
            $text={theme.colors.secondaryText}
            $gap={theme.spacing(0.5)}
            $pad={`${theme.spacing(1)} ${theme.spacing(2)}`}
          >
            {provider && key ? (
              <Select
                size='sm'
                value={model}
                onValueChange={(v) => handleModelChange(v as string)}
              >
                {modelOptions.map((m) => (
                  <Select.Option
                    key={m}
                    value={m}
                  >
                    {m}
                  </Select.Option>
                ))}
              </Select>
            ) : (
              <span />
            )}
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                gap: theme.spacing(0.5),
              }}
              onClick={() => !propKey && setShowKeyModal(true)}
            >
              <Typography variant='subtitle'>{key ? 'Connected' : 'Disconnected'}</Typography>
              <IconButton
                icon={key ? 'carbon:checkmark' : 'carbon:circle-dash'}
                aria-label={t.setApiKey}
              />
            </span>
          </Bar>
          <Wrapper
            ref={wrapRef}
            $gap={theme.spacing(3)}
            style={{ overflow: 'hidden' }}
          >
            <Messages
              role='log'
              aria-relevant='additions'
              aria-busy={isTyping}
              $gap={theme.spacing(1.5)}
              style={shouldConstrain ? { overflowY: 'auto', maxHeight } : undefined}
            >
              {messages
                .filter((m) => m.role !== 'system')
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
                          size='sm'
                          variant='outline'
                          sx={{ marginRight: theme.spacing(1) }}
                        />
                      )}
                      <Panel
                        compact
                        variant='filled'
                        color={m.role === 'user' ? theme.colors.primary : undefined}
                        sx={{
                          maxWidth: '100%',
                          width: 'fit-content',
                          borderRadius: theme.spacing(0.5),
                          animation: m.animate ? `${fadeIn} 0.2s ease-out` : undefined,
                        }}
                      >
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
                            $color={
                              m.role === 'user' ? theme.colors.primaryText : theme.colors.text
                            }
                          >
                            <span />
                            <span />
                            <span />
                          </Typing>
                        ) : m.role === 'assistant' ? (
                          <Markdown
                            data={m.content}
                            codeBackground={theme.colors.background}
                          />
                        ) : (
                          <Typography>{m.content}</Typography>
                        )}
                      </Panel>
                      {m.role === 'user' && userAvatar && (
                        <Avatar
                          src={userAvatar}
                          size='sm'
                          variant='outline'
                          sx={{ marginLeft: theme.spacing(1) }}
                        />
                      )}
                    </Row>
                  );
                })}
            </Messages>

            {!disableInput && (
              <form
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
                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const form = e.currentTarget.form;
                        form?.requestSubmit();
                      }
                    }}
                    rows={1}
                    placeholder={placeholder}
                    fullWidth
                  />
                  <IconButton
                    icon='carbon:send'
                    type='submit'
                    aria-label={t.send}
                  />
                </Stack>
              </form>
            )}
          </Wrapper>
        </CompactCtx.Provider>
      </Panel>
    </>
  );
};

export default LLMChat;
