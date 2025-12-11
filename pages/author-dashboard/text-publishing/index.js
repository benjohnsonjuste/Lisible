// pages/author-dashboard/text-publishing/index.js
"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";

export default function TextPublishingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authorName, setAuthorName] = useState("AuteurTest"); // Remplace par ton pseudo

  // limite raisonnable pour Base64 -> 5 MB (approx)
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => {
        reader.abort();
        reject(new Error("Erreur lecture fichier"));
      };
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      return toast.error("Titre et contenu requis");
    }

    setLoading(true);

    try {
      toast("Préparation de la publication...", { duration: 2000 });

      let imageBase64 = null;
      if (imageFile) {
        // taille check
        if (imageFile.size > MAX_IMAGE_BYTES) {
          throw new Error("Image trop grosse — limitez à 5 MB");
        }

        toast("Conversion de l'image en base64...", { duration: 2000 });
        imageBase64 = await fileToDataUrl(imageFile);

        // check taille base64 (approx)
        const approxBytes = Math.ceil((imageBase64.length * 3) / 4);
        if (approxBytes > MAX_IMAGE_BYTES) {
          throw new Error("Image (base64) dépasse la limite autorisée (~5MB).");
        }
      }

      toast("Envoi de la requête de publication...", { duration: 2000 });

      const payload = {
        title: title.trim(),
        content: content.trim(),
        imageBase64, // null si aucune image
        author: {
          name: authorName,
        },
      };

      const res = await fetch("/api/publishText", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error("Réponse non JSON du serveur:", jsonErr);
        throw new Error("Réponse serveur invalide");
      }

      if (!res.ok) {
        console.error("Erreur publishText API:", data);
        // message clair si disponible
        const serverMsg = data?.error || data?.message || JSON.stringify(data);
        throw new Error(serverMsg);
      }

      toast.success("Texte publié avec succès !");
      // data.id devrait exister
      if (data.id) {
        router.push(`/texts/${data.id}`);
      } else {
        console.warn("Publication réussie mais id manquant dans la réponse", data);
        router.push("/texts");
      }
    } catch (err) {
      console.error("Erreur publication:", err);
      toast.error(err.message || "Échec de la publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Publier un texte</h1>

        <form onSubmit={handlePublish} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Auteur (pseudo)</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full border p-2 rounded mb-2"
            />
            <label className="font-semibold">Titre</label>
            <input
              type="text"
              placeholder="Titre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="font-semibold">Contenu</label>
            <textarea
              rows={10}
              placeholder="Contenu"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="font-semibold">Image (optionnelle, max 5MB)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0] || null)}
              className="mt-1"
            />
            {imageFile && (
              <p className="text-sm text-gray-500 mt-2">
                Sélectionné : {imageFile.name} — {(imageFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Publication..." : "Publier"}
          </button>
        </form>
      </div>
    </div>
  );
}