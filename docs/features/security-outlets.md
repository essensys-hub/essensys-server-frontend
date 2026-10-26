# Prises de sécurité

> Feature `security-outlets-2026-10-011` — essensys-hub/essensys-feature-lifecycle#36

## Objectif

Couper et rétablir les prises de sécurité de la maison depuis la page **Sécurité** du portail local, et voir si elles sont coupées.

Route : `/security`, carte **Prises de sécurité**.

## Utilisation

- **État** : « Prises pilotées » (440 = 0), « Prises coupées » (440 = 1) ou « État inconnu » (indice absent). Après une commande, la carte affiche « En attente de l'armoire » et relit l'état après 5, 10 puis 20 s.
- **Couper** : demande une confirmation, puis envoie le lot. **Annuler** n'envoie rien.
- **Rétablir** : envoie le lot directement.
- Les deux boutons sont désactivés quand le snapshot de l'armoire indique qu'elle est hors ligne.
- En mode test (dry-run) ou en démo, la commande est validée sans être exécutée.

L'éditeur de scénarios propose aussi **Prises de sécurité : ne rien faire / couper / rétablir** pour chaque scénario (décalage 31 du bloc : `592 + (n − 1) × 41 + 31`, par exemple 664 pour « Je sors »).

## Mapping Table d'Échange

| Action | Lot envoyé à `/api/admin/inject` |
|---|---|
| Couper | `[{k: 590, v: "1"}, {k: 623, v: "1"}]` |
| Rétablir | `[{k: 590, v: "1"}, {k: 623, v: "2"}]` |

La gateway complète le bloc (605–622 à 0) et ajoute `623 = "0"` à toute commande d'éclairage, pour qu'elle ne puisse pas recouper les prises.

## Tests

`e2e/tests/security-outlets.spec.ts` (`@nr NR-server-frontend-6`) sur la cible `local`, avec la fixture no-armoire : lot exact pour couper et rétablir, annulation sans envoi, commandes désactivées hors ligne, état inconnu sans 440.

```bash
cd e2e
ESSENSYS_LOCAL_URL=http://localhost:4183 npx playwright test security-outlets.spec.ts --project=local-desktop --project=local-iphone --project=local-ipad
```

Validation réelle : sur le banc BP, par un humain. Jamais par les tests automatiques.
