import {
  startRoutedHarness,
  type RoutedHarnessRoute,
} from '@effindomv2/runtime/routed-harness';
import type { HarnessExports } from '@effindomv2/runtime/managed-harness';
import { appHostEvents } from './host/host-events.js';
import { appHostServices } from './host/host-services.js';
import routeManifest from './routes.json' with { type: 'json' };

type RouteExports = HarnessExports & {
  __runApp(): void;
  __disposeApp?(): void;
};

const routes: readonly RoutedHarnessRoute[] = routeManifest.routes;

startRoutedHarness<RouteExports>({
  shellId: 'fui-routes',
  routeBase: '/',
  routes,
  hostEvents: appHostEvents,
  hostServices: appHostServices,
  workerHostServices: {
    scriptUrl: new URL('./worker-host-services.js', import.meta.url).toString(),
    exportName: 'demoWorkerHostServices',
  },
  recreateRuntimeOnWarmRouteSwap: true,
  run(exports): void {
    exports.__runApp();
  },
  onDispose(exports): void {
    exports.__disposeApp?.();
  },
});
