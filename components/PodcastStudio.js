"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Upload, Loader2, UserPlus, X, Users, Share2, LogOut, CheckCircle2 } from 'lucide-react';
import { Room, RoomEvent, createLocalAudioTrack } from 'livekit-client'; 
import { toast } from 'sonner';

// --- COMPOSANT VISUALISEUR ---
const AudioVisualizer = ({ stream }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!stream) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `rgba(244, 63, 94, ${dataArray[i] / 255 + 0.2})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
      requestAnimationFrame(draw);
    };
    draw();
    return () => audioCtx.close();
  }, [stream]);
  return <canvas ref={canvasRef} width={200} height={40} className="rounded-lg opacity-80" />;
};

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
  const [recordingStream, setRecordingStream] = useState(null);
  const [publishedUrl, setPublishedUrl] = useState(null); // Nouveau : Lien final

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
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
      } catch (e) { console.error(e); }
    };
    fetchAuthors();
  }, [currentUserEmail]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam && !isLive && currentUserEmail) joinLiveRoom(roomParam);
  }, [currentUserEmail, isLive]);

  const joinLiveRoom = async (roomName) => {
    if (!currentUserEmail) return toast.error("Connectez-vous");
    const roomInstance = new Room();
    setRoom(roomInstance);
    try {
      const resp = await fetch(`/api/livekit/token?room=${roomName}&identity=${currentUserEmail}`);
      const { token } = await resp.json();
      await roomInstance.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL, token);
      const localTrack = await createLocalAudioTrack();
      await roomInstance.localParticipant.publishTrack(localTrack);
      roomInstance.on(RoomEvent.ParticipantConnected, updateParticipants);
      roomInstance.on(RoomEvent.ParticipantDisconnected, updateParticipants);
      roomInstance.on(RoomEvent.TrackSubscribed, updateParticipants);
      updateParticipants();
      setIsLive(true);
      startGlobalRecording(roomInstance, localTrack);
    } catch (e) { toast.error("Erreur connexion"); }
  };

  const updateParticipants = () => {
    if (!room) return;
    setParticipants([room.localParticipant, ...Array.from(room.participants.values())]);
  };

  const startGlobalRecording = async (activeRoom, localTrack) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const dest = audioCtx.createMediaStreamDestination();
      const localStream = new MediaStream([localTrack.mediaStreamTrack]);
      audioCtx.createMediaStreamSource(localStream).connect(dest);
      activeRoom.participants.forEach(p => {
        p.audioTracks.forEach(t => {
          if (t.track?.mediaStream) audioCtx.createMediaStreamSource(t.track.mediaStream).connect(dest);
        });
      });
      setRecordingStream(dest.stream);
      mediaRecorderRef.current = new MediaRecorder(dest.stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
        setAudioUrl(URL.createObjectURL(audioBlob));
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) { toast.error("Erreur audio"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (audioCtxRef.current) audioCtxRef.current.close();
      setRecordingStream(null);
    }
  };

  const leaveStudio = () => {
    if (room) room.disconnect();
    setIsLive(false);
    setAudioUrl(null);
    setPublishedUrl(null);
    window.history.pushState({}, '', window.location.pathname);
    toast.info("Studio quitté");
  };

  const launchStudioAndNotify = async () => {
    if (invitedUsers.length === 0) return toast.error("Invitez au moins un membre");
    const roomId = `room-${currentUserEmail.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
    const t = toast.loading("Lancement...");
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
              type: 'PODCAST_INVITATION',
              title: '🎙️ Studio Live',
              message: `${currentUserName} vous invite en direct.`,
              link: `${window.location.origin}/studio?room=${roomId}`,
              createdAt: new Date().toISOString()
            }
          })
        })
      );
      await Promise.all(notificationPromises);
      await joinLiveRoom(roomId);
      toast.success("Studio prêt", { id: t });
      setShowInviteList(false);
    } catch (e) { toast.error("Erreur", { id: t }); }
  };

  const savePodcast = async () => {
    setIsUploading(true);
    const t = toast.loading("Publication...");
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
      const filename = `podcast-${Date.now()}.mp3`;
      const uploadRes = await fetch(`/api/podcasts/upload?filename=${filename}`, { method: 'POST', body: audioBlob });
      const blobData = await uploadRes.json();
      
      const podcastId = crypto.randomUUID();
      await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_podcast',
          podcastData: { id: podcastId, title: `Session de ${currentUserName}`, audioUrl: blobData.url, hostEmail: currentUserEmail, createdAt: new Date().toISOString() }
        })
      });
      
      setPublishedUrl(`${window.location.origin}/podcasts/${podcastId}`);
      toast.success("Enregistrement publié !", { id: t });
    } catch (e) { toast.error("Erreur publication", { id: t }); }
    finally { setIsUploading(false); }
  };

  const sharePodcast = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mon Podcast', text: `Écoutez mon dernier enregistrement sur Lisible`, url: publishedUrl });
      } catch (e) { console.error(e); }
    } else {
      navigator.clipboard.writeText(publishedUrl);
      toast.success("Lien copié !");
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl border border-white/5 relative overflow-hidden">
      {/* Header Statut */}
      {isLive && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex -space-x-2">
            {participants.map((p, i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">
                {p.identity?.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <button onClick={leaveStudio} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-rose-500/20 text-rose-500 rounded-full text-[10px] font-black transition-all">
            <LogOut size={14} /> QUITTER LE STUDIO
          </button>
        </div>
      )}

      <div className="flex flex-col items-center gap-6">
        {!isLive ? (
          <div className="w-full space-y-6">
            <button onClick={() => setShowInviteList(!showInviteList)} className="w-full flex items-center justify-center gap-2 py-4 bg-slate-800 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all">
              <UserPlus size={16} /> {showInviteList ? "MASQUER LES AUTEURS" : "INVITER DES AUTEURS"}
            </button>
            {showInviteList && (
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {availableUsers.map(user => (
                  <div key={user.email} onClick={() => !invitedUsers.find(u=>u.email===user.email) ? setInvitedUsers([...invitedUsers, user]) : setInvitedUsers(invitedUsers.filter(u=>u.email!==user.email))} 
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${invitedUsers.find(u => u.email === user.email) ? 'bg-indigo-600' : 'bg-slate-800/50'}`}>
                    <span className="text-xs font-bold">{user.name}</span>
                    {invitedUsers.find(u => u.email === user.email) ? <X size={14}/> : <UserPlus size={14} className="opacity-20" />}
                  </div>
                ))}
              </div>
            )}
            <button onClick={launchStudioAndNotify} disabled={invitedUsers.length === 0} className="w-full py-5 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 disabled:opacity-30 transition-all active:scale-95">
              LANCER LE STUDIO INTERACTIF
            </button>
          </div>
        ) : (
          !audioUrl && (
            <div className="text-center py-10">
              <div className="mb-8">{recordingStream && <AudioVisualizer stream={recordingStream} />}</div>
              <button onClick={stopRecording} className="w-32 h-32 rounded-full bg-rose-600 flex items-center justify-center animate-pulse shadow-3xl shadow-rose-500/40 active:scale-90 transition-transform">
                <Square fill="white" size={32} />
              </button>
              <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 animate-bounce">ENREGISTREMENT EN COURS...</p>
            </div>
          )
        )}
        
        {audioUrl && !publishedUrl && (
          <div className="w-full space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="bg-slate-800 p-8 rounded-[2rem] border border-white/5 shadow-inner">
              <audio src={audioUrl} controls className="w-full accent-rose-500" />
            </div>
            <button onClick={savePodcast} disabled={isUploading} className="w-full py-6 bg-teal-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-teal-500/20">
              {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
              PUBLIER L'ÉPISODE
            </button>
          </div>
        )}

        {publishedUrl && (
          <div className="w-full space-y-4 animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[2rem] text-center">
              <CheckCircle2 className="mx-auto mb-4 text-emerald-500" size={40} />
              <h3 className="font-black italic text-xl mb-2">PUBLICATION RÉUSSIE !</h3>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest">Votre voix est maintenant en ligne.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={sharePodcast} className="flex-1 py-5 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <Share2 size={18} /> PARTAGER
              </button>
              <button onClick={leaveStudio} className="px-8 py-5 bg-slate-800 rounded-2xl font-black uppercase tracking-widest">
                FIN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
