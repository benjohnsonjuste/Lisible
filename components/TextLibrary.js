"use client";
import React, { useState } from "react";
import { useRouter } from "next/router";
import { Grid, List, Eye, FileText } from "lucide-react";
import AppImage from "@/components/AppImage";
import { Bouton } from "@/components/ui/Bouton";

export default function TextLibrary() {
  const router = useRouter();

  // ⚡ Mode d’affichage : grille ou liste
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("recent");

  // 📚 Exemple de données de textes (⚡ plus tard à connecter avec Firestore)
  const [textLibrary] = useState([
    {
      id: 1,
      title: "Les Murmures de Montmartre",
      type: "Nouvelle",
      publishedAt: "2025-01-15",
      views: 2847,
      coverImage:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
      excerpt:
        "Une histoire pavée de Montmartre, où les secrets du passé rencontrent les rêves du présent.",
      status: "Publié",
    },
    {
      id: 2,
      title: "Réflexions sur l’Art Moderne",
      type: "Essai",
      publishedAt: "2025-02-01",
      views: 1923,
      coverImage:
        "https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
      excerpt:
        "Une analyse profonde des mouvements artistiques contemporains et leur impact sur notre perception de la beauté.",
      status: "Publié",
    },
    {
      id: 3,
      title: "Le Jardin Secret",
      type: "Roman",
      publishedAt: "2025-02-20",
      views: 857,
      coverImage:
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
      excerpt:
        "Un voyage poétique à travers les souvenirs d’enfance et la magie des jardins cachés.",
      status: "Publié",
    },
  ]);

  return (
    <div className="bg-card border rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">📚 Bibliothèque de textes</h2>

        {/* Contrôles */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
          >
            <Grid size={18} />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
          >
            <List size={18} />
          </Button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded p-1 ml-3"
          >
            <option value="recent">Plus récents</option>
            <option value="views">Plus vus</option>
            <option value="title">Titre A-Z</option>
          </select>
        </div>
      </div>

      {/* Liste des textes */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-4"
        }
      >
        {textLibrary.map((text) => (
          <div
            key={text.id}
            className="border rounded-lg overflow-hidden shadow hover:shadow-md transition cursor-pointer"
            onClick={() => router.push(`/text/${text.id}`)}
          >
            <AppImage
              src={text.coverImage}
              alt={text.title}
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg">{text.title}</h3>
              <p className="text-xs text-muted-foreground mb-2">
                {text.type} • {text.publishedAt}
              </p>
              <p className="text-sm line-clamp-3">{text.excerpt}</p>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye size={16} /> {text.views}
                </span>
                <span className="flex items-center gap-1">
                  <FileText size={16} /> {text.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}