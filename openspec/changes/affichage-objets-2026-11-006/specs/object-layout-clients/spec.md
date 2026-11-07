## Purpose

Appliquer la disposition des lumières et des volets (objets désactivés masqués, ordre choisi) sur le portail local et permettre à l'administrateur de la modifier (surface de ce dépôt).

## ADDED Requirements

### Requirement: Lecture et repli
Le portail local SHALL lire `GET /api/lights/layout` et `GET /api/shutters/layout` et calculer la liste effective : `order` d'abord, puis les identifiants connus absents dans l'ordre du catalogue ; les identifiants inconnus sont ignorés. Si la lecture échoue ou si le serveur répond 404, il MUST afficher le catalogue complet dans l'ordre d'origine, sans message bloquant. Après une lecture réussie, une coupure passagère conserve la dernière disposition lue.

#### Scenario: Ancien serveur
- **GIVEN** une gateway qui répond 404
- **WHEN** l'utilisateur ouvre Éclairage ou Volets & Stores
- **THEN** les 33 lumières et les 16 volets et stores sont affichés dans l'ordre d'origine

#### Scenario: Ordre incomplet ou identifiant ancien
- **GIVEN** un `order` qui ne contient que `salon` et un identifiant inexistant
- **THEN** `salon` vient en premier de son groupe, les autres suivent dans l'ordre du catalogue

### Requirement: Objet désactivé masqué partout
Un objet désactivé SHALL être masqué pour tous les utilisateurs dans les listes, les commandes de groupe, l'écran Temporisations et la carte « Temps de course ». Aucune commande MUST être envoyée pour cet objet. Un groupe sans objet actif n'affiche ni boutons de groupe ni ligne, seulement « Aucune lumière activée » ou « Aucun volet activé ».

#### Scenario: Commande de groupe
- **GIVEN** `wc2` désactivée
- **WHEN** l'utilisateur appuie sur « Tout allumer » du groupe principal
- **THEN** 20 commandes sont envoyées, aucune pour `wc2`

#### Scenario: Volet désactivé
- **GIVEN** `voletbureau` désactivé
- **THEN** il disparaît de la liste, de « Tout ouvrir » et de « Temps de course »

### Requirement: Ordre appliqué dans chaque groupe
L'ordre SHALL s'appliquer à l'intérieur de chaque groupe d'affichage ; un objet ne change jamais de groupe. Les écrans sans groupe (Temporisations, « Temps de course ») suivent l'ordre global filtré. Les noms (#41, #52) restent inchangés.

#### Scenario: Ordre choisi
- **GIVEN** `volet2salon` placé avant `volet1salon`
- **THEN** la liste, « Temps de course » et « Tout ouvrir » suivent cet ordre

### Requirement: Écran de gestion de l'administrateur
`lan_admin` (ou tout le monde si l'IAM LAN est désactivé) SHALL disposer d'un écran de gestion listant tous les objets du genre, désactivés compris, avec interrupteur, Monter/Descendre dans le groupe, « Ordre d'origine » (écriture `{"reset":true}`) et « Enregistrer » (une seule écriture). Un `lan_user` MUST NOT voir l'écran ni le bouton. Les erreurs 400, 403 et 503 donnent un message clair et laissent l'écran ouvert.

#### Scenario: Monter et descendre
- **WHEN** l'administrateur monte `sam` et enregistre
- **THEN** `sam` précède `salon`, sans rechargement

#### Scenario: Utilisateur non administrateur
- **WHEN** un `lan_user` ouvre Éclairage (IAM actif)
- **THEN** il ne voit ni le bouton de gestion ni les objets désactivés

### Requirement: Aucune écriture dans l'armoire
Le portail local MUST NOT écrire la disposition dans l'armoire ni envoyer de commande pour un objet désactivé. Les tests s'exécutent en mode `no-armoire`.
