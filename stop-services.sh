#!/bin/bash

echo "Stopping all Samadal services..."

kill $(lsof -ti:4000,4001,4002,4003,4004,4005,4006,4007 2>/dev/null) 2>/dev/null

sleep 1

# Vérifier qu'il ne reste rien
REMAINING=$(lsof -ti:4000,4001,4002,4003,4004,4005,4006,4007 2>/dev/null)
if [ -n "$REMAINING" ]; then
  echo "Some processes still running, force killing..."
  kill -9 $REMAINING 2>/dev/null
fi

echo "All services stopped"
