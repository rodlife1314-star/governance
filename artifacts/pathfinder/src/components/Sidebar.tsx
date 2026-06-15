import { Folder, FileCode, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { RustFile } from "../types";

interface SidebarProps {
  files: RustFile[];
  selectedFile: RustFile;
  onSelectFile: (file: RustFile) => void;
  compiledFileName: string;
}

export default function Sidebar({
  files,
  selectedFile,
  onSelectFile,
  compiledFileName,
}: SidebarProps) {
  const workspaceStructure = [
    {
      name: "systems_layer (Hardware API Bounds)",
      icon: Folder,
      pathPrefix: "/systems_layer",
      items: files.filter((f) => f.path.startsWith("/systems_layer")),
    },
    {
      name: "core_layer (Observation Doctrine)",
      icon: Folder,
      pathPrefix: "/core_layer",
      items: files.filter((f) => f.path.startsWith("/core_layer")),
    },
    {
      name: "agents_layer (Astra / Hermes)",
      icon: Folder,
      pathPrefix: "/agents_layer",
      items: files.filter((f) => f.path.startsWith("/agents_layer")),
    },
    {
      name: "src/agents (AI Refactoring)",
      icon: Folder,
      pathPrefix: "/src/agents",
      items: files.filter((f) => f.path.includes("/src/agents")),
    },
    {
      name: "src/doctrine (Compile Constraints)",
      icon: Folder,
      pathPrefix: "/src/doctrine",
      items: files.filter((f) => f.path.includes("/src/doctrine")),
    },
    {
      name: "app/src (Orchestration Loop)",
      icon: Folder,
      pathPrefix: "/app",
      items: files.filter((f) => f.path.startsWith("/app")),
    },
    {
      name: "core (HFT Engine Driver)",
      icon: Folder,
      pathPrefix: "/src",
      items: files.filter((f) => f.layer === "core" && !f.path.startsWith("/core_layer") && !f.path.startsWith("/app")),
    },
    {
      name: "Project Documentation",
      icon: Folder,
      pathPrefix: "/README.md",
      items: files.filter((f) => f.layer === "documentation"),
    },
  ];

  return (
    <div className="bg-sleek-sidebar border border-sleek-border rounded-xl overflow-hidden shadow-2xl h-full flex flex-col font-sans" id="workspace-sidebar">
      <div className="bg-sleek-bg px-4 py-3 border-b border-sleek-border">
        <h3 className="text-xs font-mono font-bold text-sleek-muted tracking-wider">
          PROJECT STRUCTURE
        </h3>
        <p className="text-[10px] text-sleek-muted mt-0.5 font-mono">
          Interactive HFT Blueprint
        </p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {workspaceStructure.map((dir, dirIdx) => (
          <div key={dirIdx} className="space-y-1.5" id={`dir-section-${dirIdx}`}>
            <div className="flex items-center space-x-2 text-sleek-text font-mono text-xs font-semibold">
              <span className="text-sm shrink-0">📂</span>
              <span className="text-[#A1A1AA]">{dir.name}</span>
            </div>

            <div className="pl-4 border-l border-sleek-border space-y-1">
              {dir.items.map((file, fileIdx) => {
                const isSelected = file.path === selectedFile.path;
                const isCritical = file.latencyImpact.includes("Critical");

                return (
                  <button
                    key={fileIdx}
                    onClick={() => onSelectFile(file)}
                    className={`w-full text-left px-2.5 py-2 rounded flex items-center justify-between font-mono text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#1E2128] text-[#FFFFFF] border border-[#2D3139] shadow-sm font-semibold"
                        : "text-sleek-muted hover:bg-[#1E2128]/45 hover:text-sleek-text"
                    }`}
                    id={`btn-file-${file.name}`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className={`text-xs shrink-0 ${isSelected ? "opacity-100" : "opacity-60"}`}>
                        🦀
                      </span>
                      <span className="truncate">{file.name}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {isCritical && (
                        <span className="text-[8px] bg-sleek-red/10 text-sleek-red border border-sleek-red/20 px-1 py-0.5 rounded font-mono uppercase font-bold tracking-tight">
                          ⚠ Runtime Critical
                        </span>
                      )}
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sleek-green shadow-[0_0_8px_#4CD964]"></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-[#0A0B0E] border-t border-sleek-border space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-sleek-muted">Target Type:</span>
          <span className="text-sleek-text">hft-binary-exe</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-sleek-muted">Active Linker:</span>
          <span className="text-sleek-green flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sleek-green" />
            <span>Link-Time-Opt</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-sleek-muted">Memory Security:</span>
          <span className="text-sleek-cyan">safe + pins</span>
        </div>
      </div>
    </div>
  );
}
