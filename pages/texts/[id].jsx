"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Heart, Share2, Eye } from "lucide-react";
// Assurez-vous que ce hook et son implémentation sont disponibles
import { useUserProfile } from "@/hooks/useUserProfile"; 

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query; // Récupère l'ID du texte depuis l'URL

  // --- États locaux ---
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  
  // Utilisation d'un hook pour l'utilisateur (à adapter à votre système d'authentification)
  const { user, isLoading: userLoading, redirectToAuth } = useUserProfile();

  /**
   * Fonction utilitaire pour obtenir le nom d'affichage de l'auteur.
   */
  const getDisplayName = (author) =>
    author?.displayName || author?.name || author?.email || "Utilisateur Anonyme";

  // --- API GitHub Simulé (Assurez-vous d'avoir un endpoint `/api/github-save`) ---
  /**
   * 🔹 Sauvegarde les données mises à jour (likes/commentaires/vues) sur GitHub.
   * Cette fonction nécessite un endpoint API sur votre serveur Next.js pour fonctionner.
   */
  const saveToGitHub = async (updatedData) => {
    try {
      // Cet endpoint doit gérer l'authentification GitHub et la mise à jour du fichier.
      const res = await fetch("/api/github-save", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, data: updatedData }),
      });
      if (!res.ok) throw new Error("Erreur GitHub lors de la sauvegarde");
      // Optionnel : toast.success("Sauvegarde GitHub OK");
    } catch (err) {
      console.error("❌ Sauvegarde GitHub échouée:", err);
      // toast.error("Échec de la sauvegarde sur GitHub.");
    }
  };

  // --- Chargement et Initialisation des Données Locales ---
  /**
   * 🔹 Charger le texte et initialiser les vues, likes et commentaires depuis localStorage.
   */
  useEffect(() => {
    if (!id) return;
    
    async function fetchText() {
      try {
        // Charge le contenu du texte depuis un fichier JSON statique ou une API
        const res = await fetch(`/data/texts/${id}.json`);
        if (!res.ok) throw new Error("Texte introuvable");
        const data = await res.json();

        // Initialiser likes et commentaires depuis localStorage
        const storedLikes = JSON.parse(localStorage.getItem(`likes-${id}`) || "[]");
        const storedComments = JSON.parse(localStorage.getItem(`comments-${id}`) || "[]");

        setText(data);
        // Les likes affichés sont le nombre d'IDs stockés localement
        setLikes(storedLikes.length); 
        // Vérifie si l'utilisateur actuel a liké
        setLiked(user ? storedLikes.includes(user.uid) : false); 
        setComments(storedComments);

        trackView(data); // Enregistre la vue
        setLoading(false);
      } catch {
        toast.error("Impossible de charger le texte");
        setLoading(false);
      }
    }
    fetchText();

  }, [id, user]);

  // --- Gestion des Vues ---
  /**
   * 🔹 Compte les vues uniques via un identifiant unique (utilisateur ou appareil).
   */
  const trackView = async (currentText) => {
    const key = `viewers-${id}`;
    // Utilise l'UID de l'utilisateur ou un ID unique d'appareil (persistant localement)
    const uniqueId = user?.uid || localStorage.getItem("deviceId") || crypto.randomUUID();
    localStorage.setItem("deviceId", uniqueId);

    const viewers = JSON.parse(localStorage.getItem(key) || "[]");
    
    // N'enregistre la vue que si l'ID n'est pas déjà dans la liste
    if (!viewers.includes(uniqueId)) {
      viewers.push(uniqueId);
      localStorage.setItem(key, JSON.stringify(viewers));
      
      setViews(viewers.length);
      const updated = { ...currentText, views: viewers.length };
      setText(updated);
      await saveToGitHub(updated); // Sauvegarde la nouvelle vue sur GitHub
    } else {
      // Si déjà vu, met juste à jour l'état local des vues (pour le rendu initial)
      setViews(viewers.length); 
    }
  };

  // --- Gestion du Like (Sans Rechargement) ---
  /**
   * 🔹 Gère le like : met à jour l'état local, le localStorage et sauvegarde sur GitHub.
   */
  const handleLike = async () => {
    if (!user) return redirectToAuth(`/texts/${id}`); // Redirige si non connecté

    const key = `likes-${id}`;
    let currentLikes = JSON.parse(localStorage.getItem(key) || "[]");
    const likeId = user.uid; // ID de l'utilisateur qui like

    // Gère le double clic (déjà liké)
    if (currentLikes.includes(likeId)) {
      // --- Logique pour UNLIKE si vous voulez l'implémenter ---
      // currentLikes = currentLikes.filter(uid => uid !== likeId);
      // setLiked(false);
      // toast.info("Like retiré.");
      // --------------------------------------------------------
      toast.info("Tu as déjà liké !");
      return; 
    }

    // Ajout du like
    currentLikes.push(likeId);
    localStorage.setItem(key, JSON.stringify(currentLikes)); // 💾 Sauvegarde Locale
    setLikes(currentLikes.length);
    setLiked(true); // ✨ Colore le bouton
    toast.success("Merci pour ton like !");

    // Mise à jour de l'objet texte et sauvegarde sur GitHub
    const updated = { ...text, likes: currentLikes.length };
    setText(updated);
    await saveToGitHub(updated); // 💾 Sauvegarde sur GitHub
  };

  // --- Gestion des Commentaires (Sans Rechargement) ---
  /**
   * 🔹 Gère la publication d'un commentaire : met à jour l'état local, le localStorage et sauvegarde sur GitHub.
   */
  const handleComment = async () => {
    if (!user) return redirectToAuth(`/texts/${id}`); // Redirige si non connecté
    if (!commentText.trim()) return; // Vérifie que le champ n'est pas vide

    const newComment = {
      author: getDisplayName(user),
      content: commentText,
      date: new Date().toISOString(),
    };

    const updatedComments = [...comments, newComment];
    setComments(updatedComments); // ✨ Mise à jour de l'affichage
    setCommentText(""); // 🧹 Nettoie le champ de saisie

    // Sauvegarde locale pour persistance
    localStorage.setItem(`comments-${id}`, JSON.stringify(updatedComments)); // 💾 Sauvegarde Locale

    toast.success("Commentaire publié !");
    
    // Mise à jour de l'objet texte et sauvegarde sur GitHub
    const updated = { ...text, comments: updatedComments };
    setText(updated);
    await saveToGitHub(updated); // 💾 Sauvegarde sur GitHub
  };

  // --- Rendu Conditionnel ---
  if (loading || userLoading) 
    return <p className="text-center mt-10">Chargement en cours...</p>;
  if (!text) 
    return <p className="text-center mt-10">Texte introuvable.</p>;

  // --- Rendu du Composant ---
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow mt-6 space-y-6">
      {text.image && (
        <img src={text.image} alt={text.title} className="w-full h-64 object-cover rounded-xl" />
      )}

      <h1 className="text-3xl font-bold">{text.title}</h1>
      <div className="text-gray-600 text-sm flex justify-between">
        <p>
          <strong>{getDisplayName(text.author)}</strong>
        </p>
        <p>{new Date(text.date).toLocaleString()}</p>
      </div>

      <p className="leading-relaxed whitespace-pre-line">{text.content}</p>

      {/* --- Actions (Like, Partage, Vues) --- */}
      <div className="flex gap-4 pt-4 border-t items-center">
        {/* Bouton Like : coloré si `liked` est true */}
        <button onClick={handleLike} className="flex items-center gap-2 transition">
          <Heart
            size={24}
            // Logic: Si liké, couleur rose et rempli, sinon gris et vide.
            className={liked ? "text-pink-500" : "text-gray-400"}
            fill={liked ? "currentColor" : "none"} 
          />
          <span>{likes}</span>
        </button>

        {/* Bouton Partage (utilise l'API web Share native) */}
        <button onClick={() => navigator.share({ title: text.title, url: window.location.href })}>
          <Share2 size={24} className="text-gray-400 hover:text-blue-500" />
        </button>

        {/* Compteur de vues */}
        <span className="ml-auto text-sm text-gray-500 flex items-center gap-1">
          <Eye size={16} /> {views} vue{views > 1 ? "s" : ""}
        </span>
      </div>

      {/* --- Section Commentaires --- */}
      <div className="pt-4 border-t">
        <h3 className="font-semibold mb-2">Commentaires ({comments.length})</h3>
        
        {/* Liste des commentaires */}
        {comments.map((c, i) => (
          <div key={i} className="p-2 border rounded mb-2 bg-gray-50">
            <p className="text-sm text-gray-700">
              <strong>{c.author}</strong> · {new Date(c.date).toLocaleString()}
            </p>
            <p className="mt-1">{c.content}</p>
          </div>
        ))}

        {/* Formulaire d'ajout de commentaire */}
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            placeholder="Écrire un commentaire..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500"
            rows={3}
          />
          <button
            onClick={handleComment} // Appel sans rechargement
            className="self-end px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Publier
          </button>
        </div>
      </div>
    </div>
  );
}
