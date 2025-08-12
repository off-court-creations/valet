// ─────────────────────────────────────────────────────────────
// src/components/fields/MetroSelect.tsx | valet
// windows 8 start screen style grid select
// patch: add valet-esque hover tint on options – 2025‑08‑12
// patch: support multiple selection via `multiple` prop – 2025‑08‑12
// ─────────────────────────────────────────────────────────────
/* eslint-disable react/prop-types */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Stack from '../layout/Stack';
import Panel from '../layout/Panel';
import { Icon } from '../primitives/Icon';
import { Typography } from '../primitives/Typography';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { toHex, toRgb, mix } from '../../helpers/color';
import type { Presettable } from '../../types';
import { styled } from '../../css/createStyled';

export type Primitive = string | number;

interface MetroCtx {
  value: Primitive | Primitive[] | null;
  setValue: (v: Primitive) => void;
  multiple: boolean;
}

const MetroCtx = createContext<MetroCtx | null>(null);
const useMetro = () => {
  const ctx = useContext(MetroCtx);
  if (!ctx) throw new Error('MetroSelect.Option must be inside MetroSelect');
  return ctx;
};

export interface MetroSelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'value' | 'defaultValue'>,
    Presettable {
  value?: Primitive | Primitive[];
  defaultValue?: Primitive | Primitive[];
  gap?: number | string;
  multiple?: boolean;
  onChange?: (v: Primitive | Primitive[]) => void;
  children: React.ReactNode;
}

export interface MetroOptionProps extends React.HTMLAttributes<HTMLDivElement>, Presettable {
  value: Primitive;
  icon: string | React.ReactElement;
  label: React.ReactNode;
  disabled?: boolean;
}

const HoverWrap = styled('div')<{
  $hoverBg: string;
  $hoverSelBg: string;
  $disabled: boolean;
  $selected: boolean;
}>`
  position: relative;
  display: inline-block;
  /* Ensure the wrapper does not interfere with layout sizing */
  vertical-align: top;

  .valet-hover-bg {
    position: absolute;
    inset: 0;
    background: transparent;
    pointer-events: none;
    transition: background 120ms ease;
    z-index: 0;
  }

  /* Only apply hover on devices that actually support it */
  @media (hover: hover) {
    &:hover .valet-hover-bg {
      ${({ $disabled, $selected, $hoverBg, $hoverSelBg }) =>
        $disabled ? '' : `background: ${$selected ? $hoverSelBg : $hoverBg};`}
    }
  }
`;

export const Option: React.FC<MetroOptionProps> = ({
  value,
  icon,
  label,
  disabled = false,
  preset: p,
  style,
  className,
  ...rest
}) => {
  const { theme, mode } = useTheme();
  const { value: sel, setValue } = useMetro();

  const selected = Array.isArray(sel)
    ? sel.findIndex((x) => String(x) === String(value)) !== -1
    : sel !== null && String(sel) === String(value);

  const presetCls = p ? preset(p) : '';

  const disabledColor = useMemo(
    () => toHex(mix(toRgb(theme.colors.text), toRgb(mode === 'dark' ? '#000' : '#fff'), 0.4)),
    [theme, mode],
  );

  /* Shared valet hover tone: primary mixed into background */
  const hoverBg = useMemo(
    () => toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.25)),
    [theme],
  );
  // For selected tiles, nudge primary toward text similarly to DateSelector
  const hoverSelBg = useMemo(
    () => toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.text), 0.3)),
    [theme],
  );

  const innerStyle: React.CSSProperties = {
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    height: '100%',
    width: '100%',
    position: 'relative',
    zIndex: 1, // keep content above hover layer
  };

  return (
    <HoverWrap
      $hoverBg={hoverBg}
      $hoverSelBg={hoverSelBg}
      $disabled={!!disabled}
      $selected={selected && !disabled}
      className={[presetCls, className].filter(Boolean).join(' ')}
    >
      <Panel
        {...rest}
        variant='alt'
        compact
        onClick={() => !disabled && setValue(value)}
        style={{
          width: '6rem',
          height: '6rem',
          overflow: 'hidden',
          position: 'relative', // anchor hover layer
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderColor:
            selected && !disabled ? theme.colors.primary : disabled ? disabledColor : undefined,
          background: selected && !disabled ? theme.colors.primary : undefined,
          color: disabled ? disabledColor : selected ? theme.colors.primaryText : undefined,
          opacity: disabled ? 0.45 : 1,
          transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease',
          ...style,
        }}
      >
        <div className='valet-hover-bg' />
        <div style={innerStyle}>
          {typeof icon === 'string' ? (
            <Icon
              icon={icon}
              size='lg'
            />
          ) : (
            <Icon size='lg'>{icon}</Icon>
          )}
          <Typography
            variant='h6'
            centered
            noSelect
          >
            {label}
          </Typography>
        </div>
      </Panel>
    </HoverWrap>
  );
};
Option.displayName = 'MetroSelect.Option';

export interface MetroSelectComponent extends React.FC<MetroSelectProps> {
  Option: React.FC<MetroOptionProps>;
}

export const MetroSelect: MetroSelectComponent = ({
  value: valueProp,
  defaultValue,
  gap = 0,
  onChange,
  multiple = false,
  preset: p,
  className,
  style,
  children,
  ...rest
}) => {
  const controlled = valueProp !== undefined;
  const [self, setSelf] = useState<Primitive | Primitive[] | null>(defaultValue ?? null);

  const val = controlled ? (valueProp as Primitive | Primitive[] | null) : self;

  const setValue = useCallback(
    (v: Primitive) => {
      if (multiple) {
        const current = Array.isArray(val) ? val : [];
        const idx = current.findIndex((x) => String(x) === String(v));
        const next = idx === -1 ? [...current, v] : current.filter((_, i) => i !== idx);
        if (!controlled) setSelf(next);
        onChange?.(next);
      } else {
        if (!controlled) setSelf(v);
        onChange?.(v);
      }
    },
    [controlled, multiple, onChange, val],
  );

  const presetCls = p ? preset(p) : '';

  const ctx = useMemo<MetroCtx>(() => ({ value: val ?? null, setValue, multiple }), [val, setValue, multiple]);

  return (
    <MetroCtx.Provider value={ctx}>
      <Stack
        direction='row'
        wrap
        compact
        gap={gap}
        {...rest}
        style={style}
        className={[presetCls, className].filter(Boolean).join(' ')}
      >
        {children}
      </Stack>
    </MetroCtx.Provider>
  );
};

MetroSelect.displayName = 'MetroSelect';
MetroSelect.Option = Option;

export default MetroSelect;
