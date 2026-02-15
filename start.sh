#!/bin/bash
# Script de démarrage rapide pour CSS Extractor

echo "🚀 Démarrage de CSS Extractor..."
echo ""

# Vérifier si la base de données existe
mysql -u css_user -pcss_pass123 -e "USE css_extractor;" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ Base de données non initialisée"
    echo ""
    echo "Veuillez d'abord initialiser la base de données avec :"
    echo "  cd backend/scripts && ./init-db.sh"
    echo ""
    exit 1
fi

echo "✅ Base de données OK"
echo ""

# Démarrer le backend en arrière-plan
echo "🔧 Démarrage du backend (port 3002)..."
cd backend
node server.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 2

# Vérifier que le backend a démarré
if lsof -i:3002 > /dev/null 2>&1; then
    echo "✅ Backend démarré (PID: $BACKEND_PID)"
else
    echo "❌ Erreur de démarrage du backend"
    echo "Voir les logs dans: logs/backend.log"
    exit 1
fi

echo ""
echo "⚛️  Démarrage du frontend (port 3000)..."
echo ""
cd frontend
npm start

# Cleanup au exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
