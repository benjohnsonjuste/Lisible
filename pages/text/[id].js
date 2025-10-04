"use client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Eye, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import AppImage from "@/components/AppImage";

// ⚡ Pour l’instant on simule les données
// Plus tard, tu pourras connecter Firestore ici
const mockTexts = [
  {
    id: 1,
    title: "Les Murmures de Montmartre",
    type: "Nouvelle",
    publishedAt: "2025-01-15",
    views: 2847,
    coverImage:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80",
    content: `
      Au cœur de Montmartre, les pavés résonnaient des histoires oubliées...
      Chaque ruelle semblait murmurer un secret, chaque ombre cachait un rêve.
    `,
    status: "Publié",
  },
  {
    id: 2,
    title: "Réflexions sur l’Art Moderne",
    type: "Essai",
    publishedAt: "2025-02-01",
    views: 1923,
    coverImage:
      "https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop",
    content: `
      L’art moderne est une rupture, une quête de liberté...
      Mais il est aussi une invitation à questionner notre rapport à la beauté.
    `,
    status: "Publié",
  },
  {
    id: 3,
    title: "Le Jardin Secret",
    type: "Roman",
    publishedAt: "2025-02-20",
    views: 857,
    coverImage:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80",
    content: `
      Derrière le vieux portail de fer, un monde de fleurs sauvages et de souvenirs d’enfance...
      Un lieu où le temps semblait suspendu.
    `,
    status: "Publié",
  },
];

export default function TextDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [text, setText] = useState(null);

  useEffect(() => {
    if (id) {
      const found = mockTexts.find((t) => t.id === Number(id));
      setText(found || null);
    }
  }, [id]);

  if (!text) {
    return (
      <div className="p-6">
        <p className="text-center text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Retour */}
      <Link href="/dashboard" className="flex items-center text-sm text-primary hover:underline mb-4">
        <ArrowLeft size={16} className="mr-1" /> Retour au tableau de bord
      </Link>

      {/* Image de couverture */}
      <AppImage
        src={text.coverImage}
        alt={text.title}
        className="w-full h-60 object-cover rounded-lg shadow mb-6"
      />

      {/* Titre & Infos */}
      <h1 className="text-3xl font-bold mb-2">{text.title}</h1>
      <p className="text-muted-foreground text-sm mb-4">
        {text.type} • {text.publishedAt}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-6 text-muted-foreground mb-6">
        <span className="flex items-center gap-1">
          <Eye size={18} /> {text.views} vues
        </span>
        <span className="flex items-center gap-1">
          <FileText size={18} /> {text.status}
        </span>
      </div>

      {/* Contenu */}
      <div className="prose prose-sm sm:prose lg:prose-lg">
        {text.content.split("\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
