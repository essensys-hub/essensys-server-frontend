# Noms des volets et stores

> Feature `noms-volets-2026-11-005` — essensys-hub/essensys-feature-lifecycle#52 (sub-issue essensys-hub/essensys-server-frontend#14)

## Objectif

Donner à chaque volet et store le nom de votre choix (« Volet baie vitrée » à la place de « Volet 1 Salon »). Le nom s'affiche partout sur la page **Volets & Stores** : liste des commandes, carte « Temps de course » et messages de dernière action.

## Où le trouver

Page **Volets & Stores** : sous chaque volet, le panneau repliable « Nom » contient le champ **Nom** (1 à 40 caractères), **Enregistrer** et **Nom d'origine** (remet le nom d'usine).

## Permissions

Réservé à l'administrateur de l'armoire : rôle `lan_admin`, ou tout utilisateur quand l'IAM LAN est désactivé. Les autres voient les noms sans pouvoir les modifier ; la gateway répond 403 à un non-administrateur.

## Règles

- Nom de 1 à 40 caractères, sans caractère de contrôle ni `<` `>` ; les guillemets sont permis ; affiché comme texte brut.
- Si la lecture des noms échoue, les noms d'origine sont affichés.
- Renommer n'envoie aucun ordre à l'armoire et ne change pas les temps de course.
- Erreurs : 400 (nom refusé), 403 (réservé à l'administrateur), 503 (stockage des noms indisponible sur la passerelle).

## API

| Appel | Détail |
|---|---|
| `GET /api/shutters/names` | `{"shutters":[{"id","default","name","version","updated_at"}]}` (16 volets et stores), `name` null si aucun |
| `PUT /api/admin/shutters/names/{id}` | corps `{"name":"Volet baie vitrée"}` ou `{"name":null}` ; 200 avec `"status":"saved"` ou `"dry_run"` |

Contrat complet dans le change commun (`essensys-feature-lifecycle`).

## Limites connues

- Démo : noms simulés en mémoire ; `sessionStorage.essensys_demo_names_error` (`403` ou `503`) force une erreur simulée.
- Le widget historique `ShutterControl` (V.1.0.0), non utilisé par les routes actuelles, n'est pas concerné.
