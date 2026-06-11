'use client';
import { useState } from 'react';

export default function ChatEphemeral({ messages, onSendMessage }) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="absolute bottom-24 left-4 w-80 h-72 flex flex-col justify-end z-30">
      {/* Zone des messages éphémères */}
      <div className="space-y-2 overflow-hidden flex flex-col justify-end mb-4 pointer-events-none">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="bg-black/60 text-white p-2.5 rounded-xl text-sm animate-fade-in-up max-w-max backdrop-blur-md border border-white/10"
          >
            <span className="font-bold text-blue-400">{msg.user} : </span>
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Envoyer un commentaire éphémère..."
          className="bg-black/40 backdrop-blur border border-white/20 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 w-full"
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
      </div>
    </div>
  );
}
