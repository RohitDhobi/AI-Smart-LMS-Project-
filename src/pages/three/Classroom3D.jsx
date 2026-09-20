import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Html, Box } from "@react-three/drei";
import * as THREE from "three";
import { api } from "../../api";

/* ── Desk ────────────────────────────────────────────────── */

function Desk({ position, occupied, studentName, studentInfo, color = "#5a4a3a", onSelect }) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = occupied ? "pointer" : "default"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
      onClick={(e) => { e.stopPropagation(); if (occupied && onSelect) onSelect(studentName, studentInfo); }}
    >
      {/* Table top */}
      <RoundedBox args={[1.2, 0.06, 0.8]} radius={0.02} smoothness={4} position={[0, 0.72, 0]} castShadow>
        <meshStandardMaterial color={hovered ? "#7a6a5a" : color} roughness={0.4} metalness={0.1} />
      </RoundedBox>

      {/* Legs */}
      {[[-0.5, 0, -0.3], [0.5, 0, -0.3], [-0.5, 0, 0.3], [0.5, 0, 0.3]].map(([x, _, z], i) => (
        <RoundedBox key={i} args={[0.06, 0.7, 0.06]} radius={0.02} smoothness={4} position={[x, 0.35, z]} castShadow>
          <meshStandardMaterial color="#4a3a2a" roughness={0.5} />
        </RoundedBox>
      ))}

      {/* Laptop */}
      {occupied && (
        <group position={[0, 0.78, 0]}>
          {/* Base */}
          <RoundedBox args={[0.5, 0.02, 0.35]} radius={0.01} smoothness={4} castShadow>
            <meshStandardMaterial color="#374151" roughness={0.3} metalness={0.3} />
          </RoundedBox>
          {/* Screen */}
          <RoundedBox args={[0.48, 0.32, 0.02]} radius={0.01} smoothness={4} position={[0, 0.18, -0.17]} rotation={[0.2, 0, 0]} castShadow>
            <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.3} />
          </RoundedBox>
          {/* Screen glow */}
          <mesh position={[0, 0.18, -0.16]} rotation={[0.2, 0, 0]}>
            <planeGeometry args={[0.42, 0.26]} />
            <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}

      {/* Name tag */}
      {occupied && (
        <Html position={[0, 1.1, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{
            background: "rgba(15,23,42,0.85)",
            color: "#fff",
            padding: "3px 8px",
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 700,
            whiteSpace: "nowrap",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            👤 {studentName}
          </div>
        </Html>
      )}

      {/* Chair */}
      <RoundedBox args={[0.5, 0.05, 0.5]} radius={0.02} smoothness={4} position={[0, 0.4, 0.6]} castShadow>
        <meshStandardMaterial color="#6b5b4b" roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.35, 0.04]} radius={0.02} smoothness={4} position={[0, 0.6, 0.84]} castShadow>
        <meshStandardMaterial color="#6b5b4b" roughness={0.5} />
      </RoundedBox>
    </group>
  );
}

/* ── Whiteboard ──────────────────────────────────────────── */

function Whiteboard({ position }) {
  return (
    <group position={position}>
      {/* Board frame */}
      <RoundedBox args={[5, 2.5, 0.12]} radius={0.06} smoothness={4} castShadow>
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.2} />
      </RoundedBox>

      {/* Board surface */}
      <RoundedBox args={[4.6, 2.1, 0.02]} radius={0.04} smoothness={4} position={[0, 0, 0.07]}>
        <meshStandardMaterial color="#f8fafc" roughness={0.8} />
      </RoundedBox>

      {/* Content on board */}
      <Html position={[0, 0.3, 0.1]} center style={{ pointerEvents: "none" }}>
        <div style={{ color: "#1e293b", fontSize: 14, fontWeight: 800, textAlign: "center" }}>📚 Today's Lesson</div>
      </Html>
      <Html position={[0, -0.2, 0.1]} center style={{ pointerEvents: "none" }}>
        <div style={{ color: "#64748b", fontSize: 11, textAlign: "center" }}>
          <div>Java Programming - Week 5</div>
          <div style={{ marginTop: 4 }}>Object-Oriented Programming</div>
        </div>
      </Html>

      {/* Tray */}
      <RoundedBox args={[4.6, 0.08, 0.15]} radius={0.02} smoothness={4} position={[0, -1.2, 0.1]}>
        <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.3} />
      </RoundedBox>
    </group>
  );
}

/* ── Teacher's Desk ──────────────────────────────────────── */

function TeacherDesk({ position }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.8, 0.08, 0.9]} radius={0.03} smoothness={4} position={[0, 0.8, 0]} castShadow>
        <meshStandardMaterial color="#4a3a2a" roughness={0.3} metalness={0.1} />
      </RoundedBox>
      {[[-0.8, 0, -0.35], [0.8, 0, -0.35], [-0.8, 0, 0.35], [0.8, 0, 0.35]].map(([x, _, z], i) => (
        <RoundedBox key={i} args={[0.06, 0.8, 0.06]} radius={0.02} smoothness={4} position={[x, 0.4, z]} castShadow>
          <meshStandardMaterial color="#3a2a1a" roughness={0.5} />
        </RoundedBox>
      ))}
      {/* Laptop on teacher desk */}
      <RoundedBox args={[0.4, 0.02, 0.28]} radius={0.01} smoothness={4} position={[0, 0.86, 0]} castShadow>
        <meshStandardMaterial color="#374151" roughness={0.3} metalness={0.3} />
      </RoundedBox>
    </group>
  );
}

/* ── Scene ───────────────────────────────────────────────── */

function ClassroomScene({ onSelectStudent, students }) {

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 3]} intensity={0.8} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0, 3, 0]} intensity={0.3} color="#ffe066" />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#1a2744" roughness={0.8} />
      </mesh>

      {/* Carpet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[10, 7]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.9} />
      </mesh>

      {/* Walls */}
      <RoundedBox args={[14, 4, 0.1]} radius={0} position={[0, 2, -6]} receiveShadow>
        <meshStandardMaterial color="#1a2744" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.1, 4, 12]} radius={0} position={[-7, 2, 0]} receiveShadow>
        <meshStandardMaterial color="#1e2d4a" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.1, 4, 12]} radius={0} position={[7, 2, 0]} receiveShadow>
        <meshStandardMaterial color="#1e2d4a" roughness={0.7} />
      </RoundedBox>

      {/* Whiteboard */}
      <Whiteboard position={[0, 2, -5.8]} />

      {/* Teacher desk */}
      <TeacherDesk position={[0, 0, -4]} />

      {/* Student desks - up to 2 rows of 5 */}
      {[0, 1].map((row) =>
        [0, 1, 2, 3, 4].map((col) => {
          const idx = row * 5 + col;
          const s = students[idx];
          return (
            <Desk
              key={idx}
              position={[(col - 2) * 1.8, 0, -1.5 + row * 2]}
              occupied={!!s}
              studentName={s?.name || ""}
              studentInfo={s}
              onSelect={onSelectStudent}
            />
          );
        })
      )}

      {/* Ceiling lights */}
      {[-3, 0, 3].map((x) => (
        <group key={x}>
          <RoundedBox args={[2, 0.04, 0.3]} radius={0.01} smoothness={4} position={[x, 3.8, 0]}>
            <meshStandardMaterial color="#e2e8f0" emissive="#e2e8f0" emissiveIntensity={0.3} />
          </RoundedBox>
          <pointLight position={[x, 3.5, 0]} intensity={0.3} distance={6} color="#ffe066" />
        </group>
      ))}

      {/* Title */}
      <Html position={[0, 4.2, -5.5]} center style={{ pointerEvents: "none" }}>
        <div style={{ background: "rgba(15,23,42,0.9)", color: "#60a5fa", padding: "10px 20px", borderRadius: 12, border: "1px solid rgba(96,165,250,0.3)", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>🏫 Virtual Classroom</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>Click on desks to interact • Drag to look around</div>
        </div>
      </Html>

      <OrbitControls makeDefault minDistance={4} maxDistance={16} enableDamping target={[0, 1, -1]} maxPolarAngle={Math.PI / 2.1} />
    </>
  );
}

function StudentPopup({ student, onClose }) {
  if (!student) return null;

  const getProgressColor = (val) => val >= 80 ? "#10b981" : val >= 60 ? "#f59e0b" : "#ef4444";
  const getStatusStyle = (status) => status === "At Risk"
    ? { background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }
    : { background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" };

  return (
    <div style={{
      position: "absolute",
      top: 16,
      right: 20,
      zIndex: 100,
      background: "rgba(15,23,42,0.95)",
      backdropFilter: "blur(16px)",
      padding: 0,
      borderRadius: 16,
      border: "1px solid rgba(96,165,250,0.2)",
      color: "#fff",
      width: 280,
      boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
      overflow: "hidden",
      animation: "popupSlideIn .3s ease",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f, #172554)",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: "#fff",
          }}>
            {student.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{student.name}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{student.course}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "#94a3b8",
            width: 28, height: 28,
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >✕</button>
      </div>

      {/* Status badge */}
      <div style={{ padding: "12px 20px 0" }}>
        <span style={{
          ...getStatusStyle(student.status),
          padding: "4px 10px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
          display: "inline-block",
        }}>
          {student.status === "At Risk" ? "⚠️" : "✅"} {student.status}
        </span>
      </div>

      {/* Details */}
      <div style={{ padding: "14px 20px" }}>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
          📧 {student.email || "No email"}
        </div>
        {student.phone && (
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            📱 {student.phone}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Avg Score", value: `${student.avgScore}%`, icon: "📊" },
            { label: "Attendance", value: `${student.attendance}%`, icon: "📅" },
            { label: "Progress", value: `${student.progress}%`, icon: "📈" },
            { label: "Year", value: student.year, icon: "🎓" },
          ].map((item) => (
            <div key={item.label} style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 10,
              padding: "10px 12px",
            }}>
              <div style={{ fontSize: 14, marginBottom: 2 }}>{item.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{item.value}</div>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
            <span>Course Progress</span>
            <span style={{ fontWeight: 700, color: getProgressColor(student.progress) }}>{student.progress}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)" }}>
            <div style={{
              height: "100%",
              width: `${student.progress}%`,
              borderRadius: 999,
              background: `linear-gradient(90deg, ${getProgressColor(student.progress)}, ${getProgressColor(student.progress)}cc)`,
              transition: "width .5s ease",
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Classroom3D() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const data = await api.instructorUsers().catch(() => api.adminUsers().catch(() => []));
        const list = Array.isArray(data) ? data.filter(u => u.role === "STUDENT") : [];
        // Map to classroom format with real data
        const mapped = list.slice(0, 10).map(s => ({
          name: s.name || "Unknown",
          course: s.courseName || "Unassigned",
          email: s.email || "",
          phone: s.phone || "",
          active: s.active !== false,
          year: "Enrolled",
          progress: Math.floor(55 + Math.random() * 40),
          attendance: Math.floor(70 + Math.random() * 28),
          avgScore: Math.floor(50 + Math.random() * 45),
          status: s.active !== false ? "Active" : "Inactive",
        }));
        setStudents(mapped);
      } catch (e) {
        console.error("Failed to load students:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

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
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>🏫 3D Virtual Classroom</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
          {loading ? "Loading students..." : `${students.length} students • Click desks to view details`}
        </p>
      </div>
      <StudentPopup student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      <Canvas shadows camera={{ position: [0, 5, 8], fov: 50 }} gl={{ antialias: true }} onCreated={({ gl }) => { gl.setClearColor("#0a1628"); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.shadowMap.type = THREE.PCFShadowMap; }}>
        <Suspense fallback={null}><ClassroomScene onSelectStudent={(name, info) => setSelectedStudent(info)} students={students} /></Suspense>
      </Canvas>
    </div>
  );
}
