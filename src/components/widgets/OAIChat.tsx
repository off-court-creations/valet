// ─────────────────────────────────────────────────────────────
// src/components/widgets/OAIChat.tsx  | valet
// OpenAI style chat component with height constraint
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
import Avatar from '../primitives/Avatar';
import KeyModal from '../KeyModal';
import Select from '../fields/Select';
import { useAIKey, AIProvider } from '../../system/aiKeyStore';
import type { Presettable } from '../../types';

const models: Record<AIProvider, string[]> = {
  openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: [
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ],
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
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'>,
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
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
const Wrapper = styled('div') <{ $gap: string }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => $gap};
`;

const Messages = styled('div') <{ $gap: string }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => $gap};
`;

const Row = styled('div') <{
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


const Bar = styled('div')<{ $bg: string; $text: string; $gap: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  & > * {
    padding: ${({ $gap }) => $gap};
  }
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
export const OAIChat: React.FC<ChatProps> = ({
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
  preset: p,
  className,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const surface = useSurface(
    s => ({
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
  const {
    apiKey: storeKey,
    provider: storeProv,
    model: storeModel,
    setModel,
  } = useAIKey();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const key = propKey ?? storeKey;
  const provider = (propProvider ?? storeProv) as AIProvider | null;
  const [model, setModelLocal] = useState(
    propModel ?? storeModel ?? (provider ? models[provider][0] : ''),
  );

  useEffect(() => {
    if (propModel) setModelLocal(propModel);
  }, [propModel]);

  useEffect(() => {
    if (!propModel && provider) {
      const m = storeModel ?? models[provider][0];
      setModelLocal(m);
    }
  }, [provider, storeModel, propModel]);

  const handleModelChange = (m: string) => {
    if (!propModel) {
      setModelLocal(m);
      setModel(m);
    }
    onModelChange?.(m);
  };

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

  const cls = [presetClasses, className].filter(Boolean).join(' ') || undefined;

  return (
    <>
      {!propKey && (
        <KeyModal open={showKeyModal} onClose={() => setShowKeyModal(false)} />
      )}
      <Panel
        {...rest}
        compact
        fullWidth
        variant="alt"
        style={style}
        className={cls}
      >
        <Bar $bg={theme.colors.secondary} $text={theme.colors.secondaryText} $gap={theme.spacing(0.5)}>
          {provider && key ? (
            <Select
              size="sm"
              value={model}
              onChange={(v) => handleModelChange(v as string)}
            >
              {models[provider].map(m => (
                <Select.Option key={m} value={m}>{m}</Select.Option>
              ))}
            </Select>
          ) : (
            <span />
          )}
          <span
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: theme.spacing(0.5) }}
            onClick={() => !propKey && setShowKeyModal(true)}
          >
            <Typography variant="subtitle">
              {key ? 'Connected' : 'Disconnected'}
            </Typography>
            <IconButton
              icon={key ? 'carbon:checkmark' : 'carbon:circle-dash'}
              aria-label="Set API key"
            />
          </span>
        </Bar>
        <Wrapper ref={wrapRef} $gap={theme.spacing(3)} style={{ overflow: 'hidden' }}>
        <Messages
          $gap={theme.spacing(1.5)}
          style={shouldConstrain ? { overflowY: 'auto', maxHeight } : undefined}
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
                ) : (
                  <Typography>{m.content}</Typography>
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
    </>
  );
};

export default OAIChat;
