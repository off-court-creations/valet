// ─────────────────────────────────────────────────────────────
// src/components/widgets/Accordion.tsx | valet
// Fully-typed, theme-aware <Accordion /> component
// – Composition API (Accordion.Item / .Header / .Content)
// – Controlled & uncontrolled modes, single- or multi-expand
// – Seamless preset & theme integration, zero external deps
// – A11y-optimised: roving tab-index, ARIA roles / ids, focus rings
// ─────────────────────────────────────────────────────────────
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useMemo,
  useLayoutEffect,
  useState,
  useId,
  useEffect,
} from 'react';
import type { JSX } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { toRgb, mix, toHex } from '../../helpers/color';
import { useSurface } from '../../system/surfaceStore';
import { shallow } from 'zustand/shallow';
import type { Presettable } from '../../types';
import { Typography } from '../primitives/Typography';

/*───────────────────────────────────────────────────────────*/
/* Context                                                   */
interface Ctx {
  open: number[];
  toggle: (idx: number) => void;
  multiple: boolean;
  headerTag: keyof JSX.IntrinsicElements;
}

const AccordionCtx = createContext<Ctx | null>(null);
const useAccordion = () => {
  const ctx = useContext(AccordionCtx);
  if (!ctx) throw new Error('<Accordion.Item> must be inside <Accordion>');
  return ctx;
};

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
const Root = styled('div')<{ $gap: string }>`
  width: 100%;
  box-sizing: border-box;
  margin: ${({ $gap }) => $gap};
  & > * {
    padding: ${({ $gap }) => $gap};
  }
`;

const Wrapper = styled('div')`
  width: 100%;
  display: block;
  box-sizing: border-box;
  min-height: 0;
`;

const ItemWrapper = styled('div')`
  border-bottom: 1px solid currentColor;
`;

const HeaderBtn = styled('button')<{
  $open: boolean;
  $primary: string;
  $disabledColor: string;
  $highlight: string;
  $shift: string;
  $skipHover: boolean;
  $hoverBg: string;
}>`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem ${({ $shift }) => $shift};
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
  appearance: none;
  box-sizing: border-box;
  margin-inline-start: -${({ $shift }) => $shift};
  margin-inline-end: -${({ $shift }) => $shift};

  /* Disable blue tap-highlight on mobile */
  -webkit-tap-highlight-color: transparent;

  transition: background 200ms ease;

  /* Hover tint – only on devices that actually support hover */
  @media (hover: hover) {
    &:hover:not(:disabled) {
      ${({ $skipHover, $hoverBg }) => ($skipHover ? '' : `background:${$hoverBg};`)}
    }
  }

  ${({ $open, $highlight }) => $open && `background:${$highlight};`}

  &:focus-visible {
    outline: 2px solid ${({ $primary }) => $primary};
    outline-offset: 2px;
  }

  &:disabled {
    color: ${({ $disabledColor }) => $disabledColor};
    cursor: not-allowed;
  }
`;

const Chevron = styled('svg')<{ $open: boolean }>`
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
  transform: rotate(${({ $open }) => ($open ? 0 : 180)}deg);
`;

const Content = styled('div')<{ $open: boolean; $height: number }>`
  overflow: hidden;
  height: ${({ $open, $height }) => ($open ? `${$height}px` : '0')};
  transition: height 300ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: height;
`;

/*───────────────────────────────────────────────────────────*/
/* Public API                                                */
export interface AccordionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Presettable {
  defaultOpen?: number | number[];
  open?: number | number[];
  multiple?: boolean;
  onOpenChange?: (open: number[]) => void;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  constrainHeight?: boolean;
}

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement>, Presettable {
  header: ReactNode;
  index?: number;
  disabled?: boolean;
  children: ReactNode;
}

/*───────────────────────────────────────────────────────────*/
/* Accordion root                                            */
export const Accordion: React.FC<AccordionProps> & {
  Item: React.FC<AccordionItemProps>;
} = ({
  defaultOpen,
  open: openProp,
  multiple = false,
  onOpenChange,
  headingLevel = 3,
  constrainHeight = true,
  preset: p,
  className,
  children,
  ...divProps
}) => {
  const { theme } = useTheme();
  const surface = useSurface(
    (s) => ({
      element: s.element,
      height: s.height,
      registerChild: s.registerChild,
      unregisterChild: s.unregisterChild,
    }),
    shallow,
  );
  const wrapRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();
  const [maxHeight, setMaxHeight] = useState<number>();
  const [shouldConstrain, setShouldConstrain] = useState(false);
  const constraintRef = useRef(false);
  const controlled = openProp !== undefined;
  const toArray = (v?: number | number[]) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

  const [selfOpen, setSelfOpen] = useState(() => toArray(defaultOpen));
  const open = controlled ? toArray(openProp) : selfOpen;

  const toggle = useCallback(
    (idx: number) => {
      let next: number[];
      const isOpen = open.includes(idx);

      if (isOpen) next = open.filter((i) => i !== idx);
      else if (multiple) next = [...open, idx];
      else next = [idx];

      if (!controlled) setSelfOpen(next);
      onOpenChange?.(next);
    },
    [controlled, multiple, onOpenChange, open],
  );

  const ctx = useMemo<Ctx>(
    () => ({
      open,
      toggle,
      multiple,
      headerTag: `h${headingLevel}` as keyof JSX.IntrinsicElements,
    }),
    [open, toggle, multiple, headingLevel],
  );

  const presetClasses = p ? preset(p) : '';

  const calcCutoff = () => {
    if (typeof document === 'undefined') return 32;
    const fs = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return (isNaN(fs) ? 16 : fs) * 2;
  };

  const bottomRef = useRef(0);
  const rafRef = useRef<number>(0);
  const prevHeightRef = useRef<number | undefined>(undefined);
  const prevConstrainedRef = useRef(false);

  const runUpdate = () => {
    const node = wrapRef.current;
    const surfEl = surface.element;
    if (!node || !surfEl) return;
    const sRect = surfEl.getBoundingClientRect();
    const nRect = node.getBoundingClientRect();
    const top = Math.round(nRect.top - sRect.top + surfEl.scrollTop);
    const dynBottom = Math.round(
      surfEl.scrollHeight - (nRect.bottom - sRect.top + surfEl.scrollTop),
    );
    if (!constraintRef.current) bottomRef.current = dynBottom;
    const available = Math.round(surface.height - top - bottomRef.current);
    const cutoff = calcCutoff();

    const shouldClamp = node.scrollHeight - available > 1 && available >= cutoff;

    if (shouldClamp) {
      if (!constraintRef.current) {
        surfEl.scrollTop = 0;
        surfEl.scrollLeft = 0;
      }
      constraintRef.current = true;
      if (!prevConstrainedRef.current) {
        prevConstrainedRef.current = true;
        setShouldConstrain(true);
      }
      const newHeight = Math.max(0, available);
      if (prevHeightRef.current !== newHeight) {
        prevHeightRef.current = newHeight;
        setMaxHeight(newHeight);
      }
    } else {
      constraintRef.current = false;
      bottomRef.current = dynBottom;
      if (prevConstrainedRef.current) {
        prevConstrainedRef.current = false;
        setShouldConstrain(false);
      }
      if (prevHeightRef.current !== undefined) {
        prevHeightRef.current = undefined;
        setMaxHeight(undefined);
      }
    }
  };

  const update = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(runUpdate);
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
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [constrainHeight, surface.element]);

  useLayoutEffect(() => {
    if (!constrainHeight || !wrapRef.current || !surface.element) return;
    update();
  }, [constrainHeight, surface.height, surface.element]);

  return (
    <AccordionCtx.Provider value={ctx}>
      <Wrapper
        ref={wrapRef}
        style={shouldConstrain ? { overflow: 'auto', maxHeight } : undefined}
      >
        <Root
          {...divProps}
          $gap={theme.spacing(1)}
          className={[presetClasses, className].filter(Boolean).join(' ')}
        >
          {React.Children.map(children, (child, idx) =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<any>, {
                  index: idx,
                })
              : child,
          )}
        </Root>
      </Wrapper>
    </AccordionCtx.Provider>
  );
};

/*───────────────────────────────────────────────────────────*/
/* Accordion.Item                                            */
const AccordionItem: React.FC<AccordionItemProps> = ({
  header,
  children,
  disabled = false,
  preset: p,
  className,
  index = 0,
  ...divProps
}) => {
  const { theme, mode } = useTheme();
  const { open, toggle, headerTag } = useAccordion();

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPress = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [skipHover, setSkipHover] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveHandler = useRef<((e: PointerEvent) => void) | null>(null);

  const disableHoverUntilMove = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setSkipHover(true);
    const remove = () => {
      if (moveHandler.current) {
        window.removeEventListener('pointermove', moveHandler.current);
        moveHandler.current = null;
      }
      if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
      }
      setSkipHover(false);
    };
    moveHandler.current = () => remove();
    window.addEventListener('pointermove', moveHandler.current, { once: true });
    hoverTimer.current = setTimeout(remove, 1000);
  };

  const isOpen = open.includes(index);

  useLayoutEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [children, isOpen]);
  const headerId = `acc-btn-${index}`;
  const panelId = `acc-panel-${index}`;

  /* ----- compute disabled colour (greyed-out, mode-aware) -- */
  const disabledColor = toHex(
    mix(toRgb(theme.colors.text), toRgb(mode === 'dark' ? '#000' : '#fff'), 0.4),
  );

  const presetClasses = p ? preset(p) : '';
  const HeaderTag = headerTag as keyof JSX.IntrinsicElements;

  const highlight = toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.15));
  const hoverBg = toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.6));
  const shift = theme.spacing(1);

  return (
    <ItemWrapper
      {...divProps}
      className={[presetClasses, className].filter(Boolean).join(' ')}
    >
      <HeaderTag style={{ margin: 0 }}>
        <HeaderBtn
          id={headerId}
          type='button'
          aria-expanded={isOpen}
          aria-controls={panelId}
          disabled={disabled}
          onClick={() => toggle(index)}
          onContextMenu={(e: React.MouseEvent) => {
            e.preventDefault();
            if (!disabled && !wasLongPress.current) toggle(index);
            wasLongPress.current = false;
          }}
          onPointerDown={(e: React.PointerEvent) => {
            if (hoverTimer.current) {
              clearTimeout(hoverTimer.current);
              hoverTimer.current = null;
            }
            if (moveHandler.current) {
              window.removeEventListener('pointermove', moveHandler.current);
              moveHandler.current = null;
            }
            setSkipHover(true);
            if (e.pointerType === 'touch') {
              longPressTimer.current = setTimeout(() => {
                wasLongPress.current = true;
                if (!disabled) toggle(index);
              }, 500);
            }
          }}
          onPointerUp={() => {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
            wasLongPress.current = false;
            disableHoverUntilMove();
          }}
          onPointerLeave={() => {
            if (hoverTimer.current) {
              clearTimeout(hoverTimer.current);
              hoverTimer.current = null;
            }
            if (moveHandler.current) {
              window.removeEventListener('pointermove', moveHandler.current);
              moveHandler.current = null;
            }
            setSkipHover(false);
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
            wasLongPress.current = false;
          }}
          onPointerCancel={() => {
            if (hoverTimer.current) {
              clearTimeout(hoverTimer.current);
              hoverTimer.current = null;
            }
            if (moveHandler.current) {
              window.removeEventListener('pointermove', moveHandler.current);
              moveHandler.current = null;
            }
            setSkipHover(false);
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
            wasLongPress.current = false;
          }}
          $open={isOpen}
          $primary={theme.colors.primary}
          $disabledColor={disabledColor}
          $highlight={highlight}
          $hoverBg={hoverBg}
          $shift={shift}
          $skipHover={skipHover}
        >
          {typeof header === 'string' || typeof header === 'number' ? (
            <Typography
              variant='subtitle'
              noSelect
              style={{ font: 'inherit' }}
            >
              {header}
            </Typography>
          ) : (
            header
          )}
          <Chevron
            aria-hidden
            $open={isOpen}
            viewBox='0 0 24 24'
          >
            <path
              d='M6 9l6 6 6-6'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </Chevron>
        </HeaderBtn>
      </HeaderTag>

      <Content
        role='region'
        id={panelId}
        aria-labelledby={headerId}
        $open={isOpen}
        $height={height}
      >
        <div
          ref={contentRef}
          style={{ padding: '0.75rem 0' }}
        >
          {children}
        </div>
      </Content>
    </ItemWrapper>
  );
};
AccordionItem.displayName = 'Accordion.Item';
Accordion.Item = AccordionItem;

/*───────────────────────────────────────────────────────────*/
export default Accordion;
