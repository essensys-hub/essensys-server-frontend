# Essensys Server Frontend

Ce projet est une réécriture moderne en **React + TypeScript + Vite** de l'interface web "Legacy" du serveur domotique Essensys. Il remplace l'ancienne interface basée sur jQuery.

## Fonctionnalités

Le tableau de bord permet de contrôler les éléments suivants via des appels API au backend existant :

- **Éclairages** : Gestion des lumières par zone (Principaux, Indirects) avec retour d'état visuel.
- **Chauffage** : Contrôle des modes (Confort, Éco, Hors gel, etc.) pour différentes zones (Jour, Nuit, SDB).
- **Volets** : Ouverture et fermeture centralisée ou individuelle.
- **Alarme** : Activation/Désactivation et statut.
- **Arrosage & Cumulus** : Contrôles dédiés.

## Structure du Projet

- `essensys-web-react/` : Le code source de l'application React.
  - `src/components/Dashboard/` : Composants UI pour chaque fonctionnalité (LightingControl, HeatingControl, etc.).
  - `src/services/legacyApi.ts` : Service gérant la communication avec le backend (Injections d'actions).
  - `vite.config.ts` : Configuration de Vite, incluant le **proxy** vers le backend.
- `test/` : Scripts Python pour le reverse engineering et la validation des API.

## Prérequis

- **Node.js** (version 18 ou supérieure recommandée)
- **npm**

## Installation et Démarrage

Le projet frontend se trouve dans le dossier `essensys-web-react`.

1. **Naviguer dans le dossier du projet :**
   ```bash
   cd essensys-web-react
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement :**
   ```bash
   npm run dev
   ```
   L'application sera accessible sur `http://localhost:5173`.

4. **Construire pour la production :**
   ```bash
   npm run build
   ```
   Les fichiers compilés seront dans le dossier `dist/`.

## Configuration du Backend (Proxy)

Le serveur de développement Vite est configuré pour rediriger les appels API (`/api/*`) vers le backend local tournant sur le port **80** (`http://127.0.0.1:80`).

> [!IMPORTANT]
> Une correction a été appliquée dans `vite.config.ts` (utilisation de `body-parser`) pour forcer l'envoi du header `Content-Length`. Cela corrige l'erreur `400 Bad Request` renvoyée par le backend qui ne supporte pas le `Transfer-Encoding: chunked`.

## Tests et Debugging

Des scripts Python sont disponibles dans le dossier `test/` pour vérifier le comportement du backend indépendamment du frontend :

```bash
# Exemple de test d'injection d'action
python3 test/test_degamenet2.py
```
