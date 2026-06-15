import { Suspense, useState, Component, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import HUD from "./components/HUD";
import WebGLFallback from "./components/WebGLFallback";

export type SelectedItem = {
  name: string;
  subtitle: string;
  description: string;
} | null;

class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export default function App() {
  const [selected, setSelected] = useState<SelectedItem>(null);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <ErrorBoundary fallback={<WebGLFallback />}>
        <Canvas
          camera={{ position: [0, 1.8, -7], fov: 70, near: 0.1, far: 200 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 1);
          }}
        >
          <Suspense fallback={null}>
            <Scene setSelected={setSelected} />
          </Suspense>
        </Canvas>
        <HUD selected={selected} />
      </ErrorBoundary>
    </div>
  );
}
