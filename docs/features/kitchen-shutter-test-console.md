# Console scénario cuisine

## Objectif

La console scénario cuisine est une page de diagnostic no-armoire pour vérifier les indices legacy des volets cuisine sans envoyer de commande réelle à une armoire ESSENSYS.

Route : `/admin/kitchen-shutter-test`

## Mode no-armoire

La page calcule localement les payloads Table d'Échange et affiche une bannière `Mode test no-armoire`. Elle ne déclenche pas `sendInjection`, ne lance pas de scénario et ne contacte pas les endpoints legacy de mutation.

Les tests Playwright bloquent ou surveillent notamment :

- `/api/admin/inject`
- `/api/portal/inject`
- `/api/web/actions`
- `/scenarios/*/launch`
- `/api/myactions`

## Mapping Table d'Échange

| Action | Index action | Valeur | Trigger scénario |
|---|---:|---:|---:|
| Ouvrir volet cuisine 1 | 619 | 1 | 590=1 |
| Ouvrir volet cuisine 2 | 619 | 2 | 590=1 |
| Ouvrir les deux volets cuisine | 619 | 3 | 590=1 |
| Fermer volet cuisine 1 | 622 | 1 | 590=1 |
| Fermer volet cuisine 2 | 622 | 2 | 590=1 |
| Fermer les deux volets cuisine | 622 | 3 | 590=1 |

La valeur `3` correspond au masque combiné `1 OR 2`.

## Validation UX

La feature est déclarée dans :

`features/essensys-kitchen-shutter-test-console-2026-06-031.json`

La gate UX obligatoire exige :

- desktop
- iPhone
- iPad
- screenshots Playwright
- no-armoire actif

Test principal :

`e2e/tests/kitchen-shutter-test-console.spec.ts`

## Critère de réussite

Cliquer sur `Ouvrir les deux volets cuisine` doit afficher :

```json
[
  { "k": 619, "v": "3" },
  { "k": 590, "v": "1" }
]
```

Cliquer sur `Fermer les deux volets cuisine` doit afficher :

```json
[
  { "k": 622, "v": "3" },
  { "k": 590, "v": "1" }
]
```
