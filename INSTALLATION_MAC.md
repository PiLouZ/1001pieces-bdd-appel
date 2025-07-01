# Installation de l'Application Gestionnaire d'Appareils Électroménagers sur macOS

Ce guide vous permet d'installer et d'utiliser l'application en local sur votre Mac, sans dépendances externes.

## Prérequis

1. **Node.js** (version 18 ou supérieure)
   - Téléchargez depuis [nodejs.org](https://nodejs.org/)
   - Ou installez via Homebrew : `brew install node`

2. **Git** (pour cloner le projet)
   - Préinstallé sur macOS ou installable via : `brew install git`

## Installation

### 1. Cloner le projet
```bash
git clone [URL_DU_PROJET]
cd gestionnaire-appareils
```

### 2. Installer les dépendances
```bash
npm install
# ou
yarn install
```

### 3. Démarrer l'application
```bash
npm run dev
# ou
yarn dev
```

L'application sera accessible à l'adresse : `http://localhost:8080`

## Utilisation

### Fonctionnalités principales

1. **Import d'appareils** (`/import`)
   - Import via copier-coller (2 ou 3 colonnes)
   - Support des formats : référence/marque ou référence/marque/type
   - Association automatique avec les pièces détachées
   - Gestion des sessions d'import

2. **Gestion des appareils** (`/appliances`)
   - Visualisation et recherche dans la base
   - Édition en mode Excel (double-clic sur les cellules)
   - Tri et filtrage avancés
   - Indicateurs de chargement

3. **Export de données** (`/export`)
   - Export CSV avec colonnes personnalisées
   - Export HTML avec zones de copie
   - Filtrage par références de pièces

4. **Aide** (`/help`)
   - Documentation complète de l'outil

### Stockage des données

- **Base de données locale** : SQLite (`appliance_database.db`)
- **Emplacement** : Racine du projet
- **Sauvegarde automatique** : Toutes les modifications sont sauvegardées instantanément

### Formats d'import supportés

**Format 2 colonnes :**
```
REF001    BOSCH
REF002    SIEMENS
```

**Format 3 colonnes :**
```
REF001    BOSCH    LAVE-LINGE
REF002    SIEMENS  LAVE-VAISSELLE
```

## Configuration pour la production

### 1. Build de l'application
```bash
npm run build
```

### 2. Servir les fichiers statiques
```bash
npm run preview
```

### 3. Application Electron (optionnel)

Pour créer une vraie application macOS :

1. Installer Electron :
```bash
npm install -g electron
npm install --save-dev electron-builder
```

2. Ajouter les scripts dans `package.json` :
```json
{
  "main": "public/electron.js",
  "homepage": "./",
  "scripts": {
    "electron": "electron .",
    "electron-dev": "ELECTRON_IS_DEV=true electron .",
    "dist": "electron-builder"
  }
}
```

3. Créer `public/electron.js` :
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const isDev = process.env.ELECTRON_IS_DEV === 'true';
  mainWindow.loadURL(isDev ? 'http://localhost:8080' : `file://${path.join(__dirname, '../dist/index.html')}`);
}

app.whenReady().then(createWindow);
```

## Dépannage

### Problèmes courants

1. **Port 8080 déjà utilisé**
   - Modifiez le port dans `vite.config.ts`
   - Ou tuez le processus : `lsof -ti:8080 | xargs kill`

2. **Erreurs de dépendances**
   - Supprimez `node_modules` et `package-lock.json`
   - Réinstallez : `npm install`

3. **Base de données corrompue**
   - Supprimez `appliance_database.db`
   - Redémarrez l'application

### Commandes utiles

```bash
# Vider le cache
npm run dev -- --force

# Réinitialiser complètement
rm -rf node_modules package-lock.json appliance_database.db
npm install

# Diagnostics
npm run build --verbose
```

## Support

- **Logs** : Ouvrez les outils de développement (F12) → onglet Console
- **Base de données** : Le fichier `appliance_database.db` peut être inspecté avec des outils SQLite
- **Performance** : SQLite offre de meilleures performances que la version précédente avec IndexedDB

## Évolutions futures

- [ ] Interface de sauvegarde/restauration
- [ ] Export vers différents formats
- [ ] Synchronisation entre machines
- [ ] API REST pour intégrations externes