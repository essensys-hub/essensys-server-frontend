> Ticket : [essensys-hub/essensys-feature-lifecycle#55](https://github.com/essensys-hub/essensys-feature-lifecycle/issues/55). Feature ID : `affichage-objets-2026-11-006`. Sub-issue : essensys-hub/essensys-server-frontend#16.
> Feature répartie sur plusieurs dépôts. Le change commun (pourquoi, décisions, **contrat d'API**, risques) est `openspec/changes/affichage-objets-2026-11-006` du dépôt `essensys-feature-lifecycle` (`proposal.md`, `design.md`). Ce change ne décrit que le code de **essensys-server-frontend** (portail local CM5 et Raspberry Pi).

## Why

Permettre à l'administrateur de masquer les lumières et les volets qu'il n'utilise pas et de choisir leur ordre d'affichage, sur le portail local.

## What Changes

- Lecture `GET /api/lights/layout` et `GET /api/shutters/layout` (réplique partagée ; catalogue complet dans l'ordre d'origine si la lecture échoue ou si le serveur répond 404 ; dernière lecture conservée après un succès).
- Liste des lumières (principales, indirectes), des volets, du store, « Temporisations » et « Temps de course » filtrées et ordonnées ; une seule liste alimente les boutons de groupe et les lignes. Un groupe vide affiche « Aucune lumière activée » / « Aucun volet activé ».
- Écran de gestion (bouton « Gérer l'affichage… » sur les pages Éclairage et Volets & Stores) pour `lan_admin`, ou tout le monde quand l'IAM LAN est désactivé : interrupteur Activé/Désactivé, Monter/Descendre dans le groupe, « Ordre d'origine », « Enregistrer » (un seul `PUT /api/admin/{lights|shutters}/layout`).
- Démo (`src/mockFetch.ts`) : les routes de lecture et d'écriture.
- Tests : `@nr NR-server-frontend-10` sous la fixture no-armoire, inscrits dans `test:demo` (desktop, iPhone, iPad).

## Capabilities

### New Capabilities

- `object-layout-clients` : disposition affichée et modifiée (surface portail local).

### Modified Capabilities

Aucune.

## Impact

- **Code** : `src/layout/`, `src/components/Layout/`, `src/pages/{LightingPage,ShuttersPage,LightTimersPage}.tsx`, `src/services/legacyApi.ts`, `src/mockFetch.ts`, `e2e/`.
- **Armoire** : aucune écriture ; aucun ordre pour un objet désactivé. Scénarios et éditeur de scénarios inchangés (catalogue complet).
- **Noms (#41, #52)** et temporisations : inchangés.
- **Legacy IoT** : aucun endpoint `serverinfos`, `mystatus`, `myactions`, `done` touché.
- **Dépendances** : aucune nouvelle ; la gateway (essensys-server-backend) fournit les routes.
