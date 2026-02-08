"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LibraryPage() {
  const [texts, setTexts] = useState([]);

  useEffect(() => {
    async function fetchTexts() {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/texts`);
      const files = await res.json();
      const data = await Promise.all(
        files.filter(f => f.name.endsWith('.json')).map(f => fetch(f.download_url).then(r => r.json()))
      );
      setTexts(data);
    }
    fetchTexts();
  }, []);

  return (
    <div className="p-10">
      <h2 className="text-4xl font-black mb-10 italic">Bibliothèque</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {texts.map((text, i) => (
          <div key={i} className="p-6 border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-xl mb-2">{text.title}</h3>
            <p className="text-slate-500 text-sm line-clamp-3 mb-4">{text.content}</p>
            <div className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Par {text.penName}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
