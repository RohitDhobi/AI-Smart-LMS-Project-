import React, { useRef, useState, Suspense, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Html } from "@react-three/drei";
import * as THREE from "three";
import { api } from "../../api";

/* ── Course Icon Mapping ─────────────────────────────── */

function getCourseIcon(title) {
  const t = title.toLowerCase();
  if (t.includes("java")) return "☕";
  if (t.includes("python")) return "🐍";
  if (t.includes("web") || t.includes("html") || t.includes("css")) return "🌐";
  if (t.includes("data") || t.includes("analytics")) return "📊";
  if (t.includes("machine") || t.includes("ai") || t.includes("artificial") || t.includes("deep learning")) return "🤖";
  if (t.includes("cloud") || t.includes("aws") || t.includes("azure")) return "☁️";
  if (t.includes("security") || t.includes("cyber")) return "🔒";
  if (t.includes("mobile") || t.includes("android") || t.includes("ios")) return "📱";
  if (t.includes("database") || t.includes("sql")) return "🗄️";
  if (t.includes("devops") || t.includes("ci/cd") || t.includes("docker")) return "⚙️";
  if (t.includes("blockchain") || t.includes("crypto")) return "⛓️";
  if (t.includes("art") || t.includes("design") || t.includes("creative")) return "🎨";
  if (t.includes("business") || t.includes("mba") || t.includes("administration")) return "💼";
  if (t.includes("computer") || t.includes("cs") || t.includes("programming")) return "💻";
  if (t.includes("science") || t.includes("physics") || t.includes("chemistry")) return "🔬";
  if (t.includes("commerce") || t.includes("finance") || t.includes("accounting")) return "💰";
  if (t.includes("math") || t.includes("statistics")) return "📐";
  if (t.includes("english") || t.includes("literature") || t.includes("writing")) return "📝";
  if (t.includes("history") || t.includes("social")) return "📜";
  if (t.includes("music") || t.includes("audio")) return "🎵";
  if (t.includes("video") || t.includes("film") || t.includes("media")) return "🎬";
  return "📚";
}

/* ── 3D Course Icon (rotating geometric shapes) ────────── */

const SHAPES = ["box", "sphere", "torus", "octahedron", "dodecahedron", "cone"];
const ICON_COLORS = ["#60a5fa", "#a78bfa", "#34d399", "#fbbf24", "#f87171", "#38bdf8"];

function CourseIcon3D({ shape, color, position }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.8;
      ref.current.rotation.y += delta * 1.2;
    }
  });

  const geo = useMemo(() => {
    switch (shape) {
      case "sphere": return <sphereGeometry args={[0.18, 16, 16]} />;
      case "torus": return <torusGeometry args={[0.16, 0.06, 12, 24]} />;
      case "octahedron": return <octahedronGeometry args={[0.2]} />;
      case "dodecahedron": return <dodecahedronGeometry args={[0.18]} />;
      case "cone": return <coneGeometry args={[0.16, 0.28, 16]} />;
      default: return <boxGeometry args={[0.24, 0.24, 0.24]} />;
    }
  }, [shape]);

  return (
    <mesh ref={ref} position={position}>
      {geo}
      <meshStandardMaterial color={color} roughness={0.2} metalness={0.6} emissive={color} emissiveIntensity={0.15} />
    </mesh>
  );
}

/* ── Floating Particles ─────────────────────────────────── */

function FloatingParticles({ count = 50 }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 40,
      y: (Math.random() - 0.5) * 15 + 2,
      z: (Math.random() - 0.5) * 30 - 5,
      speed: 0.05 + Math.random() * 0.15,
      offset: Math.random() * Math.PI * 2,
      scale: 0.02 + Math.random() * 0.04,
      color: new THREE.Color().setHSL(0.55 + Math.random() * 0.15, 0.6, 0.5 + Math.random() * 0.2),
    }));
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed + p.offset) * 0.3,
        p.y + Math.cos(t * p.speed * 0.5 + p.offset) * 0.15,
        p.z
      );
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, p.color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial transparent opacity={0.4} toneMapped={false} />
    </instancedMesh>
  );
}

/* ── Starfield Background ───────────────────────────────── */

function Starfield({ count = 150 }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      x: (Math.random() - 0.5) * 80,
      y: (Math.random() - 0.5) * 40 + 5,
      z: -15 - Math.random() * 30,
      baseScale: 0.015 + Math.random() * 0.025,
    }));
  }, [count]);

  useFrame(() => {
    if (!meshRef.current) return;
    stars.forEach((s, i) => {
      dummy.position.set(s.x, s.y, s.z);
      dummy.scale.setScalar(s.baseScale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#c7d2fe" transparent opacity={0.6} toneMapped={false} />
    </instancedMesh>
  );
}

/* ── Card Shadow / Reflection ───────────────────────────── */

function CardReflection({ position, color }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime();
      ref.current.position.y = position[1] - 2.2 + Math.sin(t * 1 + position[0]) * 0.04;
      ref.current.material.opacity = 0.12 + Math.sin(t * 0.5 + position[0] * 2) * 0.04;
    }
  });

  return (
    <mesh ref={ref} position={[position[0], position[1] - 2.2, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2.0, 0.4]} />
      <meshBasicMaterial color={color} transparent opacity={0.12} />
    </mesh>
  );
}

/* ── Flip Card ───────────────────────────────────────────── */

function CourseCard3D({ position, course, index, entranceDelay }) {
  const groupRef = useRef();
  const [flipped, setFlipped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const flipAngle = useRef(0);
  const entranceProgress = useRef(0);
  const hasEntered = useRef(false);

  const colors = [
    "#2563eb", "#7c3aed", "#0891b2", "#059669",
    "#d97706", "#dc2626", "#db2777", "#4f46e5",
    "#0d9488", "#c2410c", "#7c2d12", "#1d4ed8"
  ];

  const cardColor = colors[index % colors.length];

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Staggered entrance animation
    if (!hasEntered.current) {
      entranceProgress.current = Math.min(1, entranceProgress.current + delta * 1.2);
      if (entranceProgress.current >= 1) hasEntered.current = true;
      
      const t = entranceProgress.current;
      // Elastic ease out
      const elastic = t === 1 ? 1 : -Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
      const startX = position[0] + (index % 2 === 0 ? -6 : 6);
      const startY = position[1] + 5;
      const startZ = position[2] - 4;
      groupRef.current.position.x = startX + (position[0] - startX) * elastic;
      groupRef.current.position.y = startY + (position[1] - startY) * elastic;
      groupRef.current.position.z = startZ + (position[2] - startZ) * elastic;
      groupRef.current.scale.setScalar(elastic);
    } else {
      // Gentle float
      groupRef.current.position.y = position[1] + Math.sin(Date.now() * 0.0008 + index * 0.7) * 0.08;
    }

    // Flip animation
    const target = flipped ? Math.PI : 0;
    flipAngle.current = THREE.MathUtils.lerp(flipAngle.current, target, delta * 6);
    groupRef.current.rotation.y = flipAngle.current;

    // Hover scale
    const s = hovered ? 1.06 : 1;
    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, s, delta * 8);
    groupRef.current.scale.setScalar(newScale);
  });

  function handleEnrollClick(e) {
    e.stopPropagation();
    window.location.href = `/courses/${course.id}`;
  }

  return (
    <group ref={groupRef} position={position}>
      {/* Glow Ring (hover) */}
      {hovered && (
        <mesh position={[0, 0, -0.15]}>
          <planeGeometry args={[2.5, 3.0]} />
          <meshBasicMaterial color={cardColor} transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
      )}

      <group
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
        onClick={(e) => { e.stopPropagation(); setFlipped(!flipped); }}
      >
        {/* Front Face */}
        <group>
          <RoundedBox args={[2.0, 2.5, 0.12]} radius={0.1} smoothness={4} castShadow>
            <meshStandardMaterial color={cardColor} roughness={0.35} metalness={0.08} />
          </RoundedBox>

          {!flipped && (
            <>
              {/* Course Emoji Icon */}
              <Html position={[0, 0.7, 0.08]} center style={{ pointerEvents: "none" }}>
                <div style={{
                  fontSize: 40,
                  lineHeight: 1,
                  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))"
                }}>{course.icon}</div>
              </Html>

              {/* Course Title */}
              <Html position={[0, 0.0, 0.08]} center style={{ pointerEvents: "none" }}>
                <div style={{
                  color: "#fff",
                  fontSize: 17,
                  fontWeight: 900,
                  textAlign: "center",
                  width: 175,
                  textShadow: "0 2px 12px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.4)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2
                }}>{course.title}</div>
              </Html>

              {/* Instructor */}
              <Html position={[0, -0.5, 0.08]} center style={{ pointerEvents: "none" }}>
                <div style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 12,
                  fontWeight: 600,
                  textShadow: "0 1px 6px rgba(0,0,0,0.5)",
                  background: "rgba(0,0,0,0.25)",
                  padding: "2px 10px",
                  borderRadius: 6
                }}>{course.instructor}</div>
              </Html>

              {/* Click hint */}
              <Html position={[0, -0.9, 0.08]} center style={{ pointerEvents: "none" }}>
                <div style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 11,
                  fontWeight: 600,
                  background: "rgba(0,0,0,0.3)",
                  padding: "4px 12px",
                  borderRadius: 8
                }}>Click to flip →</div>
              </Html>
            </>
          )}
        </group>

        {/* Back Face */}
        <group rotation={[0, Math.PI, 0]}>
          <RoundedBox args={[2.0, 2.5, 0.12]} radius={0.1} smoothness={4} castShadow>
            <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.1} />
          </RoundedBox>

          {flipped && (
            <>
              <Html position={[0, 0.85, 0.08]} center style={{ pointerEvents: "none" }}>
                <div style={{
                  color: "#60a5fa",
                  fontSize: 14,
                  fontWeight: 900,
                  textShadow: "0 1px 8px rgba(96,165,250,0.4)",
                  background: "rgba(30,41,59,0.8)",
                  padding: "3px 12px",
                  borderRadius: 8
                }}>📋 Course Details</div>
              </Html>

              <Html position={[0, 0.15, 0.08]} center style={{ pointerEvents: "none" }}>
                <div style={{
                  color: "#e2e8f0",
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: "center",
                  width: 160,
                  lineHeight: 2,
                  background: "rgba(15,23,42,0.75)",
                  padding: "8px 12px",
                  borderRadius: 10,
                  textShadow: "0 1px 4px rgba(0,0,0,0.3)"
                }}>
                  <div>📚 {course.lessons} Lessons</div>
                  <div>⏱️ {course.duration}</div>
                  <div>👨‍🏫 {course.instructor}</div>
                </div>
              </Html>

              {/* Progress Bar */}
              <Html position={[0, -0.4, 0.08]} center style={{ pointerEvents: "none" }}>
                <div style={{ width: 145, height: 8, background: "#374151", borderRadius: 999, overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)" }}>
                  <div style={{ width: `${course.progress}%`, height: "100%", background: "linear-gradient(90deg, #22c55e, #16a34a)", borderRadius: 999, boxShadow: "0 0 8px rgba(34,197,94,0.4)" }} />
                </div>
              </Html>

              {/* Enroll Button */}
              <Html position={[0, -0.7, 0.08]} center>
                <button
                  onClick={handleEnrollClick}
                  style={{
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 22px",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(34,197,94,0.4)",
                    letterSpacing: "0.02em",
                    transition: "transform 0.15s, box-shadow 0.15s"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "scale(1.08)";
                    e.target.style.boxShadow = "0 6px 18px rgba(34,197,94,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "scale(1)";
                    e.target.style.boxShadow = "0 4px 12px rgba(34,197,94,0.4)";
                  }}
                >
                  🎓 Enroll Now
                </button>
              </Html>

              {/* Flip back hint */}
              <Html position={[0, -1.0, 0.08]} center style={{ pointerEvents: "none" }}>
                <div style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 10,
                  fontWeight: 500
                }}>← Click card to flip back</div>
              </Html>
            </>
          )}
        </group>
      </group>
    </group>
  );
}

/* ── Scene ───────────────────────────────────────────────── */

const FALLBACK_COURSES = [
  { id: 1, title: "Java Programming", icon: "☕", instructor: "Prof. Sharma", lessons: 24, duration: "12 hrs", progress: 75 },
  { id: 2, title: "Python Basics", icon: "🐍", instructor: "Dr. Patel", lessons: 18, duration: "8 hrs", progress: 45 },
  { id: 3, title: "Web Development", icon: "🌐", instructor: "Mr. Kumar", lessons: 32, duration: "16 hrs", progress: 90 },
  { id: 4, title: "Data Science", icon: "📊", instructor: "Ms. Gupta", lessons: 28, duration: "14 hrs", progress: 30 },
  { id: 5, title: "Machine Learning", icon: "🤖", instructor: "Dr. Singh", lessons: 20, duration: "10 hrs", progress: 60 },
  { id: 6, title: "Cloud Computing", icon: "☁️", instructor: "Prof. Verma", lessons: 16, duration: "8 hrs", progress: 15 },
  { id: 7, title: "Cyber Security", icon: "🔒", instructor: "Dr. Mehta", lessons: 22, duration: "11 hrs", progress: 55 },
  { id: 8, title: "Mobile App Dev", icon: "📱", instructor: "Ms. Reddy", lessons: 26, duration: "13 hrs", progress: 40 },
  { id: 9, title: "AI & Deep Learning", icon: "🧠", instructor: "Prof. Iyer", lessons: 30, duration: "15 hrs", progress: 20 },
  { id: 10, title: "Database Systems", icon: "🗄️", instructor: "Mr. Joshi", lessons: 15, duration: "7 hrs", progress: 85 },
  { id: 11, title: "DevOps & CI/CD", icon: "⚙️", instructor: "Dr. Nair", lessons: 19, duration: "9 hrs", progress: 35 },
  { id: 12, title: "Blockchain Tech", icon: "⛓️", instructor: "Prof. Rao", lessons: 14, duration: "7 hrs", progress: 10 },
];

function CourseCardsScene() {
  const [courses, setCourses] = useState(FALLBACK_COURSES);

  useEffect(() => {
    api.courses()
      .then(list => {
        if (!Array.isArray(list) || list.length === 0) return;
        const mapped = list.map((c, i) => ({
          id: c.id,
          title: c.title,
          icon: "📚",
          instructor: c.instructor || "TBA",
          lessons: c.lessons || c.totalLessons || 0,
          duration: c.duration || "Self-paced",
          progress: 0
        }));
        // Take only first 12
        setCourses(mapped.slice(0, 12));
      })
      .catch(() => {});
  }, []);

  const gridColors = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626", "#db2777", "#4f46e5", "#0d9488", "#c2410c", "#7c2d12", "#1d4ed8"];

  // Layout: 4 columns, 3 rows with proper spacing
  const COLS = 4;
  const CARD_SPACING_X = 3.2;  // horizontal gap
  const CARD_SPACING_Z = 3.8;  // depth gap per row

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[8, 12, 8]} intensity={1.2} castShadow />
      <hemisphereLight args={["#60a5fa", "#1a1a2e", 0.4]} />
      <pointLight position={[0, 8, 0]} intensity={0.6} color="#818cf8" distance={25} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.0, 8]} receiveShadow>
        <planeGeometry args={[50, 40]} />
        <meshStandardMaterial color="#0a0e1a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Starfield */}
      <Starfield count={150} />

      {/* Floating Particles */}
      <FloatingParticles count={50} />

      {/* Course Cards - 4 columns, 3 rows */}
      {courses.map((c, i) => {
        const row = Math.floor(i / COLS);
        const col = i % COLS;
        // Center the grid: offset x by half the total width
        const totalWidth = (COLS - 1) * CARD_SPACING_X;
        const x = col * CARD_SPACING_X - totalWidth / 2;
        const z = row * CARD_SPACING_Z;
        const y = 0.5;
        // Add course icon to the course object
        const courseWithIcon = { ...c, icon: getCourseIcon(c.title) };
        return (
          <React.Fragment key={c.id || i}>
            <CourseCard3D
              position={[x, y, z]}
              course={courseWithIcon}
              index={i}
              entranceDelay={i * 0.1}
            />
            <CardReflection position={[x, y, z]} color={gridColors[i % gridColors.length]} />
          </React.Fragment>
        );
      })}

      <OrbitControls
        makeDefault
        minDistance={8}
        maxDistance={30}
        enableDamping
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 5]}
      />
    </>
  );
}

export default function CourseCards3D() {
  return (
    <div style={{ width: "100%", height: "calc(100vh - 60px)", position: "relative", background: "#0a1628" }}>
      {/* Top Left Header */}
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
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>📚 3D Course Cards</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
          Click to flip • Drag to rotate • Enroll from back
        </p>
      </div>
      
      <Canvas 
        shadows 
        camera={{ position: [0, 5, 16], fov: 50 }} 
        gl={{ antialias: true }} 
        onCreated={({ gl }) => { 
          gl.setClearColor("#0a1628"); 
          gl.toneMapping = THREE.ACESFilmicToneMapping; 
          gl.shadowMap.type = THREE.PCFShadowMap;
        }}
      >
        <Suspense fallback={null}><CourseCardsScene /></Suspense>
      </Canvas>
    </div>
  );
}
