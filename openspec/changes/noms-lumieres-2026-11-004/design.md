## Context

Le contexte, les décisions et le **contrat d'API** (identique cloud et gateway) sont dans le change commun `openspec/changes/noms-lumieres-2026-11-004` du dépôt `essensys-feature-lifecycle` (`design.md`). Ce document ne note que les choix propres au portail local.

## Decisions

1. **Logique pure dans `src/lights/lightNames.ts`** : catalogue des 33 lumières (id, nom d'origine), nom affiché, validation (1 à 40 caractères, sans caractère de contrôle ni `<` `>`). Testée sans navigateur (`light-names-logic.spec.ts`).
2. **Réplique partagée** (`useLightNames`, store externe) : une lecture alimente tous les écrans ; un renommage les met à jour sans rechargement. Lecture impossible : noms d'origine, sans message bloquant.
3. **Texte brut** : le nom n'est rendu que comme texte React, jamais comme HTML.
4. **Rôle** : même règle que les temporisations (`useCanAdminLightTimers` : `lan_admin`, ou tout le monde quand l'IAM LAN est désactivé). Le masquage n'est pas une protection : le serveur répond 403.
5. **Temporisations** : l'écran et le panneau utilisent le nom affiché ; les libellés renvoyés par `/lights/timers` restent d'origine et ne servent que de repli.
6. **Éditeur de scénarios** : ses libellés viennent des descripteurs de scénarios du serveur (bits), pas des identifiants de lumières ; non modifié.
7. **Aucune modification d'authentification** : le correctif `LanAuthContext` de la feature précédente est déjà dans la base.
