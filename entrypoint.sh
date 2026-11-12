#!/bin/sh

# Check if API_HOST and API_PORT are set
if [ -z "$API_HOST" ] || [ -z "$API_PORT" ]; then
  echo "Error: API_HOST and API_PORT environment variables must be set."
  exit 1
fi

# BASE_PATH: empty or "/path" without a trailing slash
case "$BASE_PATH" in
  "" ) ;;
  / | /*/ | *[!A-Za-z0-9/_.-]* ) echo "Error: BASE_PATH must look like /drill (no trailing slash), got: $BASE_PATH"; exit 1 ;;
  /* ) ;;
  * ) echo "Error: BASE_PATH must start with /, got: $BASE_PATH"; exit 1 ;;
esac

# Replace variables in the nginx.conf template
envsubst '$$API_HOST $$API_PORT $$BASE_PATH' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf

# Add basepath in build
#   index.html
sed -i "s|/static|$(echo $BASE_PATH)/static|g" ./usr/share/nginx/html/index.html
sed -i "s|href=\"/favicon.ico\"|href=\"$(echo $BASE_PATH)/favicon.ico\"|g" ./usr/share/nginx/html/index.html
#   main.js
sed -i "s|defaults.baseURL=\"/api\"|defaults.baseURL=\"$(echo $BASE_PATH)/api\"|g" $(find ./usr/share/nginx/html/static/js/ -name 'main.*.js')
sed -i "s|basename:\"|basename:\"$(echo $BASE_PATH)|g" $(find ./usr/share/nginx/html/static/js/ -name 'main.*.js')

# Start nginx
nginx -g 'daemon off;'
