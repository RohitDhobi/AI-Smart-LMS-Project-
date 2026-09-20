import React, { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, RoundedBox, Html, Environment } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

/* ── helpers ─────────────────────────────────────────────── */

function gradientColor(base, light) {
  return new THREE.Color(base).lerp(new THREE.Color(light), 0.3);
}

/* ── Ground plane ────────────────────────────────────────── */

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <circleGeometry args={[22, 64]} />
      <meshStandardMaterial color="#1a3a2a" />
    </mesh>
  );
}

/* ── Path tiles ──────────────────────────────────────────── */

function Path({ start, end, width = 0.6 }) {
  const dir = new THREE.Vector3().subVectors(end, start);
  const len = dir.length();
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const angle = Math.atan2(dir.x, dir.z);

  return (
    <mesh rotation={[-Math.PI / 2, 0, angle]} position={[mid.x, 0.01, mid.z]} receiveShadow>
      <planeGeometry args={[width, len]} />
      <meshStandardMaterial color="#2a5a3a" />
    </mesh>
  );
}

/* ── Tree ────────────────────────────────────────────────── */

function Tree({ position }) {
  return (
    <group position={position}>
      {/* trunk */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 1.2, 8]} />
        <meshStandardMaterial color="#5a3a1a" />
      </mesh>
      {/* foliage */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshStandardMaterial color="#2d7a3a" />
      </mesh>
      <mesh position={[0.2, 1.3, 0.15]} castShadow>
        <sphereGeometry args={[0.35, 10, 10]} />
        <meshStandardMaterial color="#248a30" />
      </mesh>
    </group>
  );
}

/* ── Building ────────────────────────────────────────────── */

function Building({ position, size, color, label, emoji, path, navigate }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (meshRef.current) {
      const target = hovered ? 1.08 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(target, target, target),
        delta * 6
      );
    }
  });

  return (
    <group position={position}>
      {/* base */}
      <RoundedBox
        ref={meshRef}
        args={size}
        radius={0.12}
        smoothness={4}
        castShadow
        receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
        onClick={(e) => { e.stopPropagation(); navigate(path); }}
      >
        <meshStandardMaterial
          color={hovered ? gradientColor(color, "#ffffff") : color}
          roughness={0.35}
          metalness={0.08}
        />
      </RoundedBox>

      {/* roof accent */}
      <RoundedBox
        args={[size[0] + 0.15, 0.15, size[2] + 0.15]}
        radius={0.06}
        smoothness={4}
        position={[0, size[1] / 2 + 0.08, 0]}
        castShadow
      >
        <meshStandardMaterial color={gradientColor(color, "#000000")} roughness={0.5} />
      </RoundedBox>

      {/* windows */}
      {[...Array(3)].map((_, i) => (
        <mesh
          key={`win-${i}`}
          position={[
            size[0] / 2 + 0.01,
            -0.1 + i * 0.45,
            0,
          ]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[0.25, 0.3]} />
          <meshStandardMaterial color="#ffe066" emissive="#ffe066" emissiveIntensity={0.4} />
        </mesh>
      ))}

      {/* label */}
      <Html
        position={[0, size[1] / 2 + 0.55, 0]}
        center
        distanceFactor={8}
        style={{ pointerEvents: "none" }}
      >
        <div style={{
          background: "rgba(15,23,42,0.92)",
          color: "#fff",
          padding: "5px 12px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 700,
          whiteSpace: "nowrap",
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.15)",
          backdropFilter: "blur(4px)",
          userSelect: "none",
        }}>
          <span style={{ marginRight: 5, fontSize: 16 }}>{emoji}</span>
          {label}
        </div>
      </Html>
    </group>
  );
}

/* ── Lamp post ───────────────────────────────────────────── */

function Lamp({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 2.4, 6]} />
        <meshStandardMaterial color="#444" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#ffe066" emissive="#ffe066" emissiveIntensity={1.2} />
      </mesh>
      <pointLight position={[0, 2.5, 0]} intensity={0.8} distance={5} color="#ffe066" />
    </group>
  );
}

/* ── Scene contents ──────────────────────────────────────── */

function CampusScene() {
  const navigate = useNavigate();

  const buildings = [
    { position: [0, 1.1, -3],    size: [3.2, 2.2, 2.4], color: "#2563eb", label: "Dashboard",       emoji: "🏠", path: "/dashboard" },
    { position: [-4, 0.9, 0],    size: [2.6, 1.8, 2.2], color: "#7c3aed", label: "My Courses",     emoji: "📚", path: "/courses" },
    { position: [4, 1.3, 0],     size: [2.8, 2.6, 2.2], color: "#0891b2", label: "AI Tutor",       emoji: "🤖", path: "/ai-assistant" },
    { position: [-3, 0.8, 4],    size: [2.4, 1.6, 2.0], color: "#059669", label: "Quizzes",        emoji: "❓", path: "/quizzes" },
    { position: [3, 1.0, 4],     size: [2.6, 2.0, 2.2], color: "#d97706", label: "Exams",          emoji: "🎓", path: "/exams" },
    { position: [0, 0.7, 7],     size: [3.0, 1.4, 1.8], color: "#dc2626", label: "Progress",       emoji: "📊", path: "/progress" },
    { position: [-5.5, 0.6, -4], size: [2.0, 1.2, 1.6], color: "#64748b", label: "Settings",       emoji: "⚙️", path: "/settings" },
    { position: [5.5, 0.6, -4],  size: [2.0, 1.2, 1.6], color: "#be185d", label: "Achievements",   emoji: "🏆", path: "/achievements" },
  ];

  const trees = [
    [-7, 0, 2], [7, 0, -1], [-6, 0, -3], [6, 0, 3],
    [-2, 0, -6], [2, 0, -6], [0, 0, 3], [-5, 0, 5],
    [5, 0, -6], [-8, 0, -1], [8, 0, 1],
  ];

  const lamps = [
    [-2, 0, -1], [2, 0, -1], [0, 0, 2], [-3, 0, 2], [3, 0, 2],
  ];

  const paths = [
    { start: new THREE.Vector3(0, 0, -1.5), end: new THREE.Vector3(0, 0, 6) },
    { start: new THREE.Vector3(-4, 0, -1), end: new THREE.Vector3(0, 0, -1.5) },
    { start: new THREE.Vector3(4, 0, -1), end: new THREE.Vector3(0, 0, -1.5) },
    { start: new THREE.Vector3(0, 0, 2), end: new THREE.Vector3(-3, 0, 3.5) },
    { start: new THREE.Vector3(0, 0, 2), end: new THREE.Vector3(3, 0, 3.5) },
  ];

  return (
    <>
      {/* lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={40}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <hemisphereLight args={["#b1e1ff", "#1a3a2a", 0.4]} />

      {/* ground */}
      <Ground />

      {/* paths */}
      {paths.map((p, i) => (
        <Path key={i} start={p.start} end={p.end} />
      ))}

      {/* buildings */}
      {buildings.map((b, i) => (
        <Building key={i} {...b} navigate={navigate} />
      ))}

      {/* trees */}
      {trees.map((pos, i) => (
        <Tree key={i} position={pos} />
      ))}

      {/* lamps */}
      {lamps.map((pos, i) => (
        <Lamp key={i} position={pos} />
      ))}

      {/* controls */}
      <OrbitControls
        makeDefault
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={20}
        enableDamping
        dampingFactor={0.08}
        target={[0, 0.5, 1]}
      />
    </>
  );
}

/* ── Loading fallback ────────────────────────────────────── */

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#2563eb" wireframe />
    </mesh>
  );
}

/* ── Main component ──────────────────────────────────────── */

export default function CampusTour() {
  return (
    <div style={{ width: "100%", height: "calc(100vh - 60px)", position: "relative", background: "#0a1628" }}>
      {/* header overlay */}
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
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>🏫 3D Campus Tour</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
          Click on a building to navigate • Drag to rotate • Scroll to zoom
        </p>
      </div>

      {/* legend */}
      <div style={{
        position: "absolute",
        bottom: 16,
        left: 20,
        zIndex: 10,
        background: "rgba(15,23,42,0.85)",
        backdropFilter: "blur(10px)",
        padding: "12px 18px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#cbd5e1",
        fontSize: 12,
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
      }}>
        <span>🖱️ Drag to orbit</span>
        <span>🔍 Scroll to zoom</span>
        <span>👆 Click building to visit</span>
      </div>

      <Canvas
        shadows
        camera={{ position: [10, 8, 10], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor("#0a1628");
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <CampusScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
