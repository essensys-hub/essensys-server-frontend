## Why

ESSENSYS needs a concrete UI feature to prove the full feature lifecycle end-to-end: OpenSpec, feature manifest, React implementation, Playwright UX matrix, no-armoire safety, documentation, and essensys-memory/OKF synchronization.

Kitchen shutters are an ideal feature because the legacy table d'échange indices are known and safety-critical:

- open kitchen shutters: index `619`, values `1`, `2`, or `3`
- close kitchen shutters: index `622`, values `1`, `2`, or `3`
- scenario trigger: index `590`, value `1`

A diagnostic console must make those payloads visible without sending a real command to an armoire during tests or demo mode.

## What Changes

Add a server frontend diagnostic page for a kitchen shutter dry-run console:

- route `/admin/kitchen-shutter-test`
- page title `Console scénario cuisine`
- no-armoire dry-run banner
- buttons for opening/closing kitchen shutter 1, kitchen shutter 2, and both kitchen shutters
- visible table d'échange payload preview including `k=619`, `k=622`, and trigger `k=590`
- last simulated action state
- responsive layout validated on desktop, iPhone, and iPad
- Playwright spec with `@devices: desktop,iphone,ipad` and `@no-armoire`

## Impact

- Repository: `essensys-server-frontend`
- UI: adds a diagnostic/admin page only
- Legacy protocol: documents and previews payloads; no firmware contract change
- Safety: no real armoire mutation in the new console; Playwright blocks inject/scenario mutation endpoints
- Lifecycle: creates `features/essensys-kitchen-shutter-test-console-2026-06-031.json` with UX matrix evidence placeholders

## Non-goals

- Do not send real shutter commands to production hardware.
- Do not change firmware or legacy HTTP endpoints.
- Do not change existing `ShuttersPage` behavior.
- Do not store credentials or live gateway URLs.
