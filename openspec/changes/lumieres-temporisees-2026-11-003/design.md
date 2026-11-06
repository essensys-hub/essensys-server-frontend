## Context

Le contexte, les décisions et le **contrat d'API** (identique cloud et gateway) sont dans le change commun `openspec/changes/lumieres-temporisees-2026-11-003` du dépôt `essensys-feature-lifecycle` (`design.md`, section « Contrat d'API »). Ce document ne note que les choix propres au portail local.

## Decisions

1. **Logique pure dans `src/lights/lightTimers.ts`** : catalogue (id, libellé, clé), raccourcis 15, 30, 60 et 0 « Jamais », validation de la valeur libre (entier 1 à 255), formatage (« 7 min », « 1 h », « Jamais », « inconnue »). Testée sans navigateur (`light-timers-logic.spec.ts`).
2. **Un composant, deux endroits** : `LightTimerControl` est rendu par la page `/lighting/timers` (une lecture `GET` pour les six) et par `LightTimerPanel`, panneau repliable de la page Éclairage (lecture à l'ouverture).
3. **Rôle** : `useCanAdminLightTimers` = `lan_admin`, ou tout le monde quand l'IAM LAN est désactivé ; faux tant que le mode IAM n'est pas résolu. Le masquage n'est pas une protection : le serveur répond 403.
4. **Hors ligne** : `snapshot.connected` (sans snapshot, hors ligne). Relecture à 5, 10 et 20 s après un envoi.
5. **Course IAM** : `LanAuthContext` redirigeait vers `/login` au rendu qui suit la résolution asynchrone de `/health` ; le contexte reste en chargement jusqu'à la première lecture de session.
