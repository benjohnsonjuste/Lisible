'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Send, Sparkles, User, AlertCircle } from 'lucide-react';

const SUGGESTIONS = [
  'Quels sont les 3 points faibles de mon texte ?',
  'Comment rendre mes dialogues plus vivants ?',
  'Résume mon extrait en 5 lignes.',
  'Propose-moi 3 titres pour ce texte.',
  'Comment améliorer le rythme de mon récit ?',
  'Ce passage est-il crédible ? Pourquoi ?',
];

function renderMarkdown(t) {
  // Mini-rendu Markdown sûr : gras, italique, titres, listes
  const esc = t
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = esc
    .split('\n')
    .map((line) => {
      if (/^#{1,3}\s/.test(line)) return `<p class="font-bold text-slate-100 mt-2">${line.replace(/^#{1,3}\s/, '')}</p>`;
      if (/^\s*[-*]\s/.test(line)) return `<li class="ml-4 list-disc">${line.replace(/^\s*[-*]\s/, '')}</li>`;
      if (/^\s*\d+\.\s/.test(line)) return `<li class="ml-4 list-decimal">${line.replace(/^\s*\d+\.\s/, '')}</li>`;
      if (!line.trim()) return '<div class="h-2"></div>';
      return `<p>${line}</p>`;
    })
    .join('')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-slate-100">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return html;
}

export default function AssistantChat({ text }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Bonjour, je suis **PlumAI**, votre coach d'écriture. Collez votre texte ci-dessus, puis posez-moi vos questions : style, personnages, dialogues, rythme, idées… Je vous réponds avec des conseils concrets." },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (q) => {
    const question = (q ?? input).trim();
    if (!question || sending) return;
    setError(null);
    const newMessages = [...messages, { role: 'user', content: question }];
    setMessages(newMessages);
    setInput('');
    setSending(true);
    try {
      const res = await fetch('/api/plumai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textChunk: text,
          question,
          history: newMessages.slice(-9, -1),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de l\u2019assistant.');
      setMessages([...newMessages, { role: 'assistant', content: data.reponse }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col" style={{ height: 560 }}>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-violet-600 text-white rounded-br-sm'
                  : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/50'
              }`}
              dangerouslySetInnerHTML={m.role === 'assistant' ? { __html: renderMarkdown(m.content) } : undefined}
            >
              {m.role === 'user' ? m.content : null}
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-slate-400">
              PlumAI réfléchit…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-5 pb-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={sending}
              className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-slate-300 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mx-5 mb-2 p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="p-4 border-t border-slate-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Posez votre question sur votre texte…"
          disabled={sending}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        />
        <button
          onClick={() => send()}
          disabled={sending || !input.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 rounded-lg transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
