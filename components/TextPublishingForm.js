"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function TextPublishingForm() {
const router = useRouter();
const { user, isLoading } = useUserProfile();

const [title, setTitle] = useState("");
const [content, setContent] = useState("");
const [imageFile, setImageFile] = useState(null);
const [preview, setPreview] = useState(null);
const [loading, setLoading] = useState(false);

/** Convert image to Base64 with size check (max 5MB) */
const toBase64 = (file) =>
new Promise((resolve, reject) => {
if (file.size > 5 * 1024 * 1024) {
reject(new Error("Image trop grande (max 5 Mo)"));
return;
}
const reader = new FileReader();
reader.onload = (e) => resolve(e.target.result);
reader.onerror = reject;
reader.readAsDataURL(file);
});

async function handleSubmit(e) {
e.preventDefault();

if (!user) {
  toast.error("Connectez-vous pour publier.");
  return;
}

if (!title.trim() || !content.trim()) {
  toast.error("Veuillez écrire un titre et un contenu.");
  return;
}

setLoading(true);

try {
  let imageBase64 = null;
  let imageName = null;

  if (imageFile) {
    if (!imageFile.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image.");
      setLoading(false);
      return;
    }

    imageBase64 = await toBase64(imageFile);
    imageName = Date.now() + "-" + imageFile.name.replace(/\s+/g, "_");
  }

  const authorName =
    user.fullName || user.displayName || user.name || "Auteur inconnu";

  const payload = {
    title: title.trim(),
    content: content.trim(),
    authorName,
    authorEmail: user.email || "",
    imageBase64,
    imageName,
    createdAt: new Date().toISOString(),
  };

  const res = await fetch("/api/publish-github", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error("Réponse API invalide");
  }

  if (!res.ok) {
    console.error("Erreur publication GitHub:", json);
    throw new Error(json.error || "Échec publication");
  }

  toast.success("Texte publié avec succès !");
  setTitle("");
  setContent("");
  setImageFile(null);
  setPreview(null);

  router.push("/bibliotheque");
} catch (err) {
  console.error("Erreur côté client:", err);
  toast.error(err.message || "Échec lors de la publication.");
} finally {
  setLoading(false);
}

}

function handleImage(e) {
const f = e.target.files[0];
setImageFile(f || null);
if (f) setPreview(URL.createObjectURL(f));
else setPreview(null);
}

if (isLoading) return <p className="text-center mt-10">Chargement...</p>;

return (
<form
onSubmit={handleSubmit}
className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow space-y-4"
>
<h2 className="text-xl font-semibold text-center">Publier un texte</h2>

  <div>
    <label className="block text-sm font-medium mb-1">Titre</label>
    <input
      type="text"
      placeholder="Titre du texte"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      className="w-full p-2 border rounded"
      required
    />
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">Contenu</label>
    <textarea
      placeholder="Écris ton texte..."
      value={content}
      onChange={(e) => setContent(e.target.value)}
      rows={15}
      className="w-full p-2 border rounded min-h-[200px]"
      required
    />
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">
      Image d’illustration (optionnel, max 5 Mo)
    </label>
    <input type="file" accept="image/*" onChange={handleImage} />
    {preview && (
      <img
        src={preview}
        className="mt-3 w-full max-h-72 object-cover rounded"
        alt="Preview"
      />
    )}
  </div>

  <button
    type="submit"
    disabled={loading}
    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
  >
    {loading ? "Publication…" : "Publier"}
  </button>
</form>

);
}