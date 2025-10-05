"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { getAuth } from "firebase/auth";
import {
  BookOpen,
  FileText,
  Book,
  Feather,
  Newspaper,
  Grid3X3,
  List,
  Plus,
} from "lucide-react";

export default function ContentLibrary({ className = "" }) {
  const router = useRouter();
  const [contentItems, setContentItems] = useState([]);
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);

  const typeIcons = { Nouvelle: BookOpen, Essai: FileText, Roman: Book, Poésie: Feather, Article: Newspaper };

  const formatDate = (d) =>
    new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d));
  const formatCurrency = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
  const formatNumber = (n) => new Intl.NumberFormat("fr-FR").format(n);

  // 🔥 Récupération des textes de Firestore
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, "texts"),
          where("authorId", "==", user.uid),
          orderBy("publishedAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setContentItems(data);
      } catch (error) {
        console.error("Erreur lors du chargement des textes :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  // 🔁 Tri personnalisé
  const sortedItems = [...contentItems].sort((a, b) => {
    switch (sortBy) {
      case "views":
        return b.views - a.views;
      case "earnings":
        return b.earnings - a.earnings;
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return new Date(b.publishedAt) - new Date(a.publishedAt);
    }
  });

  const handleItemClick = (item) => {
    router.push(`/text-publishing?id=${item.id}`);
  };

  // ☁️ Exemple de lien Google Drive (contenu du texte)
  const openDriveFile = (driveFileId) => {
    if (driveFileId) window.open(`https://drive.google.com/file/d/${driveFileId}/view`, "_blank");
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <p>Chargement de vos textes...</p>
      </div>
    );
  }

  return (
    <div className={`bg-card border border-border rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">📚 Ma Bibliothèque</h2>
          <p className="text-sm text-muted-foreground">
            Gérez vos textes publiés et suivez leurs performances.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Tri */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-background text-sm"
          >
            <option value="recent">Plus récents</option>
            <option value="views">Plus vus</option>
            <option value="earnings">Plus rentables</option>
            <option value="title">Titre A–Z</option>
          </select>

          {/* Vue */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-primary text-white" : "hover:bg-muted"}`}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-primary text-white" : "hover:bg-muted"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">
        {sortedItems.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Aucun texte publié</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Commencez à écrire et partagez vos créations avec vos lecteurs.
            </p>
            <button
              onClick={() => router.push("/text-publishing")}
              className="px-4 py-2 bg-primary text-white rounded-lg flex items-center justify-center gap-2 mx-auto"
            >
              <Plus size={16} /> Nouveau texte
            </button>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"
            }
          >
            {sortedItems.map((item) => {
              const Icon = typeIcons[item.type] || FileText;
              return (
                <div
                  key={item.id}
                  onClick={() => openDriveFile(item.driveFileId)}
                  className="border border-border rounded-lg p-4 hover:bg-muted cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-muted rounded-lg p-2">
                      <Icon size={20} className="text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">{item.type}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {item.excerpt || "Aperçu non disponible..."}
                  </p>
                  <div className="text-xs text-muted-foreground space-x-3">
                    <span>{formatDate(item.publishedAt)}</span>
                    <span>{formatNumber(item.views || 0)} vues</span>
                    <span>{formatNumber(item.subscribers || 0)} abonnés</span>
                    <span>{formatCurrency(item.earnings || 0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}