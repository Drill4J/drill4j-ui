FROM node:20.15.0 AS build

WORKDIR /app

# Install deps
COPY ./package.json ./package.json
RUN npm install

# Build
COPY ./src ./src
COPY ./public ./public
RUN npm run build

FROM nginx:latest

LABEL org.opencontainers.image.source=https://github.com/drill4j/drill4j-ui

COPY --from=build /app/build /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/nginx.conf

CMD ["nginx", "-g", "daemon off;"]
