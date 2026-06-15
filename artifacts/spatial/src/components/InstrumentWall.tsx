import { useRef, useState } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { SelectedItem } from "../App";

interface WallRow {
  key: string;
  value: string;
}

interface WallData {
  id: string;
  title: string;
  icon: string;
  color: string;
  subtitle: string;
  rows: WallRow[];
  description: string;
}

interface Props {
  wall: WallData;
  angle: number;
  radius: number;
  setSelected: (item: SelectedItem) => void;
}

export default function InstrumentWall({ wall, angle, radius, setSelected }: Props) {
  const [active, setActive] = useState(false);

  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;
  const rotY = Math.PI + angle;

  const handleClick = () => {
    const next = !active;
    setActive(next);
    setSelected(
      next
        ? { name: wall.title, subtitle: wall.subtitle, description: wall.description }
        : null
    );
  };

  return (
    <group position={[x, 1.5, z]} rotation={[0, rotY, 0]}>
      {/* Physical frame — emissive border */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[3.6, 2.6]} />
        <meshBasicMaterial color="#000" transparent opacity={0.0} />
      </mesh>

      {/* Border lines */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(3.6, 2.6)]} />
        <lineBasicMaterial color={wall.color} transparent opacity={active ? 0.9 : 0.35} />
      </lineSegments>

      {/* Glow plane behind panel */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[3.8, 2.8]} />
        <meshBasicMaterial color={wall.color} transparent opacity={active ? 0.04 : 0.015} />
      </mesh>

      {/* Header bar */}
      <mesh position={[0, 1.0, 0.005]}>
        <planeGeometry args={[3.6, 0.36]} />
        <meshBasicMaterial color={wall.color} transparent opacity={active ? 0.25 : 0.12} />
      </mesh>

      {/* HTML content */}
      <Html
        position={[0, 0, 0.02]}
        center
        transform
        occlude={false}
        style={{ pointerEvents: "all" }}
      >
        <div
          className={`wall-panel ${active ? "active" : ""}`}
          style={{ color: wall.color, borderColor: active ? wall.color : `${wall.color}55`, width: 320 }}
          onClick={handleClick}
        >
          <div className="wall-panel-header" style={{ borderBottomColor: `${wall.color}40` }}>
            <span className="wall-panel-dot" />
            <span>{wall.title}</span>
            <span style={{ marginLeft: "auto", opacity: 0.5, fontSize: 8 }}>{wall.icon}</span>
          </div>
          <div className="wall-panel-body">
            <div style={{ color: `${wall.color}80`, marginBottom: 8, fontSize: 8, letterSpacing: "0.2em" }}>
              {wall.subtitle}
            </div>
            {wall.rows.map((row) => (
              <div key={row.key} className="wall-panel-row">
                <span className="wall-panel-key">{row.key}</span>
                <span className="wall-panel-val">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Html>
    </group>
  );
}

export type { WallData };
