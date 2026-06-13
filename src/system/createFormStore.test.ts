// ─────────────────────────────────────────────────────────────
// src/system/createFormStore.test.ts  | valet
// contract baseline for createFormStore (node environment)
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import { createFormStore } from './createFormStore';
import type { FormStore } from './createFormStore';

/** Fresh defaults per test – includes object/array fields for identity checks. */
const makeInitial = () => ({
  email: '',
  attempts: 0,
  meta: { locale: 'en-US' },
  tags: ['alpha', 'beta'],
});

describe('createFormStore', () => {
  describe('public contract surface', () => {
    it('returns a callable hook exposing the zustand store API', () => {
      const useForm = createFormStore(makeInitial());
      expect(typeof useForm).toBe('function');
      expect(typeof useForm.getState).toBe('function');
      expect(typeof useForm.setState).toBe('function');
      expect(typeof useForm.subscribe).toBe('function');
    });

    it('exposes exactly values / setField / reset on state', () => {
      const useForm = createFormStore(makeInitial());
      const state: FormStore<ReturnType<typeof makeInitial>> = useForm.getState();
      expect(Object.keys(state).sort()).toEqual(['reset', 'setField', 'values']);
      expect(typeof state.setField).toBe('function');
      expect(typeof state.reset).toBe('function');
    });
  });

  describe('initial values', () => {
    it('seeds values from the initial object', () => {
      const useForm = createFormStore(makeInitial());
      expect(useForm.getState().values).toEqual(makeInitial());
    });

    it('holds the exact initial reference – no defensive clone', () => {
      const initial = makeInitial();
      const useForm = createFormStore(initial);
      expect(useForm.getState().values).toBe(initial);
      expect(useForm.getState().values.meta).toBe(initial.meta);
    });
  });

  describe('setField', () => {
    it('updates the targeted field only', () => {
      const useForm = createFormStore(makeInitial());
      useForm.getState().setField('email', 'a@b.dev');
      expect(useForm.getState().values).toEqual({
        ...makeInitial(),
        email: 'a@b.dev',
      });
    });

    it('replaces values with a new object on every write', () => {
      const useForm = createFormStore(makeInitial());
      const before = useForm.getState().values;
      useForm.getState().setField('attempts', 1);
      const after = useForm.getState().values;
      expect(after).not.toBe(before);

      // Even an identity write (same value) produces a fresh values object –
      // there is no equality bail-out at the store level.
      useForm.getState().setField('attempts', 1);
      expect(useForm.getState().values).not.toBe(after);
      expect(useForm.getState().values).toEqual(after);
    });

    it('keeps the identity of unchanged fields', () => {
      const useForm = createFormStore(makeInitial());
      const before = useForm.getState().values;
      useForm.getState().setField('email', 'a@b.dev');
      const after = useForm.getState().values;
      expect(after.meta).toBe(before.meta);
      expect(after.tags).toBe(before.tags);
      expect(after.attempts).toBe(before.attempts);
    });

    it('never mutates the caller-supplied initial object', () => {
      const initial = makeInitial();
      const useForm = createFormStore(initial);
      useForm.getState().setField('email', 'a@b.dev');
      useForm.getState().setField('attempts', 3);
      expect(initial).toEqual(makeInitial());
    });

    it('keeps setField / reset function identity stable across writes', () => {
      const useForm = createFormStore(makeInitial());
      const { setField, reset } = useForm.getState();
      setField('attempts', 5);
      reset();
      expect(useForm.getState().setField).toBe(setField);
      expect(useForm.getState().reset).toBe(reset);
    });

    it('notifies subscribers with next and previous state', () => {
      const useForm = createFormStore(makeInitial());
      const calls: Array<{ next: string; prev: string }> = [];
      const unsubscribe = useForm.subscribe((next, prev) => {
        calls.push({ next: next.values.email, prev: prev.values.email });
      });
      useForm.getState().setField('email', 'a@b.dev');
      expect(calls).toEqual([{ next: 'a@b.dev', prev: '' }]);
      unsubscribe();
      useForm.getState().setField('email', 'c@d.dev');
      expect(calls).toHaveLength(1);
    });
  });

  describe('reset', () => {
    it('restores every field to its default after multiple writes', () => {
      const useForm = createFormStore(makeInitial());
      useForm.getState().setField('email', 'a@b.dev');
      useForm.getState().setField('attempts', 2);
      useForm.getState().setField('meta', { locale: 'fr-FR' });
      useForm.getState().reset();
      expect(useForm.getState().values).toEqual(makeInitial());
    });

    it('restores the exact initial reference, not a copy', () => {
      const initial = makeInitial();
      const useForm = createFormStore(initial);
      useForm.getState().setField('email', 'a@b.dev');
      useForm.getState().reset();
      expect(useForm.getState().values).toBe(initial);
    });
  });

  describe('store independence', () => {
    it('separate stores never share state', () => {
      const useFormA = createFormStore(makeInitial());
      const useFormB = createFormStore(makeInitial());
      useFormA.getState().setField('email', 'only-a@b.dev');
      expect(useFormB.getState().values.email).toBe('');
      useFormB.getState().setField('attempts', 9);
      expect(useFormA.getState().values.attempts).toBe(0);
      expect(useFormA.getState().values.email).toBe('only-a@b.dev');
    });

    it('stores built from one shared initial object stay isolated (copy-on-write)', () => {
      const shared = makeInitial();
      const useFormA = createFormStore(shared);
      const useFormB = createFormStore(shared);
      useFormA.getState().setField('email', 'a@b.dev');
      expect(useFormB.getState().values).toBe(shared);
      expect(useFormB.getState().values.email).toBe('');
    });
  });

  describe('compile-time field typing', () => {
    it('rejects unknown keys and mismatched value types', () => {
      const useForm = createFormStore(makeInitial());
      // Never executed – exists purely so tsc enforces the generic contract.
      const assertTypes = () => {
        // @ts-expect-error unknown field names are rejected
        useForm.getState().setField('missing', 1);
        // @ts-expect-error value type must match the field's type
        useForm.getState().setField('attempts', 'not-a-number');
        useForm.getState().setField('attempts', 1);
      };
      expect(typeof assertTypes).toBe('function');
    });
  });
});
