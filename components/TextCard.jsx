import React from 'react';
import { Heart, Eye, Award, BookOpen } from 'lucide-react';

export default function TextCard({ item }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      {item.image && (
        <img 
          src={item.image} 
          alt={item.title} 
          className="w-full h-40 object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
            {item.category}
          </span>
          {item.certified > 0 && (
            <Award className="w-5 h-5 text-yellow-500" />
          )}
        </div>
        
        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 truncate">
          {item.title}
        </h3>
        <p className="text-sm text-slate-500 mb-4 flex items-center">
          par <span className="font-medium ml-1 text-slate-700">{item.author}</span>
        </p>

        <div className="flex items-center justify-between text-slate-500 text-sm border-t pt-3">
          <div className="flex gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" /> {item.views || 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-pink-500" /> {item.likes || 0}
            </span>
          </div>
          <a 
            href={`/texts/${item.id}`}
            className="flex items-center gap-1 text-blue-600 font-semibold hover:underline"
          >
            Lire <BookOpen className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
