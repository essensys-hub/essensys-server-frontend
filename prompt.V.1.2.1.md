Contexte:
Nous préparons une évolution post V.1.2.0 de Mon Essensys. 
Cette évolution doit être développée sur une nouvelle branche V.1.2.1 sur tous les repositories concernés.

Repositories impactés (OBLIGATOIREMENT créer et utiliser la branche V.1.2.1):
- essensys-server-backend
- essensys-server-frontend
- essensys-raspberry-install
- essensys-ansible

Objectif principal:
Ajouter une authentification simple, sécurisée et compatible Raspberry Pi à l’installation Essensys, avec une option basculable:
- Auth obligatoire en WAN
- Optionnellement PAS d’auth en LAN (réseaux privés), activable/désactivable à tout moment

Contraintes:
- Compatible Raspberry Pi (ressources limitées)
- Simple à implémenter, maintenir, mettre à jour et déployer
- Sécuritaire par défaut
- Pas de dépendance à un service externe (Keycloak, OAuth, etc.)
- Ne pas complexifier le code applicatif inutilement

Choix technique recommandé:
Authentification au niveau reverse-proxy (Caddy prioritaire, Nginx acceptable).

Principe:
- Reverse-proxy devant frontend + backend
- Auth HTTP Basic avec hash sécurisé (bcrypt ou argon2)
- Fichier users:
    /etc/essensys/auth/users.htpasswd
    permissions: root:root 600
- Toute la sécurité repose sur le proxy (frontend et backend restent simples)

Option LAN / WAN:
- WAN: authentification TOUJOURS obligatoire
- LAN (RFC1918 + loopback): authentification optionnelle
- Option basculable à chaud par l’utilisateur

Configuration centrale:
Créer un fichier:
  /etc/essensys/auth/config.env

Variables:
  ESSENSYS_AUTH_ENABLED=1
  ESSENSYS_LAN_NOAUTH=0   # 1 = LAN sans auth, 0 = auth partout
  ESSENSYS_AUTH_REALM="Essensys"

Tâches détaillées:

1) Branches Git
   - Créer une branche V.1.2.1 sur chacun des repos:
       * essensys-server-backend
       * essensys-server-frontend
       * essensys-raspberry-install
       * essensys-ansible
   - Tous les développements doivent être faits exclusivement sur V.1.2.1
   - Aucun commit direct sur main ou V.1.2.0

2) essensys-raspberry-install
   - Installer Caddy via le script d’installation
   - Générer la configuration reverse-proxy:
       /        -> frontend
       /api/*   -> backend
   - Gérer HTTPS:
       - LAN: cert auto-signé acceptable
       - WAN (si domaine): Let's Encrypt automatique
   - Durant l’installation:
       - demander si auth activée
       - demander si LAN sans auth
       - demander username + password initial
       - générer users.htpasswd avec hash sécurisé
       - ne jamais logguer les mots de passe
   - Templates de configuration:
       - Template "auth partout"
       - Template "LAN sans auth / WAN avec auth" (basé sur remote_ip)
   - Recharger Caddy sans reboot après modification

   - Ajouter un outil admin:
       /usr/local/bin/essensys-auth
       Commandes:
         add-user <user>
         del-user <user>
         passwd <user>
         list-users
         lan-noauth on|off
         auth on|off
         status
       Chaque changement:
         - met à jour config.env
         - régénère la conf proxy
         - reload Caddy

3) essensys-server-backend (branche V.1.2.1)
   - Aucune logique d’auth applicative obligatoire
   - Toutes les routes protégées par le proxy
   - Option: laisser /health public
   - Vérifier qu’aucun log ne dump le header Authorization

4) essensys-server-frontend (branche V.1.2.1)
   - Pas de page login custom (Basic Auth navigateur OK)
   - Gérer les erreurs 401 proprement (message simple)
   - Dans Settings:
       - afficher le statut de l’auth (activée, LAN no-auth actif)
       - texte informatif sur la sécurité

5) essensys-ansible (branche V.1.2.1)
   - Ajouter les rôles/playbooks pour:
       - déployer Caddy
       - pousser config.env
       - pousser templates proxy
       - gérer users.htpasswd
   - Permettre:
       - activer/désactiver auth
       - activer/désactiver LAN sans auth
       - redéployer sans downtime

6) Sécurité & tests
   - Permissions strictes sur les fichiers sensibles
   - Tests:
       - LAN sans auth => 200
       - WAN sans auth => 401
       - WAN avec auth => 200
   - Documentation claire:
       - risques du LAN sans auth
       - recommandation firewall / non-exposition directe

Livrables attendus:
- Commits propres sur branches V.1.2.1
- Config proxy versionnée (templates)
- Script essensys-auth fonctionnel
- Documentation "Auth & LAN/WAN modes"