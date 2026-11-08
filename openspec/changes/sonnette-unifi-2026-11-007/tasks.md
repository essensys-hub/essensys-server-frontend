## 2. Portail local (essensys-server-frontend) (#18)

- [x] 2.1 Ajouter la lecture de l'état, la fenêtre « Quelqu'un sonne » avec la vidéo (toutes pages, fermeture sans réouverture pour la même sonnerie) ; vérifier par des tests de la logique et Playwright (faux état `ringing`, désactivé, indisponible)
- [x] 2.2 Ajouter l'écran « Sonnette » pour l'administrateur (activer, caméra, lumières avec noms personnalisés et sans les lumières masquées, clignotements, « Essayer », messages d'erreur) ; vérifier par Playwright (réglage, essai, non-administrateur sans écran)
- [x] 2.3 Ajouter `@nr NR-server-frontend-11` en mode `no-armoire` et l'inscrire dans le script `test:demo`, desktop, iPhone et iPad
