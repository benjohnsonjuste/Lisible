"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Upload, Loader2, Users } from 'lucide-react';
import { Room, RoomEvent } from 'livekit-client'; 
import { toast } from 'sonner';

export default function PodcastStudio({ currentUser }) {
  // États classiques
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // États Live & WebRTC
  const [isLive, setIsLive] = useState(false);
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const currentUserEmail = currentUser?.email || null;
  const currentUserName = currentUser?.penName || currentUser?.name || "Invité";

  // Rejoindre automatiquement si l'URL contient une room (via lien direct par exemple)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam && !isLive && currentUserEmail) {
      joinLiveRoom(roomParam);
    }
  }, [currentUserEmail, isLive]);

  // --- LOGIQUE WEBRTC ---
  const joinLiveRoom = async (roomName) => {
    if (!currentUserEmail) return toast.error("Connectez-vous pour rejoindre le live");
    
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
      toast.success("Vous êtes en direct dans le studio !");
    } catch (e) {
      console.error(e);
      toast.error("Échec de la connexion au salon audio");
    }
  };

  const updateParticipants = () => {
    if (!room) return;
    setParticipants([room.localParticipant, ...Array.from(room.participants.values())]);
  };

  // --- LOGIQUE ENREGISTREMENT ---
  const startGlobalRecording = async () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx.createMediaStreamSource(localStream).connect(dest);

      if (room) {
        room.participants.forEach(p => {
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
      toast.success("Enregistrement master lancé");
    } catch (err) {
      toast.error("Erreur de capture audio globale");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const launchStudio = async () => {
    const roomId = `room-${currentUserEmail.replace(/[^a-zA-Z0-9]/g, '')}`;
    await joinLiveRoom(roomId);
  };

  const savePodcast = async () => {
    setIsUploading(true);
    const t = toast.loading("Publication...");
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
      const filename = `podcast-${Date.now()}.mp3`;
      const uploadRes = await fetch(`/api/podcasts/upload?filename=${filename}`, { method: 'POST', body: audioBlob });
      const blobData = await uploadRes.json();
      
      const registerRes = await fetch('/api/podcasts/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addPodcast',
          podcastData: {
            id: crypto.randomUUID(),
            title: `Session Live : ${currentUserName}`,
            audioUrl: blobData.url,
            hostName: currentUserName,
            hostEmail: currentUserEmail,
            createdAt: new Date().toISOString()
          }
        })
      });

      if (registerRes.ok) {
        toast.success("Publié !", { id: t });
        setAudioUrl(null);
        setIsLive(false);
      }
    } catch (e) { 
      toast.error("Erreur publication", { id: t }); 
    } finally { 
      setIsUploading(false); 
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl border border-white/5">
      {/* Visualisation Participants */}
      {isLive && (
        <div className="flex justify-center gap-4 mb-8">
          {participants.map((p, idx) => (
            <div key={idx} className="relative group">
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-indigo-400 animate-pulse">
                <Users size={20} />
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] bg-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap border border-white/10">
                {p.identity === currentUserEmail ? "Moi" : "Participant"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-6">
        {!isLive ? (
          <button 
            onClick={launchStudio}
            className="w-full py-4 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20"
          >
            Entrer dans le Studio
          </button>
        ) : (
          !audioUrl && (
            <div className="text-center">
              <button
                onClick={isRecording ? stopRecording : startGlobalRecording}
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-rose-600 animate-pulse scale-110 shadow-3xl shadow-rose-500/40' : 'bg-white text-slate-900 shadow-xl'}`}
              >
                {isRecording ? <Square fill="white" size={32} /> : <Mic size={32} />}
              </button>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {isRecording ? "Enregistrement en cours..." : "Cliquer pour enregistrer le Master"}
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
