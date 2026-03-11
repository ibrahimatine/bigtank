#!/bin/bash

echo "Stopping Samadal API..."

kill $(lsof -ti:4000 2>/dev/null) 2>/dev/null

sleep 1

# Vérifier qu'il ne reste rien
REMAINING=$(lsof -ti:4000 2>/dev/null)
if [ -n "$REMAINING" ]; then
  echo "Process still running, force killing..."
  kill -9 $REMAINING 2>/dev/null
fi

echo "API stopped"
