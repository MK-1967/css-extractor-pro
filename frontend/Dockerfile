# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app

# Copie des fichiers package.json
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du code source
COPY . .

# Build de l'application React
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
RUN npm run build

# Stage 2: Production avec Nginx
FROM nginx:alpine

# Copie du build React
COPY --from=build /app/build /usr/share/nginx/html

# Configuration Nginx pour React Router
RUN echo 'server { \
  listen 80; \
  server_name _; \
  \
  location / { \
    root /usr/share/nginx/html; \
    index index.html; \
    try_files $uri $uri/ /index.html; \
  } \
  \
  # Gestion des erreurs \
  error_page 404 /index.html; \
  \
  # Optimisations \
  gzip on; \
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
