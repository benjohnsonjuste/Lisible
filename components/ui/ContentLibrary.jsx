"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

/**
 * 🧩 Composant ContentLibrary
 * Permet d'afficher, modifier ou supprimer un texte spécifique d’un auteur.
 * Peut être utilisé dans n’importe quelle page du dashboard.
 */
export default function ContentLibrary({ textId: propTextId }) {
  const router = useRouter();
  const params = useParams();
  const textId = propTextId || params?.id;

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔹 Charger le texte depuis public/data/texts/[id].json
  useEffect(() => {
    const fetchText = async () => {
      try {
        const res = await fetch(`/data/texts/${textId}.json`);
        if (!res.ok) throw new Error("Texte introuvable");
        const data = await res.json();
        setText(data);
      } catch (err) {
        console.error("Erreur chargement texte:", err);
        toast.error("Impossible de charger le texte");
      } finally {
        setLoading(false);
      }
    };
    if (textId) fetchText();
  }, [textId]);

  // 🔹 Modifier localement un champ du texte
  const handleChange = (field, value) =>
    setText((prev) => ({ ...prev, [field]: value }));

  // 🔹 Sauvegarder les modifications
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/update-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(text),
      });
      if (!res.ok) throw new Error("Erreur mise à jour");
      toast.success("✅ Texte mis à jour !");
      router.push("/dashboard");
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Supprimer le texte
  const handleDelete = async () => {
    if (!confirm("Supprimer ce texte définitivement ?")) return;
    try {
      const res = await fetch("/api/delete-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: textId }),
      });
      if (!res.ok) throw new Error("Erreur suppression");
      toast.success("🗑️ Texte supprimé !");
      router.push("/dashboard");
    } catch (err) {
      toast.error("Échec de suppression");
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="text-center py-10 text-gray-600">Chargement...</div>
    );

  if (!text)
    return (
      <div className="text-center py-10 text-gray-600">
        Texte introuvable.
      </div>
    );

  return (
    <form
      onSubmit={handleSave}
      className="max-w-3xl mx-auto bg-white shadow rounded-xl p-6 space-y-4"
    >
      <h1 className="text-2xl font-semibold text-center mb-4">
        ✏️ Modifier le texte
      </h1>

      <input
        type="text"
        value={text.title || ""}
        onChange={(e) => handleChange("title", e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Titre du texte"
      />

      <textarea
        value={text.content || ""}
        onChange={(e) => handleChange("content", e.target.value)}
        rows={10}
        className="w-full p-2 border rounded"
        placeholder="Contenu du texte"
      />

      <div>
        <label className="text-sm text-gray-600 mb-1 block">Image</label>
        {text.image && (
          <img
            src={text.image}
            alt="illustration"
            className="w-full h-48 object-cover mb-2 rounded"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () =>
              handleChange("image", reader.result);
            reader.readAsDataURL(file);
          }}
        />
      </div>

      <div className="flex justify-between items-center">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {saving ? "Sauvegarde..." : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Supprimer
        </button>
      </div>
    </form>
  );
  }
