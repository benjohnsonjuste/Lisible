"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Upload, Loader2, Radio, UserPlus, X, Users, Signal, MicOff, DoorOpen } from 'lucide-react';
import { Room, RoomEvent } from 'livekit-client'; 
import { toast } from 'sonner';

export default function PodcastStudio({ currentUser }) {
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [showInviteList, setShowInviteList] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const currentUserEmail = currentUser?.email || null;
  const currentUserName = currentUser?.penName || currentUser?.name || "Invité";

  // Charger les auteurs
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const res = await fetch('/api/github-db?type=publications');
        if (res.ok) {
          const data = await res.json();
          const authors = data.content.reduce((acc, curr) => {
            if (curr?.authorEmail && !acc.find(a => a.email === curr.authorEmail) && curr.authorEmail !== currentUserEmail) {
              acc.push({ name: curr.author || "Auteur inconnu", email: curr.authorEmail });
            }
            return acc;
          }, []);
          setAvailableUsers(authors);
        }
      } catch (e) { console.error(e); }
    };
    fetchAuthors();
  }, [currentUserEmail]);

  // Détection automatique d'invitation dans l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam && !isLive && currentUserEmail) {
      toast.info("Reconnexion au salon en cours...");
      joinLiveRoom(roomParam);
    }
  }, [currentUserEmail]);

  const joinLiveRoom = async (roomName) => {
    if (!currentUserEmail) return toast.error("Connexion requise");
    const roomInstance = new Room();
    setRoom(roomInstance);
    try {
      const resp = await fetch(`/api/livekit/token?room=${roomName}&identity=${currentUserEmail}`);
      const { token } = await resp.json();
      await roomInstance.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL, token);
      await roomInstance.localParticipant.setMicrophoneEnabled(true);
      roomInstance.on(RoomEvent.ParticipantConnected, updateParticipants);
      roomInstance.on(RoomEvent.ParticipantDisconnected, updateParticipants);
      updateParticipants();
      setIsLive(true);
      toast.success("Studio Live Connecté");
    } catch (e) { toast.error("Erreur WebRTC"); }
  };

  const updateParticipants = () => {
    if (!room) return;
    setParticipants([room.localParticipant, ...Array.from(room.participants.values())]);
  };

  const launchStudioAndNotify = async () => {
    if (invitedUsers.length === 0) return toast.error("Sélectionnez des invités");
    const roomId = `podcast-${Math.random().toString(36).substring(7)}`;
    const t = toast.loading("Notification des invités...");

    try {
      const notificationPromises = invitedUsers.map(user => 
        fetch('/api/github-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'notifications',
            action: 'add',
            data: {
              id: crypto.randomUUID(),
              toEmail: user.email,
              fromName: currentUserName,
              type: 'PODCAST_INVITATION', // Type crucial pour le Dashboard
              title: '🎙️ LIVE : Invitation Studio',
              message: `${currentUserName} vous invite à rejoindre son podcast en direct maintenant.`,
              link: `${window.location.origin}/studio?room=${roomId}`,
              status: 'active',
              createdAt: new Date().toISOString()
            }
          })
        })
      );
      await Promise.all(notificationPromises);
      await joinLiveRoom(roomId);
      toast.success("Studio ouvert et invitations envoyées !", { id: t });
    } catch (e) { toast.error("Échec du lancement", { id: t }); }
  };

  // ... (Garder startGlobalRecording, stopRecording et savePodcast à l'identique)

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl border border-white/5">
      {/* Participants Header */}
      {isLive && (
        <div className="flex justify-center gap-4 mb-8">
          {participants.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 p-0.5">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                   <Users size={20} className={p.isSpeaking ? "text-rose-500" : "text-slate-400"} />
                </div>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-400">
                {p.identity === currentUserEmail ? "Moi (Hôte)" : "Invité"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Reste de l'UI avec le bouton launchStudioAndNotify */}
      <div className="flex flex-col items-center gap-8">
        {!isLive ? (
          <div className="w-full space-y-4">
             {/* Liste d'invitation existante... */}
             <button 
              onClick={launchStudioAndNotify}
              disabled={invitedUsers.length === 0}
              className="w-full py-5 bg-rose-600 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-500 shadow-lg shadow-rose-500/20 transition-all"
            >
              Lancer l'enregistrement Live
            </button>
          </div>
        ) : (
          /* Contrôles d'enregistrement Master */
          <div className="text-center">
             <button
                onClick={isRecording ? stopRecording : startGlobalRecording}
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-rose-600 animate-pulse' : 'bg-white text-slate-900'}`}
              >
                {isRecording ? <Square size={32} /> : <Mic size={32} />}
              </button>
          </div>
        )}
      </div>
    </div>
  );
}
