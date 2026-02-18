"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  Text, PerspectiveCamera, Sparkles, 
  MeshTransmissionMaterial, Float 
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { useRouter } from "next/navigation";
import { Loader2, ArrowUp, ArrowLeft, ArrowRight, ArrowDown } from "lucide-react";
import * as THREE from "three";

// --- GÉNÉRATEUR DE SONS SYNTHÉTIQUES (Zéro fichier externe) ---
const playSynth = (type) => {
  if (typeof window === "undefined") return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'step') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  } else if (type === 'door') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 1.2);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    osc.start(); osc.stop(ctx.currentTime + 1.2);
  }
};

// --- COMPOSANT PORTE ---
function TextDoor({ txt, position }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      <mesh 
        onPointerOver={() => (setHovered(true), document.body.style.cursor = "pointer")}
        onPointerOut={() => (setHovered(false), document.body.style.cursor = "auto")}
        onClick={() => {
            playSynth('door');
            router.push(`/texts/${txt.id}`);
        }}
      >
        <boxGeometry args={[2.5, 4.5, 0.1]} />
        <MeshTransmissionMaterial 
          thickness={0.5} 
          anisotropy={0.1}
          chromaticAberration={0.04}
          color={hovered ? "#5eead4" : "#0a0a0a"} 
          transmission={0.9}
        />
        
        <Text position={[0, 2.8, 0]} fontSize={0.22} color="white" fontWeight="900">
          {txt.title.toUpperCase()}
        </Text>

        {hovered && (
          <group position={[0, -0.5, 0.2]}>
            <mesh><sphereGeometry args={[0.1]} /><meshBasicMaterial color="#2dd4bf" /></mesh>
            <Text position={[0, -0.4, 0]} fontSize={0.12} color="white">CLIQUER POUR OUVRIR</Text>
          </group>
        )}
      </mesh>
    </group>
  );
}

// --- LOGIQUE DE NAVIGATION ---
function SceneManager({ phase, setPhase, texts }) {
  const { camera } = useThree();
  const doorRef = useRef();
  const [keys, setKeys] = useState({});
  const stepInterval = useRef(0);

  useEffect(() => {
    const handleKey = (e) => setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: e.type === "keydown" }));
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);
    return () => { window.removeEventListener("keydown", handleKey); window.removeEventListener("keyup", handleKey); };
  }, []);

  useFrame((state, delta) => {
    if (phase === "intro") {
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 15, 0.02);
      if (camera.position.z < 15.2) setPhase("door");
    }

    if (phase === "door") {
      if (doorRef.current) doorRef.current.rotation.y = THREE.MathUtils.lerp(doorRef.current.rotation.y, -Math.PI/1.5, 0.02);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 8, 0.02);
      if (camera.position.z < 8.2) setPhase("explore");
    }

    if (phase === "explore") {
      const speed = 0.12;
      const isMoving = keys["w"] || keys["s"] || keys["a"] || keys["d"] || keys["arrowup"] || keys["arrowdown"] || keys["arrowleft"] || keys["arrowright"];
      
      if (keys["w"] || keys["arrowup"]) camera.position.z -= speed;
      if (keys["s"] || keys["arrowdown"]) camera.position.z += speed;
      if (keys["a"] || keys["arrowleft"]) camera.position.x -= speed;
      if (keys["d"] || keys["arrowright"]) camera.position.x += speed;

      if (isMoving) {
        stepInterval.current += delta;
        if (stepInterval.current > 0.5) { playSynth('step'); stepInterval.current = 0; }
      }
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -10, 10);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -20, 12);
    }
  });

  return (
    <>
      <group position={[0, 0, 12]} ref={doorRef}>
        <mesh position={[1.25, 2.25, 0]}>
          <boxGeometry args={[2.5, 4.5, 0.2]} />
          <meshStandardMaterial color="#050505" metalness={1} roughness={0.1} />
          <Text position={[0, 1, 0.12]} fontSize={0.4} color="#2dd4bf">LISIBLE</Text>
        </mesh>
      </group>

      <group position={[0, 2.25, 0]}>
        {texts.map((txt, i) => (
          <TextDoor key={txt.id} txt={txt} position={[(i % 2 === 0 ? -6 : 6), 0, -i * 5]} />
        ))}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#020202" roughness={0.1} metalness={0.8} />
      </mesh>
    </>
  );
}

// --- EXPORT PRINCIPAL ---
export default function GalerieVirtuelle() {
  const [phase, setPhase] = useState("intro");
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Connexion directe à votre API github-db
    fetch("/api/github-db?type=library")
      .then(res => res.json())
      .then(data => {
        const content = Array.isArray(data.content) ? data.content : [];
        setTexts(content.slice(0, 12));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      <Loader2 className="animate-spin text-teal-400" size={32} />
    </div>
  );

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 1.7, 40]} fov={45} />
        <fog attach="fog" args={["#000", 5, 30]} />
        <Suspense fallback={null}>
          <SceneManager phase={phase} setPhase={setPhase} texts={texts} />
          <ambientLight intensity={0.4} />
          <pointLight position={[0, 10, 5]} intensity={2} color="#2dd4bf" />
          <Sparkles count={200} scale={20} size={2} color="#2dd4bf" />
          <EffectComposer>
            <Bloom intensity={1.5} luminanceThreshold={0.1} />
            <Vignette darkness={0.8} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* Interface HUD */}
      <div className="absolute top-10 left-10 pointer-events-none">
        <h1 className="text-teal-500 font-black text-2xl tracking-tighter italic">LISIBLE / VIRTUAL_GALLERY</h1>
        <p className="text-teal-900 font-mono text-[10px] uppercase tracking-widest">Status: {phase}</p>
      </div>

      {phase === "explore" && (
        <div className="absolute bottom-10 right-10 flex gap-4 items-center bg-black/50 p-4 rounded-full border border-teal-900">
          <ArrowUp className="text-teal-500 animate-bounce" size={20} />
          <span className="text-teal-500 font-mono text-[10px] uppercase">Utilisez ZQSD pour marcher</span>
        </div>
      )}
    </div>
  );
}
