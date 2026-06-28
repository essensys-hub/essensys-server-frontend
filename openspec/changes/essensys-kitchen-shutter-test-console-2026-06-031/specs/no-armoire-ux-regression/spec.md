# no-armoire-ux-regression

## ADDED Requirements

### Requirement: No-armoire safety

The kitchen shutter test console MUST NOT send real gateway, firmware, scenario, injection, or legacy HTTP mutation requests.

#### Scenario: Simulating an action does not mutate hardware

- **GIVEN** Playwright intercepts mutation endpoints
- **WHEN** the user simulates any kitchen shutter action
- **THEN** there are no requests to `/api/admin/inject`
- **AND** there are no requests to `/api/portal/inject`
- **AND** there are no requests to `/api/web/actions`
- **AND** there are no requests to `/scenarios/*/launch`
- **AND** there are no requests to `/api/myactions`

### Requirement: UX matrix coverage

The feature MUST be validated by Playwright on desktop, iPhone, and iPad projects.

#### Scenario: Feature manifest declares UX matrix

- **WHEN** the lifecycle gate validates `features/essensys-kitchen-shutter-test-console-2026-06-031.json`
- **THEN** `tests.ux_matrix.required` is `true`
- **AND** `tests.ux_matrix.devices` includes `desktop`, `iphone`, and `ipad`
- **AND** `tests.ux_matrix.required_projects` includes `support-desktop`, `support-iphone`, and `support-ipad`
- **AND** `tests.ux_matrix.no_armoire_required` is `true`

#### Scenario: Playwright spec declares device coverage

- **WHEN** the lifecycle gate reads `e2e/tests/kitchen-shutter-test-console.spec.ts`
- **THEN** it can find the annotation `@devices: desktop,iphone,ipad`
- **AND** it can find the annotation `@no-armoire`
