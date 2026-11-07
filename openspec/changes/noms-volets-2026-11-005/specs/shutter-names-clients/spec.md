## Purpose

Afficher le nom personnalisé de chaque volet et store partout où il apparaît, et permettre à l'administrateur de l'armoire de le modifier, sur le portail local (surface de ce dépôt).

## ADDED Requirements

### Requirement: Nom affiché partout
Le portail local SHALL lire les noms (`GET /api/shutters/names`) et afficher `name` quand il est non nul, `default` sinon, partout où le volet apparaît : page Volets & Stores (les deux groupes), carte « Temps de course », messages de dernière action (« Ouvert », « Fermé », « temps de course réglé »). Le nom MUST être rendu comme texte brut. Si la lecture échoue, les noms d'origine sont affichés. Les titres de cartes et les boutons génériques (« Volets », « Tout ouvrir », « Ouvrir », « Fermer ») ne changent pas.

#### Scenario: Nom personnalisé
- **GIVEN** `volet1salon` porte le nom « Volet baie vitrée »
- **WHEN** l'utilisateur ouvre la page Volets & Stores
- **THEN** « Volet baie vitrée » apparaît à la place de « Volet 1 Salon » dans la liste, dans « Temps de course » et dans le message après une commande

#### Scenario: Lecture impossible
- **WHEN** la lecture des noms échoue
- **THEN** les noms d'origine sont affichés, sans message d'erreur bloquant

#### Scenario: Nom contenant du HTML ou des guillemets
- **GIVEN** un nom stocké `a&b` ou `Store "nord"`
- **THEN** il est affiché tel quel, jamais interprété

#### Scenario: Nom de 40 caractères
- **GIVEN** un nom de 40 caractères
- **THEN** il reste lisible dans la liste et dans « Temps de course », sans masquer les boutons ni déborder de la page

### Requirement: Modification par l'administrateur
La fiche de chaque volet SHALL proposer, aux seuls administrateurs (`lan_admin`, ou tous quand l'IAM LAN est désactivé), un champ « Nom » (1 à 40 caractères) avec un bouton d'enregistrement et un bouton « Nom d'origine ». Le portail MUST appeler `PUT /api/admin/shutters/names/{id}`, valider la longueur avant l'envoi et afficher un message clair en cas d'erreur 400, 403 ou 503.

#### Scenario: Administrateur renomme
- **WHEN** l'administrateur saisit « Volet baie vitrée » et enregistre
- **THEN** le nom est mis à jour à l'écran sans rechargement

#### Scenario: Utilisateur non administrateur
- **THEN** le champ de modification n'est pas affiché (le serveur reste la protection : 403)

#### Scenario: Nom d'origine
- **WHEN** l'administrateur appuie sur « Nom d'origine »
- **THEN** `name` est remis à `null` et le nom d'origine réapparaît

#### Scenario: Nom invalide
- **WHEN** l'administrateur saisit 41 caractères ou `<b>`
- **THEN** l'envoi est refusé avec un message clair et aucune requête n'est émise

### Requirement: Cohérence avec le temps de course
La carte « Temps de course » SHALL utiliser le nom affiché. Le réglage du temps de course (indices 566 à 585) MUST rester inchangé.

#### Scenario: Temps de course
- **GIVEN** `store` renommé « Store terrasse »
- **THEN** la carte « Temps de course » liste « Store terrasse »

### Requirement: Lumières préservées
Les noms des lumières (#41) MUST continuer de fonctionner sans changement.

#### Scenario: Non-régression lumières
- **WHEN** un volet est renommé
- **THEN** `GET /api/lights/names` et l'affichage des lumières sont inchangés

### Requirement: Aucun effet sur l'armoire
Renommer un volet MUST NOT envoyer d'ordre ni d'indice à l'armoire. Les tests utilisent le mode `no-armoire`.

#### Scenario: Renommage
- **WHEN** un nom est modifié
- **THEN** aucune requête vers `/api/admin/inject` ni vers les actions web n'est émise
