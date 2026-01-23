"use client";
import React from "react";

// Exemple de ce à quoi devrait ressembler votre composant de liste
export default function Bibliotheque({ texts = [] }) {
  // Le "Optional Chaining" (?.) est crucial ici pour éviter les erreurs si un champ manque
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Bibliothèque</h1>
      <div className="grid gap-6">
        {texts.length === 0 ? (
          <p>Aucun texte disponible pour le moment.</p>
        ) : (
          texts.map((item, index) => (
            <div key={index} className="border p-4 rounded-lg shadow">
              {/* VÉRIFICATION DE L'IMAGE : C'est souvent ici que ça plante */}
              {item.imageBase64 && (
                <img 
                  src={item.imageBase64} 
                  alt={item.title} 
                  className="w-full h-48 object-cover rounded mb-4" 
                />
              )}
              <h2 className="text-xl font-bold">{item.title || "Titre inconnu"}</h2>
              <p className="text-sm text-gray-500">Par {item.authorName || "Auteur anonyme"}</p>
              <p className="mt-2 whitespace-pre-wrap">{item.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
