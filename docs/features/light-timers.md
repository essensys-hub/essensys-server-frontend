# Temporisations des lumières

> Feature `lumieres-temporisees-2026-11-003` — essensys-hub/essensys-feature-lifecycle#45 (sub-issue essensys-hub/essensys-server-frontend#10)

## Objectif

Régler depuis le portail local le délai après lequel l'armoire éteint automatiquement six lumières : Dressing, WC 1, WC 2, Service, Annexe 1, Annexe 2. Jusqu'ici, seul l'écran tactile de l'armoire le permettait.

## Où le trouver

- **Menu Administration > Temporisations** (route `/lighting/timers`) : liste des six lumières avec leur délai courant et le réglage de chacune. Présent aussi dans le tiroir du menu sur mobile.
- **Page Éclairage** : sous chacune des six lumières concernées, un panneau repliable « Temporisation » avec le même réglage et la même valeur. Les autres lumières ne l'ont pas.

## Fonctionnalités

- Raccourcis **15 min**, **30 min**, **1 h**, **Jamais** (0 : la lumière reste allumée), plus une valeur libre de **1 à 255 minutes**. Une valeur hors plage ou non entière est refusée avant l'envoi (0 se choisit par « Jamais »).
- Une valeur courante qui n'est pas un raccourci s'affiche telle quelle (« 7 min ») ; « inconnue » tant que l'armoire n'a pas remonté la valeur.
- Après un envoi, la valeur est relue à 5, 10 puis 20 s et celle de l'armoire est affichée.
- Mode test (dry-run) : le réglage est validé sans être exécuté.
- Hors ligne (snapshot `connected: false`) : tous les contrôles sont désactivés.

## Permissions

Réservé à l'administrateur de l'armoire : rôle `lan_admin`, ou tout utilisateur quand l'IAM LAN est désactivé. Menu et panneaux sont masqués aux autres rôles ; la page affiche « Réservé à l'administrateur de l'armoire ». Le masquage n'est pas une protection : la gateway répond 403 à un non-administrateur.

## API

| Appel | Détail |
|---|---|
| `GET /api/admin/lights/timers` | `{"timers":[{"id","label","key","minutes"}]}`, `minutes` entier 0 à 255 ou `null` (jamais lue) |
| `PUT /api/admin/lights/timers/{id}` | corps `{"minutes": n}` ; 200 `{"id","minutes","status":"queued"\|"dry_run"}` ; 400 `invalid_minutes` ou `unknown_light` ; 403 |

Identifiants : `dressing`, `wc1`, `wc2`, `pieceserv`, `ann1`, `ann2`. Contrat complet dans le change commun (`essensys-feature-lifecycle`).

## Limites connues

- L'écran de l'armoire ne coche aucune case pour une valeur libre (par exemple 7 min) et pourrait l'écraser à sa validation : à vérifier sur le banc avant déploiement.
- Démo : valeurs simulées en mémoire ; `sessionStorage.essensys_demo_lan_role` (`lan_admin` ou `lan_user`) force le rôle simulé.
- `LanAuthContext` : correctif d'une course au chargement (redirection vers `/login` pendant la résolution asynchrone du mode IAM).

## Tests

`e2e/tests/light-timers.spec.ts` et `e2e/tests/light-timers-logic.spec.ts` (`@nr NR-server-frontend-7`), cible `local`, fixture no-armoire, desktop, iPhone et iPad (Android en `fixme` : débordement horizontal antérieur).

```bash
cd e2e
npm run test:demo
```

Validation réelle : sur le banc, par un humain. Jamais par les tests automatiques.

## Liens

- Change : `openspec/changes/lumieres-temporisees-2026-11-003`
- Manifest : `features/lumieres-temporisees-2026-11-003.json`
