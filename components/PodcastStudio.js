"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Upload, Loader2, Radio, UserPlus, X, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function PodcastStudio({ currentUser }) {
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // États pour les invitations
  const [availableUsers, setAvailableUsers] = useState([]);
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [showInviteList, setShowInviteList] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Charger les utilisateurs via l'index des publications
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const res = await fetch('/api/github-db?type=publications');
        if (res.ok) {
          const data = await res.json();
          // Extraire les auteurs uniques (nom + email)
          const authors = data.content.reduce((acc, curr) => {
            if (!acc.find(a => a.email === curr.authorEmail) && curr.authorEmail !== currentUser.email) {
              acc.push({ name: curr.author, email: curr.authorEmail });
            }
            return acc;
          }, []);
          setAvailableUsers(authors);
        }
      } catch (e) {
        console.error("Erreur auteurs:", e);
      }
    };
    fetchAuthors();
  }, [currentUser.email]);

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

  const toggleInvite = (user) => {
    if (invitedUsers.find(u => u.email === user.email)) {
      setInvitedUsers(invitedUsers.filter(u => u.email !== user.email));
    } else {
      setInvitedUsers([...invitedUsers, user]);
    }
  };

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
      setShowInviteList(false);
      toast.success("Enregistrement en cours avec vos invités...");
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
      const filename = `podcast-${Date.now()}.mp3`;

      const uploadRes = await fetch(`/api/podcasts/upload?filename=${filename}`, {
        method: 'POST',
        body: audioBlob
      });

      if (!uploadRes.ok) throw new Error("Erreur upload");
      const blobData = await uploadRes.json();

      const registerRes = await fetch('/api/podcasts/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addPodcast',
          podcastData: {
            id: crypto.randomUUID(),
            title: `Discussion : ${currentUser.penName || currentUser.name} & ses invités`,
            audioUrl: blobData.url,
            hostName: currentUser.penName || currentUser.name,
            hostEmail: currentUser.email,
            guests: invitedUsers, // Liste des invités enregistrée
            duration: formatTime(1800 - timeLeft),
            createdAt: new Date().toISOString()
          }
        })
      });

      if (registerRes.ok) {
        toast.success("Podcast publié !", { id: t });
        setAudioUrl(null);
        setInvitedUsers([]);
        setTimeLeft(1800);
      }
    } catch (e) {
      toast.error("Échec de la publication", { id: t });
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-800'}`}>
            <Radio size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black italic tracking-tighter">Studio Podcast</h2>
            <p className="text-[10px] uppercase font-bold text-slate-400">{invitedUsers.length} Invité(s)</p>
          </div>
        </div>
        <div className="text-2xl font-mono font-bold text-rose-500">{formatTime(timeLeft)}</div>
      </div>

      {/* Zone Invitation (uniquement si pas d'audio enregistré) */}
      {!audioUrl && !isRecording && (
        <div className="mb-8">
          <button 
            onClick={() => setShowInviteList(!showInviteList)}
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest bg-slate-800 px-4 py-2 rounded-xl hover:bg-slate-700 transition-all"
          >
            <UserPlus size={14} /> {showInviteList ? "Fermer la liste" : "Inviter des membres"}
          </button>

          {showInviteList && (
            <div className="mt-4 grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {availableUsers.map(user => (
                <div 
                  key={user.email} 
                  onClick={() => toggleInvite(user)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                    invitedUsers.find(u => u.email === user.email) ? 'bg-indigo-600' : 'bg-slate-800/50 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xs font-bold">{user.name}</span>
                  {invitedUsers.find(u => u.email === user.email) && <X size={14} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Liste des invités actifs */}
      {invitedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {invitedUsers.map(u => (
            <span key={u.email} className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded-full border border-indigo-500/30 flex items-center gap-1">
              <Users size={10} /> {u.name}
            </span>
          ))}
        </div>
      )}

      {/* Contrôles */}
      <div className="flex flex-col items-center gap-6">
        {!audioUrl ? (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
              isRecording ? 'bg-rose-600 scale-110 shadow-3xl shadow-rose-500/40' : 'bg-white text-slate-900'
            }`}
          >
            {isRecording ? <Square fill="white" size={32} /> : <Mic size={32} />}
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
          </div>
        )}
      </div>
    </div>
  );
}
