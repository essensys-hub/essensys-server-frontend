## Purpose

Afficher la vidéo de la sonnette UniFi dans le portail local et permettre à l'administrateur de régler la fonction (surface de ce dépôt).

## ADDED Requirements

### Requirement: Fenêtre de sonnette
Le portail local SHALL interroger `GET /api/doorbell/status` et, quand la fonction est activée et disponible et que `ringing=true`, afficher sur toutes les pages une fenêtre « Quelqu'un sonne » avec la vidéo de `GET /api/doorbell/stream`. La fenêtre MUST pouvoir être fermée, ne pas se rouvrir pour la même sonnerie et se rouvrir pour la suivante. Fonction désactivée, `available=false` ou gateway sans sonnette (404) : aucune fenêtre et aucune requête vidéo.

#### Scenario: Sonnerie
- **GIVEN** un faux état `ringing=true`
- **WHEN** le portail interroge l'état
- **THEN** la fenêtre s'affiche avec la vidéo, sur Tableau de bord, Éclairage et Volets & Stores

#### Scenario: Fermeture
- **WHEN** l'utilisateur ferme la fenêtre
- **THEN** elle ne se rouvre pas pour la même sonnerie et se rouvre pour la suivante

#### Scenario: Fonction désactivée ou indisponible
- **GIVEN** `enabled=false`, `available=false`, `ringing=false` ou une gateway qui répond 404
- **THEN** aucune fenêtre et aucune requête vidéo

#### Scenario: Flux en erreur
- **GIVEN** un flux qui répond 503
- **THEN** « Vidéo indisponible pour le moment. » est affiché et la fenêtre reste fermable

### Requirement: Écran de réglage
Le portail local SHALL proposer à `lan_admin` (ou à tous si l'IAM LAN est désactivé) un écran « Sonnette » : activer, caméra, lumières du catalogue (noms personnalisés affichés, lumières masquées non proposées), clignotements de 1 à 10, « Enregistrer » (un seul `PUT`) et « Essayer ». Les erreurs de la gateway sont affichées en français. Un utilisateur non administrateur ne voit ni l'écran ni l'entrée de menu.

#### Scenario: Réglage
- **WHEN** l'administrateur choisit deux lumières, 3 clignotements et enregistre
- **THEN** un seul `PUT` part avec `enabled`, `camera_id`, `lights`, `blinks` et les valeurs sont relues à la réouverture

#### Scenario: Lumières proposées
- **GIVEN** `salon` renommé « Séjour » et `wc2` masquée par la disposition
- **THEN** « Séjour » est proposé et `wc2` ne l'est pas (sauf si elle est déjà choisie, avec la mention « (masquée) »)

#### Scenario: Erreurs
- **WHEN** la gateway répond 403, 503 `names_unavailable`, 400 `unknown_camera` ou `invalid_blinks`
- **THEN** un message en français est affiché et l'écran garde les modifications

#### Scenario: Essai
- **WHEN** l'administrateur touche « Essayer »
- **THEN** `POST /api/admin/doorbell/test` part (dry-run en mode test) et la fenêtre de sonnerie s'affiche, sans aucun ordre vers l'armoire

#### Scenario: Non-administrateur
- **WHEN** un `lan_user` ouvre le portail (IAM actif)
- **THEN** il ne voit ni l'écran de réglage ni l'entrée « Sonnette », mais voit la fenêtre de sonnerie

### Requirement: Mode no-armoire
Les tests applicatifs MUST s'exécuter en mode `no-armoire` : aucune requête vers l'armoire ni vers une console UniFi réelle.

#### Scenario: Matrice d'appareils
- **WHEN** les tests Playwright s'exécutent sur desktop, iPhone et iPad
- **THEN** ils passent sans aucune requête vers l'armoire (`@nr NR-server-frontend-11`)
