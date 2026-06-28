# kitchen-shutter-legacy-payload

## ADDED Requirements

### Requirement: Kitchen shutter payload mapping

The console MUST use the ESSENSYS legacy table d'échange mapping for kitchen shutters.

#### Scenario: Open kitchen shutter 1

- **WHEN** the user selects `Ouvrir volet cuisine 1`
- **THEN** the action payload is `{ "k": 619, "v": "1" }`
- **AND** the trigger payload is `{ "k": 590, "v": "1" }`

#### Scenario: Open kitchen shutter 2

- **WHEN** the user selects `Ouvrir volet cuisine 2`
- **THEN** the action payload is `{ "k": 619, "v": "2" }`
- **AND** the trigger payload is `{ "k": 590, "v": "1" }`

#### Scenario: Open both kitchen shutters

- **WHEN** the user selects `Ouvrir les deux volets cuisine`
- **THEN** the action payload is `{ "k": 619, "v": "3" }`
- **AND** the trigger payload is `{ "k": 590, "v": "1" }`

#### Scenario: Close kitchen shutter 1

- **WHEN** the user selects `Fermer volet cuisine 1`
- **THEN** the action payload is `{ "k": 622, "v": "1" }`
- **AND** the trigger payload is `{ "k": 590, "v": "1" }`

#### Scenario: Close kitchen shutter 2

- **WHEN** the user selects `Fermer volet cuisine 2`
- **THEN** the action payload is `{ "k": 622, "v": "2" }`
- **AND** the trigger payload is `{ "k": 590, "v": "1" }`

#### Scenario: Close both kitchen shutters

- **WHEN** the user selects `Fermer les deux volets cuisine`
- **THEN** the action payload is `{ "k": 622, "v": "3" }`
- **AND** the trigger payload is `{ "k": 590, "v": "1" }`
