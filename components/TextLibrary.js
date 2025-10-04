"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Grid, List, Eye, FileText } from "lucide-react";
import AppImage from "@/components/AppImage";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/firebaseConfig";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

export default function TextLibrary() {
  const router = useRouter();

  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("recent");
  const [textLibrary, setTextLibrary] = useState([]);

  // Charger les textes depuis Firestore
  useEffect(() => {
    const fetchTexts = async () => {
      try {
        let q;
        if (sortBy === "recent") {
          q = query(collection(db, "texts"), orderBy("createdAt", "desc"));
        } else if (sortBy === "views") {
          q = query(collection(db, "texts"), orderBy("views", "desc"));
        } else {
          q = query(collection(db, "texts"), orderBy("title", "asc"));
        }

        const querySnapshot = await getDocs(q);
        const texts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTextLibrary(texts);
      } catch (error) {
        console.error("Erreur lors du chargement des textes :", error);
      }
    };

    fetchTexts();
  }, [sortBy]);

  return (
    <div className="bg-card border rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">📚 Bibliothèque de textes</h2>

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
                  <FileText size={16} /> {text.status || "Brouillon"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}