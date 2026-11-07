## Context

Le contexte, les décisions et le **contrat d'API** (identique cloud et gateway) sont dans le change commun `openspec/changes/noms-volets-2026-11-005` du dépôt `essensys-feature-lifecycle` (`design.md`). Ce document ne note que les choix propres au portail local.

## Decisions

1. **Logique pure dans `src/shutters/shutterNames.ts`** : catalogue des 16 volets et stores (id, nom d'origine ; `voletstore` garde ses guillemets), nom affiché, validation (1 à 40 caractères, sans caractère de contrôle ni `<` `>`, bornes partagées avec les lumières). Testée sans navigateur (`shutter-names-logic.spec.ts`).
2. **Réplique partagée** (`useShutterNames`, store externe) : une lecture alimente la liste, « Temps de course » et les messages ; un renommage les met à jour sans rechargement. Lecture impossible : noms d'origine, sans message bloquant.
3. **Texte brut** : le nom n'est rendu que comme texte React, jamais comme HTML.
4. **Rôle** : même règle que les noms de lumières (`useCanAdminLightTimers` : `lan_admin`, ou tout le monde quand l'IAM LAN est désactivé). Le masquage n'est pas une protection : le serveur répond 403.
5. **Nom d'origine** : il reste dans le tableau `shutters` / `stores` de `ShuttersPage.tsx` (clé de repli) ; seul l'affichage passe par `nameOf(id)`. Les titres de cartes et les boutons génériques ne changent pas.
6. **Aucune modification d'authentification ni des lumières** : les noms de lumières (#41) sont inchangés.
