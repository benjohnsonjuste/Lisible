"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  Float, Text, ContactShadows, OrbitControls, 
  MeshWobbleMaterial, Sparkles, Environment 
} from "@react-three/drei";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// --- MOTEUR AUDIO CRISTALLIN ---
const playNote = (freq) => {
  if (typeof window === "undefined") return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq || 440, ctx.currentTime);
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 1);
};

// --- COMPOSANT PILIER (STÈLE) ---
function Stele({ txt, position, index }) {
  const mesh = useRef();
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  
  // Utilise la fréquence stockée en DB ou en génère une basée sur l'index
  const freq = txt.audio_frequency || (440 + index * 20);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    mesh.current.rotation.y = Math.sin(time * 0.2) * 0.1 + (index * 0.5);
    
    // Animation fluide au survol
    const s = hovered ? 1.15 : 1;
    mesh.current.scale.lerp({ x: s, y: s, z: s }, 0.1);
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group 
        position={position}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = 'pointer';
          playNote(freq / 2); // Note plus basse au survol
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={() => {
          playNote(freq); // Note claire au clic
          setTimeout(() => router.push(`/texts/${txt.id}`), 250);
        }}
      >
        <mesh ref={mesh} castShadow>
          <boxGeometry args={[0.9, 3.2, 0.15]} />
          <MeshWobbleMaterial 
            color={hovered ? "#14b8a6" : "#0f172a"} 
            factor={hovered ? 0.5 : 0.05} 
            speed={2} 
          />
        </mesh>

        <Text
          position={[0, 2.3, 0.2]}
          fontSize={0.16}
          color={hovered ? "#14b8a6" : "#475569"}
          maxWidth={1.5}
          textAlign="center"
          fontStyle="italic"
          fontWeight="900"
          anchorY="middle"
        >
          {txt.title.substring(0, 25)}
        </Text>
      </group>
    </Float>
  );
}

// --- COMPOSANT PRINCIPAL ---
export default function GalerieVirtuelle() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/github-db?type=library");
        const data = await res.json();
        if (data && data.content) {
          // On affiche les 12 dernières œuvres pour garder de la fluidité
          setTexts(data.content.slice(0, 12));
        }
      } catch (err) {
        console.error("Erreur Galerie:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="w-full h-[500px] flex flex-col items-center justify-center bg-[#FCFBF9] rounded-[3rem] border border-slate-100">
      <Loader2 className="animate-spin text-teal-600 mb-4" size={32} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Ouverture du portail 3D...</p>
    </div>
  );

  return (
    <div className="w-full h-[600px] bg-white rounded-[3.5rem] overflow-hidden border border-slate-100 shadow-2xl relative">
      <Canvas shadows camera={{ position: [0, 2, 12], fov: 35 }}>
        <color attach="background" args={["#FCFBF9"]} />
        <fog attach="fog" args={["#FCFBF9", 8, 22]} />
        
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} castShadow intensity={2} />
          <pointLight position={[-10, -10, -10]} color="#14b8a6" intensity={1} />

          <group position={[0, -1, 0]}>
            {texts.map((txt, i) => {
              // Calcul de la position en arc de cercle
              const radius = 9;
              const angle = (i / (texts.length - 1) - 0.5) * Math.PI * 0.5;
              const x = Math.sin(angle) * radius;
              const z = Math.cos(angle) * radius - radius;
              
              return (
                <Stele 
                  key={txt.id} 
                  txt={txt} 
                  index={i} 
                  position={[x, 0.5, z]} 
                />
              );
            })}
            
            <ContactShadows 
              position={[0, -0.01, 0]} 
              opacity={0.4} 
              scale={20} 
              blur={2.4} 
              far={4.5} 
            />
          </group>

          <Sparkles count={100} scale={15} size={1.5} speed={0.4} color="#14b8a6" />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            minPolarAngle={Math.PI / 2.4}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>

      {/* Interface minimaliste superposée */}
      <div className="absolute top-8 left-10 pointer-events-none">
        <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-900 italic">Vision Archive</h3>
        <div className="w-8 h-1 bg-teal-500 mt-1" />
      </div>

      <div className="absolute bottom-8 right-10 flex flex-col items-end pointer-events-none">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Interactif : Pivot & Clic</p>
      </div>
    </div>
  );
}
