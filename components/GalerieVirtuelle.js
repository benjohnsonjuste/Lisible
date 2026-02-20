"use client";
import React, { useEffect, useState, useRef, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  Text, PerspectiveCamera, Sparkles, Cloud,
  MeshTransmissionMaterial, Sky, Environment, ContactShadows
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { useRouter } from "next/navigation";
import { Fingerprint, Loader2, ThermometerSnowflake } from "lucide-react";
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
      className="w-32 h-32 rounded-full bg-black/20 border border-white/30 backdrop-blur-md relative touch-none pointer-events-auto shadow-2xl"
    >
      <div 
        className="w-12 h-12 bg-white/80 rounded-full absolute shadow-xl"
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

  if (type === 'snow_step') {
    osc.frequency.setValueAtTime(50, ctx.currentTime);
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  } else if (type === 'creak_door') {
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 1);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    osc.start(); osc.stop(ctx.currentTime + 1.2);
  }
};

// --- MAINS ---
function WinterHands({ walking, phase }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.position.y = walking ? Math.sin(t * 8) * 0.02 - 0.45 : -0.45;
    ref.current.position.x = walking ? Math.cos(t * 4) * 0.015 : 0;
    if (phase === "entering") ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, -1, 0.05);
  });
  return (
    <group ref={ref}>
      <mesh position={[-0.55, 0, -0.7]}><capsuleGeometry args={[0.07, 0.18]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[0.55, 0, -0.7]}><capsuleGeometry args={[0.07, 0.18]} /><meshStandardMaterial color="#111" /></mesh>
    </group>
  );
}

// --- PORTE TEXTE ---
function BookDoor({ txt, position, onNear }) {
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
        <MeshTransmissionMaterial thickness={0.3} color={active ? "#2dd4bf" : "#ffffff"} />
      </mesh>
      <Text position={[0, 3, 0.12]} fontSize={0.2} color="white" maxWidth={2} textAlign="center">
        {txt.title.toUpperCase()}
      </Text>
    </group>
  );
}

// --- WORLD MANAGER ---
function World({ phase, setPhase, texts, setTargetText, moveData }) {
  const { camera } = useThree();
  const mainDoorRef = useRef();
  const stepTimer = useRef(0);
  const [isWalking, setIsWalking] = useState(false);

  useFrame((state, delta) => {
    const speed = 0.12;
    const collisionZ = 22.5; // Mur du bâtiment

    // Intro automatique
    if (phase === "intro") {
      camera.position.z -= 0.06;
      setIsWalking(true);
      if (camera.position.z < 26) setPhase("at_main_door");
    } 
    // Animation porte
    else if (phase === "entering") {
      mainDoorRef.current.rotation.y = THREE.MathUtils.lerp(mainDoorRef.current.rotation.y, -1.7, 0.04);
      camera.position.z -= 0.08;
      if (camera.position.z < 18) setPhase("library");
    }
    // Mouvement libre (Joystick)
    else if (phase === "library") {
      const mx = moveData.x * speed;
      const mz = -moveData.y * speed;
      
      if (Math.abs(mx) > 0.01 || Math.abs(mz) > 0.01) {
        setIsWalking(true);
        // Collisions simples
        const newX = camera.position.x + mx;
        const newZ = camera.position.z + mz;
        
        if (newX > -12 && newX < 12) camera.position.x = newX;
        if (newZ > -60 && newZ < 18) camera.position.z = newZ;

        stepTimer.current += delta;
        if (stepTimer.current > 0.5) { playSound('snow_step'); stepTimer.current = 0; }
      } else {
        setIsWalking(false);
      }
    }

    if (phase === "at_main_door") setIsWalking(false);
  });

  return (
    <>
      <Sky sunPosition={[20, 5, 10]} />
      <Sparkles count={800} scale={60} size={1} speed={0.3} color="white" />
      
      {/* MONTRÉAL (EXTÉRIEUR) */}
      <group position={[0, 0, 20]}>
        {/* Façade pierre */}
        <mesh position={[0, 10, 0]} receiveShadow>
          <boxGeometry args={[60, 25, 4]} />
          <meshStandardMaterial color="#333" roughness={0.8} />
        </mesh>
        {/* Porte bois */}
        <mesh ref={mainDoorRef} position={[2.1, 2.5, 2.1]} castShadow>
          <boxGeometry args={[4.2, 5.5, 0.4]} />
          <meshStandardMaterial color="#1a0f08" />
          <Text position={[-0.8, 3.5, 0.25]} fontSize={0.3} color="#ccc">GALERIE LISIBLE</Text>
        </mesh>
      </group>

      {/* BIBLIOTHÈQUE (INTÉRIEUR) */}
      <group position={[0, 0, 0]}>
        <ambientLight intensity={phase === "library" ? 0.3 : 0.8} />
        <pointLight position={[0, 10, 10]} intensity={1.5} color="#2dd4bf" />
        {texts.map((t, i) => (
          <BookDoor key={t.id} txt={t} position={[(i % 2 === 0 ? -7 : 7), 2.4, 10 - i * 10]} onNear={setTargetText} />
        ))}
      </group>

      {/* SOL */}
      <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color={phase === "library" ? "#0a0a0a" : "#ffffff"} roughness={0.1} />
      </mesh>

      <WinterHands walking={isWalking} phase={phase} />
      <ContactShadows opacity={0.4} scale={40} blur={2} />
    </>
  );
}

// --- EXPORT ---
export default function GalerieLisible() {
  const [phase, setPhase] = useState("intro");
  const [texts, setTexts] = useState([]);
  const [targetText, setTargetText] = useState(null);
  const [moveData, setMoveData] = useState({ x: 0, y: 0 });
  const router = useRouter();

  useEffect(() => {
    fetch("/api/github-db?type=library")
      .then(res => res.json())
      .then(data => setTexts(Array.isArray(data.content) ? data.content : []));
  }, []);

  return (
    <div className="w-full h-screen bg-white relative overflow-hidden select-none">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 1.7, 45]} fov={50} />
        <Suspense fallback={null}>
          <World phase={phase} setPhase={setPhase} texts={texts} setTargetText={setTargetText} moveData={moveData} />
          <EffectComposer>
            <Bloom intensity={0.5} />
            <Vignette darkness={0.7} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* OVERLAY UI */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-10">
        <div className="flex justify-between items-start">
          <div className="bg-black/10 backdrop-blur-md px-5 py-2 rounded-full flex items-center gap-3 border border-white/20">
            <ThermometerSnowflake className="text-blue-400" size={20} />
            <span className="text-slate-800 font-bold tracking-tighter italic">Montréal VR</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          {phase === "at_main_door" && (
            <button 
              onClick={() => { setPhase("entering"); playSound('creak_door'); }}
              className="pointer-events-auto bg-slate-900 text-white px-12 py-6 rounded-full font-black text-xl shadow-2xl animate-bounce"
            >
              OUVRIR LA PORTE
            </button>
          )}

          {targetText && (
            <div className="flex flex-col items-center gap-5 translate-y-[-50px]">
              <div className="bg-white/90 backdrop-blur-xl px-10 py-5 rounded-2xl shadow-2xl border-b-4 border-teal-500 text-center">
                <p className="text-[10px] text-teal-600 font-black uppercase tracking-[0.3em] mb-2">Manuscrit</p>
                <h2 className="text-2xl font-serif italic text-slate-900">{targetText.title}</h2>
              </div>
              <button 
                onClick={() => router.push(`/texts/${targetText.id}`)}
                className="pointer-events-auto bg-teal-500 text-black px-12 py-5 rounded-full font-black flex items-center gap-4 shadow-[0_0_40px_rgba(45,212,191,0.5)] active:scale-95 transition-all"
              >
                <Fingerprint size={24} /> SCANNER L'EMPREINTE
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between items-end">
          {phase === "library" && <VirtualJoystick onMove={setMoveData} />}
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            {phase} mode
          </div>
        </div>
      </div>

      {texts.length === 0 && (
        <div className="absolute inset-0 bg-white z-[100] flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-teal-500 mb-4" size={40} />
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.5em]">Sync Library</p>
        </div>
      )}
    </div>
  );
}
