> Ticket : [essensys-hub/essensys-feature-lifecycle#45](https://github.com/essensys-hub/essensys-feature-lifecycle/issues/45). Feature ID : `lumieres-temporisees-2026-11-003`. Sub-issue : essensys-hub/essensys-server-frontend#10.
> Feature répartie sur plusieurs dépôts. Le change commun (pourquoi, décisions, **contrat d'API**, risques) est `openspec/changes/lumieres-temporisees-2026-11-003` du dépôt `essensys-feature-lifecycle` (`proposal.md`, `design.md`). Ce change ne décrit que le code de **essensys-server-frontend** (portail local CM5 et Raspberry Pi).

## Why

Régler le délai d'extinction automatique des six lumières concernées (Dressing, WC 1, WC 2, Service, Annexe 1, Annexe 2) sans être devant l'écran de l'armoire.

## What Changes

- Menu **Temporisations** (route `/lighting/timers`, section Administration, aussi dans le tiroir mobile), visible pour `lan_admin` ou quand l'IAM LAN est désactivé.
- Même réglage dans un panneau repliable de chaque lumière concernée de la page Éclairage (composant `LightTimerControl` partagé).
- API : `GET /api/admin/lights/timers`, `PUT /api/admin/lights/timers/{id}` `{"minutes": n}` (mode test : dry-run).
- Relecture à 5, 10 et 20 s après un envoi ; contrôles désactivés quand le snapshot dit `connected: false`.
- Mock de démonstration (GET/PUT, rôles `lan_admin` et `lan_user`), test Playwright `@nr NR-server-frontend-7` sous la fixture no-armoire.

## Capabilities

### New Capabilities

- `light-timers-clients` : menu central et réglage par lumière (surface portail local).

### Modified Capabilities

Aucune.

## Impact

- **Code** : `src/lights/`, `src/components/Lighting/`, `src/pages/LightTimersPage.tsx`, `src/pages/LightingPage.tsx`, menu et routes, `src/services/legacyApi.ts`, `src/mockFetch.ts`, `src/context/LanAuthContext.tsx` (correctif de course, voir docs), `e2e/`.
- **Table d'échange** : aucun indice modifié côté portail ; le backend écrit les clés 521, 555, 556, 557, 561, 562.
- **Legacy IoT** : aucun endpoint `serverinfos`, `mystatus`, `myactions`, `done` touché.
- **Dépendances** : aucune nouvelle ; ne dépend d'aucune autre feature en cours.
