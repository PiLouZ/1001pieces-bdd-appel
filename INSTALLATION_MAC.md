
# Installation et utilisation sur Mac comme application locale

## Prérequis

1. **Node.js** (version 18 ou supérieure)
   ```bash
   # Installer Node.js avec Homebrew
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   brew install node
   ```

2. **Git** (si pas déjà installé)
   ```bash
   brew install git
   ```

## Installation

1. **Cloner ou télécharger le projet**
   ```bash
   # Si vous avez un repository Git
   git clone [URL_DU_REPOSITORY]
   cd [NOM_DU_DOSSIER]
   
   # Ou extraire le fichier ZIP téléchargé
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Lancer l'application en mode développement**
   ```bash
   npm run dev
   ```
   L'application sera accessible à l'adresse : http://localhost:5173

## Créer une application autonome (App Mac)

### Option 1: Avec Electron (Recommandé)

1. **Installer Electron**
   ```bash
   npm install --save-dev electron electron-builder
   ```

2. **Créer le fichier principal Electron**
   Créer un fichier `electron.js` à la racine :
   ```javascript
   const { app, BrowserWindow } = require('electron');
   const path = require('path');
   const isDev = require('electron-is-dev');

   function createWindow() {
     const mainWindow = new BrowserWindow({
       width: 1200,
       height: 800,
       webPreferences: {
         nodeIntegration: false,
         contextIsolation: true
       }
     });

     mainWindow.loadURL(
       isDev
         ? 'http://localhost:5173'
         : `file://${path.join(__dirname, '../dist/index.html')}`
     );
   }

   app.whenReady().then(createWindow);

   app.on('window-all-closed', () => {
     if (process.platform !== 'darwin') {
       app.quit();
     }
   });

   app.on('activate', () => {
     if (BrowserWindow.getAllWindows().length === 0) {
       createWindow();
     }
   });
   ```

3. **Modifier package.json**
   Ajouter dans package.json :
   ```json
   {
     "main": "public/electron.js",
     "homepage": "./",
     "scripts": {
       "electron": "electron .",
       "electron-dev": "ELECTRON_IS_DEV=true electron .",
       "build-electron": "npm run build && electron-builder"
     },
     "build": {
       "appId": "com.votreentreprise.gestionnaire-appareils",
       "productName": "Gestionnaire d'Appareils",
       "directories": {
         "output": "dist-electron"
       },
       "files": [
         "dist/**/*",
         "public/electron.js"
       ],
       "mac": {
         "category": "public.app-category.productivity"
       }
     }
   }
   ```

4. **Construire l'application**
   ```bash
   npm run build
   npm run build-electron
   ```

### Option 2: Avec Tauri (Plus léger)

1. **Installer Rust** (prérequis pour Tauri)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

2. **Installer Tauri CLI**
   ```bash
   npm install --save-dev @tauri-apps/cli
   ```

3. **Initialiser Tauri**
   ```bash
   npx tauri init
   ```

4. **Construire l'application**
   ```bash
   npx tauri build
   ```

## Utilisation en production locale

### Mode serveur local permanent

1. **Créer un script de lancement**
   Créer un fichier `start-local.sh` :
   ```bash
   #!/bin/bash
   cd "$(dirname "$0")"
   npm run build
   npx serve -s dist -p 3000
   echo "Application accessible sur http://localhost:3000"
   ```

2. **Rendre le script exécutable**
   ```bash
   chmod +x start-local.sh
   ```

3. **Lancer l'application**
   ```bash
   ./start-local.sh
   ```

### Création d'un alias pour accès rapide

Ajouter dans votre `~/.zshrc` ou `~/.bash_profile` :
```bash
alias gestionnaire-appareils="cd /chemin/vers/votre/projet && npm run dev"
```

## Avantages de l'application locale

- ✅ **Confidentialité totale** : Toutes les données restent sur votre Mac
- ✅ **Performance optimale** : Pas de latence réseau
- ✅ **Disponibilité hors ligne** : Fonctionne sans internet
- ✅ **Contrôle complet** : Vos données, vos règles
- ✅ **Sauvegardes locales** : Données stockées dans IndexedDB

## Sauvegarde des données

Les données sont automatiquement sauvegardées dans IndexedDB. Pour une sauvegarde manuelle :

1. Utiliser les fonctions d'export intégrées dans l'application
2. Sauvegarder le dossier du navigateur (optionnel)
3. Créer des exports CSV réguliers via l'interface

## Mise à jour de l'application

1. Télécharger la nouvelle version
2. Remplacer les fichiers (conserver le dossier de données si demandé)
3. Relancer `npm install` si nécessaire
4. Les données IndexedDB sont conservées automatiquement
