"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Upload, Loader2, Radio, Headphones, Lock, Award, Sparkles, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import ContactModal from '@/components/ContactModal';

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
  const [podcastTitle, setPodcastTitle] = useState("");
  const [isContactOpen, setIsContactOpen] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // L'accès est autorisé si un utilisateur est connecté
  const hasAccess = !!currentUser;

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
    if (!podcastTitle.trim()) {
      toast.error("Veuillez donner un titre à votre épisode.");
      return;
    }

    setIsUploading(true);
    const t = toast.loading("Publication du podcast...");
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
      
      const formData = new FormData();
      formData.append('file', audioBlob, `podcast-${Date.now()}.mp3`);

      const uploadRes = await fetch('/api/podcasts/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error("Erreur lors de l'upload du fichier");
      const uploadData = await uploadRes.json();

      const hostName = currentUser?.penName || currentUser?.name || "Auteur";
      const hostEmail = currentUser?.email || "user@studio.local";
      
      const registerRes = await fetch('/api/podcasts/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addPodcast',
          podcastData: {
            id: crypto.randomUUID(),
            title: podcastTitle,
            audioUrl: uploadData.url,
            hostName: hostName,
            hostEmail: hostEmail,
            duration: formatTime(1800 - timeLeft),
            createdAt: new Date().toISOString(),
            views: 0
          }
        })
      });

      if (!registerRes.ok) throw new Error("Erreur lors de l'enregistrement GitHub");

      toast.success("Podcast publié !", { id: t });
      setAudioUrl(null);
      setPodcastTitle("");
      setTimeLeft(1800);
      
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Échec de la publication", { id: t });
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Rendu de l'état "Accès Refusé" (Uniquement si non connecté)
  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-100 rounded-[3rem] p-12 shadow-xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50" />
        <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-amber-100">
          <Lock size={32} className="text-amber-600" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles size={16} className="text-amber-500" />
          <h2 className="text-2xl font-black italic tracking-tighter text-slate-900 uppercase">
            Accès Réservé.
          </h2>
          <Sparkles size={16} className="text-amber-500" />
        </div>
        <p className="text-slate-500 text-sm leading-relaxed font-serif italic max-w-sm mx-auto mb-8">
          "Veuillez vous connecter pour accéder au Studio Podcast et commencer votre transmission littéraire."
        </p>
        
        <button 
          onClick={() => setIsContactOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-rose-600 transition-colors shadow-lg"
        >
          <MessageSquare size={14} /> Contacter le Staff
        </button>

        <ContactModal 
          isOpen={isContactOpen} 
          onClose={() => setIsContactOpen(false)} 
          userEmail={currentUser?.email} 
          userName={currentUser?.penName || currentUser?.name} 
        />
      </div>
    );
  }

  // Rendu normal du Studio
  return (
    <div className="max-w-2xl mx-auto bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl border border-white/5">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-800'}`}>
            <Radio size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black italic tracking-tighter uppercase text-white">Studio Podcast</h2>
            <p className="text-[10px] uppercase font-bold text-slate-400">Session Membre • En Direct</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsContactOpen(true)}
            className="p-2 text-slate-500 hover:text-white transition-colors"
            title="Aide technique"
          >
            <MessageSquare size={20} />
          </button>
          <div className="text-2xl font-mono font-bold text-rose-500">{formatTime(timeLeft)}</div>
        </div>
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
          <div className="w-full space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-2">
                Titre de l'épisode
              </label>
              <input 
                type="text"
                placeholder="Ex: Ma première transmission..."
                value={podcastTitle}
                onChange={(e) => setPodcastTitle(e.target.value)}
                className="w-full bg-slate-800 border border-white/5 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-bold text-lg text-white"
              />
            </div>

            <audio src={audioUrl} controls className="w-full accent-rose-500" />
            
            <button
              onClick={savePodcast}
              disabled={isUploading}
              className="w-full py-5 bg-teal-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20"
            >
              {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
              Publier le Podcast
            </button>
            
            <button 
              onClick={() => {setAudioUrl(null); setTimeLeft(1800); setPodcastTitle("");}}
              className="w-full text-[10px] uppercase font-bold text-slate-500 hover:text-white transition-colors"
            >
              Recommencer
            </button>
          </div>
        )}
      </div>

      <ContactModal 
        isOpen={isContactOpen} 
        onClose={() => setIsContactOpen(false)} 
        userEmail={currentUser?.email} 
        userName={currentUser?.penName || currentUser?.name} 
      />
    </div>
  );
}
