// ─────────────────────────────────────────────────────────────
// src/pages/concepts/DirectionalNavigation.tsx  | valet-docs
// Device-neutral directional navigation, focus, and activation
// ─────────────────────────────────────────────────────────────
import { CodeBlock, Panel, Stack, Surface, Typography } from '@archway/valet';
import NavDrawer from '../../components/NavDrawer';
import type { DocMeta } from '../../types';

export const meta: DocMeta = {
  id: 'directional-navigation',
  title: 'Directional Navigation',
  description:
    'Drive real DOM focus from logical directional intents while keeping gamepads, remotes, rotary controls, and platform mappings outside valet.',
  pageType: 'concept',
  components: ['useDirectionalNavigation', 'createDirectionalNavigation', 'Button', 'IconButton'],
  prerequisites: ['quickstart'],
  tldr: 'Map physical input to up/down/left/right/next/previous outside valet, then call useDirectionalNavigation to move real DOM focus or activate the focused control. Scopes are explicit, movement never wraps, and adapters can fall back when move/activate returns false.',
};

const hookExample = `import { useRef } from 'react';
import {
  Button,
  Stack,
  useDirectionalNavigation,
} from '@archway/valet';

function GameMenu() {
  const menuRef = useRef<HTMLDivElement>(null);
  const navigation = useDirectionalNavigation({ scope: menuRef });

  // Give navigation to your input adapter; valet does not poll hardware.
  useGameMenuAdapter(navigation);

  return (
    <Stack ref={menuRef} gap={1}>
      <Button onClick={() => startGame()}>Start game</Button>
      <Button onClick={() => openOptions()}>Options</Button>
      <Button onClick={() => quitGame()}>Quit</Button>
    </Stack>
  );
}`;

const apiContract = `type NavigationDirection =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'next'
  | 'previous';

type DirectionalNavigationScope =
  | HTMLElement
  | { readonly current: HTMLElement | null }
  | (() => HTMLElement | null)
  | null;

interface DirectionalNavigation {
  move(direction: NavigationDirection): boolean;
  activate(): boolean;
  clear(): void;
}

interface DirectionalNavigationController
  extends DirectionalNavigation {
  dispose(): void;
}`;

const coreExample = `import { createDirectionalNavigation } from '@archway/valet';

const navigation = createDirectionalNavigation({
  // A getter is resolved on every intent, so replacing the menu is safe.
  scope: () => document.querySelector<HTMLElement>('[data-game-menu]'),
});

navigation.move('down');
navigation.activate();

// Teardown removes marker ownership and listeners without blurring focus.
navigation.dispose();`;

const gamepadAdapter = `// Illustrative application adapter — not a valet dependency.
controller.on('dpad-up', () => {
  if (!navigation.move('up')) game.handleGameplayIntent('up');
});
controller.on('dpad-down', () => {
  if (!navigation.move('down')) game.handleGameplayIntent('down');
});
controller.on('a', () => {
  if (!navigation.activate()) game.handleGameplayIntent('primary-action');
});`;

const remoteAdapter = `// Illustrative TV/platform adapter — key mapping stays outside valet.
remote.on('ArrowLeft', () => navigation.move('left'));
remote.on('ArrowRight', () => navigation.move('right'));
remote.on('Select', () => navigation.activate());
remote.on('Back', () => app.closeMenu());`;

const clickWheelAdapter = `// Illustrative rotary adapter — repeat/debounce policy is application-owned.
wheel.on('clockwise', () => navigation.move('next'));
wheel.on('counterclockwise', () => navigation.move('previous'));
wheel.on('center', () => navigation.activate());`;

const nestedScopeExample = `<div ref={outerMenuRef}>
  <button>Outer action</button>

  <div
    ref={dialogMenuRef}
    data-valet-navigation-exclude='true'
  >
    <button>Dialog action</button>
  </div>
</div>`;

const activationOverrides = `<div
  role='button'
  tabIndex={0}
  onClick={runAction}
>
  Activates from its role
</div>

<div
  tabIndex={0}
  data-valet-navigation-activate='true'
  onClick={runCustomAction}
>
  Explicitly opted into activation
</div>

<button data-valet-navigation-activate='false'>
  Focusable, but excluded from navigation activation
</button>`;

export default function DirectionalNavigationPage() {
  return (
    <Surface>
      <NavDrawer />
      <Stack
        gap={2}
        pad={2}
        sx={{ maxWidth: 1100 }}
      >
        <Typography
          variant='h2'
          weight='bold'
        >
          Directional Navigation
        </Typography>
        <Typography>
          valet turns a small set of logical UI intents into real DOM focus and native activation.
          Physical-device support remains application-owned: a gamepad library, TV platform API,
          rotary encoder, accessibility switch, or future input adapter decides when to call the
          navigator.
        </Typography>

        <Panel
          fullWidth
          variant='outlined'
          pad={2}
        >
          <Stack gap={1}>
            <Typography
              variant='h3'
              weight='bold'
            >
              The boundary
            </Typography>
            <Typography>
              Physical input or platform API → external adapter → valet navigation intent → real DOM
              focus or <code>.click()</code> → native and React handlers.
            </Typography>
            <Typography>
              valet does not poll controllers, interpret analog axes, map remote key codes, debounce
              hardware, choose repeat timing, or own Back, Escape, Menu, Home, and gameplay actions.
              It also does not install competing arrow-key navigation: existing keyboard and
              composite-widget behavior remains in charge.
            </Typography>
          </Stack>
        </Panel>

        <Typography
          variant='h3'
          weight='bold'
        >
          React hook
        </Typography>
        <Typography>
          Pass an explicit scope to <code>useDirectionalNavigation</code>. The returned object is
          stable across renders, so an adapter can subscribe once. <code>move()</code> and{' '}
          <code>activate()</code> return <code>true</code> only when valet handled the intent; use a
          false result to fall back to gameplay or application behavior.
        </Typography>
        <CodeBlock
          code={hookExample}
          language='tsx'
          ariaLabel='Copy useDirectionalNavigation example'
        />

        <Typography
          variant='h3'
          weight='bold'
        >
          Public contract
        </Typography>
        <CodeBlock
          code={apiContract}
          language='ts'
          ariaLabel='Copy directional navigation API contract'
        />
        <Stack gap={0.5}>
          <Typography>
            • <code>scope</code> accepts an <code>HTMLElement</code>, a structural ref with a
            nullable <code>current</code>, a getter, or <code>null</code>. Ref/getter scopes are
            resolved for every intent. A missing, unmounted, replaced-with-null, or disconnected
            scope produces a safe <code>false</code>; there is no document-wide default.
          </Typography>
          <Typography>
            • <code>clear()</code> removes this navigator&apos;s visual marker and blurs only the
            exact focused element it still owns. It does not erase keyboard/pointer focus or focus
            claimed by another navigator.
          </Typography>
          <Typography>
            • The non-React controller adds <code>dispose()</code>. Disposal removes marker
            ownership and listeners without blurring, and subsequent movement or activation returns
            false.
          </Typography>
        </Stack>
        <CodeBlock
          code={coreExample}
          language='ts'
          ariaLabel='Copy createDirectionalNavigation example'
        />

        <Typography
          variant='h3'
          weight='bold'
        >
          Movement
        </Typography>
        <Panel
          fullWidth
          pad={2}
        >
          <Stack gap={1}>
            <Typography>
              <strong>Sequential:</strong> <code>next</code> and <code>previous</code> follow
              deterministic <code>tabIndex</code> ordering—positive values first in ascending order,
              then normal focusable elements in DOM order. Movement never wraps. With nothing
              focused in the scope, <code>next</code> enters at the first target and{' '}
              <code>previous</code> at the last. A same-name radio group contributes one sequential
              stop: its checked eligible member, or its first eligible member when none is checked.
            </Typography>
            <Typography>
              <strong>Spatial:</strong> <code>up</code>, <code>down</code>, <code>left</code>, and{' '}
              <code>right</code> measure candidates only when an intent arrives. A candidate must
              sit wholly beyond the requested edge; primary-axis distance and cross-axis alignment
              determine the result, with DOM order as the stable tie-breaker.
            </Typography>
            <Typography>
              <strong>Spatial entry:</strong> when there is no in-scope focus reference,{' '}
              <code>down</code> starts at the topmost target, <code>up</code> at the bottommost,
              <code>right</code> at the leftmost, and <code>left</code> at the rightmost.
            </Typography>
            <Typography>
              Candidate discovery happens on every call, so removed, disabled, hidden, or newly
              mounted controls do not require observers or a separate selection index.
            </Typography>
            <Typography>
              If the focused target becomes ineligible but remains in the scope, it is never chosen
              again but can still provide the ordering or geometry for the next move. If it is
              removed or focus leaves the scope, the next intent uses the initial-entry rule.
            </Typography>
          </Stack>
        </Panel>

        <Typography
          variant='h3'
          weight='bold'
        >
          Eligibility and scopes
        </Typography>
        <Stack gap={0.5}>
          <Typography>
            • Native focusables and deliberate non-negative <code>tabIndex</code> targets
            participate. Disabled, <code>aria-disabled</code>, hidden, inert, disconnected,
            non-rendered, and negative-tab-index targets do not.
          </Typography>
          <Typography>
            • Scope means DOM containment. Portalled menus, dialogs, and drawers need a navigator
            scoped to their portalled root; a logical React parent does not make a portal a DOM
            descendant.
          </Typography>
          <Typography>
            • Multiple and nested navigators are independent. Put{' '}
            <code>data-valet-navigation-exclude=&apos;true&apos;</code> on a nested scope root to
            hide that subtree from an outer navigator. The nested navigator still includes its own
            root boundary and descendants. There is no global active-navigator singleton; the
            application sends each intent only to the currently relevant navigator.
          </Typography>
        </Stack>
        <CodeBlock
          code={nestedScopeExample}
          language='tsx'
          ariaLabel='Copy nested directional navigation scope example'
        />

        <Typography
          variant='h3'
          weight='bold'
        >
          Focus visualization and interoperability
        </Typography>
        <Typography>
          Navigation moves real DOM focus—the same source of truth used by the browser, assistive
          technology, Tab order, scrolling, and React focus handlers. valet adds its device-neutral
          navigation-focus marker because programmatic focus is not guaranteed to match{' '}
          <code>:focus-visible</code>; the marker uses the same valet focus-ring tokens rather than
          a hover treatment.
        </Typography>
        <Typography>
          Blur, clear, teardown, or the next pointer/keyboard interaction removes the marker.
          Pointer and keyboard modality changes do not blur the control. valet only observes that
          modality change for marker cleanup—it does not map keys, prevent defaults, move focus from
          a key event, or add a focus trap.
        </Typography>

        <Typography
          variant='h3'
          weight='bold'
        >
          Activation
        </Typography>
        <Typography>
          <code>activate()</code> calls <code>.click()</code> only on the current eligible target
          inside the scope. Native buttons, links, inputs, and controls with appropriate interactive
          roles activate by default. A generic <code>tabIndex</code> container can receive focus but
          is not activatable unless it has native/ARIA action semantics or explicitly opts in.
          Structural roles such as <code>row</code> and <code>gridcell</code> are not assumed to be
          actions; opt an actionable one in explicitly.
        </Typography>
        <CodeBlock
          code={activationOverrides}
          language='tsx'
          ariaLabel='Copy directional navigation activation overrides'
        />
        <Panel
          fullWidth
          variant='outlined'
          pad={2}
        >
          <Typography>
            <strong>Synthetic activation limitations.</strong> <code>.click()</code> is
            intentionally untrusted: it does not fabricate pointer coordinates, may not reproduce
            physical <code>:active</code> or ripple animation, and security-gated browser APIs may
            reject it. Form submit/reset and checkbox/radio behavior remain the focused
            control&apos;s authentic native behavior—set button <code>type</code> deliberately.
          </Typography>
        </Panel>

        <Typography
          variant='h3'
          weight='bold'
        >
          External adapter examples
        </Typography>
        <Typography>
          These listeners are illustrative application code. The controller, remote, wheel, and game
          objects are not valet dependencies or APIs.
        </Typography>

        <Typography
          variant='h4'
          weight='bold'
        >
          Game controller
        </Typography>
        <CodeBlock
          code={gamepadAdapter}
          language='ts'
          ariaLabel='Copy external game controller adapter example'
        />

        <Typography
          variant='h4'
          weight='bold'
        >
          TV remote
        </Typography>
        <CodeBlock
          code={remoteAdapter}
          language='ts'
          ariaLabel='Copy external TV remote adapter example'
        />

        <Typography
          variant='h4'
          weight='bold'
        >
          Click wheel or rotary encoder
        </Typography>
        <CodeBlock
          code={clickWheelAdapter}
          language='ts'
          ariaLabel='Copy external click wheel adapter example'
        />
      </Stack>
    </Surface>
  );
}
