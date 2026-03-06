"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Upload, Loader2, UserPlus, X, Users } from 'lucide-react';
import { Room, RoomEvent, createLocalAudioTrack } from 'livekit-client'; 
import { toast } from 'sonner';

export default function PodcastStudio({ currentUser }) {
  const [isRecording, setIsRecording] = useState(false);
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
  // On utilise une ref pour l'AudioContext afin d'éviter les multiples instances
  const audioCtxRef = useRef(null);

  const currentUserEmail = currentUser?.email || null;
  const currentUserName = currentUser?.penName || currentUser?.name || "Invité";

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const res = await fetch('/api/github-db?type=publications');
        if (res.ok) {
          const data = await res.json();
          const authors = data.content.reduce((acc, curr) => {
            if (curr && curr.authorEmail && !acc.find(a => a.email === curr.authorEmail) && curr.authorEmail !== currentUserEmail) {
              acc.push({ name: curr.author || "Auteur inconnu", email: curr.authorEmail });
            }
            return acc;
          }, []);
          setAvailableUsers(authors);
        }
      } catch (e) { console.error("Erreur auteurs:", e); }
    };
    fetchAuthors();
  }, [currentUserEmail]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam && !isLive && currentUserEmail) {
      joinLiveRoom(roomParam);
    }
  }, [currentUserEmail, isLive]);

  const joinLiveRoom = async (roomName) => {
    if (!currentUserEmail) return toast.error("Connectez-vous pour rejoindre le live");
    
    const roomInstance = new Room();
    setRoom(roomInstance);

    try {
      const resp = await fetch(`/api/livekit/token?room=${roomName}&identity=${currentUserEmail}`);
      const { token } = await resp.json();

      await roomInstance.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL, token);
      
      // On crée et publie la piste audio
      const localTrack = await createLocalAudioTrack();
      await roomInstance.localParticipant.publishTrack(localTrack);

      roomInstance.on(RoomEvent.ParticipantConnected, updateParticipants);
      roomInstance.on(RoomEvent.ParticipantDisconnected, updateParticipants);
      roomInstance.on(RoomEvent.TrackSubscribed, updateParticipants);
      
      updateParticipants();
      setIsLive(true);
      
      // LANCEMENT DE L'ENREGISTREMENT EN UTILISANT LA PISTE EXISTANTE
      startGlobalRecording(roomInstance, localTrack);
      
      toast.success("Studio rejoint. Enregistrement en cours...");
    } catch (e) {
      console.error(e);
      toast.error("Échec de la connexion");
    }
  };

  const updateParticipants = () => {
    if (!room) return;
    setParticipants([room.localParticipant, ...Array.from(room.participants.values())]);
  };

  const startGlobalRecording = async (activeRoom, localTrack) => {
    try {
      // 1. Initialiser l'AudioContext (doit être fait suite à une interaction)
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const dest = audioCtx.createMediaStreamDestination();
      
      // 2. Utiliser le flux de LiveKit plutôt que de refaire un getUserMedia
      const localStream = new MediaStream([localTrack.mediaStreamTrack]);
      audioCtx.createMediaStreamSource(localStream).connect(dest);

      // 3. Connecter les flux des autres participants
      activeRoom.participants.forEach(p => {
        p.audioTracks.forEach(t => {
          if (t.track?.mediaStream) {
            audioCtx.createMediaStreamSource(t.track.mediaStream).connect(dest);
          }
        });
      });

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
      console.error("Capture Error:", err);
      toast.error("Erreur de routage audio");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (audioCtxRef.current) audioCtxRef.current.close();
      toast.success("Enregistrement terminé");
    }
  };

  const launchStudioAndNotify = async () => {
    if (invitedUsers.length === 0) return toast.error("Invitez au moins un membre");
    const roomId = `room-${currentUserEmail.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
    const t = toast.loading("Lancement du studio...");

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
              title: '🎙️ Studio Interactif',
              message: `${currentUserName} lance un enregistrement live.`,
              link: `${window.location.origin}/studio?room=${roomId}`,
              read: false,
              createdAt: new Date().toISOString()
            }
          })
        })
      );

      await Promise.all(notificationPromises);
      await joinLiveRoom(roomId);
      toast.success("Studio lancé !", { id: t });
      setShowInviteList(false);
    } catch (e) {
      toast.error("Erreur de lancement", { id: t });
    }
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
            title: `Session Studio : ${currentUserName}`,
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
        <div className="flex justify-center gap-4 mb-8">
          {participants.map((p, idx) => (
            <div key={idx} className="relative group">
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-indigo-400 animate-pulse">
                <Users size={20} />
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] bg-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                {p.identity === currentUserEmail ? "Moi" : "Invité"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-6">
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

            <button onClick={launchStudioAndNotify} disabled={invitedUsers.length === 0} className="w-full py-4 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 disabled:opacity-30">
              LANCER LE STUDIO INTERACTIF
            </button>
          </div>
        ) : (
          !audioUrl && (
            <div className="text-center">
              <button onClick={stopRecording} className="w-32 h-32 rounded-full flex items-center justify-center transition-all bg-rose-600 animate-pulse scale-110 shadow-3xl shadow-rose-500/40">
                <Square fill="white" size={32} />
              </button>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                STUDIO EN COURS D'ENREGISTREMENT
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
              Publier le Podcast
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
