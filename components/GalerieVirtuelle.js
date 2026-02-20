"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  Text, PerspectiveCamera, Sparkles, 
  MeshTransmissionMaterial, Stars, Sky
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useRouter } from "next/navigation";
import { Loader2, Fingerprint } from "lucide-react";
import * as THREE from "three";

// --- EFFET DE BUÉE (OVERLAY HTML/CSS) ---
function FogOverlay({ active }) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (active) {
      setOpacity(0.9);
      const timer = setTimeout(() => {
        const interval = setInterval(() => {
          setOpacity((prev) => {
            if (prev <= 0) { clearInterval(interval); return 0; }
            return prev - 0.01;
          });
        }, 60);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (opacity <= 0) return null;

  return (
    <div 
      className="fixed inset-0 z-[150] pointer-events-none transition-opacity duration-1000"
      style={{
        opacity: opacity,
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.5) 100%)',
        backdropFilter: `blur(${opacity * 20}px)`,
        WebkitBackdropFilter: `blur(${opacity * 20}px)`,
      }}
    />
  );
}

// --- GÉNÉRATEUR DE SONS ---
const playSound = (type) => {
  if (typeof window === "undefined") return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);

  if (type === 'step') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  } else if (type === 'open') {
    osc.type = 'sine';
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start(); osc.stop(ctx.currentTime + 1);
  }
};

// --- MAINS GANTÉES (VUE SUBJECTIVE) ---
function FirstPersonHands({ isWalking, isOpening }) {
  const group = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (isWalking) {
      group.current.position.y = Math.sin(t * 10) * 0.02;
      group.current.position.x = Math.cos(t * 5) * 0.01;
    }
    group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, isOpening ? -0.5 : 0, 0.1);
  });

  return (
    <group ref={group}>
      <mesh position={[-0.6, -0.4, -0.8]} rotation={[0.2, 0.4, 0]}>
        <capsuleGeometry args={[0.07, 0.2, 4, 8]} />
        <meshStandardMaterial color="#0a0a0a" roughness={1} />
      </mesh>
      <mesh position={[0.6, -0.4, -0.8]} rotation={[0.2, -0.4, 0]}>
        <capsuleGeometry args={[0.07, 0.2, 4, 8]} />
        <meshStandardMaterial color="#0a0a0a" roughness={1} />
      </mesh>
    </group>
  );
}

// --- PORTE DE TEXTE AVEC DÉTECTION ---
function TextDoor({ txt, position, onNear }) {
  const { camera } = useThree();
  const [active, setActive] = useState(false);

  useFrame(() => {
    const dist = camera.position.distanceTo(new THREE.Vector3(...position));
    if (dist < 3.5) {
      if (!active) { setActive(true); onNear(txt); }
    } else if (active) {
      setActive(false); onNear(null);
    }
  });

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[2.8, 4.8, 0.15]} />
        <MeshTransmissionMaterial 
          thickness={0.5} 
          color={active ? "#2dd4bf" : "#050505"} 
          transmission={0.7}
        />
        <Text position={[0, 3, 0.2]} fontSize={0.18} color="white" maxWidth={2.2} textAlign="center">
          {txt.title.toUpperCase()}
        </Text>
      </mesh>
    </group>
  );
}

// --- SCÈNE ET GAMEPLAY ---
function SceneManager({ phase, setPhase, texts, setTargetText }) {
  const { camera } = useThree();
  const mainDoorRef = useRef();
  const [keys, setKeys] = useState({});
  const [isWalking, setIsWalking] = useState(false);
  const stepTimer = useRef(0);

  useEffect(() => {
    const h = (e) => setKeys(p => ({ ...p, [e.key.toLowerCase()]: e.type === "keydown" }));
    window.addEventListener("keydown", h); window.addEventListener("keyup", h);
    return () => { window.removeEventListener("keydown", h); window.removeEventListener("keyup", h); };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    
    // Head Bobbing (Tremblement de caméra réaliste)
    if (isWalking) {
      camera.position.y = 1.7 + Math.sin(t * 10) * 0.03;
    }

    if (phase === "intro") {
      camera.position.z -= 0.06;
      setIsWalking(true);
      if (camera.position.z < 16.5) setPhase("at_door");
    }

    if (phase === "at_door") {
      setIsWalking(false);
      if (keys["w"] || keys["arrowup"] || keys[" "]) {
        setPhase("entering");
        playSound('open');
      }
    }

    if (phase === "entering") {
      if (mainDoorRef.current) mainDoorRef.current.rotation.y = THREE.MathUtils.lerp(mainDoorRef.current.rotation.y, -Math.PI/1.8, 0.04);
      camera.position.z -= 0.08;
      if (camera.position.z < 10) setPhase("explore");
    }

    if (phase === "explore") {
      const speed = 0.12;
      const move = keys["w"] || keys["s"] || keys["a"] || keys["d"] || keys["arrowup"] || keys["arrowdown"] || keys["arrowleft"] || keys["arrowright"];
      setIsWalking(move);

      if (keys["w"] || keys["arrowup"]) camera.position.z -= speed;
      if (keys["s"] || keys["arrowdown"]) camera.position.z += speed;
      if (keys["a"] || keys["arrowleft"]) camera.position.x -= speed;
      if (keys["d"] || keys["arrowright"]) camera.position.x += speed;

      if (move) {
        stepTimer.current += delta;
        if (stepTimer.current > 0.5) { playSound('step'); stepTimer.current = 0; }
      }
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -14, 14);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -60, 11);
    }
  });

  return (
    <>
      <FirstPersonHands isWalking={isWalking} isOpening={phase === "entering"} />
      
      {(phase === "intro" || phase === "at_door") && (
        <>
          <Sky sunPosition={[100, 10, 100]} />
          <Stars radius={100} depth={50} count={5000} factor={4} />
        </>
      )}

      <group position={[0, 0, 12]}>
        <mesh position={[0, 5, -0.2]}>
           <boxGeometry args={[40, 20, 1]} />
           <meshStandardMaterial color="#050505" />
        </mesh>
        <Text position={[0, 8.5, 0.6]} fontSize={1.2} color="#2dd4bf">GALERIE LISIBLE</Text>
        <group position={[0, 0, 0]} ref={mainDoorRef}>
           <mesh position={[1.5, 2.5, 0.1]}>
              <boxGeometry args={[3, 5, 0.25]} />
              <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.1} />
           </mesh>
        </group>
      </group>

      <group position={[0, 2.4, 0]}>
        {texts.map((txt, i) => (
          <TextDoor 
            key={txt.id} 
            txt={txt} 
            position={[(i % 2 === 0 ? -7.5 : 7.5), 0, -i * 7]} 
            onNear={setTargetText}
          />
        ))}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color={phase === "intro" ? "#ffffff" : "#020202"} metalness={0.2} roughness={0.8} />
      </mesh>
      <Sparkles count={1200} scale={60} size={2} speed={0.4} color="white" />
    </>
  );
}

// --- EXPORT ---
export default function GalerieVirtuelle() {
  const [phase, setPhase] = useState("intro");
  const [texts, setTexts] = useState([]);
  const [targetText, setTargetText] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/github-db?type=library").then(res => res.json()).then(data => {
      setTexts(Array.isArray(data.content) ? data.content.slice(0, 20) : []);
    });
  }, []);

  const handleOpenDoor = () => {
    if (targetText) {
      playSound('open');
      router.push(`/texts/${targetText.id}`);
    }
  };

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      <FogOverlay active={phase === "entering"} />
      
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 1.7, 45]} fov={50} />
        <Suspense fallback={null}>
          <SceneManager phase={phase} setPhase={setPhase} texts={texts} setTargetText={setTargetText} />
          <ambientLight intensity={0.4} />
          <pointLight position={[0, 10, 15]} intensity={1.5} color="#2dd4bf" />
          <EffectComposer>
            <Bloom intensity={1.5} />
            <Vignette darkness={0.8} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-12">
        <div className="text-center">
          <h1 className="text-teal-500 font-black tracking-[0.6em] text-2xl uppercase">Lisible 3D</h1>
          {phase === "at_door" && <p className="text-white animate-pulse mt-6 font-mono text-sm tracking-widest">APPUYEZ SUR [W] POUR ENTRER</p>}
        </div>

        {targetText && phase === "explore" && (
          <div className="animate-in fade-in slide-in-from-bottom-8 flex flex-col items-center gap-6">
            <p className="text-white font-serif italic text-3xl bg-black/60 backdrop-blur-md px-10 py-4 rounded-2xl border border-white/10">
              {targetText.title}
            </p>
            <button 
              onClick={handleOpenDoor}
              className="pointer-events-auto bg-teal-500 hover:bg-teal-400 text-black font-black px-12 py-5 rounded-full flex items-center gap-4 shadow-[0_0_50px_rgba(45,212,191,0.4)] transition-all scale-110"
            >
              <Fingerprint size={24} /> OUVRIR LA PORTE
            </button>
          </div>
        )}

        <div className="w-full flex justify-between items-end opacity-40">
          <div className="font-mono text-[10px] text-teal-700 leading-loose">
            SYSTEM: OK <br />
            AMBIENT: {phase === "intro" ? "EXT_SNOW" : "INT_GALLERY"} <br />
            FPS: 60
          </div>
          <div className="flex gap-3">
            {['W','A','S','D'].map(k => <kbd key={k} className="border border-teal-900 px-3 py-1.5 text-teal-800 rounded-lg text-xs">{k}</kbd>)}
          </div>
        </div>
      </div>
    </div>
  );
}
