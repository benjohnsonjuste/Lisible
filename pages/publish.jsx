"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  X,
  Feather,
} from "lucide-react";

export default function PublishPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  /* ==============================
     AUTH + BROUILLON
  ============================== */
  useEffect(() => {
    const storedUser = localStorage.getItem("lisible_user");

    if (!storedUser) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(storedUser));
    setTitle(localStorage.getItem("draft_title") || "");
    setContent(localStorage.getItem("draft_content") || "");
    setIsChecking(false);
  }, [router]);

  useEffect(() => {
    if (!isChecking) {
      localStorage.setItem("draft_title", title);
      localStorage.setItem("draft_content", content);
    }
  }, [title, content, isChecking]);

  /* ==============================
     IMAGE
  ============================== */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const scale = MAX_WIDTH / img.width;

        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        setImagePreview(
          canvas.toDataURL("image/jpeg", 0.6)
        );
      };
      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  };

  /* ==============================
     SUBMIT
  ============================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!user?.email) {
      return toast.error("Utilisateur non identifié.");
    }

    if (content.trim().length < 50) {
      return toast.error("Le texte doit contenir au moins 50 caractères.");
    }

    setLoading(true);
    const toastId = toast.loading("Publication en cours…");

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        authorName: user.penName || user.name || "Plume",
        authorEmail: user.email.toLowerCase().trim(),
        imageBase64: imagePreview,
        isConcours: false,
      };

      const res = await fetch("/api/texts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Échec de la publication");
      }

      toast.success("Œuvre publiée avec succès ✨", {
        id: toastId,
      });

      localStorage.removeItem("draft_title");
      localStorage.removeItem("draft_content");

      router.push(`/texts/${data.id}`);

    } catch (err) {
      console.error("Publish error:", err);
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  /* ==============================
     LOADING
  ============================== */
  if (isChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FCFBF9]">
        <Loader2 className="animate-spin text-teal-600" size={30} />
      </div>
    );
  }

  /* ==============================
     UI
  ============================== */
  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20 px-5 pt-10 bg-[#FCFBF9]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/bibliotheque"
          className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 hover:text-teal-600 transition"
        >
          <ArrowLeft size={16} /> Retour Bibliothèque
        </Link>

        <button
          type="button"
          onClick={() => {
            if (confirm("Vider le brouillon ?")) {
              setTitle("");
              setContent("");
            }
          }}
          className="text-[9px] font-black uppercase text-rose-400 bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition"
        >
          Effacer
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 md:p-14 rounded-[3.5rem] border border-slate-100 shadow-2xl space-y-8"
      >
        {/* Title */}
        <div className="flex items-center gap-4 border-b pb-6">
          <div className="p-3 bg-slate-900 rounded-2xl text-white">
            <Feather size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic text-slate-900">
              Nouveau Manuscrit
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Encre & Lumière
            </p>
          </div>
        </div>

        {/* Inputs */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de votre œuvre…"
          required
          className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-5 text-xl font-black italic outline-none focus:bg-white focus:border-teal-500/20"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Laissez courir votre plume…"
          required
          className="w-full bg-slate-50 border-2 rounded-[2.5rem] p-8 font-serif text-lg leading-relaxed min-h-[350px] outline-none focus:bg-white focus:border-teal-500/20"
        />

        {/* Image */}
        <div>
          <input
            type="file"
            accept="image/*"
            id="cover"
            className="hidden"
            onChange={handleImageChange}
          />

          {imagePreview ? (
            <div className="relative h-56 rounded-[2rem] overflow-hidden">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute top-4 right-4 bg-rose-500 text-white p-2 rounded-full"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <label
              htmlFor="cover"
              className="flex flex-col items-center justify-center p-10 bg-slate-50 border-2 border-dashed rounded-[2.5rem] cursor-pointer hover:bg-teal-50 transition"
            >
              <ImageIcon size={32} className="text-slate-300" />
              <span className="text-[10px] font-black uppercase text-slate-400 mt-3 tracking-[0.2em]">
                Couverture (optionnelle)
              </span>
            </label>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white py-7 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] hover:bg-teal-600 transition flex justify-center items-center"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            "Diffuser"
          )}
        </button>
      </form>
    </div>
  );
}
