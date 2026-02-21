"use client";
import React, { Suspense, useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  PerspectiveCamera, Environment, MeshTransmissionMaterial, 
  Sky, ContactShadows, Text, Float, Sparkles, Fog
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from "@react-three/postprocessing";
import { useRouter } from "next/navigation";
import { Fingerprint, ThermometerSnowflake, Loader2, ChevronRight } from "lucide-react";
import * as THREE from "three";

// --- 1. GÉNÉRATION DES MAINS GANTÉES (PROCÉDURAL) ---
function VRHands({ walking, phase }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.position.y = walking ? Math.sin(t * 10) * 0.02 - 0.45 : -0.45;
    ref.current.position.x = walking ? Math.cos(t * 5) * 0.015 : 0;
    if (phase === "entering") ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, -1.2, 0.05);
  });
  return (
    <group ref={ref}>
      <mesh position={[-0.6, 0, -0.8]} rotation={[0.2, 0, 0]}>
        <capsuleGeometry args={[0.07, 0.2, 4, 16]} />
        <meshStandardMaterial color="#111" roughness={1} />
      </mesh>
      <mesh position={[0.6, 0, -0.8]} rotation={[0.2, 0, 0]}>
        <capsuleGeometry args={[0.07, 0.2, 4, 16]} />
        <meshStandardMaterial color="#111" roughness={1} />
      </mesh>
    </group>
  );
}

// --- 2. LA PORTE EN BOIS (PROCÉDURAL) ---
function MainDoor({ phase }) {
  const mesh = useRef();
  useFrame(() => {
    const targetRotation = (phase === "entering" || phase === "library") ? -Math.PI / 1.8 : 0;
    mesh.current.rotation.y = THREE.MathUtils.lerp(mesh.current.rotation.y, targetRotation, 0.04);
  });
  return (
    <group position={[2.2, 0, 25]}> {/* Pivot sur le côté */}
      <mesh ref={mesh} position={[-2.1, 2.8, 0]} castShadow>
        <boxGeometry args={[4.2, 5.6, 0.3]} />
        <meshStandardMaterial color="#1a0f08" roughness={1} metalness={0} />
        <Text position={[0, 4, 0.2]} fontSize={0.3} color="#daa520" font="/fonts/Inter-Bold.woff">GALERIE LISIBLE</Text>
      </mesh>
    </group>
  );
}

// --- 3. LES PORTES DE TEXTES (GIVRÉES) ---
function TextPortal({ txt, position, onNear }) {
  const { camera } = useThree();
  const [active, setActive] = useState(false);
  useFrame(() => {
    const dist = camera.position.distanceTo(new THREE.Vector3(...position));
    if (dist < 4 && !active) { setActive(true); onNear(txt); }
    else if (dist >= 4 && active) { setActive(false); onNear(null); }
  });
  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.4}>
      <group position={position}>
        <mesh>
          <boxGeometry args={[3, 5, 0.15]} />
          <MeshTransmissionMaterial 
            backside thickness={0.4} roughness={0.05} 
            transmission={1} ior={1.3} chromaticAberration={0.05} 
            color={active ? "#2dd4bf" : "#ffffff"} 
          />
        </mesh>
        <Text position={[0, 3.2, 0.1]} fontSize={0.2} color="white" maxWidth={2} textAlign="center">
          {txt.title.toUpperCase()}
        </Text>
      </group>
    </Float>
  );
}

// --- 4. SCÈNE & LOGIQUE DE MOUVEMENT ---
function Scene({ phase, setPhase, texts, setTargetText, moveData }) {
  const { camera } = useThree();
  const isWalking = useRef(false);

  useFrame((state, delta) => {
    const speed = 0.15;
    if (phase === "intro") {
      camera.position.z -= 0.07;
      isWalking.current = true;
      if (camera.position.z < 30) setPhase("at_main_door");
    } else if (phase === "entering") {
      camera.position.z -= 0.1;
      isWalking.current = true;
      if (camera.position.z < 18) setPhase("library");
    } else if (phase === "library") {
      const mz = -moveData.y * speed;
      const mx = moveData.x * speed;
      isWalking.current = (Math.abs(mz) > 0.01 || Math.abs(mx) > 0.01);
      
      // Collisions Allée
      const nextZ = camera.position.z + mz;
      const nextX = camera.position.x + mx;
      if (nextZ < 20 && nextZ > -texts.length * 10) camera.position.z = nextZ;
      if (nextX > -8 && nextX < 8) camera.position.x = nextX;
    }
  });

  return (
    <>
      <Sky sunPosition={[0, -1, 0]} inclination={0.5} azimuth={0.25} />
      <Environment preset="night" />
      <fog attach="fog" args={["#050505", 10, 45]} />
      <Sparkles count={1500} scale={80} size={1} speed={0.4} color="white" />

      {/* RUE DE MONTRÉAL (FAÇADE) */}
      <group position={[0, 0, 25]}>
        <mesh position={[0, 10, -1.5]} receiveShadow>
          <boxGeometry args={[60, 25, 3]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
        <MainDoor phase={phase} />
      </group>

      {/* INTÉRIEUR BIBLIOTHÈQUE */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[100, 300]} />
          <meshStandardMaterial color="#050505" roughness={0.05} metalness={0.8} />
        </mesh>
        {texts.map((t, i) => (
          <TextPortal key={t.id} txt={t} position={[(i % 2 === 0 ? -7 : 7), 2.5, 12 - i * 12]} onNear={setTargetText} />
        ))}
      </group>

      <VRHands walking={isWalking.current} phase={phase} />
      <ContactShadows opacity={0.6} scale={40} blur={2} />
    </>
  );
}

// --- 5. COMPOSANT PRINCIPAL ---
export default function GalerieVirtuelle() {
  const [phase, setPhase] = useState("intro");
  const [moveData, setMoveData] = useState({ x: 0, y: 0 });
  const [targetText, setTargetText] = useState(null);
  const [texts, setTexts] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/github-db?type=library")
      .then(res => res.json())
      .then(data => setTexts(Array.isArray(data.content) ? data.content.slice(0, 15) : []));
  }, []);

  return (
    <div className="w-full h-screen bg-black overflow-hidden select-none font-sans">
      <Canvas shadows gl={{ antialias: true, toneMapping: THREE.ReinhardToneMapping }}>
        <PerspectiveCamera makeDefault position={[0, 1.7, 50]} fov={45} />
        <Suspense fallback={null}>
          <Scene phase={phase} setPhase={setPhase} texts={texts} setTargetText={setTargetText} moveData={moveData} />
          <EffectComposer>
            <Bloom intensity={1.2} luminanceThreshold={0.1} />
            <Noise opacity={0.05} />
            <Vignette darkness={0.7} />
            <ChromaticAberration offset={[0.0005, 0.0005]} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* UI OVERLAY */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
        <div className="flex justify-between items-start">
          <div className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/10 flex items-center gap-3">
            <ThermometerSnowflake className="text-blue-300 animate-pulse" />
            <span className="text-white font-serif italic text-lg tracking-widest uppercase">Montreal / VR</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          {phase === "at_main_door" && (
            <button 
              onClick={() => setPhase("entering")}
              className="pointer-events-auto group flex items-center gap-4 px-12 py-6 bg-white text-black font-black text-xl rounded-full hover:scale-110 active:scale-95 transition-all shadow-2xl"
            >
              OUVRIR LA PORTE <ChevronRight />
            </button>
          )}

          {targetText && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500 mb-12">
              <div className="bg-black/90 backdrop-blur-2xl border-t-2 border-teal-500 p-8 rounded-3xl shadow-2xl text-center mb-6 max-w-sm">
                <p className="text-teal-400 text-[10px] font-black tracking-[0.4em] mb-2 uppercase">Manuscrit</p>
                <h2 className="text-white text-2xl font-serif italic uppercase leading-tight">{targetText.title}</h2>
              </div>
              <button 
                onClick={() => router.push(`/texts/${targetText.id}`)}
                className="pointer-events-auto bg-teal-500 hover:bg-teal-400 text-black px-12 py-5 rounded-full font-black flex items-center gap-4 shadow-[0_0_40px_#2dd4bf]"
              >
                <Fingerprint size={24} /> SCANNER L'EMPREINTE
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between items-end">
          {phase === "library" && (
             <div className="w-32 h-32 rounded-full border border-white/20 bg-black/40 backdrop-blur-lg pointer-events-auto relative"
                  onPointerMove={(e) => {
                    if (e.buttons > 0) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMoveData({
                        x: (e.clientX - rect.left - rect.width/2) / (rect.width/2),
                        y: (e.clientY - rect.top - rect.height/2) / (rect.height/2)
                      });
                    }
                  }}
                  onPointerUp={() => setMoveData({x:0, y:0})}>
                <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-teal-400 rounded-full shadow-[0_0_15px_#2dd4bf]" />
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
