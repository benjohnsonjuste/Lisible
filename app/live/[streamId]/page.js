'use client';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ChatEphemeral from '@/components/ChatEphemeral';
import LikeBubbly from '@/components/LikeBubbly';

export default function ViewerPage() {
  const { streamId } = useParams();
  const videoRef = useRef(null);
  const droneRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [likes, setLikes] = useState([]);
  const [username] = useState(() => 'Spectateur_' + Math.floor(Math.random() * 900 + 100));

  useEffect(() => {
    if (!streamId) return;

    const script = document.createElement('script');
    script.src = 'https://cdn.scaledrone.com/scaledrone.min.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const drone = new window.Scaledrone('yjS74g9Y3M2WAb9q');
      droneRef.current = drone;
      const roomName = `observable-room-${streamId}`;

      drone.on('open', error => {
        if (error) return console.error(error);
        const room = drone.subscribe(roomName);

        room.on('data', (message, member) => {
          // Écouter globalement les commentaires et likes des autres spectateurs
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

    return () => {
      if (droneRef.current) droneRef.current.close();
    };
  }, [streamId]);

  const sendComment = (text) => {
    if (droneRef.current) {
      droneRef.current.publish({
        room: `observable-room-${streamId}`,
        message: { type: 'comment', text: text, user: username }
      });
    }
  };

  const sendLike = () => {
    if (droneRef.current) {
      droneRef.current.publish({
        room: `observable-room-${streamId}`,
        message: { type: 'like' }
      });
    }
  };

  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center text-white overflow-hidden">
      {/* Simulation vidéo P2P interactive autonome */}
      <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-gray-500 p-4 text-center">
        <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-gray-400">Connexion au flux vidéo éphémère du diffuseur...</p>
      </div>

      <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover z-10" />

      <div className="absolute top-4 left-4 bg-black/50 px-3 py-1.5 rounded-full text-xs backdrop-blur-md border border-white/10 z-20">
        👁️ Mode Spectateur : <span className="text-blue-400 font-mono">{username}</span>
      </div>

      {/* Composants Éphémères */}
      <ChatEphemeral messages={messages} onSendMessage={sendComment} />
      <LikeBubbly likes={likes} onSendLike={sendLike} />
    </div>
  );
}
