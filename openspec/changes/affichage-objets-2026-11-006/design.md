## Context

Le contexte, les décisions et le **contrat d'API** sont dans le change commun `openspec/changes/affichage-objets-2026-11-006` du dépôt `essensys-feature-lifecycle` (`design.md`). Ce document ne note que les choix propres au portail local.

## Decisions

1. **Logique pure dans `src/layout/objectLayout.ts`** : catalogues (identifiant et groupe `MAIN` / `INDIRECT` / `SPECIAL`, dérivés des catalogues de noms #41 et #52), `effectiveLayout` (règle commune : `order` d'abord, puis les identifiants connus absents dans l'ordre du catalogue, inconnus ignorés), `layoutItems` (filtre et ordre d'une liste), `moveInGroup` (échange avec le voisin du même groupe), `buildWrite` (`order` complet et `disabled`, ou `{"reset":true}`). Testée sans navigateur (`object-layout-logic.spec.ts`).
2. **Réplique partagée** (`useObjectLayout`, un magasin externe par genre) : une lecture alimente les listes, Temporisations et « Temps de course ». Lecture impossible ou 404 : catalogue complet ; la dernière valeur lue est conservée après un succès. La lecture est relancée à chaque affichage d'un écran.
3. **Filtrer une seule fois** : `renderLightControls` et `renderShutterControls` reçoivent le catalogue du groupe et calculent la liste filtrée et ordonnée ; boutons de groupe et lignes partagent donc la même liste. Le tableau `allShutters` n'est filtré qu'à l'affichage de « Temps de course » (la lecture des temps reste complète, aucune écriture ne part pour un objet désactivé).
4. **Écran de gestion** (`ObjectLayoutManager`) : modifications locales jusqu'à « Enregistrer » ; « Ordre d'origine » prépare `{"reset":true}` tant que rien d'autre n'est modifié. Le nom affiché est celui de #41/#52, en texte brut.
5. **Rôle** : `useCanAdminLightTimers` (`lan_admin`, ou tout le monde quand l'IAM LAN est désactivé). Le masquage n'est pas une protection : le serveur répond 403.
6. **Hors périmètre** : scénarios, éditeur de scénarios, widgets historiques non routés (`LightingControl`, `ShutterControl`).
