# Configuration de la base de données

## Problème
Le serveur ne démarre pas car la base de données n'est pas configurée.

## Solution (à faire demain)

### 1. Créer la base de données et l'utilisateur

Ouvrez un terminal et exécutez:

```bash
mysql -u root -p
```

Entrez votre mot de passe root MySQL, puis exécutez ces commandes SQL:

```sql
CREATE DATABASE IF NOT EXISTS css_extractor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'css_user'@'localhost' IDENTIFIED BY 'CssPass123!';
GRANT ALL PRIVILEGES ON css_extractor.* TO 'css_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Initialiser les tables

```bash
cd /Volumes/web/css-extractor/backend
mysql -u css_user -p'CssPass123!' css_extractor < migrations/init.sql
```

### 3. Démarrer le serveur

```bash
npm start
```

Le serveur devrait démarrer sur le port 3002.

---

**Note:** Le port 3002 est maintenant libre, le problème était que la base de données n'était pas configurée, ce qui faisait bloquer le serveur au démarrage.
