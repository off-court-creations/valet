// ─────────────────────────────────────────────────────────────
// src/components/labelsWiring.dom.test.tsx | valet
// A11Y S8 — labels-wiring regression suite across the components that
// render internal i18n strings. Asserts the three-tier resolution
// contract (instance `labels` prop > ValetLocaleProvider strings >
// built-in English) is honored for every wired aria-label / title /
// visible-text literal. Table-driven where the component renders with
// a trivial prop set; Drawer (portrait-only toggles, needs matchMedia)
// gets a dedicated case.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import Chip from './widgets/Chip';
import Pagination from './widgets/Pagination';
import Iterator from './fields/Iterator';
import SpeedDial, { type SpeedDialAction } from './widgets/SpeedDial';
import Dropzone from './widgets/Dropzone';
import LoadingBackdrop from './widgets/LoadingBackdrop';
import LLMChat, { type ChatMessage } from './widgets/LLMChat';
import RichChat, { type RichMessage } from './widgets/RichChat';
import DateSelector from './fields/DateSelector';
import Drawer from './layout/Drawer';
import { SurfaceCtx, createSurfaceStore } from '../system/surfaceStore';
import { ValetLocaleProvider, type PartialValetStrings } from '../system/locale';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  if (!window.matchMedia) {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
    }));
  }
});

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

/** Render inside a minimal Surface context (LLMChat/RichChat/Drawer read it). */
function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(<SurfaceCtx.Provider value={createSurfaceStore()}>{node}</SurfaceCtx.Provider>);
  });
  return { root, container };
}

/** Tear down every mounted tree + clear the shared overlay portal root. */
function unmountAll() {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  document.getElementById('valet-overlay-root')?.replaceChildren();
}

afterEach(unmountAll);

/* Document-wide search: portalled content (Drawer) lives outside container.
   Test label strings never contain a double quote, so a plain attribute
   selector is sufficient (jsdom here ships no CSS.escape). */
const findByLabel = (label: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[aria-label="${label}"]`);

const findByTitle = (title: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[title="${title}"]`);

const dot = (key: string) => <span data-icon={key}>•</span>;
const actions: SpeedDialAction[] = [{ icon: dot('a'), label: 'Share', onClick: () => {} }];
const chatMessages: ChatMessage[] = [{ role: 'user', content: 'hi' }];
const richMessages: RichMessage[] = [{ role: 'user', content: 'hi' }];

/*───────────────────────────────────────────────────────────────────────*/
/* Table-driven: each component → the slice it reads, the default English  */
/* label we expect, a provider override, an instance-prop override, and a  */
/* render function that wires `labels` through to the component.           */

interface LabelCase {
  name: string;
  render: (labels?: unknown) => React.ReactElement;
  providerStrings: PartialValetStrings;
  defaultLabel: string;
  providerLabel: string;
  instanceLabels: unknown;
  instanceLabel: string;
  /** Where the resolved string lands (default 'aria-label'). */
  via?: 'aria-label' | 'title' | 'text';
}

const cases: LabelCase[] = [
  {
    name: 'Chip (remove aria-label)',
    render: (labels) => (
      <Chip
        label='Tag'
        onDelete={() => {}}
        labels={labels as never}
      />
    ),
    providerStrings: { chip: { remove: 'Entfernen' } },
    defaultLabel: 'Remove',
    providerLabel: 'Entfernen',
    instanceLabels: { remove: 'Dismiss' },
    instanceLabel: 'Dismiss',
  },
  {
    name: 'Pagination (root nav aria-label)',
    render: (labels) => (
      <Pagination
        count={3}
        page={1}
        labels={labels as never}
      />
    ),
    providerStrings: { pagination: { root: 'Seiten' } },
    defaultLabel: 'pagination',
    providerLabel: 'Seiten',
    instanceLabels: { root: 'navigation' },
    instanceLabel: 'navigation',
  },
  {
    name: 'Pagination (previousPage title)',
    render: (labels) => (
      <Pagination
        count={3}
        page={2}
        labels={labels as never}
      />
    ),
    providerStrings: { pagination: { previousPage: 'Zurück' } },
    defaultLabel: 'Previous page',
    providerLabel: 'Zurück',
    instanceLabels: { previousPage: 'Prev' },
    instanceLabel: 'Prev',
    via: 'title',
  },
  {
    name: 'Iterator (decrement aria-label)',
    render: (labels) => (
      <Iterator
        defaultValue={1}
        labels={labels as never}
      />
    ),
    providerStrings: { iterator: { decrement: 'weniger' } },
    defaultLabel: 'decrement',
    providerLabel: 'weniger',
    instanceLabels: { decrement: 'minus' },
    instanceLabel: 'minus',
  },
  {
    name: 'SpeedDial (mainButton aria-label)',
    render: (labels) => (
      <SpeedDial
        icon={dot('main')}
        actions={actions}
        labels={labels as never}
      />
    ),
    providerStrings: { speedDial: { mainButton: 'Schnellwahl' } },
    defaultLabel: 'Speed dial',
    providerLabel: 'Schnellwahl',
    instanceLabels: { mainButton: 'Quick actions' },
    instanceLabel: 'Quick actions',
  },
  {
    name: 'SpeedDial (actions group aria-label)',
    render: (labels) => (
      <SpeedDial
        icon={dot('main')}
        actions={actions}
        labels={labels as never}
      />
    ),
    providerStrings: { speedDial: { actions: 'Aktionen' } },
    defaultLabel: 'Speed dial actions',
    providerLabel: 'Aktionen',
    instanceLabels: { actions: 'Quick action list' },
    instanceLabel: 'Quick action list',
  },
  {
    name: 'LoadingBackdrop (loading aria-label)',
    render: (labels) => (
      <LoadingBackdrop
        showSpinner
        labels={labels as never}
      />
    ),
    providerStrings: { loadingBackdrop: { loading: 'Laden' } },
    defaultLabel: 'Loading',
    providerLabel: 'Laden',
    instanceLabels: { loading: 'Please wait' },
    instanceLabel: 'Please wait',
  },
  {
    name: 'LLMChat (setApiKey aria-label)',
    render: (labels) => (
      <LLMChat
        messages={chatMessages}
        labels={labels as never}
      />
    ),
    providerStrings: { llmChat: { setApiKey: 'API-Schlüssel setzen' } },
    defaultLabel: 'Set API key',
    providerLabel: 'API-Schlüssel setzen',
    instanceLabels: { setApiKey: 'Add key' },
    instanceLabel: 'Add key',
  },
  {
    name: 'RichChat (send aria-label)',
    render: (labels) => (
      <RichChat
        messages={richMessages}
        labels={labels as never}
      />
    ),
    providerStrings: { richChat: { send: 'Senden' } },
    defaultLabel: 'Send',
    providerLabel: 'Senden',
    instanceLabels: { send: 'Submit' },
    instanceLabel: 'Submit',
  },
  {
    name: 'DateSelector (previousMonth aria-label)',
    render: (labels) => (
      <DateSelector
        defaultValue='2024-01-15'
        labels={labels as never}
      />
    ),
    providerStrings: { dateSelector: { previousMonth: 'Vorheriger Monat' } },
    defaultLabel: 'Previous month',
    providerLabel: 'Vorheriger Monat',
    instanceLabels: { previousMonth: 'Back a month' },
    instanceLabel: 'Back a month',
  },
];

describe('A11Y S8 labels wiring — three-tier resolution (jsdom)', () => {
  const lookup = (c: LabelCase, label: string): HTMLElement | null =>
    c.via === 'title' ? findByTitle(label) : findByLabel(label);

  for (const c of cases) {
    describe(c.name, () => {
      it('default English when no provider and no labels prop', () => {
        render(c.render());
        expect(lookup(c, c.defaultLabel)).toBeTruthy();
      });

      it('provider strings override built-in English', () => {
        render(<ValetLocaleProvider strings={c.providerStrings}>{c.render()}</ValetLocaleProvider>);
        expect(lookup(c, c.providerLabel)).toBeTruthy();
        expect(lookup(c, c.defaultLabel)).toBeFalsy();
      });

      it('instance labels prop wins over the provider', () => {
        render(
          <ValetLocaleProvider strings={c.providerStrings}>
            {c.render(c.instanceLabels)}
          </ValetLocaleProvider>,
        );
        expect(lookup(c, c.instanceLabel)).toBeTruthy();
        expect(lookup(c, c.providerLabel)).toBeFalsy();
      });
    });
  }
});

/*───────────────────────────────────────────────────────────────────────*/
/* Interpolated formatter leaves (Dropzone removeFile, Pagination page).   */

describe('A11Y S8 labels wiring — interpolated formatters (jsdom)', () => {
  // The Dropzone per-file removeFile() formatter requires real dropped files
  // (no prop injection path), so it is covered by the locale-core unit suite;
  // here we cover Dropzone's always-rendered instruction strings per-tier.
  it('Dropzone instructions resolve per-tier (idle)', () => {
    // default
    render(<Dropzone />);
    expect(document.body.textContent).toContain('Drag files or click to browse');
    unmountAll();

    // provider
    render(
      <ValetLocaleProvider strings={{ dropzone: { instructionsIdle: 'Dateien hierher ziehen' } }}>
        <Dropzone />
      </ValetLocaleProvider>,
    );
    expect(document.body.textContent).toContain('Dateien hierher ziehen');

    // instance prop wins
    render(
      <ValetLocaleProvider strings={{ dropzone: { instructionsIdle: 'Dateien hierher ziehen' } }}>
        <Dropzone labels={{ instructionsIdle: 'Drop a file' }} />
      </ValetLocaleProvider>,
    );
    expect(document.body.textContent).toContain('Drop a file');
  });

  it('Pagination per-page label formatter resolves per-tier', () => {
    // default: "Page 2" (non-current), "Page 1, current page"
    render(
      <Pagination
        count={3}
        page={1}
      />,
    );
    expect(findByLabel('Page 1, current page')).toBeTruthy();
    expect(findByLabel('Page 2')).toBeTruthy();
    unmountAll();

    // instance override of the formatter
    render(
      <Pagination
        count={3}
        page={1}
        labels={{ pageLabel: (n, cur) => `Seite ${n}${cur ? ' (aktuell)' : ''}` }}
      />,
    );
    expect(findByLabel('Seite 1 (aktuell)')).toBeTruthy();
    expect(findByLabel('Seite 2')).toBeTruthy();
  });
});

/*───────────────────────────────────────────────────────────────────────*/
/* Drawer: portrait-only open/close toggle aria-labels.                    */

describe('A11Y S8 labels wiring — Drawer portrait toggles (jsdom)', () => {
  const portraitMatchMedia = (q: string) => ({
    matches: /portrait/.test(q),
    media: q,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  });

  it('openDrawer toggle label resolves per-tier (collapsed adaptive/portrait)', () => {
    vi.stubGlobal('matchMedia', portraitMatchMedia);

    // default English — collapsed adaptive Drawer shows the open toggle
    render(
      <Drawer
        adaptive
        defaultOpen={false}
      >
        body
      </Drawer>,
    );
    expect(findByLabel('Open drawer')).toBeTruthy();
    unmountAll();

    // provider override
    render(
      <ValetLocaleProvider strings={{ drawer: { openDrawer: 'Schublade öffnen' } }}>
        <Drawer
          adaptive
          defaultOpen={false}
        >
          body
        </Drawer>
      </ValetLocaleProvider>,
    );
    expect(findByLabel('Schublade öffnen')).toBeTruthy();
    expect(findByLabel('Open drawer')).toBeFalsy();
    unmountAll();

    // instance prop wins
    render(
      <ValetLocaleProvider strings={{ drawer: { openDrawer: 'Schublade öffnen' } }}>
        <Drawer
          adaptive
          defaultOpen={false}
          labels={{ openDrawer: 'Show menu' }}
        >
          body
        </Drawer>
      </ValetLocaleProvider>,
    );
    expect(findByLabel('Show menu')).toBeTruthy();
    expect(findByLabel('Schublade öffnen')).toBeFalsy();
  });

  it('closeDrawer toggle label resolves per-tier (open adaptive/portrait)', () => {
    vi.stubGlobal('matchMedia', portraitMatchMedia);

    // An adaptive portrait Drawer renders collapsed (a mount effect forces it
    // shut regardless of defaultOpen); clicking the open toggle expands the
    // overlay, which carries the portrait close button.
    const openIt = () =>
      act(() => {
        (findByLabel('Open drawer') ?? findByLabel('Show menu'))?.click();
      });

    // default English
    render(
      <Drawer
        adaptive
        aria-label='Nav'
      >
        body
      </Drawer>,
    );
    openIt();
    expect(findByLabel('Close drawer')).toBeTruthy();
    unmountAll();

    // instance prop wins over the provider
    render(
      <ValetLocaleProvider strings={{ drawer: { closeDrawer: 'Schließen' } }}>
        <Drawer
          adaptive
          aria-label='Nav'
          labels={{ closeDrawer: 'Hide' }}
        >
          body
        </Drawer>
      </ValetLocaleProvider>,
    );
    openIt();
    expect(findByLabel('Hide')).toBeTruthy();
    expect(findByLabel('Schließen')).toBeFalsy();
    expect(findByLabel('Close drawer')).toBeFalsy();
  });
});
