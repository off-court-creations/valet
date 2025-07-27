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
import { Grid } from '../layout/Grid';
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
  columns?: number;
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
  size?: number | string;
}

export const Option: React.FC<MetroOptionProps> = ({
  value,
  icon,
  label,
  disabled = false,
  size = '6rem',
  preset: p,
  style,
  className,
  ...rest
}) => {
  const { theme } = useTheme();
  const { value: sel, setValue } = useMetro();

  const selected = sel !== null && String(sel) === String(value);

  const dim = typeof size === 'number' ? `${size}px` : String(size);
  const presetCls = p ? preset(p) : '';

  return (
    <Panel
      {...rest}
      variant="alt"
      onClick={() => !disabled && setValue(value)}
      style={{
        width: dim,
        height: dim,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing(0.5),
        borderColor: selected ? theme.colors.primary : undefined,
        background: selected ? theme.colors.primary : undefined,
        color: selected ? theme.colors.primaryText : undefined,
        ...style,
      }}
      className={[presetCls, className].filter(Boolean).join(' ')}
    >
      {typeof icon === 'string' ? (
        <Icon icon={icon} size="xl" />
      ) : (
        <Icon size="xl">{icon}</Icon>
      )}
      <Typography variant="h5" centered>
        {label}
      </Typography>
    </Panel>
  );
};
Option.displayName = 'MetroSelect.Option';

export const MetroSelect: React.FC<MetroSelectProps> = ({
  value: valueProp,
  defaultValue,
  columns = 3,
  gap = 2,
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
        <Grid
          columns={columns}
          gap={gap}
          {...rest}
          style={style}
          className={[presetCls, className].filter(Boolean).join(' ')}
        >
          {children}
        </Grid>
      </MetroCtx.Provider>
    );
  };

MetroSelect.displayName = 'MetroSelect';
(MetroSelect as any).Option = Option;

export default MetroSelect;
