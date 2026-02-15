# 📦 Installation et Démarrage - CSS Extractor

## 🚀 Démarrage Rapide

### Étape 1 : Initialiser la base de données (une seule fois)

```bash
cd backend/scripts
./init-db.sh
```

Cela va créer :
- La base de données `css_extractor`
- L'utilisateur MySQL `css_user`
- Les tables `feeds` et `articles`

### Étape 2 : Démarrer l'application

```bash
./start.sh
```

Cela va démarrer automatiquement :
- Le backend sur **http://10.40.10.107:3002**
- Le frontend sur **http://localhost:3000**

---

## 🐳 Alternative : Docker (Recommandé)

Si vous préférez Docker (tout est automatique) :

```bash
docker-compose up -d
```

Accès :
- Frontend : **http://localhost:3000**
- Backend : **http://10.40.10.107:3002**

---

## 📝 Démarrage Manuel (Mode Développement)

### Terminal 1 - Backend
```bash
cd backend
node server.js
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start
```

---

## ✅ Vérifier que tout fonctionne

1. Backend : http://10.40.10.107:3002/api/health
2. Frontend : http://localhost:3000

---

## 🎯 Fonctionnalités

1. **Créer un flux** - Transformez n'importe quelle page web en flux RSS
2. **Bibliothèque** - Gérez tous vos flux sauvegardés
3. **Agrégateur** - Lisez tous vos articles style Inoreader
4. **Extraction CSS** - Extrayez le CSS complet d'une page
5. **Lecteur RSS** - Lisez des flux RSS existants

---

## 🛠️ Commandes Utiles

### Arrêter les services
```bash
# Trouver et tuer le process backend
lsof -ti:3002 | xargs kill

# Ou avec Docker
docker-compose down
```

### Voir les logs
```bash
tail -f logs/backend.log
```

### Réinitialiser la base de données
```bash
mysql -u css_user -pcss_pass123 css_extractor < backend/migrations/init.sql
```

---

Créé par Malek Kouidri 🚀
