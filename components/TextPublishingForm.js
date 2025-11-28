"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";
import { signIn } from "next-auth/react"; // ← Adapte selon ton provider (Clerk, Supabase, etc.)

export default function TextPublishingForm() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUserProfile();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  // Conversion Base64 (inchangée)
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 1. On attend que le statut utilisateur soit connu
    if (userLoading) {
      toast.info("Vérification de votre session...");
      return;
    }

    // 2. Si pas connecté → on déclenche la connexion
    if (!user) {
      toast.error("Vous devez être connecté pour publier.");
      // Exemple avec NextAuth :
      signIn(); // ouvre la popup/page de connexion
      // Si tu utilises Clerk :
      // signInWithRedirect({ strategy: "oauth_google" }) // ou autre
      // Si Supabase :
      // supabase.auth.signInWithOAuth({ provider: "google" })
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast.error("Veuillez remplir le titre et le contenu.");
      return;
    }

    setLoading(true);
    setPublishedUrl(null);

    try {
      let imageBase64: string | null = null;
      let imageName: string | null = null;

      if (imageFile) {
        if (!imageFile.type.startsWith("image/")) {
          toast.error("Veuillez sélectionner une image valide.");
          setLoading(false);
          return;
        }
        imageBase64 = await toBase64(imageFile);
        imageName = `${Date.now()}-${imageFile.name.replace(/\s+/g, "_")}`;
      }

      const authorName =
        user?.fullName || user?.displayName || user?.name || "Anonyme";

      const payload = {
        title: title.trim(),
        content: content.trim(),
        authorName,
        authorEmail: user?.email || "",
        imageBase64,
        imageName,
        createdAt: new Date().toISOString(),
      };

      const res = await fetch("/api/publish-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("Erreur API:", json);
        throw new Error(json.error || "Échec de la publication");
      }

      toast.success("Texte publié avec succès !");
      setPublishedUrl(json.url);

      // Reset formulaire
      setTitle("");
      setContent("");
      setImageFile(null);
      setPreview(null);
    } catch (err: any) {
      console.error("Erreur publication:", err);
      toast.error(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setImageFile(file || null);
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  }

  // Pendant le chargement de l'utilisateur
  if (userLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-gray-600">Chargement de votre profil...</p>
      </div>
    );
  }

  // Si on sait que l'utilisateur n'est PAS connecté
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center space-y-6">
        <p className="text-lg text-gray-700">
          Vous devez être connecté pour publier un texte.
        </p>
        <button
          onClick={() => signIn()} // ← adapte selon ton auth provider
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Se connecter
        </button>
      </div>
    );
  }

  // Formulaire normal (utilisateur connecté)
  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow space-y-6"
    >
      <h2 className="text-2xl font-bold text-center">Publier un texte</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Titre</label>
        <input
          type="text"
          placeholder="Titre du texte"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Contenu</label>
        <textarea
          placeholder="Écris ton texte ici..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={15}
          className="w-full p-3 border rounded-lg min-h-[300px]"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Image d’illustration (optionnel)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImage}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {preview && (
          <img
            src={preview}
            alt="Prévisualisation"
            className="mt-4 w-full max-h-96 object-contain rounded-lg border"
          />
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70 transition"
      >
        {loading ? "Publication en cours..." : "Publier le texte"}
      </button>

      {publishedUrl && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-green-800 font-medium">
            Publié avec succès ! 
          </p>
          <a
            href={publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Voir sur GitHub
          </a>
        </div>
      )}
    </form>
  );
}