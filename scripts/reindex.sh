#!/bin/bash
# Reindex toutes les annonces ACTIVE dans Meilisearch
# Usage: pnpm reindex [URL_API]
#
# Exemples:
#   pnpm reindex                          # Dev (localhost:4000)
#   pnpm reindex https://api.samadal.net  # Production

set -e

API_URL="${1:-http://localhost:4000}"
ENDPOINT="${API_URL}/api/admin/reindex"

echo "=== Reindexation Meilisearch ==="
echo "API: ${API_URL}"
echo ""

# Health check Meilisearch
echo "1. Verification Meilisearch..."
HEALTH=$(curl -s "${API_URL}/api/search/health" 2>/dev/null || echo '{"status":"unreachable"}')
STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ "$STATUS" != "ok" ]; then
  echo "   ERREUR: Meilisearch indisponible (status: ${STATUS})"
  echo "   Verifiez MEILISEARCH_URL et MEILISEARCH_API_KEY"
  exit 1
fi
echo "   OK"

# Reindex
echo "2. Lancement reindexation..."
RESULT=$(curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN:-}" \
  2>/dev/null)

REINDEXED=$(echo "$RESULT" | grep -o '"reindexed":[0-9]*' | cut -d':' -f2)

if [ -n "$REINDEXED" ]; then
  echo "   OK — ${REINDEXED} annonces reindexees"
else
  echo "   Reponse: ${RESULT}"
  echo "   Note: l'endpoint /admin/reindex necessite un token ADMIN"
fi

echo ""
echo "=== Termine ==="
