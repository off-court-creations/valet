// ─────────────────────────────────────────────────────────────
// src/components/fields/MetroSelect.tsx | valet
// windows 8 start screen style grid select
// ─────────────────────────────────────────────────────────────
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import Stack from '../layout/Stack';
import Panel from '../layout/Panel';
import { Icon } from '../primitives/Icon';
import { Typography } from '../primitives/Typography';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';

export type Primitive = string | number;

interface MetroCtx {
  value: Primitive | null;
  setValue: (v: Primitive) => void;
}

const MetroCtx = createContext<MetroCtx | null>(null);
const useMetro = () => {
  const ctx = useContext(MetroCtx);
  if (!ctx) throw new Error('MetroSelect.Option must be inside MetroSelect');
  return ctx;
};

export interface MetroSelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Presettable {
  value?: Primitive;
  defaultValue?: Primitive;
  gap?: number | string;
  onChange?: (v: Primitive) => void;
  children: React.ReactNode;
}

export interface MetroOptionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Presettable {
  value: Primitive;
  icon: string | React.ReactElement;
  label: React.ReactNode;
  disabled?: boolean;
}

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
  const { theme } = useTheme();
  const { value: sel, setValue } = useMetro();

  const selected = sel !== null && String(sel) === String(value);

  const presetCls = p ? preset(p) : '';

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
  };

  return (
    <Panel
      {...rest}
      variant="alt"
      compact
      onClick={() => !disabled && setValue(value)}
      style={{
        width: '6rem',
        height: '6rem',
        overflow: 'hidden',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: selected ? theme.colors.primary : undefined,
        background: selected ? theme.colors.primary : undefined,
        color: selected ? theme.colors.primaryText : undefined,
        ...style,
      }}
      className={[presetCls, className].filter(Boolean).join(' ')}
    >
      <div style={innerStyle}>
          {typeof icon === 'string' ? (
          <Icon icon={icon} size="lg" />
        ) : (
          <Icon size="lg">{icon}</Icon>
        )}
        <Typography variant="h6" centered noSelect>
          {label}
        </Typography>
      </div>
    </Panel>
  );
};
Option.displayName = 'MetroSelect.Option';

export interface MetroSelectComponent
  extends React.FC<MetroSelectProps> {
  Option: React.FC<MetroOptionProps>;
}

export const MetroSelect: MetroSelectComponent = ({
  value: valueProp,
  defaultValue,
  gap = 0,
  onChange,
  preset: p,
  className,
  style,
  children,
  ...rest
}) => {
    const controlled = valueProp !== undefined;
    const [self, setSelf] = useState<Primitive | null>(defaultValue ?? null);

    const val = controlled ? valueProp! : self;

    const setValue = useCallback(
      (v: Primitive) => {
        if (!controlled) setSelf(v);
        onChange?.(v);
      },
      [controlled, onChange],
    );

    const presetCls = p ? preset(p) : '';

    const ctx = useMemo<MetroCtx>(
      () => ({ value: val ?? null, setValue }),
      [val, setValue],
    );

    return (
      <MetroCtx.Provider value={ctx}>
        <Stack
          direction="row"
          wrap
          spacing={0.5 * Number(gap)}
          compact
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
