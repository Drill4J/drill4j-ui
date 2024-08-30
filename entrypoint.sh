#!/bin/sh

# Check if API_HOST and API_PORT are set
if [ -z "$API_HOST" ] || [ -z "$API_PORT" ]; then
  echo "Error: API_HOST and API_PORT environment variables must be set."
  exit 1
fi

# Replace variables in the nginx.conf template
envsubst '$$API_HOST $$API_PORT' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf

# Start nginx
nginx -g 'daemon off;'
