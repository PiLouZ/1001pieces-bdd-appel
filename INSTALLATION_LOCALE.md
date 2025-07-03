# Guide d'installation locale - Gestionnaire d'Appareils Électroménagers

## Vue d'ensemble

Ce guide vous explique comment installer et utiliser l'application en local sur votre machine pour bénéficier de toutes les fonctionnalités et de performances optimales avec SQLite.

## Prérequis

### Système requis
- **Node.js 18+** (LTS recommandé) - [Télécharger](https://nodejs.org/)
- **NPM** (inclus avec Node.js) ou **Yarn**
- **2GB RAM minimum**
- **500MB d'espace disque**

### Vérifier votre installation
```bash
node --version    # Doit afficher v18.x.x ou supérieur
npm --version     # Doit afficher 9.x.x ou supérieur
```

## Installation

### 1. Obtenir le code source
```bash
# Cloner le repository (si disponible)
git clone [URL_DU_REPOSITORY]
cd gestionnaire-appareils

# OU extraire l'archive fournie
unzip gestionnaire-appareils.zip
cd gestionnaire-appareils
```

### 2. Installer les dépendances
```bash
npm install
# OU avec yarn
yarn install
```

### 3. Lancer l'application
```bash
npm run dev
# OU avec yarn
yarn dev
```

L'application sera accessible à l'adresse : **http://localhost:5173**

## Configuration SQLite (automatique)

L'application détecte automatiquement l'environnement et utilise :
- **SQLite natif** en local (performances optimales)
- **IndexedDB** en navigateur (fallback)

### Emplacement des données
- **macOS** : `~/Library/Application Support/appliance-manager/`
- **Windows** : `%APPDATA%/appliance-manager/`
- **Linux** : `~/.local/share/appliance-manager/`

## Utilisation

### Premier démarrage
1. Lancez l'application avec `npm run dev`
2. Ouvrez http://localhost:5173 dans votre navigateur
3. L'application se charge avec des données d'exemple
4. Commencez par importer vos propres données

### Fonctionnalités disponibles
- ✅ Import/Export illimité
- ✅ Performance maximale
- ✅ Fonctionnement hors ligne
- ✅ Sauvegarde automatique
- ✅ Base SQLite native

## Sauvegarde et maintenance

### Sauvegarde manuelle
```bash
# Copier le fichier de base de données
cp ~/.local/share/appliance-manager/database.sqlite ~/sauvegardes/
```

### Nettoyage périodique
- Utilisez la fonction "Nettoyer la base" dans l'interface
- Fréquence recommandée : 1x par mois

## Production (optionnel)

### Build pour production
```bash
npm run build
# Les fichiers sont générés dans le dossier 'dist/'
```

### Serveur local simple
```bash
npm run preview
# Accès sur http://localhost:4173
```

## Résolution de problèmes

### Erreur "Cannot find module 'better-sqlite3'"
```bash
npm install better-sqlite3 --save
# OU
npm rebuild better-sqlite3
```

### Performance lente
- Vérifiez l'espace disque disponible
- Nettoyez la base de données via l'interface
- Redémarrez l'application

### Erreur de port 5173 occupé
```bash
npm run dev -- --port 3000
# Utilise le port 3000 à la place
```

## Support

Pour toute question :
1. Consultez la documentation dans l'application (/help)
2. Vérifiez les logs dans la console du navigateur
3. Redémarrez l'application si nécessaire

---

**Installation réussie !** Vous pouvez maintenant profiter de toutes les fonctionnalités de l'application avec des performances optimales.