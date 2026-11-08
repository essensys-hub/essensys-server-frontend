> Ticket : [essensys-hub/essensys-feature-lifecycle#58](https://github.com/essensys-hub/essensys-feature-lifecycle/issues/58). Feature ID : `sonnette-unifi-2026-11-007`. Sub-issue : essensys-hub/essensys-server-frontend#18.
> Feature répartie sur plusieurs dépôts. Le change commun (pourquoi, décisions, **contrat d'API**, risques) est `openspec/changes/sonnette-unifi-2026-11-007` du dépôt `essensys-feature-lifecycle` (`proposal.md`, `design.md`, `specs/doorbell-portal/spec.md`). Ce change ne décrit que le code de **essensys-server-frontend** (portail local CM5).

## Why

Montrer la vidéo de la sonnette UniFi dans le portail local quand quelqu'un sonne, et laisser l'administrateur régler la fonction.

## What Changes

- Lecture de `GET /api/doorbell/status` (2 s fenêtre ouverte, 5 s sinon, relecture à la prise de focus) et fenêtre « Quelqu'un sonne » avec la vidéo de `GET /api/doorbell/stream`, sur toutes les pages. Fermée, elle ne se rouvre pas pour la même sonnerie (identifiée par `last_ring_at`) et se rouvre pour la suivante. Fonction désactivée, `available=false` ou ancienne gateway (404) : aucune fenêtre, aucune requête vidéo.
- Écran « Sonnette » (`/settings/doorbell`, entrée « Sonnette » du menu Administration) pour `lan_admin`, ou tout le monde quand l'IAM LAN est désactivé : activer, caméra (liste `GET /api/unifi/cameras`), lumières (catalogue dans l'ordre de la disposition #55, noms personnalisés #41, lumières masquées non proposées, sauf une lumière masquée déjà choisie, signalée « (masquée) » pour pouvoir la retirer), clignotements de 1 à 10, « Enregistrer » (un seul `PUT /api/admin/doorbell/settings`) et « Essayer » (`POST /api/admin/doorbell/test`, dry-run en mode test du portail).
- Messages d'erreur de la gateway en français (`unknown_light`, `unknown_camera`, `invalid_blinks`, `names_unavailable`, `doorbell_unavailable`, 403).
- Démo (`src/mockFetch.ts`) : état, réglages, essai, avec forçage d'erreurs par `sessionStorage`.
- Tests : `@nr NR-server-frontend-11` sous la fixture no-armoire (flux vidéo simulé par Playwright), inscrits dans `test:demo` (desktop, iPhone, iPad). La fixture bloque tout `POST /api/admin/doorbell/test` sans dry-run.

## Capabilities

### New Capabilities

- `doorbell-portal-local` : fenêtre de sonnette et écran de réglage du portail local.

### Modified Capabilities

Aucune.

## Impact

- **Code** : `src/doorbell/`, `src/components/Doorbell/`, `src/pages/DoorbellPage.tsx`, `src/layouts/MainLayout.tsx`, `src/App.tsx`, `src/components/Navigation/SidebarMenu.tsx`, `src/mockFetch.ts`, `e2e/`.
- **Armoire** : aucune écriture depuis le portail (la gateway clignote ; le portail ne commande aucune lumière).
- **Noms (#41), disposition (#55)** et temporisations : inchangés, réutilisés en lecture.
- **Legacy IoT** : aucun endpoint `serverinfos`, `mystatus`, `myactions`, `done` touché.
- **Dépendances** : aucune nouvelle ; la gateway (essensys-server-backend) fournit les routes.
