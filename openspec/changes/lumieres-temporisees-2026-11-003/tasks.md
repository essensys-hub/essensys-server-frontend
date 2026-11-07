## 4. Portail local (essensys-server-frontend) (#10)

- [x] 4.1 Reprendre la logique et l'API (`GET /api/admin/lights/timers`) du portail cloud ; vérifier par des tests de la logique
- [x] 4.2 Ajouter l'entrée « Temporisations » dans le menu (visible pour `lan_admin`, ou tous si l'IAM LAN est désactivé) et sa page ; vérifier par Playwright (rôle admin et non admin)
- [x] 4.3 Ajouter le réglage dans la fiche des six lumières ; vérifier par Playwright (valeur libre, hors ligne désactivé)
- [x] 4.4 Ajouter `@nr NR-server-frontend-7` en mode `no-armoire`, l'inscrire dans le script `test:demo`, desktop, iPhone et iPad
