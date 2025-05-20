
import React from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Help: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Aide et documentation</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Présentation générale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Cet outil vous permet de gérer une base de données d'appareils électroménagers 
                compatible avec vos pièces de rechange. Il facilite l'importation de données depuis 
                diverses sources et génère des fichiers formatés pour votre site de vente.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Importer des données</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold mb-2">Depuis un tableau (copier/coller)</h3>
              <p className="mb-4">
                Copiez un tableau contenant des appareils (références techniques, commerciales, 
                marques et types) et collez-le dans la zone d'importation. Spécifiez la référence 
                de la pièce de rechange concernée.
              </p>
              
              <h3 className="font-semibold mb-2">Depuis un fichier PDF</h3>
              <p className="mb-4">
                Téléchargez un fichier PDF contenant les informations des appareils. L'outil 
                analysera le contenu et extraira les informations pertinentes.
              </p>
              
              <h3 className="font-semibold mb-2">Complétion automatique</h3>
              <p>
                L'outil suggère automatiquement des marques et types en se basant sur les 
                références similaires déjà connues.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Exporter des données</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Vous pouvez exporter les données formatées pour votre site web :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Format CSV pour l'import en masse</li>
                <li>Code HTML prêt à être intégré à votre site</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Maintenance de la base de données</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Pour optimiser les performances de l'application :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Utilisez l'option "Nettoyer la base de données" pour supprimer les doublons</li>
                <li>Complétez manuellement les informations manquantes pour améliorer les suggestions automatiques</li>
              </ul>
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
