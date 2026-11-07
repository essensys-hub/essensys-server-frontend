# Noms des lumières

> Feature `noms-lumieres-2026-11-004` — essensys-hub/essensys-feature-lifecycle#41 (sub-issue essensys-hub/essensys-server-frontend#12)

## Objectif

Donner à chaque lumière le nom de votre choix (« WC 3 » à la place de « Dressing »). Le nom s'affiche partout sur le portail local : page Éclairage, tableau de bord, écran Temporisations et messages de dernière action.

## Où le trouver

Page **Éclairage** : sous chaque lumière, le panneau repliable « Nom » contient le champ **Nom** (1 à 40 caractères), **Enregistrer** et **Nom d'origine** (remet le nom d'usine).

## Permissions

Réservé à l'administrateur de l'armoire : rôle `lan_admin`, ou tout utilisateur quand l'IAM LAN est désactivé. Les autres voient les noms sans pouvoir les modifier ; la gateway répond 403 à un non-administrateur.

## Règles

- Nom de 1 à 40 caractères, sans caractère de contrôle ni `<` `>` ; affiché comme texte brut.
- Si la lecture des noms échoue, les noms d'origine sont affichés.
- Renommer n'envoie aucun ordre à l'armoire.
- Erreurs : 400 (nom refusé), 403 (réservé à l'administrateur), 503 (stockage des noms indisponible sur la passerelle).

## API

| Appel | Détail |
|---|---|
| `GET /api/lights/names` | `{"lights":[{"id","default","name","version","updated_at"}]}` (33 lumières), `name` null si aucun |
| `PUT /api/admin/lights/names/{id}` | corps `{"name":"WC 3"}` ou `{"name":null}` ; 200 avec `"status":"saved"` ou `"dry_run"` |

Contrat complet dans le change commun (`essensys-feature-lifecycle`).

## Limites connues

- Démo : noms simulés en mémoire ; `sessionStorage.essensys_demo_names_error` (`403` ou `503`) force une erreur simulée.
- Éditeur de scénarios : libellés fournis par le serveur, non renommés.
