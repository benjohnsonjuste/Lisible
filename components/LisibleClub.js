"use client";
import React, { useState, useEffect, useRef } from "react";
import { Heart, Send, Radio, LogOut, Loader2, Users } from "lucide-react";
import Pusher from "pusher-js";
import { 
  LivepeerConfig, 
  createReactClient, 
  studioProvider, 
  Player, 
  Broadcast 
} from "@livepeer/react";
import { toast } from "sonner";

// INITIALISATION DU MOTEUR (À l'extérieur du composant pour la stabilité)
const client = createReactClient({
  provider: studioProvider({ apiKey: "f15e0657-3f95-46f3-8b77-59f0f909162c" }), 
});

// LE CONTENU DU CLUB
function ClubInterface({ roomId, isHost }) {
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [stats, setStats] = useState({ likes: 0 });
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const mediaStreamRef = useRef(null);

  useEffect(() => {
    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
    const channel = pusher.subscribe(`chat-${roomId}`);
    channel.bind('new-message', (data) => setMessages(prev => [...prev, data].slice(-10)));
    channel.bind('new-like', () => setStats(s => ({ ...s, likes: s.likes + 1 })));
    return () => pusher.unsubscribe(`chat-${roomId}`);
  }, [roomId]);

  const startLive = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/live/create-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: `Club-${roomId}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();

      if (isHost) {
        const user = JSON.parse(localStorage.getItem("lisible_user") || "{}");
        await fetch('/api/create-notif', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'live',
            message: `${user.penName || "Un auteur"} est en direct !`,
            link: `/club/${roomId}`
          })
        });
      }
      setStreamData(data);
      setJoined(true);
      toast.success("Connexion réussie !");
    } catch (e) {
      toast.error("Le serveur vidéo ne répond pas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full">
      {!joined ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white">
          <Radio size={48} className="text-teal-400 animate-pulse mb-6" />
          <button onClick={startLive} className="bg-teal-600 px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">
            {loading ? <Loader2 className="animate-spin" /> : (isHost ? "Lancer mon direct" : "Entrer dans le Club")}
          </button>
        </div>
      ) : (
        <div className="relative h-full w-full">
          {isHost ? (
            <Broadcast streamKey={streamData?.streamKey} onMediaStream={(s) => (mediaStreamRef.current = s)} />
          ) : (
            <Player playbackId={streamData?.playbackId} autoPlay />
          )}
          
          <button onClick={() => setJoined(false)} className="absolute top-6 right-6 z-50 p-3 bg-red-600 text-white rounded-xl">
            <LogOut size={20} />
          </button>

          <div className="absolute bottom-6 left-6 right-6 flex gap-2 z-50">
            <input 
               value={inputMsg} 
               onChange={(e) => setInputMsg(e.target.value)}
               className="flex-grow bg-black/40 backdrop-blur-md border border-white/20 rounded-xl px-4 text-white outline-none"
               placeholder="Écrire..."
            />
            <button className="bg-teal-500 p-4 rounded-xl text-white"><Send size={20}/></button>
          </div>
        </div>
      )}
    </div>
  );
}

// LE COMPOSANT EXPORTÉ (CELUI QUE TU APPELLES DANS TES PAGES)
export default function LisibleClub(props) {
  return (
    <LivepeerConfig client={client}>
      <div className="max-w-4xl mx-auto h-[80vh] relative bg-black rounded-[3rem] overflow-hidden shadow-2xl">
        <ClubInterface {...props} />
      </div>
    </LivepeerConfig>
  );
}
