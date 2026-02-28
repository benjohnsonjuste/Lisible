"use client";
import React, { useEffect, useState, useRef } from "react";
import { Video, Mic, Radio, X, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

export default function LiveSystem({ currentUser, isAdmin }) {
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const zpRef = useRef(null);

  // --- CONFIGURATION ZEGO CLOUD ---
  const appID = 1044014775; 
  const serverSecret = "d687153d18038e439905239e6889bace"; 
  const serverUrl = "wss://webliveroom1044014775-api.coolzcloud.com/ws";

  const joinLive = async (type = 'video') => {
    setLoading(true);
    try {
      const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');

      const roomID = "Lisible_Elite_Club";
      // Nettoyage de l'ID pour éviter les erreurs sur mobile (caractères spéciaux)
      const userID = (currentUser?.email || `guest_${Math.floor(Math.random() * 10000)}`).replace(/[^a-zA-Z0-9]/g, '_');
      const userName = currentUser?.name || currentUser?.penName || "Membre Lisible";

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, 
        serverSecret, 
        roomID, 
        userID, 
        userName
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zpRef.current = zp;

      zp.joinRoom({
        container: containerRef.current,
        server: serverUrl, // Configuration du serveur WebSocket spécifique
        turnOnCameraWhenJoining: isAdmin && type === 'video',
        turnOnMicrophoneWhenJoining: isAdmin,
        showMyCameraToggleButton: isAdmin,
        showMyMicrophoneToggleButton: isAdmin,
        showAudioVideoSettingsButton: isAdmin,
        showScreenSharingButton: isAdmin,
        showTextChat: true,
        showUserList: true,
        scenario: {
          mode: ZegoUIKitPrebuilt.Scenario.LiveStreaming,
          config: { 
            role: isAdmin ? ZegoUIKitPrebuilt.Host : ZegoUIKitPrebuilt.Audience 
          },
        },
        layout: "Grid",
        onLeaveRoom: () => {
          setIsLive(false);
          if (isAdmin) updateLiveStatus(false);
        }
      });

      if (isAdmin) await updateLiveStatus(true, type);
      setIsLive(true);
      toast.success(isAdmin ? "Direct lancé avec succès !" : "Vous avez rejoint le club.");
    } catch (err) {
      console.error(err);
      toast.error("Erreur de connexion au flux.");
    } finally {
      setLoading(false);
    }
  };

  const updateLiveStatus = async (active, type = 'video') => {
    try {
      await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: active ? "start" : "stop", 
          admin: currentUser?.email,
          type,
          title: `Session Live de ${currentUser?.name || 'Admin'}`
        })
      });
    } catch (e) { console.error("Erreur mise à jour API"); }
  };

  useEffect(() => {
    const checkLive = async () => {
      const res = await fetch("/api/live");
      const data = await res.json();
      if (data.isActive && !isLive && !isAdmin) {
        joinLive(data.type);
      }
    };
    checkLive();
    const interval = setInterval(checkLive, 10000);
    return () => clearInterval(interval);
  }, [isLive, isAdmin]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="relative aspect-video bg-slate-950 rounded-[3.5rem] overflow-hidden border-[12px] border-white shadow-2xl transition-all duration-700">
        
        <div ref={containerRef} className="w-full h-full z-10" />

        {!isLive && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 z-20">
             <div className="p-10 bg-slate-800/50 rounded-full mb-6 border border-slate-700">
                <Radio size={80} className="text-teal-500 animate-pulse" />
             </div>
             <h2 className="text-xl font-black italic text-slate-400 uppercase tracking-[0.3em]">
                {isAdmin ? "Studio Lisible Prêt" : "Le Club est en attente"}
             </h2>
             <p className="text-slate-600 text-[10px] mt-4 font-bold uppercase tracking-widest">Flux sécurisé : {serverUrl.split('/')[2]}</p>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-30">
            <Loader2 className="animate-spin text-teal-500" size={48} />
          </div>
        )}
      </div>

      {isAdmin && !isLive && (
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
            <Shield className="text-teal-600" size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mode Administrateur</span>
          </div>
          
          <div className="flex gap-4">
            <button 
                onClick={() => joinLive('video')} 
                className="bg-slate-950 text-white px-12 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-teal-600 hover:scale-105 transition-all shadow-xl"
            >
                <Video size={18} /> Lancer le Direct
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
