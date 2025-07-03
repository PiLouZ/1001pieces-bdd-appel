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
  Code,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Users,
  Globe,
  Smartphone,
  Monitor,
  HardDrive,
  Cloud,
  Shield,
  Cpu,
  BarChart
} from "lucide-react";

const Help: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold mb-8 text-center">Documentation technique complète</h1>
        
        <div className="grid gap-8">
          {/* Présentation générale */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <FileText className="mr-3 h-6 w-6 text-blue-500" />
                Gestionnaire d'Appareils Électroménagers - Cahier des charges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-blue-800 mb-3 text-lg">Vue d'ensemble du projet</h3>
                <p className="text-blue-700 mb-4">
                  Application web moderne de gestion d'inventaire d'appareils électroménagers avec système 
                  de compatibilité de pièces détachées. Solution complète pour les revendeurs, techniciens 
                  SAV et gestionnaires d'inventaire.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Base SQLite locale</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Application web</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Données sécurisées</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Performances optimales</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3 text-lg">Technologies utilisées</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Badge variant="outline" className="flex items-center justify-center p-2">
                    <Monitor className="mr-2 h-4 w-4" />
                    React 18 + TypeScript
                  </Badge>
                  <Badge variant="outline" className="flex items-center justify-center p-2">
                    <Cpu className="mr-2 h-4 w-4" />
                    Vite (Build tool)
                  </Badge>
                  <Badge variant="outline" className="flex items-center justify-center p-2">
                    <HardDrive className="mr-2 h-4 w-4" />
                    SQLite local
                  </Badge>
                  <Badge variant="outline" className="flex items-center justify-center p-2">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Tailwind CSS
                  </Badge>
                  <Badge variant="outline" className="flex items-center justify-center p-2">
                    <Settings className="mr-2 h-4 w-4" />
                    Shadcn/ui
                  </Badge>
                  <Badge variant="outline" className="flex items-center justify-center p-2">
                    <Cloud className="mr-2 h-4 w-4" />
                    IndexedDB
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3 text-lg">Objectifs métier</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-600 mt-0.5" />
                    <span>Centraliser la gestion des références d'appareils électroménagers</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-600 mt-0.5" />
                    <span>Gérer les compatibilités entre pièces détachées et appareils</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-600 mt-0.5" />
                    <span>Automatiser l'import et l'export de données depuis/vers Excel/CSV</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-600 mt-0.5" />
                    <span>Générer du contenu HTML prêt pour intégration web</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-600 mt-0.5" />
                    <span>Fonctionner 100% hors ligne avec performances optimales</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Architecture technique */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Cpu className="mr-3 h-6 w-6 text-purple-500" />
                Architecture technique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-bold mb-3 text-lg">Structure de données</h3>
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Modèle Appliance (Appareil)</h4>
                  <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`interface Appliance {
  id: string;                    // Identifiant unique
  reference: string;             // Référence technique fabricant
  commercialRef?: string;        // Référence commerciale visible client
  brand: string;                 // Marque (Bosch, Whirlpool, etc.)
  type: string;                  // Type (Lave-linge, Réfrigérateur, etc.)
  dateAdded: string;             // Date d'ajout ISO
  lastUpdated?: string;          // Dernière modification
}`}
                  </pre>
                </div>

                <div className="bg-gray-50 border rounded-lg p-4 mt-4">
                  <h4 className="font-semibold mb-2">Modèle Association (Compatibilité)</h4>
                  <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`interface AppliancePartAssociation {
  id: string;                    // Identifiant unique
  applianceId: string;           // Référence vers l'appareil
  partReference: string;         // Référence de la pièce détachée
  dateAssociated: string;        // Date de création de l'association
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3 text-lg">Couches applicatives</h3>
                <div className="grid gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold flex items-center mb-2">
                      <Monitor className="mr-2 h-4 w-4" />
                      Couche Présentation (React UI)
                    </h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Composants React avec TypeScript</li>
                      <li>• Interface responsive (Tailwind CSS)</li>
                      <li>• Composants UI réutilisables (Shadcn/ui)</li>
                      <li>• Gestion d'état avec hooks React</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold flex items-center mb-2">
                      <Settings className="mr-2 h-4 w-4" />
                      Couche Logique Métier
                    </h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Hooks personnalisés (useAppliances, useImportLogic)</li>
                      <li>• Validation et transformation des données</li>
                      <li>• Suggestions automatiques (marques, types)</li>
                      <li>• Gestion des associations pièces/appareils</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold flex items-center mb-2">
                      <HardDrive className="mr-2 h-4 w-4" />
                      Couche Persistance
                    </h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• SQLite en local (environnement desktop)</li>
                      <li>• IndexedDB navigateur (fallback web)</li>
                      <li>• Services d'import/export (CSV, JSON, HTML)</li>
                      <li>• Migration automatique des données</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fonctionnalités détaillées */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <BarChart className="mr-3 h-6 w-6 text-green-500" />
                Spécifications fonctionnelles détaillées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-bold mb-3 text-lg flex items-center">
                  <Upload className="mr-2 h-5 w-5 text-green-600" />
                  Module d'importation de données
                </h3>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Formats d'entrée supportés</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="font-medium text-sm">Format 2 colonnes</p>
                        <p className="text-xs text-gray-600">Référence technique + Référence commerciale</p>
                        <code className="text-xs bg-white p-1 rounded mt-1 block">REF123⇥COMM456</code>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Format 3 colonnes</p>
                        <p className="text-xs text-gray-600">Référence + Marque + Type</p>
                        <code className="text-xs bg-white p-1 rounded mt-1 block">REF123⇥Bosch⇥Lave-linge</code>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Format 4 colonnes</p>
                        <p className="text-xs text-gray-600">Type + Marque + Ref.tech + Ref.comm</p>
                        <code className="text-xs bg-white p-1 rounded mt-1 block">Lave-linge⇥Bosch⇥REF123⇥COMM456</code>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Méthodes d'import</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Copy className="mr-2 h-4 w-4 text-blue-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Copier-coller depuis tableur</span>
                          <p className="text-sm text-gray-600">Import direct depuis Excel, Google Sheets, LibreOffice</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <FileText className="mr-2 h-4 w-4 text-blue-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Upload de fichiers</span>
                          <p className="text-sm text-gray-600">Support CSV, TXT, TSV avec détection automatique du délimiteur</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Traitements automatiques</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Zap className="mr-2 h-4 w-4 text-yellow-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Détection de doublons</span>
                          <p className="text-sm text-gray-600">Évite l'import de références déjà existantes</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <Zap className="mr-2 h-4 w-4 text-yellow-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Suggestions intelligentes</span>
                          <p className="text-sm text-gray-600">Auto-complétion marque et type basée sur l'historique</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <Zap className="mr-2 h-4 w-4 text-yellow-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Validation des données</span>
                          <p className="text-sm text-gray-600">Contrôle de cohérence et formatage automatique</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <Zap className="mr-2 h-4 w-4 text-yellow-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Association automatique</span>
                          <p className="text-sm text-gray-600">Lien direct avec référence de pièce détachée lors de l'import</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3 text-lg flex items-center">
                  <Database className="mr-2 h-5 w-5 text-blue-600" />
                  Module de gestion de la base de données
                </h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Fonctionnalités de recherche</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Search className="mr-2 h-4 w-4 text-blue-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Recherche multicritères</span>
                          <p className="text-sm text-gray-600">Par référence technique, commerciale, marque, type</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <Search className="mr-2 h-4 w-4 text-blue-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Recherche par compatibilité</span>
                          <p className="text-sm text-gray-600">Saisie d'une référence de pièce pour voir tous les appareils compatibles</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <Search className="mr-2 h-4 w-4 text-blue-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Filtrage par session d'import</span>
                          <p className="text-sm text-gray-600">Visualisation des derniers ajouts par date</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Édition en temps réel</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Settings className="mr-2 h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Édition inline</span>
                          <p className="text-sm text-gray-600">Double-clic pour modifier directement dans le tableau</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <Settings className="mr-2 h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Sauvegarde automatique</span>
                          <p className="text-sm text-gray-600">Persistance immédiate des modifications</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <Settings className="mr-2 h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Édition par lot</span>
                          <p className="text-sm text-gray-600">Modification simultanée de plusieurs appareils</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Gestion des associations</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Associations multiples</span>
                          <p className="text-sm text-gray-600">Un appareil peut être compatible avec plusieurs pièces</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Gestion bidirectionnelle</span>
                          <p className="text-sm text-gray-600">Vue appareil→pièces et pièce→appareils</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Traçabilité complète</span>
                          <p className="text-sm text-gray-600">Historique des associations avec dates</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3 text-lg flex items-center">
                  <Download className="mr-2 h-5 w-5 text-purple-600" />
                  Module d'exportation avancée
                </h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Formats de sortie</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-purple-50 border border-purple-200 rounded p-3">
                        <h5 className="font-medium text-purple-800">Export CSV personnalisé</h5>
                        <ul className="text-xs text-purple-700 mt-1 space-y-1">
                          <li>• Sélection des colonnes</li>
                          <li>• En-têtes en français</li>
                          <li>• Séparateur configurable</li>
                          <li>• Encodage UTF-8</li>
                        </ul>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded p-3">
                        <h5 className="font-medium text-purple-800">Export HTML stylisé</h5>
                        <ul className="text-xs text-purple-700 mt-1 space-y-1">
                          <li>• Tableau avec CSS intégré</li>
                          <li>• Responsive design</li>
                          <li>• Groupement par marque</li>
                          <li>• Ancres de navigation</li>
                        </ul>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded p-3">
                        <h5 className="font-medium text-purple-800">Export JSON structuré</h5>
                        <ul className="text-xs text-purple-700 mt-1 space-y-1">
                          <li>• Format API-ready</li>
                          <li>• Métadonnées incluses</li>
                          <li>• Structure normalisée</li>
                          <li>• Facilité d'intégration</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-800 mb-2 flex items-center">
                      <Code className="mr-2 h-4 w-4" />
                      Zones HTML prêtes pour le web
                    </h4>
                    <p className="text-orange-700 mb-3">Fonctionnalité unique pour l'intégration e-commerce</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium">Tableau de compatibilité</h5>
                        <ul className="text-sm space-y-1">
                          <li>• HTML + CSS embarqué</li>
                          <li>• Design responsive</li>
                          <li>• Compatible tous navigateurs</li>
                          <li>• Bouton copie intégré</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium">Liste simple</h5>
                        <ul className="text-sm space-y-1">
                          <li>• Format léger</li>
                          <li>• Facile à personnaliser</li>
                          <li>• Groupement par marque</li>
                          <li>• SEO-friendly</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Options d'export avancées</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Settings className="mr-2 h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Filtrage par référence de pièce</span>
                          <p className="text-sm text-gray-600">Export ciblé d'une compatibilité spécifique</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <Settings className="mr-2 h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Aperçu en temps réel</span>
                          <p className="text-sm text-gray-600">Prévisualisation avant téléchargement</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <Settings className="mr-2 h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Noms de fichiers intelligents</span>
                          <p className="text-sm text-gray-600">Nomenclature automatique avec date et contexte</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Spécifications techniques */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Cpu className="mr-3 h-6 w-6 text-orange-500" />
                Spécifications techniques et performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-3 text-lg">Environnement de développement</h3>
                  <div className="space-y-3">
                    <div className="border rounded p-3">
                      <h4 className="font-semibold text-sm">Frontend</h4>
                      <ul className="text-xs text-gray-600 mt-1 space-y-1">
                        <li>• React 18 avec TypeScript strict</li>
                        <li>• Vite comme bundler (ESM, HMR)</li>
                        <li>• Tailwind CSS v3 + design system</li>
                        <li>• Shadcn/ui pour les composants</li>
                      </ul>
                    </div>
                    <div className="border rounded p-3">
                      <h4 className="font-semibold text-sm">Persistance</h4>
                      <ul className="text-xs text-gray-600 mt-1 space-y-1">
                        <li>• SQLite (Better-sqlite3 en local)</li>
                        <li>• IndexedDB (fallback navigateur)</li>
                        <li>• Migration automatique des schémas</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-3 text-lg">Performance et optimisation</h3>
                  <div className="space-y-3">
                    <div className="border rounded p-3">
                      <h4 className="font-semibold text-sm">Temps de réponse cibles</h4>
                      <ul className="text-xs text-gray-600 mt-1 space-y-1">
                        <li>• Recherche: &lt; 100ms pour 10k enregistrements</li>
                        <li>• Import: &lt; 500ms pour 1000 appareils</li>
                        <li>• Export CSV: &lt; 200ms pour dataset complet</li>
                        <li>• Démarrage app: &lt; 2s (cache navigateur)</li>
                      </ul>
                    </div>
                    <div className="border rounded p-3">
                      <h4 className="font-semibold text-sm">Capacités recommandées</h4>
                      <ul className="text-xs text-gray-600 mt-1 space-y-1">
                        <li>• Jusqu'à 50,000 appareils en base</li>
                        <li>• Jusqu'à 500,000 associations pièces</li>
                        <li>• Usage concurrent: 1-5 utilisateurs</li>
                        <li>• Stockage: 100-500MB selon usage</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3 text-lg">Compatibilité et déploiement</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border rounded p-4">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Globe className="mr-2 h-4 w-4 text-blue-500" />
                      Navigateurs supportés
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>✅ Chrome 88+ (recommandé)</li>
                      <li>✅ Firefox 85+</li>
                      <li>✅ Safari 14+</li>
                      <li>✅ Edge 88+</li>
                      <li>⚠️ IE: Non supporté</li>
                    </ul>
                  </div>

                  <div className="border rounded p-4">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Monitor className="mr-2 h-4 w-4 text-green-500" />
                      Environnements cibles
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>🏠 <strong>Local</strong>: Node.js + SQLite</li>
                      <li>🌐 <strong>Web</strong>: Serveur statique</li>
                      <li>☁️ <strong>Cloud</strong>: Vercel, Netlify</li>
                      <li>🖥️ <strong>Desktop</strong>: Electron (optionnel)</li>
                    </ul>
                  </div>

                  <div className="border rounded p-4">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Smartphone className="mr-2 h-4 w-4 text-purple-500" />
                      Responsive design
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>📱 Mobile: 320px+</li>
                      <li>📱 Tablet: 768px+</li>
                      <li>🖥️ Desktop: 1024px+</li>
                      <li>🖥️ Large: 1440px+</li>
                      <li>🎯 Touch-friendly</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guide utilisateur */}
          <Card className="border-l-4 border-l-cyan-500">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Users className="mr-3 h-6 w-6 text-cyan-500" />
                Guide utilisateur complet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <h3 className="font-bold text-cyan-800 mb-2">Workflow type d'utilisation</h3>
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="bg-cyan-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                      <span className="font-bold text-cyan-700">1</span>
                    </div>
                    <p className="font-medium">Import initial</p>
                    <p className="text-xs text-cyan-700">Données existantes</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-cyan-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                      <span className="font-bold text-cyan-700">2</span>
                    </div>
                    <p className="font-medium">Nettoyage</p>
                    <p className="text-xs text-cyan-700">Validation, doublons</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-cyan-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                      <span className="font-bold text-cyan-700">3</span>
                    </div>
                    <p className="font-medium">Associations</p>
                    <p className="text-xs text-cyan-700">Pièces ↔ Appareils</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-cyan-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                      <span className="font-bold text-cyan-700">4</span>
                    </div>
                    <p className="font-medium">Export</p>
                    <p className="text-xs text-cyan-700">Site web, catalogues</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3 text-lg">Cas d'usage métier détaillés</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-green-700">👥 Gestionnaire SAV / Service technique</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Import des nouveaux modèles d'appareils depuis fichiers fournisseurs</li>
                      <li>• Recherche rapide de compatibilité pièce/appareil pour devis client</li>
                      <li>• Mise à jour en temps réel des associations suite retours terrain</li>
                      <li>• Export de listes de compatibilité pour équipes de réparation</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-blue-700">🛒 Responsable e-commerce</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Génération automatique de zones HTML de compatibilité pour fiches produits</li>
                      <li>• Export CSV pour mise à jour catalogue en ligne</li>
                      <li>• Validation des associations avant publication</li>
                      <li>• Suivi des nouvelles compatibilités pour actualiser le site</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-purple-700">📊 Gestionnaire de données / Acheteur</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Centralisation et nettoyage des données multi-sources</li>
                      <li>• Analyse de couverture : quels appareils sans pièces compatibles</li>
                      <li>• Détection des doublons et inconsistances</li>
                      <li>• Préparation de fichiers pour intégration ERP</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3 text-lg">Procédures d'exploitation</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">🔄 Maintenance régulière</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Nettoyage base de données : 1x/mois</li>
                      <li>• Backup des données : automatique</li>
                      <li>• Contrôle des associations : avant export</li>
                      <li>• Mise à jour références : selon arrivages</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">⚠️ Résolution de problèmes</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Problème import → Vérifier format colonnes</li>
                      <li>• Performance dégradée → Nettoyer doublons</li>
                      <li>• Associations manquantes → Re-import avec pièce</li>
                      <li>• Export incorrect → Contrôler filtres sélectionnés</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installation et déploiement */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <HardDrive className="mr-3 h-6 w-6 text-red-500" />
                Installation et déploiement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-bold text-red-800 mb-2">⚡ Installation locale recommandée (SQLite)</h3>
                <p className="text-red-700 mb-4">
                  Pour bénéficier de toutes les fonctionnalités et de performances optimales, 
                  l'installation locale avec SQLite est fortement recommandée.
                </p>
                <div className="bg-white rounded p-3">
                  <p className="text-sm">
                    📋 <strong>Voir le fichier INSTALLATION_MAC.md</strong> fourni avec le projet pour 
                    les instructions détaillées d'installation locale.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-3 text-lg">🏠 Avantages installation locale</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">Performance maximale (SQLite natif)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">Fonctionnement 100% hors ligne</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">Bases de données illimitées</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">Sauvegardes fichiers standard</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">Contrôle total des données</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold mb-3 text-lg">🌐 Alternative hébergement web</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Info className="mr-2 h-4 w-4 text-blue-500 mt-0.5" />
                      <span className="text-sm">Déploiement sur Vercel/Netlify</span>
                    </li>
                    <li className="flex items-start">
                      <Info className="mr-2 h-4 w-4 text-blue-500 mt-0.5" />
                      <span className="text-sm">Stockage IndexedDB (limité navigateur)</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="mr-2 h-4 w-4 text-yellow-500 mt-0.5" />
                      <span className="text-sm">Performance réduite sur gros volumes</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="mr-2 h-4 w-4 text-yellow-500 mt-0.5" />
                      <span className="text-sm">Dépendance connexion internet</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3 text-lg">🔧 Prérequis techniques</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border rounded p-4">
                    <h4 className="font-semibold mb-2">Installation locale</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Node.js 18+ (LTS recommandé)</li>
                      <li>• NPM ou Yarn</li>
                      <li>• 2GB RAM minimum</li>
                      <li>• 500MB espace disque</li>
                    </ul>
                  </div>
                  <div className="border rounded p-4">
                    <h4 className="font-semibold mb-2">Déploiement web</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Serveur web (Apache/Nginx)</li>
                      <li>• HTTPS recommandé</li>
                      <li>• Nom de domaine</li>
                      <li>• CDN optionnel</li>
                    </ul>
                  </div>
                  <div className="border rounded p-4">
                    <h4 className="font-semibold mb-2">Côté utilisateur</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Navigateur moderne</li>
                      <li>• JavaScript activé</li>
                      <li>• Résolution 1024px+ (recommandé)</li>
                      <li>• 100MB espace navigateur</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Annexes */}
          <Card className="border-l-4 border-l-gray-500">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <FileText className="mr-3 h-6 w-6 text-gray-500" />
                Informations complémentaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-bold mb-3 text-lg">📋 Roadmap d'évolutions possibles</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded p-4">
                    <h4 className="font-semibold mb-2 text-green-700">✅ Court terme (1-3 mois)</h4>
                    <ul className="text-sm space-y-1">
                      <li>• API REST pour intégrations externes</li>
                      <li>• Import depuis URLs (feeds XML/JSON)</li>
                      <li>• Système de tags personnalisés</li>
                      <li>• Historique détaillé des modifications</li>
                    </ul>
                  </div>
                  <div className="border rounded p-4">
                    <h4 className="font-semibold mb-2 text-blue-700">🎯 Moyen terme (3-6 mois)</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Mode multi-utilisateurs avec permissions</li>
                      <li>• Synchronisation cloud automatique</li>
                      <li>• Templates d'export personnalisables</li>
                      <li>• Module de statistiques avancées</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3 text-lg">🔒 Sécurité et confidentialité</h3>
                <div className="bg-gray-50 border rounded-lg p-4">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Shield className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">Aucune donnée transmise vers des serveurs tiers</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">Stockage local uniquement (SQLite/IndexedDB)</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">Code source transparent et auditabele</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">Conformité RGPD par design (pas de collecte)</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3 text-lg">📞 Support et maintenance</h3>
                <div className="border rounded-lg p-4">
                  <p className="text-sm mb-3">
                    Cette application est conçue pour être autonome et ne nécessite pas de maintenance 
                    externe. Les données restent sous votre contrôle total.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">📖 Documentation disponible</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Guide d'installation (INSTALLATION_MAC.md)</li>
                        <li>• Code source commenté</li>
                        <li>• Cette documentation utilisateur</li>
                        <li>• Exemples de fichiers d'import</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">🛠️ Maintenance recommandée</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Sauvegarde régulière du fichier SQLite</li>
                        <li>• Nettoyage périodique des doublons</li>
                        <li>• Test des exports avant utilisation</li>
                        <li>• Mise à jour Node.js si nécessaire</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} - Gestionnaire d'Appareils Électroménagers - Documentation technique v1.0</p>
      </footer>
    </div>
  );
};

export default Help;