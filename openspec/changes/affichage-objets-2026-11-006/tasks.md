## 4. Portail local (essensys-server-frontend) (#16)

- [x] 4.1 Reprendre la logique du portail cloud avec `GET /api/{lights|shutters}/layout` ; vérifier par des tests de la logique
- [x] 4.2 Filtrer et ordonner `LightingPage.tsx`, `ShuttersPage.tsx` (liste, `allShutters`, « Temps de course ») et `LightTimersPage.tsx` ; vérifier par Playwright
- [x] 4.3 Ajouter l'écran de gestion pour `lan_admin` (ou tous si l'IAM LAN est désactivé) avec `PUT /api/admin/{lights|shutters}/layout` ; vérifier par Playwright
- [x] 4.4 Ajouter `@nr NR-server-frontend-10` en mode `no-armoire`, l'inscrire dans le script `test:demo`, desktop, iPhone et iPad
