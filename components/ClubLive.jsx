"use client";
import { useState, useEffect, useRef } from "react";
import { Heart, Send, Users, X, Share2, Mic, Zap } from "lucide-react";
import { toast } from "sonner";

export default function ClubLive({ liveData, currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [stats, setStats] = useState({ reactions: 0, viewers: 1 });
  const [hearts, setHearts] = useState([]);
  const chatRef = useRef(null);

  useEffect(() => {
    // Sync avec le Relay toutes les 1.5s
    const sync = setInterval(async () => {
      const res = await fetch(`/api/club-relay?liveId=${liveData.id}`);
      const data = await res.json();
      setComments(data.comments);
      setStats({ reactions: data.reactions, viewers: data.viewers });
    }, 1500);
    return () => clearInterval(sync);
  }, [liveData.id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const text = newComment;
    setNewComment("");
    // Affichage immédiat (Optimiste)
    setComments([...comments, { text, user: currentUser.name, avatar: currentUser.avatar, time: "..." }]);

    await fetch('/api/club-relay', {
      method: 'POST',
      body: JSON.stringify({ action: 'comment', liveId: liveData.id, comment: text, user: currentUser })
    });
  };

  const sendReaction = () => {
    setHearts([...hearts, Date.now()]);
    fetch('/api/club-relay', { method: 'POST', body: JSON.stringify({ action: 'react', liveId: liveData.id }) });
  };

  return (
    <div className="fixed inset-0 bg-[#020617] z-[500] flex flex-col lg:flex-row overflow-hidden font-sans">
      <div className="relative flex-1 bg-black flex items-center justify-center">
        {/* Stream Content */}
        <div className="text-center">
          <div className="relative w-48 h-48 mx-auto mb-6">
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20" />
            <img src={liveData.hostAvatar} className="w-full h-full rounded-full object-cover border-4 border-blue-500" />
          </div>
          <h2 className="text-3xl font-serif italic text-white">{liveData.title}</h2>
          <audio src={liveData.streamUrl} autoPlay controls className="mt-6 mx-auto opacity-30 hover:opacity-100" />
        </div>
        
        {/* Flying Hearts */}
        <div className="absolute bottom-20 right-10">
          {hearts.map(h => <Heart key={h} className="text-rose-500 animate-bounce-up absolute" fill="currentColor" />)}
        </div>
      </div>

      {/* Chat Side */}
      <div className="w-full lg:w-96 bg-slate-900 flex flex-col border-l border-white/5">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
           <div className="flex items-center gap-2 text-rose-500 font-black text-xs">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"/> LIVE
           </div>
           <div className="flex gap-4 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1"><Users size={12}/> {stats.viewers}</span>
              <span className="flex items-center gap-1"><Heart size={12}/> {stats.reactions}</span>
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={chatRef}>
          {comments.map((m, i) => (
            <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
              <img src={m.avatar} className="w-8 h-8 rounded-lg" />
              <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none text-sm text-slate-200">
                <p className="text-[10px] font-black text-blue-400 uppercase mb-1">{m.user}</p>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} className="p-6 bg-slate-950 flex gap-2">
          <button type="button" onClick={sendReaction} className="p-3 bg-rose-500/10 text-rose-500 rounded-xl"><Heart fill="currentColor" size={20}/></button>
          <input value={newComment} onChange={e => setNewComment(e.target.value)} className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none" placeholder="Message..." />
          <button className="p-3 bg-blue-600 text-white rounded-xl"><Send size={20}/></button>
        </form>
      </div>
      <style jsx>{` @keyframes bounce-up { 0% { transform: translateY(0); opacity:1; } 100% { transform: translateY(-300px); opacity:0; } } .animate-bounce-up { animation: bounce-up 2s forwards; } `}</style>
    </div>
  );
}
