## 4. Portail local (essensys-server-frontend) (#12)

- [x] 4.1 Reprendre la logique du portail cloud avec `GET /api/lights/names` ; vérifier par des tests de la logique
- [x] 4.2 Afficher le nom personnalisé dans les listes, la fiche, l'écran Temporisations et le tableau de bord ; vérifier par Playwright
- [x] 4.3 Ajouter le champ « Nom » et « Nom d'origine » pour `lan_admin` (ou tous si l'IAM LAN est désactivé) avec `PUT /api/admin/lights/names/{id}` ; vérifier par Playwright
- [x] 4.4 Ajouter `@nr NR-server-frontend-8` en mode `no-armoire`, l'inscrire dans le script `test:demo`, desktop, iPhone et iPad
