"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Send, Radio, LogOut, Loader2, Heart, Video, Mic, Shield } from "lucide-react";
import Pusher from "pusher-js";
import { toast } from "sonner";

export default function LisibleClub({ roomId, isHost, currentUser }) {
  const [joined, setJoined] = useState(false);
  const [tempMessages, setTempMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);
  const containerRef = useRef(null);
  const zpRef = useRef(null);

  // --- CONFIGURATION ZEGO CLOUD ---
  const appID = 1044014775; 
  const serverSecret = "d687153d18038e439905239e6889bace"; 
  const serverUrl = "wss://webliveroom1044014775-api.coolzcloud.com/ws";

  const getUser = () => {
    if (typeof window === 'undefined') return {};
    try {
      return currentUser || JSON.parse(localStorage.getItem("lisible_user") || "{}");
    } catch (e) { return {}; }
  };

  // 1. Initialisation de ZegoCloud
  const initZego = async () => {
    try {
      const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');
      const user = getUser();
      const cleanUserID = (user.email || `guest_${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '_');
      const userName = user.penName || user.name || "Membre Lisible";

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, serverSecret, roomId || "Lisible_Main", cleanUserID, userName
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zpRef.current = zp;

      zp.joinRoom({
        container: containerRef.current,
        server: serverUrl,
        scenario: {
          mode: ZegoUIKitPrebuilt.Scenario.LiveStreaming,
          config: { role: isHost ? ZegoUIKitPrebuilt.Host : ZegoUIKitPrebuilt.Audience },
        },
        turnOnCameraWhenJoining: isHost,
        turnOnMicrophoneWhenJoining: isHost,
        showMyCameraToggleButton: isHost,
        showMyMicrophoneToggleButton: isHost,
        showTextChat: false, // On utilise votre chat Pusher personnalisé
        showUserList: true,
        showScreenSharingButton: isHost,
        layout: "Grid",
        onLeaveRoom: () => setJoined(false)
      });
    } catch (err) {
      console.error("Zego Init Error:", err);
      toast.error("Erreur de flux vidéo");
    }
  };

  // 2. Gestion Pusher (Chat et Cœurs)
  useEffect(() => {
    if (!roomId) return;
    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2', forceTLS: true });
    const channel = pusher.subscribe(`chat-${roomId}`);
    
    channel.bind('new-message', (data) => {
      const id = Date.now() + Math.random();
      setTempMessages(prev => [...prev, { ...data, id }]);
      setTimeout(() => setTempMessages(prev => prev.filter(m => m.id !== id)), 8000);
    });

    channel.bind('new-heart', () => triggerLocalHeart());

    return () => { 
      channel.unbind_all(); 
      pusher.unsubscribe(`chat-${roomId}`); 
    };
  }, [roomId]);

  const triggerLocalHeart = () => {
    const id = Date.now() + Math.random();
    setFloatingHearts(prev => [...prev, { id, left: Math.random() * 80 + 10 }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 3000);
  };

  const sendHeart = async () => {
    triggerLocalHeart();
    await fetch('/api/live/pusher-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: `chat-${roomId}`, event: 'new-heart', data: {} })
    });
  };

  const handleSendChat = async () => {
    if (!inputMsg.trim()) return;
    const user = getUser();
    const messageData = { user: user.penName || user.name || "Anonyme", text: inputMsg };

    try {
      await fetch('/api/live/pusher-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: `chat-${roomId}`, event: 'new-message', data: messageData })
      });
      setInputMsg("");
    } catch (e) { toast.error("Erreur d'envoi"); }
  };

  const startLive = async () => {
    setLoading(true);
    if (isHost) {
      const user = getUser();
      try {
        // Envoi de la notification via github-db
        await fetch('/api/github-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'addNotification',
            target: 'all',
            notification: {
              id: Date.now(),
              type: 'live',
              title: 'Direct en cours',
              message: `🔴 ${user.penName || user.name || "Un auteur"} est en direct sur le Club !`,
              link: `/lisible-club?room=${roomId}`,
              createdAt: new Date().toISOString(),
              isRead: false
            }
          })
        });
      } catch (err) { console.error("Notif error:", err); }
    }
    
    await initZego();
    setJoined(true);
    setLoading(false);
  };

  return (
    <div className="w-full h-[60vh] md:h-[75vh] bg-slate-950 rounded-[3rem] shadow-2xl overflow-hidden relative border border-white/5">
      
      {/* OVERLAY CŒURS */}
      <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
        {floatingHearts.map(heart => (
          <div key={heart.id} className="absolute bottom-0 text-rose-500 animate-float-heart" style={{ left: `${heart.left}%` }}>
            <Heart fill="currentColor" size={32} />
          </div>
        ))}
      </div>

      {!joined ? (
        <div className="flex flex-col items-center justify-center h-full text-white p-6 bg-gradient-to-b from-slate-900 to-black text-center">
          <Radio size={80} className="text-teal-400 animate-pulse mb-8" />
          <h2 className="text-xl font-bold mb-6 italic tracking-tight">Prêt pour l'expérience Lisible ?</h2>
          <button 
            onClick={startLive} 
            disabled={loading} 
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black uppercase text-xs tracking-widest px-12 py-5 rounded-2xl transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isHost ? "Ouvrir l'antenne" : "Entrer dans le salon")}
          </button>
        </div>
      ) : (
        <div className="relative h-full w-full bg-black">
          
          <div ref={containerRef} className="absolute inset-0 z-0 bg-slate-900" />
          
          <div className="absolute top-6 left-6 right-6 z-[110] flex justify-between items-start pointer-events-none">
             <div className="bg-rose-600 text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl font-black text-[10px] uppercase tracking-widest animate-pulse pointer-events-auto">
                <span className="w-2 h-2 bg-white rounded-full"></span> Direct
             </div>
             <button 
                onClick={() => window.location.reload()} 
                className="p-4 bg-black/40 backdrop-blur-md text-white rounded-2xl border border-white/10 hover:bg-rose-500 transition-all pointer-events-auto"
             >
                <LogOut size={18} />
             </button>
          </div>

          <div className="absolute bottom-32 left-6 z-[120] space-y-3 pointer-events-none max-w-[280px]">
            {tempMessages.map((m) => (
              <div key={m.id} className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl animate-message-fade pointer-events-auto">
                <p className="text-teal-400 font-black text-[9px] uppercase tracking-widest mb-1">{m.user}</p>
                <p className="text-white text-sm font-bold leading-snug">{m.text}</p>
              </div>
            ))}
          </div>

          <div className="absolute bottom-8 left-6 right-6 flex gap-3 z-[130]">
            <div className="flex-grow flex bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] px-6 items-center shadow-2xl">
              <input 
                 value={inputMsg} 
                 onChange={(e) => setInputMsg(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                 className="bg-transparent border-none outline-none text-white text-sm w-full py-5 placeholder:text-slate-400 font-bold"
                 placeholder="Réagir au direct..."
              />
              <button onClick={handleSendChat} className="text-teal-400 p-2 hover:scale-110 transition-transform">
                <Send size={20}/>
              </button>
            </div>
            <button 
              onClick={sendHeart} 
              className="p-5 bg-rose-500 text-white rounded-[2rem] shadow-xl hover:bg-rose-600 active:scale-90 transition-all"
            >
              <Heart size={24} fill="currentColor" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
