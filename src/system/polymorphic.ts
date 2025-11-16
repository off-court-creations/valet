// ─────────────────────────────────────────────────────────────
// src/system/polymorphic.ts  | valet
// typing helpers for polymorphic components (`as` prop)
// ─────────────────────────────────────────────────────────────
import * as React from 'react';

export type PropsOf<E extends React.ElementType> = React.ComponentPropsWithRef<E>;

export type PolymorphicRef<E extends React.ElementType> = React.ComponentPropsWithRef<E>['ref'];

export type MergeProps<A, B> = Omit<A, keyof B> & B;

export type PolymorphicProps<E extends React.ElementType, OwnProps> = MergeProps<
  PropsOf<E>,
  OwnProps & { as?: E }
> & { ref?: PolymorphicRef<E> };

export interface PolymorphicComponent<DefaultE extends React.ElementType, OwnProps> {
  <E extends React.ElementType = DefaultE>(
    props: PolymorphicProps<E, OwnProps>,
  ): React.ReactElement | null;
  displayName?: string;
}

export function createPolymorphicComponent<DefaultE extends React.ElementType, OwnProps>(
  render: <E extends React.ElementType = DefaultE>(
    props: PolymorphicProps<E, OwnProps>,
    ref: PolymorphicRef<E>,
  ) => React.ReactElement | null,
): PolymorphicComponent<DefaultE, OwnProps> {
  // Relaxed typing for forwardRef without using `any`, while preserving ref safety.
  return React.forwardRef(
    render as unknown as React.ForwardRefRenderFunction<Element>,
  ) as unknown as PolymorphicComponent<DefaultE, OwnProps>;
}
