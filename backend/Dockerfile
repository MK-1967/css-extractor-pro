FROM node:20-alpine

WORKDIR /app

# Installation des dépendances système pour Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Configuration Puppeteer pour utiliser Chromium installé
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Installation des dépendances Node.js
COPY package*.json ./
RUN npm ci --only=production

# Copie du code source
COPY . .

# Création du répertoire pour les fichiers CSS extraits
RUN mkdir -p /extracted_css && chmod 777 /extracted_css

# Exposition du port
EXPOSE 3002

# Démarrage du serveur
CMD ["node", "server.js"]
