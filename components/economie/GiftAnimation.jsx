"use client";
import { useEffect, useRef } from "react";

const DURATIONS = { grimoire_or: 8000, parchemin: 6000 };

function playChime(grande = false) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = grande ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.6);
    });
  } catch {}
}

function Fireworks() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#A78BFA", "#F472B6", "#FBBF24"];
    let parts = [];
    let raf;
    const boom = () => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.5;
      const c = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 60; i++) {
        const a = (Math.PI * 2 * i) / 60 + Math.random() * 0.3;
        const sp = 2 + Math.random() * 4;
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, c });
      }
    };
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (Math.random() < 0.06) boom();
      parts = parts.filter((p) => p.life > 0);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= 0.012;
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

function Scene({ event }) {
  const id = event.cadeauId;
  if (id === "gomme")
    return (
      <div className="anim-gomme text-[120px]">🧽</div>
    );
  if (id === "crayon")
    return (
      <div className="relative">
        <svg width="320" height="160" viewBox="0 0 320 160" className="overflow-visible">
          <path d="M20,120 C80,20 140,20 170,90 S260,150 300,40" fill="none" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round" className="anim-dessin" />
        </svg>
        <div className="anim-crayon text-[64px] absolute -top-4 left-0">✏️</div>
      </div>
    );
  if (id === "feuille")
    return (
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="anim-feuille absolute top-[-60px] text-[40px]"
            style={{ left: `${(i * 71) % 100}%`, animationDelay: `${(i * 0.35) % 3}s`, fontSize: `${28 + ((i * 13) % 24)}px` }}>
            🍃
          </span>
        ))}
      </div>
    );
  if (id === "encrier")
    return (
      <div className="relative flex items-center justify-center">
        <div className="anim-encre w-[280px] h-[280px] bg-slate-950" style={{ borderRadius: "42% 58% 61% 39% / 45% 42% 58% 55%" }} />
        <div className="absolute text-[72px]">🫙</div>
      </div>
    );
  if (id === "plume_or")
    return (
      <div className="text-center">
        <div className="text-[96px] anim-flotte">🪶</div>
        <div className="anim-or text-4xl md:text-6xl font-black mt-2">{event.deNom}</div>
      </div>
    );
  if (id === "parchemin")
    return (
      <div className="text-center">
        <div className="anim-parchemin text-[110px] origin-top">📜</div>
        <div className="text-amber-200 font-black text-xl mt-2 italic">« {event.deNom} »</div>
      </div>
    );
  // grimoire_or
  return (
    <div className="absolute inset-0">
      <Fireworks />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="anim-grimoire text-[150px] md:text-[200px] drop-shadow-[0_0_60px_rgba(255,215,0,0.8)]">📖</div>
        <div className="anim-or text-3xl md:text-5xl font-black mt-4 text-center px-4">{event.deNom}</div>
        <div className="mt-3 px-6 py-2 rounded-full bg-yellow-400/20 border border-yellow-300/60 text-yellow-200 text-xs font-black uppercase tracking-[0.3em]">
          Mécène d'honneur
        </div>
      </div>
    </div>
  );
}

export default function GiftAnimation({ event, onDone }) {
  useEffect(() => {
    if (!event) return;
    if (event.cadeauId === "parchemin") playChime(false);
    if (event.cadeauId === "grimoire_or") playChime(true);
    const t = setTimeout(() => onDone && onDone(), DURATIONS[event.cadeauId] || 4200);
    return () => clearTimeout(t);
  }, [event, onDone]);

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-[120] pointer-events-none flex items-center justify-center overflow-hidden">
      <style>{`
        @keyframes gomme-sweep { 0% { transform: translateX(-38vw) rotate(-18deg); } 50% { transform: translateX(38vw) rotate(14deg); } 100% { transform: translateX(-38vw) rotate(-18deg); } }
        .anim-gomme { animation: gomme-sweep 2s ease-in-out infinite; filter: drop-shadow(0 10px 20px rgba(0,0,0,.4)); }
        @keyframes crayon-move { 0% { transform: translate(0,110px) rotate(20deg); } 100% { transform: translate(280px,-60px) rotate(20deg); } }
        .anim-crayon { animation: crayon-move 2.2s ease-in-out infinite alternate; }
        .anim-dessin { stroke-dasharray: 600; stroke-dashoffset: 600; animation: dessin 2.2s ease-in-out infinite alternate; }
        @keyframes dessin { to { stroke-dashoffset: 0; } }
        @keyframes feuille-tombe { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(110vh) rotate(540deg); opacity: .9; } }
        .anim-feuille { animation: feuille-tombe 3.2s linear infinite; }
        @keyframes encre-grow { 0% { transform: scale(0) rotate(0deg); opacity: 0; } 60% { opacity: .92; } 100% { transform: scale(1.4) rotate(24deg); opacity: .85; } }
        .anim-encre { animation: encre-grow 2.4s ease-out forwards; }
        @keyframes flotte { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
        .anim-flotte { animation: flotte 2.4s ease-in-out infinite; }
        .anim-or { background: linear-gradient(110deg,#8a6a1f 20%,#ffd700 40%,#fff6c9 50%,#ffd700 60%,#8a6a1f 80%); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent; animation: or-brille 2.5s linear infinite; }
        @keyframes or-brille { to { background-position: 200% center; } }
        @keyframes parchemin-deroule { 0% { transform: scaleY(.15); } 100% { transform: scaleY(1); } }
        .anim-parchemin { animation: parchemin-deroule 1.6s ease-out forwards; }
        @keyframes grimoire-pulse { 0%,100% { transform: scale(1) rotate(-4deg); } 50% { transform: scale(1.12) rotate(4deg); } }
        .anim-grimoire { animation: grimoire-pulse 1.8s ease-in-out infinite; }
        @keyframes gift-in { from { transform: scale(.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .anim-gift-in { animation: gift-in .45s cubic-bezier(.2,1.4,.4,1) both; }
      `}</style>

      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
      <div className="relative anim-gift-in">
        <Scene event={event} />
      </div>

      <div className="absolute bottom-10 left-0 right-0 text-center anim-gift-in">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
          <span className="text-2xl">{event.icone}</span>
          <div className="text-left">
            <p className="text-white font-black text-sm leading-tight">
              {event.deNom} <span className="font-medium text-white/70">a offert</span> {event.cadeauNom}
            </p>
            <p className="text-white/60 text-[11px] font-bold">
              {Number(event.li).toLocaleString("fr-FR")} Li • {Number(event.usd).toFixed(2)} $ US
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
