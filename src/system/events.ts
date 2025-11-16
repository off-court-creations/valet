// ─────────────────────────────────────────────────────────────
// src/system/events.ts  | valet
// canonical event trio types for value components
// ─────────────────────────────────────────────────────────────
import type * as React from 'react';

export type InputPhase = 'input' | 'commit';
export type InputSource = 'keyboard' | 'pointer' | 'programmatic' | 'clipboard' | 'wheel';

export interface ChangeInfo<T> {
  name?: string;
  previousValue?: T;
  phase: InputPhase;
  source: InputSource;
  event?: React.SyntheticEvent;
  index?: number;
  id?: string;
}

export type OnValueChange<T> = (value: T, info: ChangeInfo<T>) => void;
export type OnValueCommit<T> = (value: T, info: ChangeInfo<T>) => void;
