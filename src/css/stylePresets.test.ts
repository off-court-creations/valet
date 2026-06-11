// ─────────────────────────────────────────────────────────────
// src/css/stylePresets.test.ts | valet
// node-env coverage for definePreset redefine semantics (ruling R5:
// replace + warnOnce, never throw) and the pending-rule path
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import { definePreset, preset } from './stylePresets';
import { getPendingRules } from './sheet';
import { resetWarnOnce } from '../system/devErrors';
import { useTheme } from '../system/themeStore';

afterEach(() => {
  vi.restoreAllMocks();
  resetWarnOnce();
  useTheme.getState().resetTheme();
});

describe('stylePresets (node)', () => {
  it('redefining a preset replaces it, warns once per name and never throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    definePreset('redefine-me', () => 'color: red;');
    const cls = preset('redefine-me');
    expect(warn).not.toHaveBeenCalled();

    /* Pre-overhaul this threw `Style preset “…” already exists` */
    expect(() => definePreset('redefine-me', () => 'color: green;')).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('redefine-me');

    /* warnOnce: a third registration stays silent */
    definePreset('redefine-me', () => 'color: blue;');
    expect(warn).toHaveBeenCalledTimes(1);

    /* The class name never changes — it hashes the NAME */
    expect(preset('redefine-me')).toBe(cls);

    /* Node has no live rule to swap, so each distinct body is recorded;
       the LAST pending rule for the class is the latest registration
       (same selector ⇒ last-in wins on flush) */
    const mine = getPendingRules().filter((t) => t.startsWith(`.${cls}{`));
    expect(mine).toEqual([
      `.${cls}{color: red;}`,
      `.${cls}{color: green;}`,
      `.${cls}{color: blue;}`,
    ]);
  });

  it('identical-content redefine keeps the class stable and records nothing new', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    definePreset('stable-probe', () => 'color: rgb(1, 2, 3);');
    const cls = preset('stable-probe');
    expect(cls).toMatch(/^zp-stable-probe-[0-9a-z]+-[0-9a-z]+$/);

    const before = getPendingRules().length;
    definePreset('stable-probe', () => 'color: rgb(1, 2, 3);'); // new fn, same CSS
    expect(preset('stable-probe')).toBe(cls);
    expect(getPendingRules().length).toBe(before); // no churn
    expect(warn).toHaveBeenCalledTimes(1); // still announced
  });

  it('redefine warnings are memoised per preset name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    definePreset('warn-a', () => 'color: red;');
    definePreset('warn-a', () => 'color: green;');
    definePreset('warn-b', () => 'color: red;');
    definePreset('warn-b', () => 'color: green;');
    expect(warn).toHaveBeenCalledTimes(2);
    expect(String(warn.mock.calls[0][0])).toContain('warn-a');
    expect(String(warn.mock.calls[1][0])).toContain('warn-b');
  });

  it('theme changes without a live rule (Node/SSR) record nothing and never throw', () => {
    definePreset('node-theme-probe', (t) => `color: ${t.colors.primary};`);
    const before = getPendingRules().length;
    expect(() => useTheme.getState().setMode('light')).not.toThrow();
    expect(getPendingRules().length).toBe(before);
    useTheme.getState().setMode('dark');
  });

  it('preset() still throws for unknown names', () => {
    expect(() => preset('never-registered')).toThrow(/Unknown style preset/);
  });
});
