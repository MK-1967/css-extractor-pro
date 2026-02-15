#!/bin/bash
# Script d'initialisation de la base de données MySQL pour CSS Extractor

echo "🗄️  Initialisation de la base de données MySQL..."
echo ""
echo "Veuillez entrer le mot de passe root MySQL :"

# Créer la base de données et l'utilisateur
mysql -u root -p << EOF
CREATE DATABASE IF NOT EXISTS css_extractor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'css_user'@'localhost' IDENTIFIED BY 'css_pass123';
GRANT ALL PRIVILEGES ON css_extractor.* TO 'css_user'@'localhost';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Base de données créée avec succès !"
    echo ""
    echo "📋 Initialisation des tables..."

    # Initialiser le schéma
    mysql -u css_user -pcss_pass123 css_extractor < ../migrations/init.sql

    if [ $? -eq 0 ]; then
        echo "✅ Tables créées avec succès !"
        echo ""
        echo "🎉 Base de données prête à l'emploi !"
        echo ""
        echo "Vous pouvez maintenant démarrer le serveur avec: npm start"
    else
        echo "❌ Erreur lors de la création des tables"
        exit 1
    fi
else
    echo "❌ Erreur lors de la création de la base de données"
    exit 1
fi
