"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Upload, Loader2, Radio } from 'lucide-react';
import { toast } from 'sonner';

// Composant interne pour les ondes de voix
const AudioVisualizer = ({ isRecording }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-12 mb-4">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={`w-1.5 bg-rose-500 rounded-full transition-all duration-150 ${
            isRecording ? 'animate-bounce' : 'h-2'
          }`}
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
  const [timeLeft, setTimeLeft] = useState(1800);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    let interval;
    if (isRecording && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isRecording) {
      stopRecording();
      toast.warning("Limite de 30 minutes atteinte !");
    }
    return () => clearInterval(interval);
  }, [isRecording, timeLeft]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
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
      toast.success("Enregistrement en cours...");
    } catch (err) {
      toast.error("Microphone inaccessible.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const savePodcast = async () => {
    setIsUploading(true);
    const t = toast.loading("Publication du podcast...");
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
      
      // 1. Préparation du FormData pour l'upload
      const formData = new FormData();
      formData.append('file', audioBlob, `podcast-${Date.now()}.mp3`);

      // 2. Envoi vers l'API d'upload (Vercel Blob)
      const uploadRes = await fetch('/api/podcasts/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error("Erreur lors de l'upload du fichier");
      const uploadData = await uploadRes.json();

      const hostName = currentUser?.penName || currentUser?.name || "Auteur";
      const hostEmail = currentUser?.email || "user@studio.local";
      
      // 3. Envoi vers l'API register pour mettre à jour le JSON sur GitHub
      const registerRes = await fetch('/api/podcasts/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addPodcast',
          podcastData: {
            id: crypto.randomUUID(),
            title: `Podcast de ${hostName}`,
            audioUrl: uploadData.url,
            hostName: hostName,
            hostEmail: hostEmail,
            duration: formatTime(1800 - timeLeft)
          }
        })
      });

      if (!registerRes.ok) throw new Error("Erreur lors de l'enregistrement GitHub");

      toast.success("Podcast publié !", { id: t });
      setAudioUrl(null);
      setTimeLeft(1800);
      
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Échec de la publication", { id: t });
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl border border-white/5">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-800'}`}>
            <Radio size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black italic tracking-tighter">Studio Podcast</h2>
            <p className="text-[10px] uppercase font-bold text-slate-400">Enregistrement Solo</p>
          </div>
        </div>
        <div className="text-2xl font-mono font-bold text-rose-500">{formatTime(timeLeft)}</div>
      </div>

      <div className="flex flex-col items-center gap-6">
        {isRecording && <AudioVisualizer isRecording={isRecording} />}
        
        {!audioUrl ? (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
              isRecording ? 'bg-rose-600 scale-110 shadow-3xl shadow-rose-500/40' : 'bg-white text-slate-900'
            }`}
          >
            {isRecording ? <Square fill="currentColor" size={32} /> : <Mic size={32} />}
          </button>
        ) : (
          <div className="w-full space-y-4">
            <audio src={audioUrl} controls className="w-full accent-rose-500" />
            <button
              onClick={savePodcast}
              disabled={isUploading}
              className="w-full py-4 bg-teal-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
              Publier le Podcast
            </button>
            <button 
              onClick={() => {setAudioUrl(null); setTimeLeft(1800);}}
              className="w-full text-[10px] uppercase font-bold text-slate-500 hover:text-white transition-colors"
            >
              Recommencer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
