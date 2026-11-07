## 4. Portail local (essensys-server-frontend) (#14)

- [x] 4.1 Reprendre la logique du portail cloud avec `GET /api/shutters/names` ; vérifier par des tests de la logique
- [x] 4.2 Afficher le nom personnalisé dans la liste, la carte « Temps de course » et les messages de la page Volets ; vérifier par Playwright
- [x] 4.3 Ajouter le champ « Nom » et « Nom d'origine » pour `lan_admin` (ou tous si l'IAM LAN est désactivé) avec `PUT /api/admin/shutters/names/{id}` ; vérifier par Playwright
- [x] 4.4 Ajouter `@nr NR-server-frontend-9` en mode `no-armoire`, l'inscrire dans le script `test:demo`, desktop, iPhone et iPad
