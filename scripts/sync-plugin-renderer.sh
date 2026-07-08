#!/usr/bin/env bash
# Synchronise le renderer générique de plugins depuis essensys-plugin-framework.
#
# Le renderer est la SOURCE UNIQUE partagée par les deux frontends jumeaux
# (server-frontend / user-portal-frontend). On le vendore ici en attendant sa
# publication sur le registre npm interne ; les deux jumeaux exécutent ce même
# script sur la même source, donc ils restent identiques (règle jumeaux).
#
# Usage: scripts/sync-plugin-renderer.sh [chemin-framework]
set -euo pipefail

SRC="${1:-../essensys-plugin-framework/ts/src}"
DST="src/lib/plugin-renderer"

if [ ! -d "$SRC" ]; then
  echo "Source introuvable: $SRC" >&2
  exit 1
fi

mkdir -p "$DST"
header='// ⚠️ SYNCED depuis essensys-plugin-framework/ts/src — NE PAS ÉDITER ICI.
// Modifier dans le dépôt framework puis relancer scripts/sync-plugin-renderer.sh
'

for f in descriptor.ts noArmoire.ts client.ts renderer.tsx manager.tsx index.ts; do
  { printf '%s\n' "$header"; cat "$SRC/$f"; } > "$DST/$f"
done
cp "$SRC/plugin.css" "$DST/plugin.css"

echo "✓ renderer synchronisé dans $DST (depuis $SRC)"
