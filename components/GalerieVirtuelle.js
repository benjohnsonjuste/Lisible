"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  Text, PerspectiveCamera, Sparkles, 
  MeshTransmissionMaterial, Sky, Environment, ContactShadows
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { useRouter } from "next/navigation";
import { Fingerprint, Loader2, MapPin } from "lucide-react";
import * as THREE from "three";

// --- JOYSTICK TACTILE URBAIN ---
const VirtualJoystick = ({ onMove }) => {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleStart = () => setActive(true);
  const handleEnd = () => { setActive(false); setPos({ x: 0, y: 0 }); onMove({ x: 0, y: 0 }); };
  const handleMove = (e) => {
    if (!active) return;
    const touch = e.touches ? e.touches[0] : e;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (touch.clientX - centerX) / (rect.width / 2);
    const y = (touch.clientY - centerY) / (rect.height / 2);
    const limitedX = Math.max(-1, Math.min(1, x));
    const limitedY = Math.max(-1, Math.min(1, y));
    setPos({ x: limitedX * 40, y: limitedY * 40 });
    onMove({ x: limitedX, y: -limitedY });
  };

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
      onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
      className="w-32 h-32 rounded-full bg-slate-900/20 border-2 border-slate-900/30 backdrop-blur-sm relative touch-none pointer-events-auto"
    >
      <div 
        className="w-12 h-12 bg-slate-800 rounded-full absolute shadow-xl"
        style={{ 
          left: `calc(50% + ${pos.x}px)`, top: `calc(50% + ${pos.y}px)`,
          transform: 'translate(-50%, -50%)', transition: active ? 'none' : 'all 0.1s'
        }}
      />
    </div>
  );
};

// --- LOGIQUE SONORE ---
const playSound = (type) => {
  if (typeof window === "undefined") return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  if (type === 'step') {
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  } else if (type === 'open') {
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    osc.start(); osc.stop(ctx.currentTime + 0.8);
  }
};

// --- MAINS (VÊTEMENTS URBAINS) ---
function FirstPersonHands({ walking }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.position.y = walking ? Math.sin(t * 10) * 0.015 - 0.45 : -0.45;
    ref.current.position.x = walking ? Math.cos(t * 5) * 0.01 : 0;
  });
  return (
    <group ref={ref}>
      <mesh position={[-0.55, 0, -0.7]} rotation={[0.2, 0.3, 0]}>
        <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
        <meshStandardMaterial color="#334155" roughness={1} />
      </mesh>
      <mesh position={[0.55, 0, -0.7]} rotation={[0.2, -0.3, 0]}>
        <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
        <meshStandardMaterial color="#334155" roughness={1} />
      </mesh>
    </group>
  );
}

// --- PORTES INTÉRIEURES ---
function InteriorDoor({ txt, position, onNear }) {
  const { camera } = useThree();
  const [active, setActive] = useState(false);
  useFrame(() => {
    const dist = camera.position.distanceTo(new THREE.Vector3(...position));
    if (dist < 3.5) { if(!active){setActive(true); onNear(txt);} }
    else if (active) { setActive(false); onNear(null); }
  });
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[2.8, 4.8, 0.1]} />
        <MeshTransmissionMaterial thickness={0.1} color={active ? "#bae6fd" : "#f1f5f9"} />
        <Text position={[0, 2.6, 0.06]} fontSize={0.18} color="#1e293b" maxWidth={2} textAlign="center">
          {txt.title.toUpperCase()}
        </Text>
      </mesh>
    </group>
  );
}

// --- MOTEUR DE VILLE ---
function CityScene({ phase, setPhase, texts, setTargetText, moveData }) {
  const { camera } = useThree();
  const mainDoor = useRef();
  const [keys, setKeys] = useState({});
  const stepTimer = useRef(0);

  useEffect(() => {
    const h = (e) => setKeys(p => ({ ...p, [e.key.toLowerCase()]: e.type === "keydown" }));
    window.addEventListener("keydown", h); window.addEventListener("keyup", h);
    return () => { window.removeEventListener("keydown", h); window.removeEventListener("keyup", h); };
  }, []);

  useFrame((state, delta) => {
    const speed = 0.16;
    let mx = moveData.x || (keys["d"] ? 1 : keys["a"] ? -1 : 0);
    let mz = -moveData.y || (keys["s"] ? 1 : keys["w"] ? -1 : 0);

    if (phase === "intro") {
      camera.position.z -= 0.06;
      if (camera.position.z < 25) setPhase("at_door");
    } else if (phase === "entering") {
      mainDoor.current.rotation.y = THREE.MathUtils.lerp(mainDoor.current.rotation.y, -1.5, 0.04);
      camera.position.z -= 0.1;
      if (camera.position.z < 10) setPhase("explore");
    } else if (phase === "explore") {
      camera.position.x += mx * speed;
      camera.position.z += mz * speed;
    }

    if ((mx !== 0 || mz !== 0 || phase === "intro") && phase !== "at_door") {
      stepTimer.current += delta;
      if (stepTimer.current > 0.6) { playSound('step'); stepTimer.current = 0; }
    }
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -14, 14);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -100, 30);
  });

  return (
    <>
      <Sky sunPosition={[100, 40, 100]} turbidity={0.05} rayleigh={0.5} />
      <Environment preset="park" />
      <FirstPersonHands walking={phase !== "at_door"} />
      
      {/* RUE ET BÂTIMENT LISIBLE */}
      <group position={[0, 0, 15]}>
        {/* Façade principale (Pierre Grise) */}
        <mesh position={[0, 10, -2]} receiveShadow>
          <boxGeometry args={[60, 25, 4]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.7} />
        </mesh>
        
        {/* Fenêtres hautes */}
        {[ -10, 0, 10 ].map((x) => (
            <mesh key={x} position={[x, 12, 0.1]}>
                <planeGeometry args={[4, 8]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
            </mesh>
        ))}

        <Text position={[0, 10, 0.2]} fontSize={2} color="#f8fafc" font="/fonts/Inter-Bold.woff">GALERIE LISIBLE</Text>
        
        {/* Porte d'Entrée */}
        <group ref={mainDoor} position={[2, 0, 0]}>
          <mesh position={[0, 3.5, 0.2]} castShadow>
            <boxGeometry args={[4, 7, 0.4]} />
            <meshStandardMaterial color="#451a03" roughness={0.6} /> 
          </mesh>
        </group>
      </group>

      {/* RANGÉES DE TEXTES INTÉRIEURES */}
      <group position={[0, 0, 0]}>
        {texts.map((t, i) => (
          <InteriorDoor key={t.id} txt={t} position={[(i%2===0?-8:8), 2.4, -i*10]} onNear={setTargetText} />
        ))}
      </group>
      
      {/* SOL URBAIN (Bitume puis Parquet) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color={phase === "intro" || phase === "at_door" ? "#334155" : "#cbd5e1"} />
      </mesh>

      <Sparkles count={400} scale={50} size={1.5} speed={0.2} color="white" />
      <ContactShadows opacity={0.4} scale={40} blur={2} far={15} />
    </>
  );
}

// --- EXPORT ---
export default function GalerieUrbaine() {
  const [phase, setPhase] = useState("intro");
  const [texts, setTexts] = useState([]);
  const [targetText, setTargetText] = useState(null);
  const [moveData, setMoveData] = useState({ x: 0, y: 0 });
  const router = useRouter();

  useEffect(() => {
    fetch("/api/github-db?type=library").then(res => res.json()).then(data => {
      setTexts(Array.isArray(data.content) ? data.content.slice(0, 25) : []);
    });
  }, []);

  return (
    <div className="w-full h-screen bg-slate-300 relative touch-none overflow-hidden select-none">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 1.7, 50]} fov={45} />
        <Suspense fallback={null}>
          <CityScene phase={phase} setPhase={setPhase} texts={texts} setTargetText={setTargetText} moveData={moveData} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[50, 50, 25]} intensity={1} castShadow />
          <EffectComposer>
            <Bloom intensity={0.1} />
            <Vignette darkness={0.3} />
            <Noise opacity={0.02} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* HUD RÉALISTE */}
      <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="bg-slate-900 text-white p-5 rounded-sm shadow-2xl">
            <h1 className="font-black text-2xl tracking-tight leading-none">LISIBLE</h1>
            <div className="flex items-center gap-2 mt-2 text-slate-400 font-mono text-[10px] uppercase">
                <MapPin size={10} /> 45° N, 73° W • MTL
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8">
          {phase === "at_door" && (
            <button 
              onClick={() => { setPhase("entering"); playSound('open'); }} 
              className="pointer-events-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-12 py-5 rounded-full shadow-[0_15px_30px_rgba(37,99,235,0.4)] transition-all active:scale-95"
            >
              ENTRER DANS LA BIBLIOTHÈQUE
            </button>
          )}

          {targetText && phase === "explore" && (
            <div className="flex flex-col items-center gap-5 animate-in fade-in slide-in-from-bottom-5">
              <div className="bg-white px-10 py-5 rounded-lg shadow-2xl border-l-4 border-blue-600">
                <p className="text-slate-400 text-[10px] uppercase font-bold mb-1 tracking-widest">Document sélectionné</p>
                <h2 className="text-slate-900 text-xl font-serif italic font-medium">{targetText.title}</h2>
              </div>
              <button 
                onClick={() => { playSound('open'); router.push(`/texts/${targetText.id}`); }} 
                className="pointer-events-auto bg-slate-900 text-white font-black px-14 py-6 rounded-lg flex items-center gap-4 hover:bg-slate-800 transition-all shadow-xl"
              >
                <Fingerprint size={24} /> LIRE LE MANUSCRIT
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between items-end">
          <VirtualJoystick onMove={setMoveData} />
          <div className="text-right text-slate-400 font-mono text-[9px] uppercase tracking-tighter">
            System Status: Online <br />
            Location: {phase.replace('_',' ')}
          </div>
        </div>
      </div>

      {texts.length === 0 && (
        <div className="absolute inset-0 bg-slate-100 z-[200] flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
          <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">Chargement de la rue...</p>
        </div>
      )}
    </div>
  );
}
