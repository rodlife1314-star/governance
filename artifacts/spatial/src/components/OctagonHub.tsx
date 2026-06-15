import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";
import type { SelectedItem } from "../App";

const FACES = [
  { label: "OBSERVE", sub: "SYS_STATUS", angle: 0 },
  { label: "INVESTIGATE", sub: "ROUTING", angle: 1 },
  { label: "PATTERN", sub: "MEMORY_BANK", angle: 2 },
  { label: "VALIDATE", sub: "DOCTRINE", angle: 3 },
  { label: "GOVERN", sub: "RULES ENGINE", angle: 4 },
  { label: "EXECUTE", sub: "WORKFLOWS", angle: 5 },
  { label: "REVIEW", sub: "RETURN LAYER", angle: 6 },
  { label: "ARCHIVE", sub: "PERSISTENCE", angle: 7 },
];

const FACE_DESCRIPTIONS: Record<string, string> = {
  OBSERVE: "Live system metrics, routing distribution, recent activity feed. The watching eye.",
  INVESTIGATE: "Interactive routing evaluator. Submit a query. See the local vs cloud decision in real-time.",
  PATTERN: "25 memory entries. Doctrine, identity, kernel logic, TRT architecture, LFB data.",
  VALIDATE: "17 doctrine rules. Priority-ordered. Centre Law at the top. Drift Law beneath it.",
  GOVERN: "Deterministic routing engine. No LLM call. Keyword signals + threshold 0.60.",
  EXECUTE: "5 operational workflows. Session Start, Session Close, TRT Deploy, FORGE, Competition.",
  REVIEW: "Return to centre. What state was active? What drifted? What must carry forward?",
  ARCHIVE: "Postgres persistence layer. All decisions, memory, doctrine immutably logged.",
};

const GREEN = "#00ff41";
const DIM_GREEN = "rgba(0,255,65,0.15)";

interface Props {
  setSelected: (item: SelectedItem) => void;
}

export default function OctagonHub({ setSelected }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [activeface, setActiveFace] = useState<string | null>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  const RADIUS = 1.6;
  const APOTHEM = RADIUS * Math.cos(Math.PI / 8);

  const handleClick = (face: typeof FACES[0]) => {
    const isActive = activeface === face.label;
    setActiveFace(isActive ? null : face.label);
    setSelected(
      isActive
        ? null
        : {
            name: face.label,
            subtitle: face.sub,
            description: FACE_DESCRIPTIONS[face.label] ?? "",
          }
    );
  };

  return (
    <group position={[0, 1.9, 0]}>
      {/* Glow ring below */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <ringGeometry args={[1.4, 2.2, 64]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.04} />
      </mesh>

      {/* Outer glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.59, 0]}>
        <ringGeometry args={[1.55, 1.65, 64]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.25} />
      </mesh>

      {/* Main octagonal prism - solid (very dark) */}
      <mesh>
        <cylinderGeometry args={[RADIUS, RADIUS, 0.55, 8, 1, false]} />
        <meshStandardMaterial
          color="#001a00"
          transparent
          opacity={0.75}
          roughness={0.8}
          metalness={0.3}
        />
      </mesh>

      {/* Wireframe octagon */}
      <mesh>
        <cylinderGeometry args={[RADIUS, RADIUS, 0.55, 8, 1, true]} />
        <meshBasicMaterial color={GREEN} wireframe transparent opacity={0.9} />
      </mesh>

      {/* Top face */}
      <mesh position={[0, 0.275, 0]} rotation={[Math.PI / 2, Math.PI / 8, 0]}>
        <circleGeometry args={[RADIUS, 8]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.06} />
      </mesh>
      <mesh position={[0, 0.276, 0]} rotation={[Math.PI / 2, Math.PI / 8, 0]}>
        <circleGeometry args={[RADIUS, 8]} />
        <meshBasicMaterial color={GREEN} wireframe transparent opacity={0.4} />
      </mesh>

      {/* Bottom face */}
      <mesh position={[0, -0.275, 0]} rotation={[-Math.PI / 2, Math.PI / 8, 0]}>
        <circleGeometry args={[RADIUS, 8]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.04} />
      </mesh>

      {/* Face labels - positioned on each of the 8 faces */}
      <group ref={groupRef}>
        {FACES.map((face, i) => {
          const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
          const x = Math.sin(angle) * (APOTHEM + 0.01);
          const z = Math.cos(angle) * (APOTHEM + 0.01);
          const isHovered = hovered === face.label;
          const isActive = activeface === face.label;

          return (
            <group
              key={face.label}
              position={[x, 0, z]}
              rotation={[0, -angle, 0]}
              onClick={() => handleClick(face)}
              onPointerOver={() => setHovered(face.label)}
              onPointerOut={() => setHovered(null)}
            >
              {/* Invisible hit target */}
              <mesh>
                <planeGeometry args={[1.1, 0.5]} />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>

              {/* Highlight flash when hovered */}
              {(isHovered || isActive) && (
                <mesh position={[0, 0, -0.01]}>
                  <planeGeometry args={[1.12, 0.52]} />
                  <meshBasicMaterial color={GREEN} transparent opacity={isActive ? 0.12 : 0.06} />
                </mesh>
              )}

              <Text
                position={[0, 0.06, 0]}
                fontSize={0.095}
                color={isActive ? "#ffffff" : isHovered ? GREEN : "rgba(0,255,65,0.8)"}
                anchorX="center"
                anchorY="middle"
                font="https://fonts.gstatic.com/s/spacemono/v13/i7dPIFZifjKcF5UAWdDRUEZ2RFq7AwU.woff2"
                letterSpacing={0.06}
              >
                {face.label}
              </Text>
              <Text
                position={[0, -0.09, 0]}
                fontSize={0.055}
                color="rgba(0,255,65,0.4)"
                anchorX="center"
                anchorY="middle"
                font="https://fonts.gstatic.com/s/spacemono/v13/i7dPIFZifjKcF5UAWdDRUEZ2RFq7AwU.woff2"
                letterSpacing={0.04}
              >
                {face.sub}
              </Text>
            </group>
          );
        })}
      </group>

      {/* Central label */}
      <Text
        position={[0, 0.42, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.13}
        color={GREEN}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/spacemono/v13/i7dPIFZifjKcF5UAWdDRUEZ2RFq7AwU.woff2"
        letterSpacing={0.15}
      >
        OCTAGON
      </Text>
    </group>
  );
}
