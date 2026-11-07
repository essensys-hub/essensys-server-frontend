# Activer, désactiver et ordonner les lumières et les volets

> Feature `affichage-objets-2026-11-006` — essensys-hub/essensys-feature-lifecycle#55 (sub-issue essensys-hub/essensys-server-frontend#16)

## Objectif

Masquer les lumières et les volets que vous n'utilisez pas, et choisir l'ordre dans lequel les autres s'affichent.

## Où le trouver

Pages **Éclairage** et **Volets & Stores** : le bouton **Gérer l'affichage des lumières** (ou **… des volets**) ouvre la liste de tous les objets avec, pour chacun, un interrupteur **Activé / Désactivé** et les boutons **Monter** et **Descendre**. **Enregistrer** envoie une seule écriture ; **Ordre d'origine** remet l'ordre d'usine et réactive tous les objets (à enregistrer).

## Permissions

Réservé à l'administrateur de l'armoire : rôle `lan_admin`, ou tout utilisateur quand l'IAM LAN est désactivé. Les autres voient la liste filtrée sans pouvoir la modifier ; la gateway répond 403 à une écriture non autorisée.

## Effets

- Un objet désactivé disparaît des listes, de « Tout allumer / éteindre », « Tout ouvrir / fermer », de **Temporisations** et de **Temps de course** ; aucune commande n'est envoyée pour lui.
- Un groupe sans objet actif affiche « Aucune lumière activée » ou « Aucun volet activé ».
- Monter et Descendre échangent un objet avec son voisin **du même groupe** : un objet ne change jamais de groupe.
- Les noms personnalisés et les temporisations ne changent pas. Les scénarios gardent le catalogue complet.
- Si la lecture échoue (ancienne gateway, erreur), tous les objets sont affichés dans l'ordre d'origine.
- Rien n'est écrit dans l'armoire.
- Erreurs : 400 (disposition refusée), 403 (réservé à l'administrateur), 503 (stockage indisponible sur la passerelle).

## API

| Appel | Détail |
|---|---|
| `GET /api/{lights\|shutters}/layout` | `{"order":[…],"disabled":[…],"version":n,"updated_at":…}` ; défaut `{"order":[],"disabled":[],"version":0,"updated_at":null}` |
| `PUT /api/admin/{lights\|shutters}/layout` | corps `{"order":[…],"disabled":[…]}` ou `{"reset":true}` ; 200 avec `"status":"saved"` ou `"dry_run"` |

Contrat complet dans le change commun (`essensys-feature-lifecycle`).

## Limites connues

- Démo : disposition simulée en mémoire ; `sessionStorage.essensys_demo_layout_error` (`403` ou `503`) force une erreur d'écriture, `essensys_demo_layout_read` (`404` ou `500`) une erreur de lecture.
- Les widgets historiques `LightingControl` et `ShutterControl` (non routés) ne sont pas concernés.
