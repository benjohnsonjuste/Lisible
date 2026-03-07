"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Upload, Loader2, Radio, UserPlus, X, Users, Signal, MicOff, DoorOpen, Share2 } from 'lucide-react';
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
  const [currentRoomId, setCurrentRoomId] = useState(null);

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
      setCurrentRoomId(roomParam);
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
      roomInstance.on(RoomEvent.TrackSubscribed, updateParticipants);
      
      updateParticipants();
      setIsLive(true);

      // LANCEMENT AUTOMATIQUE DE L'ENREGISTREMENT (Hôte & Invités)
      setTimeout(() => startGlobalRecording(roomInstance), 1500);
      
      toast.success("Studio Live Connecté - Enregistrement démarré");
    } catch (e) { toast.error("Erreur WebRTC"); }
  };

  const updateParticipants = () => {
    if (!room) return;
    setParticipants([room.localParticipant, ...Array.from(room.participants.values())]);
  };

  const startGlobalRecording = async (activeRoom = room) => {
    if (isRecording) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx.createMediaStreamSource(localStream).connect(dest);

      if (activeRoom) {
        activeRoom.participants.forEach(p => {
          p.audioTracks.forEach(t => {
            if (t.track?.mediaStream) {
              audioCtx.createMediaStreamSource(t.track.mediaStream).connect(dest);
            }
          });
        });
      }

      mediaRecorderRef.current = new MediaRecorder(dest.stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
        setAudioUrl(URL.createObjectURL(audioBlob));
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      toast.error("Erreur de capture audio");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Session terminée");
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/studio?room=${currentRoomId}`;
    if (navigator.share) {
      navigator.share({
        title: 'Studio Podcast Lisible',
        text: `${currentUserName} vous invite à un enregistrement en direct !`,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Lien de partage copié !");
    }
  };

  const launchStudioAndNotify = async () => {
    if (invitedUsers.length === 0) return toast.error("Sélectionnez des invités");
    const roomId = `podcast-${Math.random().toString(36).substring(7)}`;
    setCurrentRoomId(roomId);
    const t = toast.loading("Notification des invités...");

    try {
      const notificationPromises = invitedUsers.map(user => 
        fetch('/api/github-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'push_notification',
            userEmail: user.email,
            notification: {
              id: crypto.randomUUID(),
              fromName: currentUserName,
              fromEmail: currentUserEmail,
              type: 'PODCAST_INVITATION',
              title: '🎙️ LIVE : Invitation Studio',
              message: `${currentUserName} vous invite à rejoindre son podcast en direct maintenant.`,
              link: `${window.location.origin}/studio?room=${roomId}`,
              read: false,
              createdAt: new Date().toISOString()
            }
          })
        })
      );
      await Promise.all(notificationPromises);
      await joinLiveRoom(roomId);
      toast.success("Studio lancé pour tous !", { id: t });
    } catch (e) { toast.error("Échec du lancement", { id: t }); }
  };

  const savePodcast = async () => {
    setIsUploading(true);
    const t = toast.loading("Publication...");
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
      const filename = `podcast-${Date.now()}.mp3`;
      const uploadRes = await fetch(`/api/podcasts/upload?filename=${filename}`, { method: 'POST', body: audioBlob });
      const blobData = await uploadRes.json();

      await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_podcast',
          podcastData: {
            id: crypto.randomUUID(),
            title: `Session Live : ${currentUserName}`,
            audioUrl: blobData.url,
            hostName: currentUserName,
            hostEmail: currentUserEmail,
            guests: invitedUsers.map(u => u.name),
            createdAt: new Date().toISOString()
          }
        })
      });
      toast.success("Podcast publié !", { id: t });
      setAudioUrl(null);
      setIsLive(false);
    } catch (e) { toast.error("Erreur publication", { id: t }); }
    finally { setIsUploading(false); }
  };

  const toggleInvite = (user) => {
    invitedUsers.find(u => u.email === user.email) 
      ? setInvitedUsers(invitedUsers.filter(u => u.email !== user.email))
      : setInvitedUsers([...invitedUsers, user]);
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl border border-white/5">
      {isLive && (
        <div className="flex flex-col items-center mb-8 gap-4">
          <div className="flex justify-center gap-4">
            {participants.map((p, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 p-0.5 animate-pulse">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                     <Users size={20} className="text-rose-500" />
                  </div>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-400">
                  {p.identity === currentUserEmail ? "Hôte" : "Invité"}
                </span>
              </div>
            ))}
          </div>
          <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10">
            <Share2 size={12} /> Partager l'accès direct
          </button>
        </div>
      )}

      <div className="flex flex-col items-center gap-8">
        {!isLive ? (
          <div className="w-full space-y-6">
            <button onClick={() => setShowInviteList(!showInviteList)} className="w-full flex items-center justify-center gap-2 py-4 bg-slate-800 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all">
              <UserPlus size={16} /> {showInviteList ? "Masquer la liste" : "Choisir des invités"}
            </button>

            {showInviteList && (
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {availableUsers.map(user => (
                  <div key={user.email} onClick={() => toggleInvite(user)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${invitedUsers.find(u => u.email === user.email) ? 'bg-indigo-600' : 'bg-slate-800/50 hover:bg-slate-800'}`}>
                    <span className="text-xs font-bold">{user.name}</span>
                    {invitedUsers.find(u => u.email === user.email) && <X size={14} />}
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={launchStudioAndNotify}
              disabled={invitedUsers.length === 0}
              className="w-full py-5 bg-rose-600 rounded-3xl font-black uppercase tracking-widest hover:bg-rose-500 shadow-lg shadow-rose-500/20 transition-all"
            >
              Lancer le Studio Interactif
            </button>
          </div>
        ) : (
          !audioUrl && (
            <div className="text-center">
              <button
                onClick={stopRecording}
                className="w-32 h-32 rounded-full flex items-center justify-center transition-all bg-rose-600 animate-pulse scale-110 shadow-3xl shadow-rose-500/40"
              >
                <Square fill="white" size={32} />
              </button>
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                Studio en cours d'enregistrement...
              </p>
            </div>
          )
        )}
        
        {audioUrl && (
          <div className="w-full space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-800 p-6 rounded-3xl border border-white/5">
              <audio src={audioUrl} controls className="w-full accent-rose-500" />
            </div>
            <button onClick={savePodcast} disabled={isUploading} className="w-full py-5 bg-teal-500 text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
              Publier l'enregistrement
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
