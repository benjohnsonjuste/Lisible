"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Heart } from "lucide-react";
import Pusher from "pusher-js";
import { PUSHER_KEY, PUSHER_CLUSTER } from "./livekit";

/**
 * Commentaires éphémères + cœurs flottants pendant un live.
 * Aucun message n'est conservé : tout disparaît après quelques secondes.
 */
export default function LiveComments({ liveId, pseudo }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [hearts, setHearts] = useState([]);
  const [displayName, setDisplayName] = useState(pseudo || "");
  const bottomRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("lisible_live_pseudo");
    if (saved && !pseudo) setDisplayName(saved);
  }, [pseudo]);

  useEffect(() => {
    if (!liveId) return;
    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER, forceTLS: true });
    const channel = pusher.subscribe(`live-chat-${liveId}`);

    channel.bind("new-message", (data) => {
      const id = Date.now() + Math.random();
      setMessages((prev) => [...prev.slice(-24), { ...data, id }]);
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }, 9000);
    });

    channel.bind("new-heart", () => spawnHeart());

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`live-chat-${liveId}`);
      pusher.disconnect();
    };
  }, [liveId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const spawnHeart = () => {
    const id = Date.now() + Math.random();
    setHearts((prev) => [...prev.slice(-30), { id, left: Math.random() * 80 + 10 }]);
    setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 2800);
  };

  const sendHeart = async () => {
    spawnHeart();
    try {
      await fetch("/api/live/pusher-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: `live-chat-${liveId}`, event: "new-heart", data: {} }),
      });
    } catch {}
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !liveId) return;
    const name = (displayName || "Invité").slice(0, 30);
    localStorage.setItem("lisible_live_pseudo", name);
    setInput("");
    try {
      await fetch("/api/live/pusher-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: `live-chat-${liveId}`,
          event: "new-message",
          data: { user: name, text: text.slice(0, 200) },
        }),
      });
    } catch {}
  };

  return (
    <div className="relative flex flex-col h-full">
      {/* Cœurs flottants */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {hearts.map((h) => (
          <div key={h.id} className="absolute bottom-24 text-rose-500 animate-float-heart" style={{ left: `${h.left}%` }}>
            <Heart fill="currentColor" size={30} />
          </div>
        ))}
      </div>

      {/* Messages éphémères */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-[120px]">
        {messages.length === 0 && (
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 italic py-4">
            Soyez le premier à réagir… Les messages s'effacent après quelques secondes.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="animate-message-fade bg-black/55 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/10 max-w-[85%]">
            <p className="text-teal-300 font-black text-[10px] uppercase tracking-widest">{m.user}</p>
            <p className="text-white text-sm font-medium leading-snug break-words">{m.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Pseudo + envoi */}
      <div className="p-3 border-t border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex gap-2 mb-2">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Votre pseudo (optionnel)"
            maxLength={30}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-teal-500"
          />
          <button
            onClick={sendHeart}
            aria-label="Envoyer un cœur"
            className="shrink-0 p-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all active:scale-90"
          >
            <Heart size={18} fill="currentColor" />
          </button>
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Écrivez un commentaire…"
            maxLength={200}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-teal-500"
          />
          <button
            onClick={sendMessage}
            aria-label="Envoyer"
            className="shrink-0 p-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-all active:scale-90"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
