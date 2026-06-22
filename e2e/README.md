# essensys-ui-e2e

Tests Playwright non-régression UI (OpenSpec 2026-06.026).

## Profils

| Commande | Cible |
|----------|--------|
| `npm run test:demo` | https://demo.essensys.fr |
| `npm run test:local` | Gateway LAN (`ESSENSYS_LOCAL_URL`, Basic Auth) |
| `npm run test:remote` | Portail (`ESSENSYS_PORTAL_URL`, JWT via login manuel) |

## Variables

- `ESSENSYS_DEMO_URL` — défaut `https://demo.essensys.fr`
- `ESSENSYS_LOCAL_URL` — défaut `https://mon.essensys.local`
- `ESSENSYS_BASIC_USER` / `ESSENSYS_BASIC_PASS` — auth local
- `ESSENSYS_TEST_MODE=dry_run` — implicite via header sur local/remote

```bash
cd e2e && npm install && npm run test:demo
```
