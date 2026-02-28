"use client";
import React, { useEffect, useState, useRef } from "react";
import { Video, Mic, Radio, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

export default function LiveSystem({ currentUser, isAdmin }) {
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const zpRef = useRef(null);

  // --- CONFIGURATION À REMPLIR ---
  const appID = 123456789; // Remplacez par votre AppID de ZegoCloud
  const serverSecret = "votre_secret_ici"; // Remplacez par votre Secret
  // -------------------------------

  const joinLive = async (type = 'video') => {
    setLoading(true);
    try {
      const roomID = "Lisible_Main_Room";
      const userID = currentUser?.email || `user_${Math.floor(Math.random() * 10000)}`;
      const userName = currentUser?.name || "Membre Lisible";

      // 1. Générer le Token (Test)
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, 
        serverSecret, 
        roomID, 
        userID, 
        userName
      );

      // 2. Créer l'instance
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zpRef.current = zp;

      // 3. Rejoindre la salle
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: type === 'video' ? ZegoUIKitPrebuilt.Scenario.LiveStreaming : ZegoUIKitPrebuilt.Scenario.GroupCall,
          config: { 
            role: isAdmin ? ZegoUIKitPrebuilt.Host : ZegoUIKitPrebuilt.Audience 
          },
        },
        showPreJoinView: false,
        turnOnCameraWhenJoining: isAdmin && type === 'video',
        turnOnMicrophoneWhenJoining: isAdmin,
        showTextChat: true,
        showUserList: true,
        layout: "Grid",
        onLeaveRoom: () => {
          setIsLive(false);
          if (isAdmin) handleStatusChange(false);
        }
      });

      if (isAdmin) await handleStatusChange(true, type);
      setIsLive(true);
    } catch (err) {
      console.error(err);
      toast.error("Échec de connexion au flux.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (active, type = 'video') => {
    try {
      await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: active ? "start" : "stop", 
          admin: currentUser?.email,
          type 
        })
      });
    } catch (e) { console.error("Erreur API Live"); }
  };

  // Auto-détection du live pour les spectateurs
  useEffect(() => {
    const checkLive = async () => {
      const res = await fetch("/api/live");
      const data = await res.json();
      if (data.isActive && !isLive && !isAdmin) {
        joinLive(data.type);
      }
    };
    checkLive();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="relative aspect-video bg-slate-950 rounded-[3rem] overflow-hidden border-[10px] border-white shadow-2xl">
        
        {/* L'interface Zego s'injecte ici */}
        <div ref={containerRef} className="w-full h-full" style={{ height: '100%' }} />

        {!isLive && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-20">
             <Radio size={70} className="text-slate-700 animate-pulse mb-4" />
             <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
               {isAdmin ? "Prêt pour l'antenne" : "Salon en attente d'hôte"}
             </p>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-30">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        )}
      </div>

      {isAdmin && !isLive && (
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => joinLive('video')} 
            className="bg-slate-950 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl"
          >
            <Video size={18} /> Lancer le Direct Vidéo
          </button>
          <button 
            onClick={() => joinLive('audio')} 
            className="bg-white text-slate-900 border-2 border-slate-100 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 transition-all"
          >
            <Mic size={18} /> Salon Audio
          </button>
        </div>
      )}
    </div>
  );
}
