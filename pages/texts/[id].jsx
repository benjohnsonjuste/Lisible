"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Heart, Share2, Eye } from "lucide-react";
import { getFileContent, createOrUpdateFile } from "@/lib/githubClient";

const GITHUB_OWNER = "benjohnsonjuste";
const GITHUB_REPO = "Lisible";
const GITHUB_BRANCH = "main";

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [user, setUser] = useState(null);

  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;

  // Charger utilisateur local
  useEffect(() => {
    const storedUser = localStorage.getItem("lisibleUser");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Charger texte depuis GitHub
  useEffect(() => {
    if (!id) return;
    async function fetchText() {
      try {
        const res = await fetch(`/data/texts/${id}.json`);
        if (!res.ok) throw new Error("Texte introuvable");
        const data = await res.json();
        setText(data);
        setLikes(data.likes || 0);
        setViews(data.views || 0);
        setLoading(false);
        handleViewSync(id);
        checkLikeStatus(id);
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Impossible de charger le texte");
      }
    }
    fetchText();
  }, [id, user]);

  // Vérifie si déjà liké
  const checkLikeStatus = (textId) => {
    const key = `likes-${textId}`;
    const likesList = JSON.parse(localStorage.getItem(key) || "[]");

    let uniqueId;
    if (user?.uid) uniqueId = `user-${user.uid}`;
    else {
      let deviceId = localStorage.getItem("lisibleDeviceId");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("lisibleDeviceId", deviceId);
      }
      uniqueId = `device-${deviceId}`;
    }

    setLiked(likesList.includes(uniqueId));
  };

  /**
   * 👁️ Vue unique + synchro GitHub
   */
  const handleViewSync = async (textId) => {
    if (!textId) return;

    let uniqueViewerId;
    if (user?.uid) {
      uniqueViewerId = `user-${user.uid}`;
    } else {
      let deviceId = localStorage.getItem("lisibleDeviceId");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("lisibleDeviceId", deviceId);
      }
      uniqueViewerId = `device-${deviceId}`;
    }

    const key = `viewers-${textId}`;
    let viewers = JSON.parse(localStorage.getItem(key) || "[]");

    // Déjà compté ? On ne double pas
    if (viewers.includes(uniqueViewerId)) {
      setViews(viewers.length);
      return;
    }

    // Ajouter la vue localement
    viewers.push(uniqueViewerId);
    localStorage.setItem(key, JSON.stringify(viewers));
    const newCount = viewers.length;
    setViews(newCount);

    // 🔁 Mise à jour GitHub
    try {
      const path = `data/texts/${textId}.json`;
      const fileData = await getFileContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path,
        branch: GITHUB_BRANCH,
        token,
      });

      const content = JSON.parse(atob(fileData.content));
      content.views = (content.views || 0) + 1;

      await createOrUpdateFile({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path,
        branch: GITHUB_BRANCH,
        token,
        message: `👁️ +1 vue pour ${content.title}`,
        content: JSON.stringify(content, null, 2),
        sha: fileData.sha,
      });
    } catch (err) {
      console.error("Erreur synchro vues:", err);
    }
  };

  /**
   * ❤️ Like unique + synchro GitHub
   */
  const handleLike = async () => {
    if (!id || liked) return;

    let uniqueId;
    if (user?.uid) uniqueId = `user-${user.uid}`;
    else {
      let deviceId = localStorage.getItem("lisibleDeviceId");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("lisibleDeviceId", deviceId);
      }
      uniqueId = `device-${deviceId}`;
    }

    const localKey = `likes-${id}`;
    const likesList = JSON.parse(localStorage.getItem(localKey) || "[]");

    if (likesList.includes(uniqueId)) return;

    likesList.push(uniqueId);
    localStorage.setItem(localKey, JSON.stringify(likesList));

    setLikes((prev) => prev + 1);
    setLiked(true);
    toast.success("❤️ Merci pour ton like !");

    // 🔁 Mise à jour GitHub
    try {
      const path = `data/texts/${id}.json`;
      const fileData = await getFileContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path,
        branch: GITHUB_BRANCH,
        token,
      });

      const content = JSON.parse(atob(fileData.content));
      content.likes = (content.likes || 0) + 1;

      await createOrUpdateFile({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path,
        branch: GITHUB_BRANCH,
        token,
        message: `❤️ +1 like pour ${content.title}`,
        content: JSON.stringify(content, null, 2),
        sha: fileData.sha,
      });
    } catch (err) {
      console.error("Erreur synchro likes:", err);
      toast.error("⚠️ Like local enregistré, mais synchro GitHub échouée.");
    }
  };

  // 🔗 Partage
  const handleShare = async () => {
    try {
      await navigator.share({
        title: text?.title,
        text: `Découvre ce texte sur Lisible : ${text?.title}`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("🔗 Lien copié !");
    }
  };

  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (!text) return <p className="text-center mt-10">Texte introuvable.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow mt-6 space-y-6">
      {text.image && (
        <img
          src={text.image}
          alt={text.title}
          className="w-full h-64 object-cover rounded-xl"
        />
      )}

      <h1 className="text-3xl font-bold">{text.title}</h1>

      <div className="text-gray-600 text-sm flex justify-between">
        <p>✍️ <strong>{text.authorName}</strong></p>
        <p>{new Date(text.date).toLocaleString()}</p>
      </div>

      <p className="leading-relaxed whitespace-pre-line">{text.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-6 border-t pt-4 text-gray-700">
        {/* ❤️ Like */}
        <button
          onClick={handleLike}
          disabled={liked}
          className="flex items-center gap-2 focus:outline-none disabled:cursor-not-allowed"
        >
          <Heart
            size={22}
            className={`transition ${
              liked ? "fill-pink-500 text-pink-500" : "text-gray-400 hover:text-pink-500"
            }`}
          />
          <span className="text-sm">{likes}</span>
        </button>

        {/* 🔗 Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition"
        >
          <Share2 size={20} />
        </button>

        {/* 👁️ Views */}
        <div className="ml-auto flex items-center gap-1 text-sm text-gray-500">
          <Eye size={16} />
          <span>{views}</span>
        </div>
      </div>
    </div>
  );
}