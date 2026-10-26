## 1. Carte Prises de sécurité (#5)

- [ ] 1.1 Même carte sur `SecurityPage.tsx` que le portail cloud (pages identiques) ; vérifier par `npm run build` et `npm run lint`
- [ ] 1.2 Même choix dans `ScenarioEditorDrawer.tsx` ; vérifier dans le mode démo

## 2. Tests (#6)

- [ ] 2.1 Test `e2e/tests/security-outlets.spec.ts` (`@nr NR-server-frontend-6`) sur la matrice Playwright existante, fixture no-armoire ; vérifier qu'il passe

## 3. Livraison (#7)

- [ ] 3.1 `/checkup` vert, captures sur #36, déploiement sur la gateway (essensys-ansible) après le backend local, puis validation sur le banc BP
