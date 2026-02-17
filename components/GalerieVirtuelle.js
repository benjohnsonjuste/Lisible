"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  Float, Text, ContactShadows, OrbitControls, 
  MeshTransmissionMaterial, Sparkles, PerspectiveCamera,
  Environment, MeshDistortMaterial
} from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// --- STÈLE HOLOGRAPHIQUE ---
function HolographicStele({ txt, position, index }) {
  const mesh = useRef();
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Petite lévitation fluide
    mesh.current.position.y = position[1] + Math.sin(t + index) * 0.1;
  });

  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
        <mesh
          ref={mesh}
          onPointerOver={() => (setHovered(true), (document.body.style.cursor = "pointer"))}
          onPointerOut={() => (setHovered(false), (document.body.style.cursor = "auto"))}
          onClick={() => router.push(`/texts/${txt.id}`)}
        >
          <boxGeometry args={[0.8, 3, 0.05]} />
          {/* Matériau Cristal Teal (comme sur l'image) */}
          <MeshTransmissionMaterial 
            backside
            samples={4}
            thickness={0.2}
            chromaticAberration={0.05}
            anisotropy={0.1}
            distortion={0.1}
            distortionScale={0.1}
            temporalDistortion={0.1}
            color={hovered ? "#5eead4" : "#14b8a6"}
            attenuationDistance={0.5}
            attenuationColor="#ffffff"
            transmission={1}
          />

          {/* Cœur lumineux interne (le trait vertical) */}
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[0.02, 2.5]} />
            <meshStandardMaterial 
              emissive="#2dd4bf" 
              emissiveIntensity={hovered ? 10 : 2} 
              transparent 
              opacity={0.8}
            />
          </mesh>
        </mesh>

        {/* Texte Holographique Vertical/Centre */}
        <Text
          position={[0, 0, 0.1]}
          fontSize={0.12}
          color="white"
          maxWidth={0.7}
          textAlign="center"
          fontStyle="italic"
          fontWeight="900"
          anchorY="middle"
        >
          {txt.title.toUpperCase()}
          <meshStandardMaterial emissive="white" emissiveIntensity={2} />
        </Text>
      </Float>

      {/* Halo lumineux à la base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
        <planeGeometry args={[1.2, 1.2]} />
        <meshBasicMaterial color="#14b8a6" transparent opacity={hovered ? 0.3 : 0.1} />
      </mesh>
    </group>
  );
}

// --- COMPOSANT PRINCIPAL ---
export default function GalerieScanner() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/github-db?type=library")
      .then(res => res.json())
      .then(data => {
        setTexts(data.content?.slice(0, 12) || []);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="w-full h-[600px] flex flex-col items-center justify-center bg-[#050505] rounded-[3rem]">
      <Loader2 className="animate-spin text-teal-400 mb-4" size={32} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-900">Synchronisation Matrix...</p>
    </div>
  );

  return (
    <div className="w-full h-[700px] bg-black rounded-[4rem] overflow-hidden relative shadow-2xl border border-white/5">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 1.5, 10]} fov={35} />
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 8, 20]} />
        
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <pointLight position={[0, 10, 0]} intensity={1.5} color="#2dd4bf" />

          <group position={[0, -0.5, 0]}>
            {texts.map((txt, i) => {
              // Disposition en arc de cercle frontale
              const spacing = 2;
              const x = (i - (texts.length - 1) / 2) * spacing;
              const z = -Math.abs(x) * 0.5; // Effet courbe vers l'arrière
              
              return (
                <HolographicStele 
                  key={txt.id} 
                  txt={txt} 
                  index={i} 
                  position={[x, 1, z]} 
                />
              );
            })}
            
            {/* Sol Miroir Noir */}
            <ContactShadows 
              position={[0, -0.5, 0]} 
              opacity={0.6} 
              scale={40} 
              blur={2} 
              far={10} 
              color="#14b8a6" 
            />
          </group>

          {/* Particules Teal en suspension */}
          <Sparkles count={150} scale={15} size={1} speed={0.3} color="#2dd4bf" />
          
          <OrbitControls 
            enableZoom={false} 
            maxPolarAngle={Math.PI / 2} 
            minPolarAngle={Math.PI / 2.5}
            enablePan={false}
          />

          {/* Rendu Post-Processing (Bloom + HUD Look) */}
          <EffectComposer>
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} radius={0.4} />
            <Noise opacity={0.05} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* --- INTERFACE HUD (OVERLAY) --- */}
      <div className="absolute inset-0 pointer-events-none p-12 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-teal-400 font-black text-xs tracking-[0.5em] uppercase">Archive Scanner v2.0</h2>
            <p className="text-teal-900 text-[8px] font-mono tracking-widest uppercase">NODE: {texts.length} / ACTIVE_STREAMS</p>
          </div>
          <div className="h-8 w-8 border border-teal-500/20 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-teal-500 rounded-full animate-ping" />
          </div>
        </div>

        {/* Barre de scan inférieure */}
        <div className="w-full flex flex-col items-center">
          <div className="w-64 h-[2px] bg-teal-950 relative overflow-hidden">
             <div className="absolute top-0 left-0 h-full w-1/3 bg-teal-400 shadow-[0_0_15px_#2dd4bf] animate-[scan_2s_linear_infinite]" />
          </div>
          <p className="mt-4 text-[7px] text-teal-800 font-mono tracking-[0.8em] uppercase">Ready for selective extraction</p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
