#!/bin/bash

# Determine le dossier du projet automatiquement
DIR="$(cd "$(dirname "$0")" && pwd)"

set -a
source "$DIR/.env"
set +a

LOG="$DIR/logs"
mkdir -p "$LOG"

# Arreter tous les anciens services (tous les ports d'un coup)
echo "Stopping old services..."
kill $(lsof -ti:3000,4000,4001,4002,4003,4004,4005,4007 2>/dev/null) 2>/dev/null
sleep 1

# Lancer les microservices backend (chacun depuis son dossier pour que envFilePath '../../.env' fonctionne)
echo "Starting backend services..."
(cd "$DIR/apps/auth-service"         && nohup node dist/main.js > "$LOG/auth.log"         2>&1 &)
(cd "$DIR/apps/listing-service"      && nohup node dist/main.js > "$LOG/listing.log"      2>&1 &)
(cd "$DIR/apps/chat-service"         && nohup node dist/main.js > "$LOG/chat.log"         2>&1 &)
(cd "$DIR/apps/payment-service"      && nohup node dist/main.js > "$LOG/payment.log"      2>&1 &)
(cd "$DIR/apps/notification-service" && nohup node dist/main.js > "$LOG/notification.log" 2>&1 &)
(cd "$DIR/apps/admin-service"        && nohup node dist/main.js > "$LOG/admin.log"        2>&1 &)

# Attendre que les services backend demarrent avant le gateway
sleep 3

# Lancer le gateway en dernier (il proxifie vers les autres)
echo "Starting API Gateway..."
(cd "$DIR/apps/api-gateway"          && nohup node dist/main.js > "$LOG/gateway.log"      2>&1 &)

sleep 2

# Verifier quels services tournent
echo ""
echo "=== Status ==="
for PORT in 4000 4001 4002 4003 4004 4005 4007; do
  PID=$(lsof -ti:$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    echo "  Port $PORT : OK (PID $PID)"
  else
    echo "  Port $PORT : FAILED"
  fi
done

echo ""
echo "Logs: $LOG/"
echo "All services started"
