'use client';
import { Heart } from 'lucide-react';

export default function LikeBubbly({ likes, onSendLike }) {
  return (
    <div className="absolute bottom-24 right-4 flex flex-col items-center z-30">
      {/* Zone d'envol des cœurs */}
      <div className="relative h-72 w-24 overflow-hidden pointer-events-none mb-2">
        {likes.map((like) => (
          <div
            key={like.id}
            className="absolute bottom-0 text-red-500 animate-bubble"
            style={{ left: `${like.left}%` }}
          >
            <Heart fill="currentColor" size={28} />
          </div>
        ))}
      </div>

      {/* Bouton Like */}
      <button
        onClick={onSendLike}
        className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-transform active:scale-90 pointer-events-auto"
      >
        <Heart fill="currentColor" size={24} />
      </button>
    </div>
  );
}
