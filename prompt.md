Contexte : le projet mon Essensys (repositories essensys-server-frontend et essensys-server-backend) doit recevoir une nouvelle navigation et une UX modernisée. Actuellement, toutes les commandes domotiques (alarme, chauffage, éclairage, volets, cumulus, arrosage, notifications, paramètres) sont présentées sur une seule page verticale. Le système de domotique fonctionne en boucle ouverte : aucun retour d’état en temps réel n’est disponible ; on ne peut afficher que la dernière action envoyée.

Objectif front‑end : mettre en place une architecture avec un tableau de bord (« Home ») et un menu de navigation clair. Le tableau de bord affiche des cartes récapitulatives pour chaque catégorie (Sécurité, Chauffage, Éclairage, Volets & Store, Cumulus, Arrosage, Notifications, Paramètres) avec la dernière action envoyée. Le menu, sous forme de barre latérale sur desktop et de menu hamburger ou de barre d’onglets sur mobile, permet d’accéder à une page dédiée par catégorie. Chaque page doit lister les sous‑sections correspondantes (p. ex. Chauffage : Zone jour, Zone nuit, Salle de bain 1, Salle de bain 2) et proposer des boutons d’action (« Allumer », « Éteindre », etc.), plutôt que des interrupteurs qui présupposent un état. Utiliser des composants réutilisables (cards, buttons) et des icônes pour améliorer la lisibilité.

Objectif back‑end : maintenir les API existantes et, si besoin, ajouter une route REST simple pour enregistrer et fournir la dernière action envoyée pour chaque dispositif (par exemple un endpoint /history/latest?deviceId=). Cette route permettra au front‑end d’afficher dans le tableau de bord le dernier ordre enregistré. Il n’est pas nécessaire d’implémenter un retour d’état en temps réel ; la route se contente de renvoyer la dernière commande stockée.

Étapes proposées :
	1.	Utiliser la branche de feature sur le front‑end et le back‑end (V.1.2.0) pour isoler les travaux.
        il faut travailler sur les projet dans la branch V.1.2.0
            - essensys-server-backend
            - essensys-server-frontend
            - essensys-raspberry-install
            - essensys-ansible
	2.	Définir la structure de routage du front‑end : /dashboard (tableau de bord) et une route par catégorie (/security, /heating, /lighting, etc.). Utiliser un composant SidebarMenu et un composant CardSummary.
	3.	Implémenter les pages avec les listes de dispositifs et les boutons d’action. Chaque bouton déclenchera l’appel existant au back‑end pour envoyer la commande.
	4.	Ajouter au back‑end un modèle simple de journalisation (par ex. table ou fichier JSON) qui enregistre pour chaque dispositif l’horodatage et la commande. Exposer une route GET pour récupérer la dernière entrée.
	5.	Adapter les appels front‑end pour récupérer et afficher la dernière action sur chaque carte du tableau de bord, avec un message indiquant que l’état réel n’est pas garanti.
	6.	Tester le responsive design et l’accessibilité (touch targets sur mobile, contrastes).

Contraintes : ne pas modifier les APIs existantes afin de préserver la compatibilité ; s’assurer que l’interface reste légère et rapide (pas de librairies lourdes). Utiliser un design cohérent avec le reste de l’application (couleurs, typographie).