"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  Text, PerspectiveCamera, Sparkles, 
  MeshTransmissionMaterial, Sky, Environment, ContactShadows, SoftShadows
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useRouter } from "next/navigation";
import { Fingerprint, Loader2 } from "lucide-react";
import * as THREE from "three";

// --- JOYSTICK TACTILE ---
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
      className="w-32 h-32 rounded-full bg-black/20 border border-white/40 backdrop-blur-md relative touch-none pointer-events-auto shadow-xl"
    >
      <div 
        className="w-12 h-12 bg-white rounded-full absolute shadow-lg"
        style={{ 
          left: `calc(50% + ${pos.x}px)`, top: `calc(50% + ${pos.y}px)`,
          transform: 'translate(-50%, -50%)', transition: active ? 'none' : 'all 0.2s'
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
    osc.frequency.setValueAtTime(50, ctx.currentTime);
    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  } else if (type === 'open') {
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start(); osc.stop(ctx.currentTime + 0.8);
  }
};

// --- MAINS (GANTS D'HIVER) ---
function WinterHands({ walking }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.position.y = walking ? Math.sin(t * 10) * 0.02 - 0.45 : -0.45;
    ref.current.position.x = walking ? Math.cos(t * 5) * 0.01 : 0;
  });
  return (
    <group ref={ref}>
      <mesh position={[-0.6, 0, -0.8]} rotation={[0.2, 0.4, 0]}>
        <capsuleGeometry args={[0.07, 0.2, 4, 8]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
      <mesh position={[0.6, 0, -0.8]} rotation={[0.2, -0.4, 0]}>
        <capsuleGeometry args={[0.07, 0.2, 4, 8]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
    </group>
  );
}

// --- PORTES DE LA BIBLIOTHÈQUE ---
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
        <boxGeometry args={[2.5, 4.5, 0.15]} />
        <MeshTransmissionMaterial thickness={0.2} color={active ? "#fff" : "#eee"} transmission={0.9} />
        <Text position={[0, 2.5, 0.1]} fontSize={0.15} color="#333" maxWidth={2} textAlign="center">
          {txt.title.toUpperCase()}
        </Text>
      </mesh>
    </group>
  );
}

// --- MOTEUR DE SCÈNE ---
function MontrealScene({ phase, setPhase, texts, setTargetText, moveData }) {
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
    const speed = 0.15;
    let mx = moveData.x || (keys["d"] ? 1 : keys["a"] ? -1 : 0);
    let mz = -moveData.y || (keys["s"] ? 1 : keys["w"] ? -1 : 0);

    if (phase === "intro") {
      camera.position.z -= 0.05;
      if (camera.position.z < 22) setPhase("at_door");
    } else if (phase === "entering") {
      mainDoor.current.rotation.y = THREE.MathUtils.lerp(mainDoor.current.rotation.y, -Math.PI/2, 0.04);
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
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -12, 12);
  });

  return (
    <>
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={2} />
      <Environment preset="city" />
      <WinterHands walking={phase !== "at_door"} />
      
      {/* ARCHITECTURE EXTÉRIEURE (Façade Pierre Grise Montréal) */}
      <group position={[0, 0, 12]}>
        <mesh position={[0, 8, -1]} receiveShadow>
          <boxGeometry args={[50, 20, 2]} />
          <meshStandardMaterial color="#888" roughness={0.8} /> {/* Pierre grise typique */}
        </mesh>
        <Text position={[0, 10, 1.2]} fontSize={1.8} color="#222" font="/fonts/serif.json">GALERIE LISIBLE</Text>
        
        {/* Grande Porte d'Entrée */}
        <group ref={mainDoor} position={[1.5, 0, 0.5]}>
          <mesh position={[0, 3, 0]} castShadow>
            <boxGeometry args={[3, 6, 0.3]} />
            <meshStandardMaterial color="#2c1e16" metalness={0.2} /> {/* Bois sombre */}
          </mesh>
        </group>
      </group>

      {/* INTÉRIEUR (Portes des textes) */}
      <group position={[0, 0, 0]}>
        {texts.map((t, i) => (
          <InteriorDoor key={t.id} txt={t} position={[(i%2===0?-7:7), 2.25, -i*8]} onNear={setTargetText} />
        ))}
      </group>
      
      {/* SOL (Trottoir enneigé puis Plancher) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={phase === "intro" || phase === "at_door" ? "#f0f0f0" : "#d2b48c"} roughness={0.5} />
      </mesh>

      <Sparkles count={800} scale={40} size={2} speed={0.3} color="white" /> {/* Simulation de neige légère */}
      <ContactShadows opacity={0.5} scale={30} blur={2} far={10} />
    </>
  );
}

// --- COMPOSANT EXPORT ---
export default function GalerieMontreal() {
  const [phase, setPhase] = useState("intro");
  const [texts, setTexts] = useState([]);
  const [targetText, setTargetText] = useState(null);
  const [moveData, setMoveData] = useState({ x: 0, y: 0 });
  const router = useRouter();

  useEffect(() => {
    fetch("/api/github-db?type=library").then(res => res.json()).then(data => {
      setTexts(Array.isArray(data.content) ? data.content.slice(0, 20) : []);
    });
  }, []);

  return (
    <div className="w-full h-screen bg-slate-200 relative touch-none overflow-hidden">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 1.7, 45]} fov={45} />
        <Suspense fallback={null}>
          <MontrealScene phase={phase} setPhase={setPhase} texts={texts} setTargetText={setTargetText} moveData={moveData} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
          <EffectComposer>
            <Bloom intensity={0.2} luminanceThreshold={0.8} />
            <Vignette darkness={0.4} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* INTERFACE UTILISATEUR (HUD) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
        <div className="flex justify-between items-start">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg border border-white/20">
            <h1 className="text-slate-900 font-bold text-xl tracking-tight uppercase">Bibliothèque Lisible</h1>
            <p className="text-slate-600 text-[10px] font-mono tracking-widest uppercase">Montréal, QC</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          {phase === "at_door" && (
            <button 
              onClick={() => { setPhase("entering"); playSound('open'); }} 
              className="pointer-events-auto bg-slate-900 text-white font-bold px-10 py-4 rounded-full shadow-2xl transition-transform active:scale-95"
            >
              OUVRIR LA PORTE
            </button>
          )}

          {targetText && phase === "explore" && (
            <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4">
              <div className="bg-white/90 shadow-xl px-8 py-3 rounded-2xl border border-slate-200 text-center">
                <div className="text-slate-800 text-lg font-medium">{targetText.title}</div>
              </div>
              <button 
                onClick={() => { playSound('open'); router.push(`/texts/${targetText.id}`); }} 
                className="pointer-events-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-12 py-5 rounded-full flex items-center gap-3 shadow-xl transition-all"
              >
                <Fingerprint size={22} /> ACCÉDER AU TEXTE
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between items-end">
          <VirtualJoystick onMove={setMoveData} />
          <div className="text-right font-mono text-[9px] text-slate-500 bg-white/50 p-2 rounded backdrop-blur-sm">
            FPS: 60 | MÉTÉO: NEIGE LÉGÈRE <br />
            {phase.toUpperCase()}
          </div>
        </div>
      </div>

      {texts.length === 0 && (
        <div className="absolute inset-0 bg-white z-[200] flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
          <p className="font-mono text-xs text-slate-400 uppercase tracking-[0.3em]">Initialisation Montréal...</p>
        </div>
      )}
    </div>
  );
}
