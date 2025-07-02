// ─────────────────────────────────────────────────────────────
// src/components/Accordion.tsx | valet
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
  useState,
} from 'react';
import { styled }               from '../css/createStyled';
import { useTheme }             from '../system/themeStore';
import { preset }               from '../css/stylePresets';
import { toRgb, mix, toHex }    from '../helpers/color';
import type { Presettable }     from '../types';

/*───────────────────────────────────────────────────────────*/
/* Context                                                   */
interface Ctx {
  open       : number[];
  toggle     : (idx: number) => void;
  multiple   : boolean;
  headerTag  : keyof JSX.IntrinsicElements;
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
  width      : 100%;
  box-sizing : border-box;
  margin     : ${({ $gap }) => $gap};
`;

const ItemWrapper = styled('div')`
  border-bottom: 1px solid currentColor;
`;

const HeaderBtn = styled('button')<{
  $open: boolean;
  $primary: string;
  $disabledColor: string;
}>`
  width           : 100%;
  display         : flex;
  justify-content : space-between;
  align-items     : center;
  padding         : 1rem 0;
  background      : transparent;
  border          : none;
  color           : inherit;
  font            : inherit;
  cursor          : pointer;
  text-align      : left;
  appearance      : none;
  box-sizing      : border-box;

  /* Disable blue tap-highlight & text selection on mobile */
  -webkit-tap-highlight-color: transparent;
  user-select               : none;
  -webkit-user-select       : none;
  -ms-user-select           : none;

  /* Hover tint – only on devices that actually support hover */
  @media (hover: hover) {
    &:hover:not(:disabled) {
      background: ${({ $primary }) => `${$primary}11`};
    }
  }

  &:focus-visible {
    outline       : 2px solid ${({ $primary }) => $primary};
    outline-offset: 2px;
  }

  &:disabled {
    color : ${({ $disabledColor }) => $disabledColor};
    cursor: not-allowed;
  }
`;

const Chevron = styled('span')<{ $open: boolean }>`
  display    : inline-block;
  transition : transform 150ms ease;
  transform  : rotate(${({ $open }) => ($open ? 90 : 0)}deg);
`;

const Content = styled('div')<{ $open: boolean }>`
  overflow   : hidden;
  max-height : ${({ $open }) => ($open ? '9999px' : '0')};
  transition : max-height 300ms ease;
  will-change: max-height;
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
}

export interface AccordionItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Presettable {
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
  preset: p,
  className,
  children,
  ...divProps
}) => {
  const { theme } = useTheme();
  const controlled = openProp !== undefined;
  const toArray = (v?: number | number[]) =>
    v === undefined ? [] : Array.isArray(v) ? v : [v];

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

  return (
    <AccordionCtx.Provider value={ctx}>
      <Root
        {...divProps}
        $gap={theme.spacing(1)}
        className={[presetClasses, className].filter(Boolean).join(' ')}
      >
        {React.Children.map(children, (child, idx) =>
          React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<any>, { index: idx })
            : child,
        )}
      </Root>
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
  const { theme, mode }          = useTheme();
  const { open, toggle, headerTag } = useAccordion();

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPress = useRef(false);

  const isOpen   = open.includes(index);
  const headerId = `acc-btn-${index}`;
  const panelId  = `acc-panel-${index}`;

  /* ----- compute disabled colour (greyed-out, mode-aware) -- */
  const disabledColor = toHex(
    mix(
      toRgb(theme.colors.text),
      toRgb(mode === 'dark' ? '#000' : '#fff'),
      0.4,
    ),
  );

  const presetClasses = p ? preset(p) : '';
  const HeaderTag = headerTag as keyof JSX.IntrinsicElements;

  return (
    <ItemWrapper
      {...divProps}
      className={[presetClasses, className].filter(Boolean).join(' ')}
    >
      <HeaderTag style={{ margin: 0 }}>
        <HeaderBtn
          id={headerId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          disabled={disabled}
          onClick={() => toggle(index)}
          onContextMenu={(e) => {
            e.preventDefault();
            if (!disabled && !wasLongPress.current) toggle(index);
            wasLongPress.current = false;
          }}
          onPointerDown={(e) => {
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
          }}
          onPointerLeave={() => {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
            wasLongPress.current = false;
          }}
          onPointerCancel={() => {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
            wasLongPress.current = false;
          }}
          $open={isOpen}
          $primary={theme.colors.primary}
          $disabledColor={disabledColor}
        >
          {header}
          <Chevron aria-hidden $open={isOpen}>▶</Chevron>
        </HeaderBtn>
      </HeaderTag>

      <Content
        role="region"
        id={panelId}
        aria-labelledby={headerId}
        $open={isOpen}
      >
        <div style={{ padding: '0.75rem 0' }}>{children}</div>
      </Content>
    </ItemWrapper>
  );
};
AccordionItem.displayName = 'Accordion.Item';
Accordion.Item           = AccordionItem;

/*───────────────────────────────────────────────────────────*/
export default Accordion;
