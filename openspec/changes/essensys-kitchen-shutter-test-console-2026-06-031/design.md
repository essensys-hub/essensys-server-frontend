## Context

The existing `ShuttersPage` already contains the kitchen indices:

- `Volet 1 Cuisine`: open `619`, close `622`, value `1`
- `Volet 2 Cuisine`: open `619`, close `622`, value `2`

The feature intentionally creates a separate diagnostic console rather than altering production shutter controls. The console is a lifecycle test vehicle and safety demonstration.

## Architecture

### UI

Create `src/pages/KitchenShutterTestConsolePage.tsx` and route it from `src/App.tsx` at `/admin/kitchen-shutter-test`.

The page will render:

- a no-armoire/dry-run safety banner
- six action buttons:
  - open shutter 1
  - open shutter 2
  - open both shutters
  - close shutter 1
  - close shutter 2
  - close both shutters
- payload preview cards:
  - action entry: `{ "k": 619|622, "v": "1"|"2"|"3" }`
  - trigger entry: `{ "k": 590, "v": "1" }`
- last simulated action state and a copyable JSON preview

### Safety model

The page must not call `sendInjection` or any gateway mutation API. It only computes payloads locally and updates component state.

Playwright additionally guards against unexpected calls to:

- `/api/admin/inject`
- `/api/portal/inject`
- `/api/web/actions`
- `/scenarios/*/launch`
- `/api/myactions`

If any of those requests are attempted by the page, the test fails.

### UX matrix

The required projects are:

- `support-desktop`
- `support-iphone`
- `support-ipad`

The feature manifest declares the UX matrix and `no_armoire_required=true`.

### Traceability

- OpenSpec change id: `essensys-kitchen-shutter-test-console-2026-06-031`
- Manifest: `features/essensys-kitchen-shutter-test-console-2026-06-031.json`
- Playwright: `e2e/tests/kitchen-shutter-test-console.spec.ts`
- Docs: `docs/features/kitchen-shutter-test-console.md`

## Risks

- Confusion with production controls: mitigated by explicit dry-run/no-armoire banner and separate admin route.
- Responsive regressions: mitigated by desktop/iPhone/iPad Playwright matrix.
- Accidental mutation: mitigated by no direct API call plus Playwright request guard.
