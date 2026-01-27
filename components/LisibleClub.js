"use client";
import React, { useState, useEffect, useRef } from "react";
import { Heart, Send, Radio, LogOut, Loader2 } from "lucide-react";
import Pusher from "pusher-js";
import { 
  LivepeerConfig, 
  createReactClient, 
  studioProvider, 
  Player, 
  Broadcast 
} from "@livepeer/react";
import { toast } from "sonner";

// Déplacement du client à l'extérieur pour éviter les re-renders
const livepeerClient = createReactClient({
  provider: studioProvider({ apiKey: "f15e0657-3f95-46f3-8b77-59f0f909162c" }), 
});

// COMPOSANT PRINCIPAL (WRAPPER)
export default function LisibleClub(props) {
  return (
    <LivepeerConfig client={livepeerClient}>
      <ClubInterface {...props} />
    </LivepeerConfig>
  );
}

// INTERFACE RÉELLE
function ClubInterface({ roomId, isHost }) {
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const mediaStreamRef = useRef(null);

  // Sécurisation de l'accès au localStorage
  const getUser = () => {
    if (typeof window === 'undefined') return {};
    return JSON.parse(localStorage.getItem("lisible_user") || "{}");
  };

  useEffect(() => {
    if (!isHost && roomId) {
      connectToLive();
    }
  }, [roomId, isHost]);

  useEffect(() => {
    if (!roomId) return;
    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
    const channel = pusher.subscribe(`chat-${roomId}`);
    channel.bind('new-message', (data) => setMessages(prev => [...prev, data].slice(-10)));
    return () => pusher.unsubscribe(`chat-${roomId}`);
  }, [roomId]);

  const connectToLive = async (retryCount = 0) => {
    setLoading(true);
    try {
      const res = await fetch("/api/live/create-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: `Club-${roomId}` }),
      });
      const data = await res.json();
      
      if (!res.ok || !data.playbackId) throw new Error("Flux non prêt");

      setStreamData(data);
      setJoined(true);
    } catch (e) {
      if (!isHost && retryCount < 3) {
        setTimeout(() => connectToLive(retryCount + 1), 5000);
      } else if (!isHost) {
        toast.error("Le live n'est pas encore actif.");
      }
    } finally {
      setLoading(false);
    }
  };

  const startLive = async () => {
    setLoading(true);
    const user = getUser();

    try {
      if (isHost) {
        fetch('/api/create-notif', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'live',
            message: `🔴 ${user.penName || user.name || "Un auteur"} est en LIVE !`,
            link: `/lisible-club?room=${roomId}`,
            targetEmail: "all" 
          })
        });
      }

      const res = await fetch("/api/live/create-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: `Club-${roomId}` }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error();

      setStreamData(data);
      setJoined(true);
    } catch (e) {
      toast.error("Erreur d'antenne.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!inputMsg.trim()) return;
    const user = getUser();
    await fetch('/api/live/pusher-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        channel: `chat-${roomId}`, 
        event: 'new-message', 
        data: { user: user.penName || "Anonyme", text: inputMsg } 
      })
    });
    setInputMsg("");
  };

  // ... (Conservez votre JSX return actuel ici)
