"use client";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toggleLike, getLikes } from "@/lib/likes";
import { useAuth } from "@/context/AuthContext";

export default function LikeButton({ textId }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  // Identifiant utilisateur ou visiteur
  const getUserId = () => {
    if (user?.email) return user.email;
    let guestId = localStorage.getItem("guestId");
    if (!guestId) {
      guestId = "guest-" + Math.random().toString(36).substring(2, 8);
      localStorage.setItem("guestId", guestId);
    }
    return guestId;
  };

  const userId = getUserId();

  useEffect(() => {
    (async () => {
      const data = await getLikes(textId);
      setCount(data.count || 0);
      setLiked(!!data.users?.[userId]);
    })();
  }, [textId]);

  const handleClick = async () => {
    const result = await toggleLike(textId, userId);
    setLiked(result.liked);
    setCount(result.count);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition"
    >
      <Heart
        className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : "text-gray-500"}`}
      />
      <span>{count}</span>
    </button>
  );
}