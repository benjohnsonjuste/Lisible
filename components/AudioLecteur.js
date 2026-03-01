"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, User, UserCheck, Sparkles, Loader2, Headphones } from 'lucide-react';

export default function AudioLecteur({ titre, contenu, auteurNom }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voiceType, setVoiceType] = useState('female'); 
  const [status, setStatus] = useState("Prêt à l'écoute");
  const [progress, setProgress] = useState(0);
  
  const synth = useRef(null);
  const chunks = useRef([]);
  const currentChunkIndex = useRef(0);

  useEffect(() => {
    synth.current = window.speechSynthesis;
    const loadVoices = () => synth.current.getVoices();
    synth.current.onvoiceschanged = loadVoices;
    loadVoices();
    return () => synth.current.cancel();
  }, []);

  const chunkText = (text) => text.match(/[^\.!\?]+[\.!\?]+/g) || [text];

  const getVoice = (type) => {
    const voices = synth.current.getVoices().filter(v => v.lang.startsWith('fr'));
    const search = type === 'male' ? ['Thomas', 'Paul', 'Daniel'] : ['Amélie', 'Marie', 'Alice'];
    return voices.find(v => search.some(s => v.name.includes(s))) || voices[0];
  };

  const playNextChunk = (tone) => {
    if (currentChunkIndex.current >= chunks.current.length) {
      setIsPlaying(false);
      setStatus("Lecture terminée");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks.current[currentChunkIndex.current]);
    utterance.voice = getVoice(voiceType);
    utterance.pitch = tone.pitch;
    utterance.rate = tone.rate;

    utterance.onstart = () => {
       setStatus(`Lecture : ${currentChunkIndex.current + 1}/${chunks.current.length}`);
    };

    utterance.onend = () => {
      currentChunkIndex.current++;
      setProgress((currentChunkIndex.current / chunks.current.length) * 100);
      playNextChunk(tone);
    };

    synth.current.speak(utterance);
  };

  const handleStart = async () => {
    if (synth.current.paused) {
      synth.current.resume();
      setIsPlaying(true);
      return;
    }

    setLoading(true);
    synth.current.cancel();

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: contenu, title: titre, userName: auteurNom })
      });
      const data = await res.json();

      // ÉTAPE 1 : LE JINGLE (Publicité/Intro)
      const intro = new SpeechSynthesisUtterance(data.jingle);
      intro.voice = getVoice(voiceType);
      intro.pitch = 1.1; // Ton un peu plus haut pour l'annonce
      intro.rate = 1.0;

      intro.onstart = () => setStatus("Introduction...");
      intro.onend = () => {
        // ÉTAPE 2 : LE CORPS DU TEXTE (Après le jingle)
        chunks.current = chunkText(contenu);
        currentChunkIndex.current = 0;
        playNextChunk(data.tone);
      };

      synth.current.speak(intro);
      setIsPlaying(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111] text-white p-8 rounded-[2rem] border-b-4 border-teal-500 shadow-2xl mb-12 relative overflow-hidden font-sans">
      
      {/* Waveform Design (Visual Only) */}
      <div className="flex items-end gap-1 h-12 mb-6 opacity-30">
        {[...Array(30)].map((_, i) => (
          <div key={i} className={`flex-1 bg-teal-500 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : 'h-2'}`} 
               style={{ height: isPlaying ? `${Math.random() * 100}%` : '10%' }} />
        ))}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <div className="relative">
              <div className={`w-20 h-20 rounded-full border-2 border-teal-500/30 flex items-center justify-center ${isPlaying ? 'rotate-180 duration-[5000ms] transition-transform' : ''}`}>
                <Headphones size={32} className="text-teal-500" />
              </div>
              {isPlaying && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500"></span></span>}
           </div>
           <div>
             <h3 className="text-2xl font-black italic tracking-tighter leading-none">{titre}</h3>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{status}</p>
           </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
           <button onClick={() => setVoiceType('female')} className={`p-3 rounded-lg transition-all ${voiceType === 'female' ? 'bg-teal-500 text-white' : 'text-slate-500'}`}><User size={18} /></button>
           <button onClick={() => setVoiceType('male')} className={`p-3 rounded-lg transition-all ${voiceType === 'male' ? 'bg-teal-500 text-white' : 'text-slate-500'}`}><UserCheck size={18} /></button>
        </div>
      </div>

      {/* Barre de Progression */}
      <div className="mt-8 relative h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="absolute h-full bg-teal-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-8 flex gap-4">
        <button onClick={isPlaying ? () => { synth.current.pause(); setIsPlaying(false); } : handleStart}
                className="flex-[3] h-16 bg-white text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
          {loading ? <Loader2 className="animate-spin" /> : isPlaying ? <Pause fill="black" /> : <Play fill="black" />}
          {isPlaying ? "Pause" : "Écouter l'œuvre"}
        </button>
        <button onClick={() => { synth.current.cancel(); setIsPlaying(false); setProgress(0); }}
                className="flex-1 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-600 transition-all"><Square size={20} fill="currentColor" /></button>
      </div>
    </div>
  );
}
