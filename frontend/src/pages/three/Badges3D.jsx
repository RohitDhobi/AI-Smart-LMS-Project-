import React, { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Text, Html, Torus, Ring } from "@react-three/drei";
import * as THREE from "three";

/* ── Trophy ──────────────────────────────────────────────── */

function Trophy({ position, color, label, unlocked }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.elapsedTime * 0.8;
      groupRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * 1.2) * 0.12;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Base */}
      <RoundedBox args={[0.9, 0.25, 0.9]} radius={0.06} smoothness={4} position={[0, -0.6, 0]} castShadow>
        <meshStandardMaterial color={unlocked ? color : "#374151"} roughness={0.3} metalness={0.4} />
      </RoundedBox>

      {/* Stem */}
      <RoundedBox args={[0.2, 0.6, 0.2]} radius={0.04} smoothness={4} position={[0, -0.15, 0]} castShadow>
        <meshStandardMaterial color={unlocked ? color : "#4b5563"} roughness={0.3} metalness={0.4} />
      </RoundedBox>

      {/* Cup body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.3, 0.7, 16]} />
        <meshStandardMaterial color={unlocked ? color : "#6b7280"} roughness={0.2} metalness={0.5} />
      </mesh>

      {/* Handles */}
      {[-1, 1].map((side) => (
        <Torus key={side} args={[0.18, 0.04, 8, 16]} position={[side * 0.52, 0.55, 0]} rotation={[0, 0, side * 0.3]} castShadow>
          <meshStandardMaterial color={unlocked ? color : "#6b7280"} roughness={0.2} metalness={0.5} />
        </Torus>
      ))}

      {/* Rim */}
      <mesh position={[0, 0.85, 0]}>
        <torusGeometry args={[0.44, 0.03, 8, 32]} />
        <meshStandardMaterial color={unlocked ? "#ffd700" : "#555"} roughness={0.15} metalness={0.7} />
      </mesh>

      {/* Star on front */}
      {unlocked && (
        <Html position={[0, 0.5, 0.46]} center style={{ pointerEvents: "none" }}>
          <div style={{ fontSize: 28 }}>⭐</div>
        </Html>
      )}

      {/* Label */}
      <Html position={[0, -1.1, 0]} center style={{ pointerEvents: "none" }}>
        <div style={{
          background: unlocked ? "rgba(15,23,42,0.9)" : "rgba(30,30,40,0.8)",
          color: unlocked ? "#fff" : "#6b7280",
          padding: "6px 14px",
          borderRadius: 10,
          border: `1px solid ${unlocked ? "rgba(255,215,0,0.3)" : "rgba(100,100,100,0.2)"}`,
          textAlign: "center",
          fontSize: 12,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}>
          {unlocked ? "🔓" : "🔒"} {label}
        </div>
      </Html>

      {/* Glow ring for unlocked */}
      {unlocked && (
        <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.6, 0.015, 8, 64]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={1.5} transparent opacity={0.6} />
        </mesh>
      )}

      <pointLight position={[0, 1.5, 0]} intensity={unlocked ? 0.5 : 0.1} distance={4} color={unlocked ? "#ffd700" : "#444"} />
    </group>
  );
}

/* ── Medal ───────────────────────────────────────────────── */

function Medal({ position, color, label, unlocked, emoji }) {
  const ref = useRef();

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.6) * 0.5;
      ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.9 + position[0]) * 0.1;
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* Ribbon */}
      <RoundedBox args={[0.4, 0.5, 0.08]} radius={0.04} smoothness={4} position={[0, 0.5, 0]} castShadow>
        <meshStandardMaterial color={unlocked ? color : "#374151"} roughness={0.4} />
      </RoundedBox>

      {/* Medal disc */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.08, 32]} />
        <meshStandardMaterial color={unlocked ? color : "#555"} roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Edge ring */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.025, 8, 32]} />
        <meshStandardMaterial color={unlocked ? "#ffd700" : "#444"} roughness={0.15} metalness={0.7} />
      </mesh>

      {/* Emoji */}
      <Html position={[0, 0, 0.06]} center style={{ pointerEvents: "none" }}>
        <div style={{ fontSize: 24 }}>{unlocked ? emoji : "🔒"}</div>
      </Html>

      {/* Label */}
      <Html position={[0, -0.7, 0]} center style={{ pointerEvents: "none" }}>
        <div style={{
          background: "rgba(15,23,42,0.9)",
          color: unlocked ? "#fff" : "#6b7280",
          padding: "5px 12px",
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: "nowrap",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          {label}
        </div>
      </Html>
    </group>
  );
}

/* ── Scene ───────────────────────────────────────────────── */

function BadgesScene() {
  const trophies = [
    { position: [-3, 0.7, 0], color: "#ffd700", label: "First Course", unlocked: true },
    { position: [-1, 0.7, 0], color: "#c0c0c0", label: "Quiz Master", unlocked: true },
    { position: [1, 0.7, 0], color: "#cd7f32", label: "Speed Learner", unlocked: true },
    { position: [3, 0.7, 0], color: "#4f46e5", label: "Perfect Score", unlocked: false },
  ];

  const medals = [
    { position: [-2.5, 0, 3], color: "#ef4444", label: "Early Bird", unlocked: true, emoji: "🐦" },
    { position: [-0.8, 0, 3], color: "#22c55e", label: "Streak 7", unlocked: true, emoji: "🔥" },
    { position: [0.8, 0, 3], color: "#3b82f6", label: "Helper", unlocked: true, emoji: "🤝" },
    { position: [2.5, 0, 3], color: "#a855f7", label: "Explorer", unlocked: false, emoji: "🧭" },
  ];

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
      <hemisphereLight args={["#ffd700", "#1a1a2e", 0.2]} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[10, 64]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Title */}
      <Html position={[0, 4, 0]} center style={{ pointerEvents: "none" }}>
        <div style={{ background: "rgba(15,23,42,0.9)", color: "#ffd700", padding: "12px 24px", borderRadius: 14, border: "1px solid rgba(255,215,0,0.3)", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>🏆 Achievement Gallery</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Your unlocked achievements</div>
        </div>
      </Html>

      {trophies.map((t, i) => <Trophy key={`t-${i}`} {...t} />)}
      {medals.map((m, i) => <Medal key={`m-${i}`} {...m} />)}

      <OrbitControls makeDefault minDistance={5} maxDistance={16} enableDamping maxPolarAngle={Math.PI / 2.1} />
    </>
  );
}

export default function Badges3D() {
  return (
    <div style={{ width: "100%", height: "calc(100vh - 60px)", position: "relative", background: "#0a1628" }}>
      <div style={{
        position: "absolute",
        top: 16,
        left: 20,
        zIndex: 10,
        background: "rgba(15,23,42,0.85)",
        backdropFilter: "blur(10px)",
        padding: "14px 22px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#fff",
      }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>🏆 3D Achievement Gallery</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
          Trophies & medals • Drag to rotate
        </p>
      </div>
      <Canvas shadows camera={{ position: [6, 5, 8], fov: 42 }} gl={{ antialias: true }} onCreated={({ gl }) => { gl.setClearColor("#0a1628"); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.shadowMap.type = THREE.PCFShadowMap; }}>
        <Suspense fallback={null}><BadgesScene /></Suspense>
      </Canvas>
    </div>
  );
}
