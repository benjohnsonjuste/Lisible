"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Grid, List, Eye, FileText } from "lucide-react";
import AppImage from "@/components/AppImage";
import { Button } from "@/components/ui/Button";

export default function TextLibrary() {
  const router = useRouter();
  const [texts, setTexts] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("recent");
  const [loading, setLoading] = useState(true);

  // 🧠 Charger les textes depuis Firestore
  useEffect(() => {
    const fetchTexts = async () => {
      try {
        const q = query(collection(db, "texts"), orderBy("publishedAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTexts(data);
      } catch (error) {
        console.error("Erreur lors du chargement des textes :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTexts();
  }, []);

  // 🔤 Tri (optionnel selon le choix)
  const sortedTexts = [...texts].sort((a, b) => {
    if (sortBy === "views") return (b.views || 0) - (a.views || 0);
    if (sortBy === "title") return a.title.localeCompare(b.title);
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });

  if (loading)
    return (
      <p className="text-center text-muted-foreground">Chargement des textes...</p>
    );

  if (texts.length === 0)
    return (
      <p className="text-center text-muted-foreground">
        Aucun texte n’a encore été publié.
      </p>
    );

  return (
    <div className="bg-card border rounded-lg shadow-sm p-6">
      {/* En-tête et filtres */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold">Tous les textes publiés</h2>

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
            <option value="views">Plus lus</option>
            <option value="title">Titre A-Z</option>
          </select>
        </div>
      </div>

      {/* Affichage des textes */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-4"
        }
      >
        {sortedTexts.map((text) => (
          <div
            key={text.id}
            className="border rounded-lg overflow-hidden shadow hover:shadow-md transition cursor-pointer"
            onClick={() => router.push(`/text/${text.id}`)}
          >
            <AppImage
              src={text.coverImage || "/default-cover.jpg"}
              alt={text.title}
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg">{text.title}</h3>
              <p className="text-xs text-muted-foreground mb-2">
                {text.type} •{" "}
                {new Date(text.publishedAt).toLocaleDateString("fr-FR")}
              </p>
              <p className="text-sm line-clamp-3">{text.excerpt}</p>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye size={16} /> {text.views || 0}
                </span>
                <span className="flex items-center gap-1">
                  <FileText size={16} /> {text.status || "Publié"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}