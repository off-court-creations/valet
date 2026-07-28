// ─────────────────────────────────────────────────────────────
// dx/type-tests/directional-navigation.test-d.ts  | valet
// compile-time probe: directional navigation's barrel contract
// ─────────────────────────────────────────────────────────────
import { createDirectionalNavigation, useDirectionalNavigation } from '@archway/valet';
import type {
  DirectionalNavigation,
  DirectionalNavigationController,
  DirectionalNavigationOptions,
  DirectionalNavigationScope,
  DirectionalNavigationScopeRef,
  NavigationDirection,
} from '@archway/valet';

declare const element: HTMLDivElement;
declare const ref: DirectionalNavigationScopeRef;

const elementScope: DirectionalNavigationScope = element;
const refScope: DirectionalNavigationScope = ref;
const getterScope: DirectionalNavigationScope = () => element;
const absentScope: DirectionalNavigationScope = null;
const options: DirectionalNavigationOptions = { scope: ref };

const controller: DirectionalNavigationController = createDirectionalNavigation(options);
const navigation: DirectionalNavigation = controller;
const direction: NavigationDirection = 'right';
const moved: boolean = controller.move(direction);
const activated: boolean = controller.activate();
controller.clear();
controller.dispose();

const hookNavigation: DirectionalNavigation = useDirectionalNavigation({ scope: ref });
hookNavigation.move('previous');

// @ts-expect-error physical-device vocabulary is not a navigation direction
controller.move('dpad-up');
// @ts-expect-error a Document is not an explicit HTMLElement scope
createDirectionalNavigation({ scope: document });
// @ts-expect-error hook facades own teardown automatically
hookNavigation.dispose();

void elementScope;
void refScope;
void getterScope;
void absentScope;
void navigation;
void moved;
void activated;
