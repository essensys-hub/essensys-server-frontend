## Context

Le contexte, les décisions et le **contrat d'API** sont dans le change commun `openspec/changes/sonnette-unifi-2026-11-007` du dépôt `essensys-feature-lifecycle` (`design.md`). Ce document ne note que les choix propres au portail local.

## Decisions

1. **Logique pure dans `src/doorbell/doorbell.ts`** : état (`parseStatus`), identité d'une sonnerie (`ringKey` = `last_ring_at`), visibilité de la fenêtre (`shouldShowWindow` : activé, disponible, sonnerie en cours, non fermée), intervalles d'interrogation, réglages (`parseSettings`, `buildSettingsWrite`, `validateBlinks` de 1 à 10), lumières proposées (`selectableLights`) et messages d'erreur. Testée sans navigateur (`doorbell-logic.spec.ts`).
2. **Interrogation** (`useDoorbellStatus`, montée une fois dans `MainLayout`) : 2 s tant que la fenêtre est ouverte, 5 s sinon, relecture immédiate à la prise de focus de l'onglet et après un essai ou un enregistrement. Une coupure passagère conserve le dernier état, qui expire à `ringing_until`. Un 404 (ancienne gateway) arrête l'interrogation. Pas de redirection de connexion sur 401 : l'interrogation tourne en arrière-plan.
3. **Fermeture** : la clé de la sonnerie fermée est gardée en mémoire et dans `sessionStorage` (un rechargement de page ne rouvre pas la même sonnerie).
4. **Vidéo** : balise `<img>` vers `GET /api/doorbell/stream?ring=<sonnerie>` (instantanés servis par la gateway, environ une image par seconde, derrière la session). La balise n'existe que fenêtre ouverte : aucune requête vidéo sinon. Échec du flux : « Vidéo indisponible pour le moment. », la fenêtre reste fermable.
5. **Écran « Sonnette »** : modifications locales jusqu'à « Enregistrer » (un seul PUT de quatre champs). « Essayer » est désactivé tant que des réglages ne sont pas enregistrés (l'essai joue les réglages enregistrés). L'essai envoie `X-Essensys-Test-Mode: dry-run` quand le mode test du portail est actif (comme #41, #52, #55).
6. **Lumières** : catalogue de #41 dans l'ordre effectif de #55, nom personnalisé affiché en texte brut ; lumières masquées écartées, sauf celles déjà choisies (mention « (masquée) »).
7. **Rôle** : `useCanAdminLightTimers` (`lan_admin`, ou tout le monde quand l'IAM LAN est désactivé). Le serveur reste la protection (403). L'état et la fenêtre sont ouverts à tout utilisateur authentifié.
8. **Hors périmètre** : ffmpeg/HLS, historique des vidéos, notifications push, cloud, applications mobiles.
