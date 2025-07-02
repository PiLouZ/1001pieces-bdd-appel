
import React from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Upload, 
  Download, 
  Database, 
  Search, 
  Settings,
  Copy,
  Code
} from "lucide-react";

const Help: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Aide et documentation</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Présentation générale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Cet outil vous permet de gérer une base de données d'appareils électroménagers 
                et leurs compatibilités avec vos pièces de rechange. Il utilise une base de données 
                SQLite locale pour des performances optimales et un fonctionnement hors ligne.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Base SQLite locale</Badge>
                <Badge variant="outline">Fonctionnement hors ligne</Badge>
                <Badge variant="outline">Import/Export facile</Badge>
                <Badge variant="outline">Interface responsive</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Importer des données
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Copy className="mr-1 h-4 w-4" />
                  Depuis un tableau (copier/coller)
                </h3>
                <p className="mb-3">
                  Copiez un tableau depuis Excel, Google Sheets ou tout autre tableur et collez-le 
                  dans la zone d'importation. Plusieurs formats sont supportés :
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li><strong>2 colonnes :</strong> Référence technique + Référence commerciale</li>
                  <li><strong>3 colonnes :</strong> Référence technique + Marque + Type</li>
                  <li><strong>4 colonnes :</strong> Type + Marque + Référence technique + Référence commerciale</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <FileText className="mr-1 h-4 w-4" />
                  Depuis un fichier
                </h3>
                <p className="mb-2">
                  Importez directement des fichiers TXT ou CSV avec les mêmes formats que le copier-coller.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Association automatique avec les pièces</h3>
                <p>
                  Lors de l'import, vous pouvez spécifier une référence de pièce pour associer 
                  automatiquement tous les appareils importés à cette pièce. L'outil génère alors 
                  un fichier CSV de compatibilité prêt à utiliser.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Complétion automatique</h3>
                <p>
                  L'outil suggère automatiquement des marques et types en se basant sur les 
                  références similaires déjà connues dans votre base de données.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Gestion de la base de données
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Search className="mr-1 h-4 w-4" />
                  Recherche avancée
                </h3>
                <p className="mb-2">
                  La recherche fonctionne sur tous les champs des appareils ainsi que sur les 
                  références de pièces détachées. Tapez une référence de pièce pour voir tous 
                  les appareils compatibles.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Filtrage par sessions d'import</h3>
                <p className="mb-2">
                  Filtrez les appareils par date d'import pour retrouver facilement les derniers 
                  ajouts ou une session d'import spécifique.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Édition en direct</h3>
                <p>
                  Double-cliquez sur n'importe quelle cellule pour l'éditer directement dans le tableau. 
                  Les modifications sont sauvegardées automatiquement.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-2 h-5 w-5" />
                Exporter des données
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Export CSV personnalisé</h3>
                <p className="mb-3">
                  Exportez vos données avec des colonnes personnalisées et des en-têtes en français :
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li><strong>Type d'appareil</strong> - Catégorie de l'appareil</li>
                  <li><strong>Marque</strong> - Fabricant de l'appareil</li>
                  <li><strong>Référence technique</strong> - Référence interne</li>
                  <li><strong>Référence commerciale</strong> - Référence visible par le client</li>
                  <li><strong>Date d'ajout</strong> - Date d'import dans la base</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Code className="mr-1 h-4 w-4" />
                  Zones HTML prêtes à l'emploi
                </h3>
                <p className="mb-2">
                  Pour chaque référence de pièce, générez automatiquement du code HTML 
                  prêt à intégrer sur votre site web :
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Tableau HTML avec styles CSS inclus</li>
                  <li>Liste HTML pour une présentation simple</li>
                  <li>Boutons de copie pour une intégration rapide</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Filtrage par compatibilité</h3>
                <p>
                  Exportez uniquement les appareils compatibles avec une référence de pièce 
                  spécifique pour créer des listes de compatibilité ciblées.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Maintenance et optimisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Base de données SQLite</h3>
                <p className="mb-2">
                  L'application utilise SQLite pour des performances optimales. La base de données 
                  est stockée localement dans votre navigateur et peut être exportée/importée.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Nettoyage automatique</h3>
                <p className="mb-2">
                  L'outil détecte et propose de nettoyer automatiquement les doublons et les 
                  informations manquantes pour maintenir la qualité de votre base de données.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Sauvegarde automatique</h3>
                <p>
                  Toutes les modifications sont sauvegardées automatiquement et en temps réel. 
                  Aucune perte de données même en cas de fermeture inattendue du navigateur.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Installation locale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Pour installer l'application en local sur votre machine, consultez le fichier 
                <code className="bg-gray-100 px-2 py-1 rounded mx-1">INSTALLATION_MAC.md</code> 
                fourni avec le projet.
              </p>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Avantages de l'installation locale :</h4>
                <ul className="list-disc pl-6 space-y-1 text-blue-700 text-sm">
                  <li>Fonctionnement 100% hors ligne</li>
                  <li>Performances optimales</li>
                  <li>Contrôle total de vos données</li>
                  <li>Possibilité de personnalisation</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} - Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>
  );
};

export default Help;
