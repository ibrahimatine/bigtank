#!/bin/bash
set -a
source /home/tine29i/bigtank/.env
set +a

LOG=/home/tine29i/bigtank/logs
mkdir -p $LOG

kill $(lsof -ti:4001,4002,4003,4004,4005,4007 2>/dev/null) 2>/dev/null
sleep 1

nohup node /home/tine29i/bigtank/apps/auth-service/dist/main.js        > $LOG/auth.log        2>&1 &
nohup node /home/tine29i/bigtank/apps/listing-service/dist/main.js     > $LOG/listing.log     2>&1 &
nohup node /home/tine29i/bigtank/apps/chat-service/dist/main.js        > $LOG/chat.log        2>&1 &
nohup node /home/tine29i/bigtank/apps/payment-service/dist/main.js     > $LOG/payment.log     2>&1 &
nohup node /home/tine29i/bigtank/apps/notification-service/dist/main.js > $LOG/notification.log 2>&1 &
nohup node /home/tine29i/bigtank/apps/admin-service/dist/main.js       > $LOG/admin.log       2>&1 &

sleep 3

kill $(lsof -ti:4000 2>/dev/null) 2>/dev/null
nohup node /home/tine29i/bigtank/apps/api-gateway/dist/main.js         > $LOG/gateway.log     2>&1 &

echo "All services started"
