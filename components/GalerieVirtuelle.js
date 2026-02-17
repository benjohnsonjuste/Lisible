"use client";
import React, { useEffect, useState, useRef, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  Float, Text, ContactShadows, OrbitControls, 
  MeshTransmissionMaterial, Sparkles, Environment,
  PerspectiveCamera, Float as FloatDrei
} from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import * as THREE from "three";

// --- MOTEUR AUDIO SPATIALISÉ ---
function Sound({ url, hovered }) {
  const sound = useRef();
  const { camera } = useThree();
  const [listener] = useState(() => new THREE.AudioListener());
  const buffer = useMemo(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    // On génère un signal pur (oscillation) au lieu d'un fichier pour la réactivité
    return null; 
  }, []);

  // Note synthétique propre à chaque stèle
  const playSynth = (freq) => {
    const ctx = listener.context;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  return null; // Interface placeholder pour l'audio spatial
}

// --- STÈLE EN CRISTAL LIQUIDE ---
function Stele({ txt, position, index, total }) {
  const mesh = useRef();
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  
  // Physique des matériaux haut de gamme
  const config = {
    backside: true,
    samples: 16,
    resolution: 256,
    transmission: 1,
    roughness: 0.1,
    clearcoat: 1,
    thickness: 0.5,
    ior: 1.5,
    chromaticAberration: 0.1,
    anisotropy: 0.1,
    distortion: 0.2,
    distortionScale: 0.2,
    temporalDistortion: 0.1,
    color: hovered ? "#2dd4bf" : "#ffffff",
  };

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    mesh.current.position.y = Math.sin(t + index) * 0.1;
    mesh.current.rotation.y = Math.cos(t * 0.5 + index) * 0.05;
  });

  return (
    <group position={position}>
      <Float speed={3} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh
          ref={mesh}
          onPointerOver={() => (setHovered(true), (document.body.style.cursor = "pointer"))}
          onPointerOut={() => (setHovered(false), (document.body.style.cursor = "auto"))}
          onClick={() => router.push(`/texts/${txt.id}`)}
          castShadow
        >
          <boxGeometry args={[1, 3.5, 0.2]} />
          <MeshTransmissionMaterial {...config} />
          
          {/* Lueur interne (Core) */}
          <mesh scale={[0.9, 0.95, 0.5]}>
             <boxGeometry args={[1, 3.5, 0.1]} />
             <meshStandardMaterial 
               emissive={hovered ? "#14b8a6" : "#0f172a"} 
               emissiveIntensity={hovered ? 2 : 0.5} 
               transparent 
               opacity={0.8}
             />
          </mesh>
        </mesh>

        {/* Typographie Holographique */}
        <Text
          position={[0, 0, 0.25]}
          fontSize={0.14}
          font="/fonts/Geist-Black.ttf" // Utilise une police technique si dispo
          maxWidth={0.8}
          textAlign="center"
          anchorY="middle"
          letterSpacing={0.1}
        >
          {txt.title.toUpperCase()}
          <meshStandardMaterial 
            emissive={hovered ? "#fff" : "#2dd4bf"} 
            emissiveIntensity={5} 
          />
        </Text>
      </Float>

      {/* Halo de sélection au sol */}
      {hovered && (
        <Sparkles count={20} scale={3} size={2} speed={2} color="#2dd4bf" />
      )}
    </group>
  );
}

export default function GalerieVirtuelle() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/github-db?type=library")
      .then(res => res.json())
      .then(data => {
        setTexts(data.content?.slice(0, 15) || []);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="w-full h-[600px] flex flex-col items-center justify-center bg-[#020617] rounded-[3rem]">
      <div className="relative">
        <Loader2 className="animate-spin text-teal-400" size={48} />
        <Zap className="absolute inset-0 m-auto text-teal-200 animate-pulse" size={16} />
      </div>
      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.5em] text-teal-500/50">Initialisation de la matrice</p>
    </div>
  );

  return (
    <div className="w-full h-[700px] bg-[#020617] rounded-[4rem] overflow-hidden relative shadow-[0_0_100px_rgba(20,184,166,0.1)] border border-white/5">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 2, 12]} fov={40} />
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 10, 25]} />
        
        <Suspense fallback={null}>
          {/* Éclairage Cinématique */}
          <Environment preset="night" />
          <rectAreaLight width={10} height={10} intensity={5} position={[5, 5, 5]} color="#2dd4bf" />
          <spotLight position={[0, 10, 0]} intensity={2} penumbra={1} castShadow />

          <group position={[0, -1, 0]}>
            {texts.map((txt, i) => {
              const angle = (i / texts.length) * Math.PI * 2;
              const radius = 8;
              const x = Math.cos(angle) * radius;
              const z = Math.sin(angle) * radius;
              
              return (
                <Stele 
                  key={txt.id} 
                  txt={txt} 
                  index={i} 
                  position={[x, 1, z]} 
                  total={texts.length}
                />
              );
            })}
          </group>

          {/* Particules d'ambiance (effet poussière laser) */}
          <Sparkles count={200} scale={20} size={0.6} speed={0.2} color="#2dd4bf" opacity={0.5} />
          
          <ContactShadows position={[0, -1.5, 0]} opacity={0.8} scale={30} blur={3} far={10} color="#000000" />
          
          <OrbitControls 
            autoRotate 
            autoRotateSpeed={0.5} 
            enableZoom={false} 
            maxPolarAngle={Math.PI / 2.1} 
            minPolarAngle={Math.PI / 2.5} 
          />

          {/* Post-traitement pour le look High-Tech */}
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.4} />
            <ChromaticAberration offset={[0.001, 0.001]} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* Overlay UI (HUD) */}
      <div className="absolute inset-0 pointer-events-none border-[20px] border-[#020617]">
         <div className="absolute top-12 left-12 flex items-center gap-4">
            <div className="h-10 w-[2px] bg-teal-500 animate-pulse" />
            <div>
              <h2 className="text-white font-black text-xs tracking-[0.6em] uppercase">Archive Scanner v2.0</h2>
              <p className="text-teal-500/50 text-[8px] font-mono tracking-widest uppercase">Node: {texts.length} / Active_Streams</p>
            </div>
         </div>

         {/* Scanner de lecture en bas */}
         <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-64 h-[1px] bg-gradient-to-r from-transparent via-teal-500 to-transparent">
            <div className="absolute -top-1 left-0 w-full h-2 bg-teal-400/10 blur-sm" />
         </div>
      </div>

      {/* Dégradé de profondeur sur les bords */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_black]" />
    </div>
  );
}
