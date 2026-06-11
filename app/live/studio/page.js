'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ChatEphemeral from '@/components/ChatEphemeral';
import LikeBubbly from '@/components/LikeBubbly';

export default function StudioPage() {
  const searchParams = useSearchParams();
  const streamId = searchParams.get('id');
  const videoRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [likes, setLikes] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!streamId) return;

    // 1. Accès caméra et micro
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
        
        // Charger le script externe de signalement pour le P2P (Ex: Scaledrone gratuit)
        const script = document.createElement('script');
        script.src = 'https://cdn.scaledrone.com/scaledrone.min.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
          // Utilisation d'une clé publique de démo Scaledrone (Valide pour le P2P sans serveur)
          const drone = new window.Scaledrone('yjS74g9Y3M2WAb9q');
          const roomName = `observable-room-${streamId}`;
          
          drone.on('open', error => {
            if (error) return console.error(error);
            const room = drone.subscribe(roomName);
            
            // Écouter les interactions éphémères envoyées par les spectateurs
            room.on('data', (message, member) => {
              if (member.id === drone.clientId) return; // Ignorer ses propres messages

              if (message.type === 'comment') {
                const newMsg = { id: Math.random(), text: message.text, user: message.user };
                setMessages((prev) => [...prev, newMsg]);
                setTimeout(() => setMessages((prev) => prev.filter(m => m.id !== newMsg.id)), 6000);
              }
              
              if (message.type === 'like') {
                const newLike = { id: Math.random(), left: Math.random() * 80 + 10 };
                setLikes((prev) => [...prev, newLike]);
                setTimeout(() => setLikes((prev) => prev.filter(l => l.id !== newLike.id)), 2000);
              }
            });
          });
        };
      });
  }, [streamId]);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/live/${streamId}` : '';

  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center text-white overflow-hidden">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

      <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase animate-pulse z-20">
        • EN DIRECT
      </div>

      <div className="absolute top-4 right-4 bg-black/60 p-3 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col gap-1 z-20">
        <span className="text-[10px] text-gray-400 font-medium">Partager le lien du live :</span>
        <div className="flex gap-2">
          <input type="text" readOnly value={shareUrl} className="bg-white/10 text-xs p-1.5 rounded-lg text-gray-200 w-44 outline-none" />
          <button 
            onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="bg-blue-600 hover:bg-blue-700 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
          >
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
      </div>

      {/* Le streameur voit les commentaires et likes en temps réel, mais ne peut pas s'en envoyer lui-même */}
      <ChatEphemeral messages={messages} onSendMessage={() => {}} />
      <LikeBubbly likes={likes} onSendLike={() => {}} />
    </div>
  );
}
