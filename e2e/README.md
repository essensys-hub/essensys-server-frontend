# essensys-ui-e2e

Tests Playwright UI multi-device ESSENSYS pour valider les surfaces **local**, **remote portail** et **support OVH** sans envoyer de valeur à une armoire domotique.

## Règle absolue no-armoire

- Ne jamais cibler une armoire client en écriture.
- Les URLs par défaut sont des environnements démo :
  - local : `https://mon.essensys.fr/demo/dashboard`
  - support OVH : `https://demo.essensys.fr`
  - remote portail : `https://demo.portal.essensys.fr`
- La fixture `fixtures/no-armoire.ts` intercepte `**/api/**` et bloque tout POST/PUT/PATCH/DELETE non neutralisé.
- Les routes dangereuses (`/inject`, `/web/actions`, `/scenarios/*/launch`) doivent avoir `test_mode=dry_run` ou `X-Essensys-Test-Mode: dry-run`; même dans ce cas, la fixture répond en mock pour éviter toute sortie armoire pendant les tests UI.
- Pour pointer une URL non-démo en lecture seule, il faut explicitement définir `ESSENSYS_ALLOW_LIVE_READONLY=1`. Cela n'autorise jamais une écriture live.

## Cibles et devices

| Cible | URL par défaut | Commande |
|---|---|---|
| `support-*` | `ESSENSYS_SUPPORT_URL` ou `https://demo.essensys.fr` | `npm run test:support` |
| `local-*` | `ESSENSYS_LOCAL_URL` ou `https://mon.essensys.fr/demo/dashboard` | `npm run test:local` |
| `remote-*` | `ESSENSYS_PORTAL_URL` ou `https://demo.portal.essensys.fr` | `npm run test:remote` |

Devices principaux : `desktop`, `iphone`, `android`, `ipad`, `ecran-domo`.
Profils écran domotique additionnels : `ecran-domo-compact` (800×480) et `ecran-domo-portrait` (600×1024).

## Commandes

```bash
cd essensys-server-frontend/e2e
npm install
npm run test:matrix              # support/local/remote × 5 devices principaux, no-armoire actif
npm run test:support             # support OVH uniquement
npm run test:local               # local démo uniquement
npm run test:remote              # portail démo uniquement
npm run test:device -- iphone    # toutes les cibles sur iPhone
npx playwright test no-armoire.spec.ts --project=local-desktop
```

## Captures écran

La spec `tests/ui-smoke.spec.ts` produit des captures dans `artifacts/screenshots/` pour chaque couple cible/device/page visité. Ces captures servent à confirmer visuellement que les boutons de navigation, menus et objets UI sont utilisables sur iPhone, iPad, desktop et écran domotique.

## Variables

- `ESSENSYS_SUPPORT_URL` — défaut `https://demo.essensys.fr`
- `ESSENSYS_LOCAL_URL` — défaut `https://mon.essensys.fr/demo/dashboard`
- `ESSENSYS_PORTAL_URL` — défaut `https://demo.portal.essensys.fr`
- `ESSENSYS_BASIC_USER` / `ESSENSYS_BASIC_PASS` — uniquement si une démo locale protégée exige Basic Auth
- `ESSENSYS_PORTAL_TOKEN` — uniquement pour les tests dry-run portail déjà existants
- `ESSENSYS_ALLOW_LIVE_READONLY=1` — opt-in lecture seule hors démo, sans jamais désactiver `no-armoire`

## Revue PR

- Joindre le rapport HTML Playwright et les captures `artifacts/screenshots/`.
- Vérifier que `no-armoire.spec.ts` reste vert : il prouve qu'un inject live est bloqué.
- Refuser toute spec qui appelle une route mutante sans dry-run/mock.
