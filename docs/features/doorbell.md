# Sonnette UniFi

> Feature `sonnette-unifi-2026-11-007` — essensys-hub/essensys-feature-lifecycle#58 (sub-issue essensys-hub/essensys-server-frontend#18)

## Objectif

Quand quelqu'un sonne, afficher la vidéo de la sonnette UniFi dans le portail local et, côté gateway, faire clignoter les lumières choisies.

## Où le trouver

- **Fenêtre « Quelqu'un sonne »** : s'affiche sur toutes les pages pendant la sonnerie (environ 60 s), avec la vidéo. Le bouton **Fermer** la ferme ; elle ne se rouvre que pour la sonnerie suivante.
- **Écran Sonnette** : menu Administration > **Sonnette** (`/settings/doorbell`).

## Fonctionnalités

- Activer ou désactiver la fonction (désactivée par défaut).
- Choisir la caméra de la sonnette (liste de la console UniFi).
- Choisir les lumières qui clignotent : noms personnalisés affichés, lumières masquées de l'affichage non proposées (une lumière masquée déjà choisie reste visible avec « (masquée) » pour pouvoir la retirer).
- Nombre de clignotements de 1 à 10. À la fin de la séquence, les lumières choisies restent **allumées** (la gateway ne lit pas leur état réel et ne restaure rien).
- **Enregistrer** envoie un seul `PUT` ; **Essayer** simule une pression avec les réglages enregistrés (désactivé tant que des modifications ne sont pas enregistrées). En mode test du portail, l'essai est à sec : aucune lumière n'est commandée.

## Permissions

Écran réservé à l'administrateur de l'armoire : rôle `lan_admin`, ou tout utilisateur quand l'IAM LAN est désactivé. Tout utilisateur authentifié voit la fenêtre de sonnerie ; la gateway répond 403 à une écriture non autorisée.

## API (gateway)

| Appel | Détail |
|---|---|
| `GET /api/doorbell/status` | `{"enabled","available","ringing","ringing_until","last_ring_at"}`, interrogé toutes les 2 s fenêtre ouverte, 5 s sinon |
| `GET /api/doorbell/stream` | instantanés servis par la gateway |
| `GET/PUT /api/admin/doorbell/settings` | `{"enabled","camera_id","lights":[…],"blinks":1..10}` |
| `POST /api/admin/doorbell/test` | essai ; en-tête `X-Essensys-Test-Mode: dry-run` : aucune écriture dans l'armoire |

Erreurs affichées en français : 403, `invalid_settings`, `unknown_light`, `unknown_camera`, `invalid_blinks`, `names_unavailable` (503), `doorbell_unavailable` (503). Contrat complet dans le change commun (`essensys-feature-lifecycle`).

## Limites connues

- La vidéo est une suite d'instantanés (environ une image par seconde), pas un flux fluide.
- Le clignotement est lent : l'armoire lit les ordres à son rythme.
- Gateway sans sonnette (404) : aucune fenêtre, aucun message.
- Démo : état et réglages simulés en mémoire ; `sessionStorage` : `essensys_demo_doorbell_status` (état renvoyé), `essensys_demo_doorbell_init` (réglages de départ), `essensys_demo_doorbell_error` (`403`, `503`, `unknown_camera`, `invalid_blinks`), `essensys_demo_doorbell_cameras` (`503`), `essensys_demo_doorbell_absent` (`404`).

## Liens

- Tests : `e2e/tests/doorbell.spec.ts`, `e2e/tests/doorbell-logic.spec.ts` (`@nr NR-server-frontend-11`).
