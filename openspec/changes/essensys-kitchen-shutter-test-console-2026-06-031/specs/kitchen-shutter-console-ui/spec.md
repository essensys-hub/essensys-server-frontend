# kitchen-shutter-console-ui

## ADDED Requirements

### Requirement: Dry-run kitchen shutter console route

The server frontend MUST expose an admin diagnostic page at `/admin/kitchen-shutter-test` for simulating kitchen shutter payloads without contacting a real armoire.

#### Scenario: User opens the diagnostic console

- **GIVEN** a user can access the server frontend admin routes
- **WHEN** they navigate to `/admin/kitchen-shutter-test`
- **THEN** the page shows title `Console scénario cuisine`
- **AND** it shows a visible `Mode test no-armoire` banner
- **AND** it explains that no command is sent to a real armoire

### Requirement: Kitchen shutter action controls

The console MUST provide explicit controls for both kitchen shutters and grouped actions.

#### Scenario: User sees all kitchen shutter actions

- **WHEN** the console renders
- **THEN** it shows actions to open and close kitchen shutter 1
- **AND** it shows actions to open and close kitchen shutter 2
- **AND** it shows actions to open and close both kitchen shutters

### Requirement: Last simulated action state

The console MUST show the last simulated payload after a user clicks an action.

#### Scenario: User simulates opening both kitchen shutters

- **WHEN** the user clicks `Ouvrir les deux volets cuisine`
- **THEN** the console records the last simulated action as `Ouvrir les deux volets cuisine`
- **AND** the action payload preview shows `"k": 619`
- **AND** the action payload preview shows `"v": "3"`
- **AND** the trigger payload preview shows `"k": 590`
- **AND** the trigger payload preview shows `"v": "1"`
