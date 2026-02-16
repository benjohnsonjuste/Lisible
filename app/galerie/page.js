"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  Float, Text, ContactShadows, OrbitControls, 
  MeshWobbleMaterial, Sparkles, Stars, Environment 
} from "@react-three/drei";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Headphones, Expand } from "lucide-react";

// --- MOTEUR AUDIO (Génère une note pure au clic) ---
const playCrystalNote = (freq) => {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq || 440, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } catch (e) { console.warn("Audio bloqué"); }
};

// --- COMPOSANT STÈLE 3D ---
function Stele({ txt, position, index }) {
  const mesh = useRef();
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  
  // Utilise la fréquence unique générée par ton API github-db
  const freq = txt.audio_frequency || (440 + index * 20);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.y = Math.sin(t * 0.2 + index) * 0.05;
    const s = hovered ? 1.1 : 1;
    mesh.current.scale.lerp({ x: s, y: s, z: s }, 0.1);
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
      <group 
        position={position}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={() => {
          playCrystalNote(freq);
          setTimeout(() => router.push(`/texts/${txt.id}`), 300);
        }}
      >
        <mesh ref={mesh} castShadow>
          <boxGeometry args={[0.8, 3.5, 0.1]} />
          <MeshWobbleMaterial 
            color={hovered ? "#14b8a6" : "#0f172a"} 
            factor={hovered ? 0.4 : 0.05} 
            speed={1.5} 
          />
        </mesh>
        <Text
          position={[0, 2.5, 0.1]}
          fontSize={0.18}
          color="#0f172a"
          maxWidth={2}
          textAlign="center"
          fontStyle="italic"
          fontWeight="900"
        >
          {txt.title.toUpperCase()}
        </Text>
      </group>
    </Float>
  );
}

// --- PAGE COMPLÈTE ---
export default function GaleriePage() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/github-db?type=library");
        const data = await res.json();
        if (data && data.content) {
          // On prend les 18 dernières œuvres pour un cercle complet
          setTexts(data.content.slice(0, 18));
        }
      } catch (e) {
        console.error("Erreur de chargement 3D");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FCFBF9]">
      <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Construction de l'espace 3D...</p>
    </div>
  );

  return (
    <main className="h-screen w-full bg-[#FCFBF9] relative overflow-hidden">
      {/* Interface utilisateur (UI Overlay) */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8 md:p-12">
        <header className="flex justify-between items-start pointer-events-auto">
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-4 bg-white/80 backdrop-blur-xl p-2 pr-6 rounded-full border border-slate-100 shadow-2xl hover:bg-teal-50 transition-all"
          >
            <div className="bg-slate-900 p-3 rounded-full text-white group-hover:bg-teal-600 transition-colors">
              <ArrowLeft size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Retour</span>
          </button>

          <div className="text-right hidden md:block">
            <h1 className="text-7xl font-black italic tracking-tighter text-slate-900 leading-none">Lisible.</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-600 mt-2">Galerie Virtuelle Lisible</p>
          </div>
        </header>

        <footer className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-sm pointer-events-auto">
            <div className="flex items-center gap-3 mb-3 text-teal-600">
              <Headphones size={18} />
              <span className="text-[9px] font-black uppercase tracking-widest">Expérience Sonore Active</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
              Explorez les manuscrits suspendus. Cliquez pour ouvrir l'œuvre.
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
            <span>{texts.length} OBJETS DÉPLOYÉS</span>
          </div>
        </footer>
      </div>

      {/* Scène 3D */}
      <Canvas shadows camera={{ position: [0, 2, 12], fov: 40 }}>
        <color attach="background" args={["#FCFBF9"]} />
        <fog attach="fog" args={["#FCFBF9", 10, 25]} />
        
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <spotLight position={[10, 20, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
          <pointLight position={[-10, -5, -10]} color="#14b8a6" intensity={1} />

          <group position={[0, -1, 0]}>
            {texts.map((txt, i) => {
              // Positionnement en cercle parfait
              const angle = (i / texts.length) * Math.PI * 2;
              const radius = 9;
              return (
                <Stele 
                  key={txt.id} 
                  txt={txt} 
                  index={i}
                  position={[
                    Math.sin(angle) * radius,
                    0.5,
                    Math.cos(angle) * radius
                  ]} 
                />
              );
            })}
            
            <ContactShadows position={[0, -0.1, 0]} opacity={0.3} scale={30} blur={2} far={4} />
          </group>

          {/* Effets d'ambiance */}
          <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
          <Sparkles count={150} scale={20} size={1.5} speed={0.3} color="#14b8a6" />
          
          <OrbitControls 
            enablePan={false}
            enableZoom={true}
            minDistance={6}
            maxDistance={15}
            autoRotate
            autoRotateSpeed={0.4}
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 2.5}
          />
        </Suspense>
      </Canvas>
    </main>
  );
}
