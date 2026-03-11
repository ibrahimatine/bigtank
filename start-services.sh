#!/bin/bash

# Determine le dossier du projet automatiquement
DIR="$(cd "$(dirname "$0")" && pwd)"

set -a
source "$DIR/.env"
set +a

LOG="$DIR/logs"
mkdir -p "$LOG"

# Arreter les anciens processus sur les ports utilises
echo "Stopping old processes..."
kill $(lsof -ti:3000,4000 2>/dev/null) 2>/dev/null
sleep 1

# Lancer le backend monolithe
echo "Starting API..."
(cd "$DIR/apps/api" && nohup node dist/main.js > "$LOG/api.log" 2>&1 &)

sleep 2

# Verifier que l'API tourne
echo ""
echo "=== Status ==="
PID=$(lsof -ti:4000 2>/dev/null)
if [ -n "$PID" ]; then
  echo "  API (port 4000) : OK (PID $PID)"
else
  echo "  API (port 4000) : FAILED"
  echo "  Check logs: $LOG/api.log"
fi

echo ""
echo "Logs: $LOG/"
echo "API started. Run 'pnpm --filter @samadal/web start' for the frontend."
