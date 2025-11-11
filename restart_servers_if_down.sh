#!/bin/bash

# This script is meant to be scheduled as a regular Cron job. It restarts the
# the servers using pm2 if any of them are down (possibly due to a server
# reboot). Prerequisites for this script to work is to first of all have pm2
# installed, and also to have run 'npm run build' beforehand (with the latest
# version of the app).  

login_server_pid_str="$(pgrep -f 'login_server')"
ajax_server_pid_str="$(pgrep -f 'ajax_server')"
app_pid_str="$(pgrep -f 'Serve.js')"

if [[ "$login_server_pid_str" < "1" ]]; then
  echo "Restarting login server..."
  pm2 start ./src/server/login_server.js
fi
if [[ "$ajax_server_pid_str" < "1" ]]; then
  echo "Restarting main AJAX server..."
  pm2 start ./src/server/ajax_server.js
fi
if [[ "$app_pid_str" < "1" ]]; then
  echo "Restarting app server..."
  pm2 serve build 3000 --name "app" --spa
fi
