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
import { styled } from '../../css/createStyled';
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

const Container = styled('div')<{ $gap: string }>`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ $gap }) => $gap};
`;

export interface MetroSelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Presettable {
  value?: Primitive;
  defaultValue?: Primitive;
  /** Spacing between option tiles */
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

  const innerStyle: React.CSSProperties = {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(0.25),
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
        width: dim,
        height: dim,
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
          <Icon icon={icon} size="xl" />
        ) : (
          <Icon size="xl">{icon}</Icon>
        )}
        <Typography variant="h5" centered>
          {label}
        </Typography>
      </div>
    </Panel>
  );
};
Option.displayName = 'MetroSelect.Option';

export const MetroSelect: React.FC<MetroSelectProps> = ({
  value: valueProp,
  defaultValue,
  gap = 4,
  onChange,
  preset: p,
  className,
  style,
  children,
  ...rest
}) => {
    const { theme } = useTheme();
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
    const g = typeof gap === 'number' ? theme.spacing(gap) : String(gap);

    const ctx = useMemo<MetroCtx>(
      () => ({ value: val ?? null, setValue }),
      [val, setValue],
    );

    return (
      <MetroCtx.Provider value={ctx}>
        <Container
          {...rest}
          $gap={g}
          style={style}
          className={[presetCls, className].filter(Boolean).join(' ')}
        >
          {children}
        </Container>
      </MetroCtx.Provider>
    );
  };

MetroSelect.displayName = 'MetroSelect';
(MetroSelect as any).Option = Option;

export default MetroSelect;
