"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Upload, Loader2, Radio, Headphones, Lock, Sparkles, MessageSquare, Share2, Users } from 'lucide-react';
import { toast } from 'sonner';
import ContactModal from '@/components/ContactModal';

const AudioVisualizer = ({ isRecording }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-12 mb-4">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={`w-1.5 bg-rose-500 rounded-full transition-all duration-150 ${isRecording ? 'animate-bounce' : 'h-2'}`}
          style={{
            height: isRecording ? `${Math.random() * 100 + 20}%` : '8px',
            animationDelay: `${i * 0.05}s`,
            animationDuration: '0.5s'
          }}
        />
      ))}
    </div>
  );
};

export default function PodcastStudio({ currentUser }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [podcastTitle, setPodcastTitle] = useState("");
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [liveLink, setLiveLink] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);

  const hasAccess = !!currentUser;

  useEffect(() => {
    let interval;
    if (isRecording && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isRecording) {
      stopRecording();
    }
    return () => clearInterval(interval);
  }, [isRecording, timeLeft]);

  const startRecording = async () => {
    try {
      // 1. Capturer le Micro avec réduction de bruit native
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });

      // 2. Capturer le son du système (l'appel)
      // Note: L'utilisateur doit cocher "Partager l'audio du système" dans la popup du navigateur
      const systemStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" }, // Nécessaire pour déclencher la capture
        audio: true 
      });

      // 3. Mixer les pistes avec AudioContext
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const destination = audioCtxRef.current.createMediaStreamDestination();
      
      const micSource = audioCtxRef.current.createMediaStreamSource(micStream);
      const systemSource = audioCtxRef.current.createMediaStreamSource(systemStream);

      // Filtre passe-haut pour nettoyer les voix (enlever les grondements sourds)
      const filter = audioCtxRef.current.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 80;

      micSource.connect(filter).connect(destination);
      systemSource.connect(destination);

      const combinedStream = destination.stream;
      streamRef.current = combinedStream;

      mediaRecorderRef.current = new MediaRecorder(combinedStream);
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
      toast.success("Enregistrement (Micro + Appel) en cours...");
    } catch (err) {
      console.error(err);
      toast.error("Veuillez autoriser le micro et le partage audio système.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const createLiveSession = async () => {
    const roomId = crypto.randomUUID();
    const link = `${window.location.origin}/live/${roomId}`;
    setLiveLink(link);
    setIsLive(true);
    
    // Appel API pour initialiser la session WebRTC/Signaling
    await fetch('/api/live/session', {
      method: 'POST',
      body: JSON.stringify({ roomId, host: currentUser.name })
    });

    navigator.clipboard.writeText(link);
    toast.success("Lien de direct copié ! Partagez-le.");
  };

  const savePodcast = async () => {
    if (!podcastTitle.trim()) return toast.error("Titre requis.");
    setIsUploading(true);
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
      const formData = new FormData();
      formData.append('file', audioBlob, `podcast-${Date.now()}.mp3`);

      const uploadRes = await fetch('/api/podcasts/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();

      await fetch('/api/podcasts/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addPodcast',
          podcastData: {
            id: crypto.randomUUID(),
            title: podcastTitle,
            audioUrl: uploadData.url,
            hostName: currentUser?.penName || currentUser?.name,
            duration: formatTime(1800 - timeLeft),
            createdAt: new Date().toISOString()
          }
        })
      });

      toast.success("Podcast publié !");
      setAudioUrl(null);
      setPodcastTitle("");
    } catch (e) {
      toast.error("Échec de la publication");
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (!hasAccess) return <div className="p-10 text-center">Accès Refusé</div>;

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl border border-white/5">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-800'}`}>
            <Radio size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black italic tracking-tighter uppercase">Studio Live</h2>
            {isLive && <span className="text-[10px] bg-emerald-500 px-2 py-0.5 rounded-full text-black font-bold animate-pulse">EN DIRECT</span>}
          </div>
        </div>
        <div className="text-2xl font-mono font-bold text-rose-500">{formatTime(timeLeft)}</div>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-4 mb-4">
          {!isLive && (
            <button onClick={createLiveSession} className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold border border-white/10 hover:bg-slate-700">
              <Share2 size={14} /> Créer un lien Live
            </button>
          )}
        </div>

        {isRecording && <AudioVisualizer isRecording={isRecording} />}
        
        {!audioUrl ? (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-rose-600 scale-110 shadow-3xl shadow-rose-500/40' : 'bg-white text-slate-900'}`}
          >
            {isRecording ? <Square fill="currentColor" size={32} /> : <Mic size={32} />}
          </button>
        ) : (
          <div className="w-full space-y-4">
            <input 
              type="text"
              placeholder="Titre de l'épisode..."
              value={podcastTitle}
              onChange={(e) => setPodcastTitle(e.target.value)}
              className="w-full bg-slate-800 border border-white/5 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-rose-500 text-white outline-none"
            />
            <audio src={audioUrl} controls className="w-full" />
            <button onClick={savePodcast} disabled={isUploading} className="w-full py-5 bg-teal-500 text-slate-950 rounded-2xl font-black flex items-center justify-center gap-2">
              {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={18} />} PUBLIER
            </button>
          </div>
        )}
      </div>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} userEmail={currentUser?.email} userName={currentUser?.name} />
    </div>
  );
}
