"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { ImageIcon, Send, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";

export default function PublishPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // LIMITES
  const MAX_IMAGE_SIZE_MB = 2;
  const MAX_WORDS = 2000;

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (!loggedUser) {
      toast.error("Veuillez vous connecter.");
      router.push("/login"); 
    } else {
      setUser(JSON.parse(loggedUser));
      setIsChecking(false);
    }
  }, [router]);

  const countWords = (str) => str.trim().split(/\s+/).filter(Boolean).length;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast.error(`L'image est trop lourde. Limite : ${MAX_IMAGE_SIZE_MB} MB`);
        e.target.value = null;
        setImageFile(null);
        return;
      }
      setImageFile(file);
    }
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const words = countWords(content);

    if (words > MAX_WORDS) {
      return toast.error(`Votre texte dépasse la limite de ${MAX_WORDS} mots.`);
    }

    setLoading(true);
    const loadingToast = toast.loading("Publication...");

    try {
      let imageBase64 = null;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: user.name,
          title: title.trim(),
          content: content.trim(),
          imageBase64,
          date: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error("Erreur serveur");
      toast.success("Publié !", { id: loadingToast });
      router.push("/bibliotheque");
    } catch (err) {
      toast.error("Erreur de publication", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 font-sans">
      <div className="max-w-2xl mx-auto mb-6">
        <Link href="/bibliotheque" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-bold text-sm">
          <ArrowLeft size={18} /> Retour
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-8 bg-white rounded-[2.5rem] shadow-sm space-y-8 border border-gray-100">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-black text-gray-900">Publier</h1>
          <p className="text-sm text-blue-600 font-bold px-4 py-1 bg-blue-50 rounded-full inline-block">
             {user?.name}
          </p>
        </header>

        {/* Rappel des limites */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-500 font-medium">
          <Info size={16} className="text-blue-500" />
          <p>Limites : <span className="font-bold text-gray-700">{MAX_WORDS} mots</span> et <span className="font-bold text-gray-700">{MAX_IMAGE_SIZE_MB} MB</span> pour l'image.</p>
        </div>

        <div className="space-y-6">
          <input
            type="text"
            placeholder="Titre..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xl"
            required
          />

          <div className="relative">
            <textarea
              placeholder="Écrivez ici..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full p-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-serif text-lg leading-relaxed"
              required
            />
            <div className={`absolute bottom-4 right-4 text-[10px] font-black px-2 py-1 rounded-md ${countWords(content) > MAX_WORDS ? 'bg-red-100 text-red-600' : 'bg-white text-gray-400'}`}>
              {countWords(content)} / {MAX_WORDS} MOTS
            </div>
          </div>
        </div>

        <div className="p-6 bg-blue-50 rounded-3xl border-2 border-dashed border-blue-100 space-y-3">
          <div className="flex items-center gap-3 text-blue-700">
            <ImageIcon size={20} />
            <span className="text-sm font-bold tracking-tight">Image d'illustration ({MAX_IMAGE_SIZE_MB} MB max)</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-xs text-blue-900/50 file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[1.5rem] font-black text-lg transition-all shadow-xl shadow-blue-50 active:scale-95 disabled:opacity-50"
        >
          {loading ? "Mise en ligne..." : "Publier sur la bibliothèque"}
        </button>
      </form>
    </div>
  );
}
