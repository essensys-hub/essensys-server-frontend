> Ticket : [essensys-hub/essensys-feature-lifecycle#52](https://github.com/essensys-hub/essensys-feature-lifecycle/issues/52). Feature ID : `noms-volets-2026-11-005`. Sub-issue : essensys-hub/essensys-server-frontend#14.
> Feature répartie sur plusieurs dépôts. Le change commun (pourquoi, décisions, **contrat d'API**, risques) est `openspec/changes/noms-volets-2026-11-005` du dépôt `essensys-feature-lifecycle` (`proposal.md`, `design.md`). Ce change ne décrit que le code de **essensys-server-frontend** (portail local CM5 et Raspberry Pi).

## Why

Donner à chaque volet et store un nom choisi par l'administrateur (par exemple « Volet baie vitrée » à la place de « Volet 1 Salon »), affiché partout sur la page Volets & Stores du portail local.

## What Changes

- Lecture `GET /api/shutters/names` (réplique partagée, noms d'origine si la lecture échoue).
- Écriture `PUT /api/admin/shutters/names/{id}` `{"name": "..." | null}` (mode test : dry-run), pour `lan_admin` ou tout le monde quand l'IAM LAN est désactivé.
- Panneau repliable « Nom » dans la fiche de chaque volet de la page Volets & Stores : champ « Nom » (1 à 40 caractères), Enregistrer, « Nom d'origine ». Erreurs 400, 403 et 503 expliquées.
- Nom affiché (texte brut) dans la liste des commandes (les deux groupes), la carte « Temps de course » et les messages « Ouvert », « Fermé » et « temps de course réglé ».
- Démo (`src/mockFetch.ts`) : les deux routes.
- Tests : `@nr NR-server-frontend-9` sous la fixture no-armoire, inscrits dans `test:demo` (desktop, iPhone, iPad).

## Capabilities

### New Capabilities

- `shutter-names-clients` : nom affiché et modification (surface portail local).

### Modified Capabilities

Aucune.

## Impact

- **Code** : `src/shutters/`, `src/components/Shutters/`, `src/pages/ShuttersPage.tsx`, `src/services/legacyApi.ts`, `src/mockFetch.ts`, `e2e/`.
- **Armoire** : aucune écriture, aucun ordre ni indice. Le réglage du temps de course (indices 566 à 585) est inchangé.
- **Legacy IoT** : aucun endpoint `serverinfos`, `mystatus`, `myactions`, `done` touché.
- **Dépendances** : aucune nouvelle ; la gateway (essensys-server-backend) fournit les routes.
