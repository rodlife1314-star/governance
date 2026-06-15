import { useRef } from "react";
import { OrbitControls, Stars, Grid, Text, Line } from "@react-three/drei";
import * as THREE from "three";
import OctagonHub from "./OctagonHub";
import InstrumentWall, { type WallData } from "./InstrumentWall";
import type { SelectedItem } from "../App";

const WALLS: WallData[] = [
  {
    id: "pathfinder",
    title: "PATHFINDER",
    icon: "⬡",
    color: "#3b82f6",
    subtitle: "INVESTIGATION WALL",
    description:
      "Structural decomposition of any challenge into Evidence nodes, Authority sources, Uncertainty, Constraints, and Recommendation. The spatial replacement for a flat report.",
    rows: [
      { key: "CHALLENGE", value: "ACTIVE" },
      { key: "EVIDENCE NODES", value: "3 loaded" },
      { key: "AUTHORITY A", value: "LFB Dataset" },
      { key: "AUTHORITY B", value: "Doctrine v1.0" },
      { key: "AUTHORITY C", value: "Memory Bank" },
      { key: "UNCERTAINTY", value: "Medium" },
      { key: "CONSTRAINTS", value: "Local-first" },
      { key: "RECOMMENDATION", value: "Pending" },
    ],
  },
  {
    id: "simon",
    title: "SIMON",
    icon: "◈",
    color: "#22c55e",
    subtitle: "PATTERN WALL",
    description:
      "Pattern recognition layer. Reads routing history and memory structure to detect drift, frequency signals, and emerging operator state patterns.",
    rows: [
      { key: "ROUTING DIST", value: "69% LOCAL" },
      { key: "PATTERN SIGNALS", value: "4 active" },
      { key: "DRIFT_SCORE", value: "0.03" },
      { key: "MEMORY DENSITY", value: "25 entries" },
      { key: "TRT SIGNALS", value: "MAPPED" },
      { key: "LFB SIGNALS", value: "MAPPED" },
      { key: "LAST_PATTERN", value: "competition_planning" },
      { key: "ENGINE", value: "deterministic" },
    ],
  },
  {
    id: "dataset",
    title: "DATASET",
    icon: "⬡",
    color: "#eab308",
    subtitle: "AUTHORITY WALL",
    description:
      "Data sources and authority references loaded into the system. LFB open data, TensorRT model registry, governance JSON — all indexed and available for routing context.",
    rows: [
      { key: "LFB SAFETY RISKS", value: "Level 1 — URL" },
      { key: "BOROUGH TIERS", value: "Level 3 — cached" },
      { key: "GOVERNANCE.JSON", value: "Level 3 — active" },
      { key: "TRT MODEL MATRIX", value: "Level 1 — docs" },
      { key: "DOCTRINE RULES", value: "Level 3 — 17 rules" },
      { key: "MEMORY ENTRIES", value: "Level 3 — 25 entries" },
      { key: "ROUTING HISTORY", value: "Level 3 — 13 records" },
      { key: "PIPELINE STATUS", value: "Stage 1 ready" },
    ],
  },
  {
    id: "governance",
    title: "GOVERNANCE",
    icon: "◉",
    color: "#ef4444",
    subtitle: "DOCTRINE WALL",
    description:
      "17 active doctrine rules drawn from Rod's kernel. Centre Law governs all. Drift Law beneath it. 4 TensorRT-specific sovereignty rules guard the edge inference layer.",
    rows: [
      { key: "CENTRE LAW", value: "Priority 1 — LOCAL" },
      { key: "DRIFT LAW", value: "Priority 2 — LOCAL" },
      { key: "SIMPLICITY LAW", value: "Priority 3 — LOCAL" },
      { key: "95 / 5 EDGE LAW", value: "Priority 11 — HYBRID" },
      { key: "EXT COMPUTE AUTH", value: "Priority 12 — HYBRID" },
      { key: "EDGE SOVEREIGNTY", value: "Priority 14 — LOCAL" },
      { key: "JSON BOUNDARY", value: "Priority 16 — LOCAL" },
      { key: "ACTIVE RULES", value: "17 / 17" },
    ],
  },
  {
    id: "journal",
    title: "OPERATOR",
    icon: "◎",
    color: "#e2e8f0",
    subtitle: "JOURNAL WALL",
    description:
      "Session state, operator context, and personal notes. The wall that remembers where you were when you left and where you're going when you return.",
    rows: [
      { key: "OPERATOR", value: "ROD" },
      { key: "SESSION_STATE", value: "ACTIVE" },
      { key: "CURRENT_MODE", value: "COMPETITION" },
      { key: "SESSION_START", value: "06:00 UTC" },
      { key: "LAST_CHECKPOINT", value: "e9a8bad1" },
      { key: "DRIFT_GATE", value: "CLEAR" },
      { key: "CENTRE_CHECK", value: "PASS" },
      { key: "NEXT_ACTION", value: "Spatial review" },
    ],
  },
];

const WALL_RADIUS = 9.5;

interface Props {
  setSelected: (item: SelectedItem) => void;
}

export default function Scene({ setSelected }: Props) {
  const floorRef = useRef<THREE.Mesh>(null);
  void floorRef;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 4, 0]} intensity={1.5} color="#00ff41" distance={20} decay={2} />
      <pointLight position={[0, 1.5, 0]} intensity={0.4} color="#00ff41" distance={8} decay={2} />

      {/* Stars background */}
      <Stars
        radius={80}
        depth={50}
        count={3000}
        factor={2}
        saturation={0}
        fade
        speed={0.3}
      />

      {/* Grid floor */}
      <Grid
        position={[0, -0.01, 0]}
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#001a00"
        sectionSize={5}
        sectionThickness={0.8}
        sectionColor="#003300"
        fadeDistance={30}
        fadeStrength={1.2}
        infiniteGrid
      />

      {/* Floor glow plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[12, 64]} />
        <meshBasicMaterial color="#00ff41" transparent opacity={0.015} />
      </mesh>

      {/* Central floor ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.3, 0.45, 64]} />
        <meshBasicMaterial color="#00ff41" transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.7, 0.75, 64]} />
        <meshBasicMaterial color="#00ff41" transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.2, 1.22, 64]} />
        <meshBasicMaterial color="#00ff41" transparent opacity={0.15} />
      </mesh>

      {/* Operator standing position label */}
      <Text
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.07}
        color="rgba(0,255,65,0.35)"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/spacemono/v13/i7dPIFZifjKcF5UAWdDRUEZ2RFq7AwU.woff2"
        letterSpacing={0.25}
      >
        OPERATOR
      </Text>

      {/* Ceiling ring hints */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 5.5, 0]}>
        <ringGeometry args={[5.5, 5.55, 64]} />
        <meshBasicMaterial color="#00ff41" transparent opacity={0.08} />
      </mesh>

      {/* Wall direction lines on floor */}
      {WALLS.map((wall, i) => {
        const angle = (i / WALLS.length) * Math.PI * 2;
        return (
          <Line
            key={wall.id}
            points={[
              [Math.sin(angle) * 1.3, 0.02, Math.cos(angle) * 1.3],
              [Math.sin(angle) * 9, 0.02, Math.cos(angle) * 9],
            ]}
            color={wall.color}
            transparent
            opacity={0.18}
            lineWidth={0.8}
          />
        );
      })}

      {/* Central Octagon Hub */}
      <OctagonHub setSelected={setSelected} />

      {/* Instrument Walls */}
      {WALLS.map((wall, i) => {
        const angle = (i / WALLS.length) * Math.PI * 2;
        return (
          <InstrumentWall
            key={wall.id}
            wall={wall}
            angle={angle}
            radius={WALL_RADIUS}
            setSelected={setSelected}
          />
        );
      })}

      {/* Wall corner markers */}
      {WALLS.map((wall, i) => {
        const angle = (i / WALLS.length) * Math.PI * 2;
        const x = Math.sin(angle) * WALL_RADIUS;
        const z = Math.cos(angle) * WALL_RADIUS;
        return (
          <Text
            key={`label-${wall.id}`}
            position={[x, 0.1, z]}
            rotation={[-Math.PI / 2, 0, -angle]}
            fontSize={0.09}
            color={wall.color}
            anchorX="center"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/spacemono/v13/i7dPIFZifjKcF5UAWdDRUEZ2RFq7AwU.woff2"
            letterSpacing={0.2}
            fillOpacity={0.5}
          >
            {wall.title}
          </Text>
        );
      })}

      {/* Orbit Controls */}
      <OrbitControls
        makeDefault
        target={[0, 1.5, 0]}
        minDistance={1.5}
        maxDistance={14}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI * 0.7}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.6}
      />
    </>
  );
}
