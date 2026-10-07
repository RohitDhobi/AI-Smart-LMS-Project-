import React, { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Text, Html } from "@react-three/drei";
import * as THREE from "three";

/* ── Animated Bar ────────────────────────────────────────── */

function AnimatedBar({ position, targetHeight, color, label, value }) {
  const meshRef = useRef();
  const [height, setHeight] = useState(0);

  useFrame((_, delta) => {
    if (meshRef.current) {
      const newH = THREE.MathUtils.lerp(height, targetHeight, delta * 3);
      setHeight(newH);
      meshRef.current.scale.y = Math.max(newH, 0.01);
      meshRef.current.position.y = newH / 2;
    }
  });

  return (
    <group position={position}>
      <RoundedBox ref={meshRef} args={[0.8, 1, 0.8]} radius={0.08} smoothness={4} castShadow>
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </RoundedBox>
      <Html position={[0, -0.5, 0]} center style={{ pointerEvents: "none" }}>
        <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</div>
      </Html>
      <Html position={[0, targetHeight + 0.4, 0]} center style={{ pointerEvents: "none" }}>
        <div style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>{value}</div>
      </Html>
    </group>
  );
}

/* ── Pie Slice ───────────────────────────────────────────── */

function PieSlice({ startAngle, endAngle, radius, height, color, label, value }) {
  const shape = new THREE.Shape();
  const segments = 32;
  const angleStep = (endAngle - startAngle) / segments;

  shape.moveTo(0, 0);
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + i * angleStep;
    shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  shape.lineTo(0, 0);

  const extrudeSettings = { depth: height, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 };

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -height / 2]} castShadow>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.08} />
      </mesh>
    </group>
  );
}

function PieChart({ data, radius = 2, height = 0.6, position }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;

  return (
    <group position={position}>
      {data.map((d, i) => {
        const startAngle = (cumulative / total) * Math.PI * 2;
        cumulative += d.value;
        const endAngle = (cumulative / total) * Math.PI * 2;
        return <PieSlice key={i} startAngle={startAngle} endAngle={endAngle} radius={radius} height={height} color={d.color} label={d.label} value={d.value} />;
      })}
      <Html position={[0, 0, 0]} center style={{ pointerEvents: "none" }}>
        <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{total}</div>
      </Html>
    </group>
  );
}

/* ── Floating Label ──────────────────────────────────────── */

function FloatingLabel({ position, text, subtext }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 1.5) * 0.15;
  });
  return (
    <group ref={ref} position={position}>
      <Html center style={{ pointerEvents: "none" }}>
        <div style={{
          background: "rgba(15,23,42,0.9)",
          color: "#fff",
          padding: "10px 18px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.1)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{text}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{subtext}</div>
        </div>
      </Html>
    </group>
  );
}

/* ── Scene ───────────────────────────────────────────────── */

function StatsScene() {
  const barData = [
    { label: "Courses", value: 12, color: "#2563eb", h: 3.6 },
    { label: "Quizzes", value: 48, color: "#7c3aed", h: 4.0 },
    { label: "Assignments", value: 32, color: "#0891b2", h: 3.2 },
    { label: "Exams", value: 8, color: "#059669", h: 2.4 },
    { label: "Lessons", value: 96, color: "#d97706", h: 4.5 },
  ];

  const pieData = [
    { label: "Completed", value: 65, color: "#22c55e" },
    { label: "In Progress", value: 20, color: "#3b82f6" },
    { label: "Not Started", value: 15, color: "#64748b" },
  ];

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[6, 8, 4]} intensity={1} castShadow />
      <hemisphereLight args={["#b1e1ff", "#1a1a2e", 0.3]} />

      {/* Bars */}
      {barData.map((d, i) => (
        <AnimatedBar key={i} position={[(i - 2) * 1.6, 0, -2]} targetHeight={d.h} color={d.color} label={d.label} value={d.value} />
      ))}

      {/* Pie Chart */}
      <PieChart data={pieData} position={[3, 0, 2]} />

      {/* Floating Labels */}
      <FloatingLabel position={[-4, 5, 0]} text="📊 Learning Statistics" subtext="Your progress overview" />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[10, 64]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      <OrbitControls makeDefault minDistance={5} maxDistance={18} enableDamping maxPolarAngle={Math.PI / 2.1} />
    </>
  );
}

export default function Stats3D() {
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
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>📊 3D Stats Dashboard</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
          Interactive 3D charts • Drag to rotate
        </p>
      </div>
      <Canvas shadows camera={{ position: [8, 6, 8], fov: 45 }} gl={{ antialias: true }} onCreated={({ gl }) => { gl.setClearColor("#0a1628"); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.shadowMap.type = THREE.PCFShadowMap; }}>
        <Suspense fallback={null}><StatsScene /></Suspense>
      </Canvas>
    </div>
  );
}
