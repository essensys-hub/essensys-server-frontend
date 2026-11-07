> Ticket : [essensys-hub/essensys-feature-lifecycle#41](https://github.com/essensys-hub/essensys-feature-lifecycle/issues/41). Feature ID : `noms-lumieres-2026-11-004`. Sub-issue : essensys-hub/essensys-server-frontend#12.
> Feature répartie sur plusieurs dépôts. Le change commun (pourquoi, décisions, **contrat d'API**, risques) est `openspec/changes/noms-lumieres-2026-11-004` du dépôt `essensys-feature-lifecycle` (`proposal.md`, `design.md`). Ce change ne décrit que le code de **essensys-server-frontend** (portail local CM5 et Raspberry Pi).

## Why

Donner à chaque lumière un nom choisi par l'administrateur (par exemple « WC 3 » à la place de « Dressing »), affiché partout sur le portail local.

## What Changes

- Lecture `GET /api/lights/names` (réplique partagée, noms d'origine si la lecture échoue).
- Écriture `PUT /api/admin/lights/names/{id}` `{"name": "..." | null}` (mode test : dry-run), pour `lan_admin` ou tout le monde quand l'IAM LAN est désactivé.
- Panneau repliable « Nom » dans la fiche de chaque lumière de la page Éclairage : champ « Nom » (1 à 40 caractères), Enregistrer, « Nom d'origine ». Erreurs 400, 403 et 503 expliquées.
- Nom affiché (texte brut) dans la page Éclairage, le tableau de bord (`LightingControl`), l'écran Temporisations, le panneau des temporisations et les messages de dernière action.
- Démo (`src/mockFetch.ts`) : les deux routes.
- Tests : `@nr NR-server-frontend-8` sous la fixture no-armoire, inscrits dans `test:demo` (desktop, iPhone, iPad).

## Capabilities

### New Capabilities

- `light-names-clients` : nom affiché et modification (surface portail local).

### Modified Capabilities

Aucune.

## Impact

- **Code** : `src/lights/`, `src/components/Lighting/`, `src/components/Dashboard/LightingControl.tsx`, `src/pages/LightingPage.tsx`, `src/pages/LightTimersPage.tsx`, `src/services/legacyApi.ts`, `src/mockFetch.ts`, `e2e/`.
- **Armoire** : aucune écriture, aucun ordre ni indice.
- **Legacy IoT** : aucun endpoint `serverinfos`, `mystatus`, `myactions`, `done` touché.
- **Dépendances** : aucune nouvelle ; la gateway (essensys-server-backend) fournit les routes.
