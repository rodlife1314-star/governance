import { useEffect, useState } from "react";

const WORKSPACES = [
  {
    id: "PATHFINDER",
    subtitle: "COGNITIVE OBSERVATION ENGINE",
    description: "Multi-domain field analysis · RAPIDS protocol · Sovereign dispatch · Dimensional intelligence",
    href: "/pathfinder/",
    accent: "#E0AF68",
    status: "ONLINE",
  },
  {
    id: "SYSTEM",
    subtitle: "OPERATIONAL CORE",
    description: "Memory bank · Governance doctrine · Workflow engine · Routing decisions · Scenario control",
    href: "/dashboard",
    accent: "#7DCFFF",
    status: "ONLINE",
  },
];

export default function Portal() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#07080B",
      color: "#C8CFE0",
      fontFamily: "'Space Mono', 'Courier New', monospace",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      position: "relative",
      overflow: "hidden",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.6s ease",
    }}>

      {/* Background grid */}
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Star field */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: `
          radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,0.5) 0%, transparent 100%),
          radial-gradient(1px 1px at 78% 9%, rgba(255,255,255,0.35) 0%, transparent 100%),
          radial-gradient(1px 1px at 44% 61%, rgba(255,255,255,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 93% 41%, rgba(255,255,255,0.28) 0%, transparent 100%),
          radial-gradient(1px 1px at 23% 84%, rgba(255,255,255,0.32) 0%, transparent 100%),
          radial-gradient(1px 1px at 67% 77%, rgba(255,255,255,0.42) 0%, transparent 100%),
          radial-gradient(1px 1px at 5% 52%, rgba(255,255,255,0.3) 0%, transparent 100%),
          radial-gradient(1px 1px at 88% 88%, rgba(255,255,255,0.25) 0%, transparent 100%)
        `,
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "700px" }}>

        {/* Header */}
        <div style={{
          textAlign: "center",
          marginBottom: "64px",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-12px)",
          transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s",
        }}>
          <div style={{
            fontSize: "11px",
            letterSpacing: "0.35em",
            color: "rgba(200,207,224,0.35)",
            marginBottom: "16px",
            textTransform: "uppercase",
          }}>
            OPERATOR CONSOLE
          </div>
          <div style={{
            fontSize: "clamp(42px, 8vw, 72px)",
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "#E8ECF8",
            lineHeight: 1,
            marginBottom: "14px",
          }}>
            OCTAGON
          </div>
          <div style={{
            width: "48px",
            height: "1px",
            background: "rgba(200,207,224,0.15)",
            margin: "0 auto 14px",
          }} />
          <div style={{
            fontSize: "10px",
            letterSpacing: "0.25em",
            color: "rgba(200,207,224,0.3)",
            textTransform: "uppercase",
          }}>
            COGNITIVE WORKSPACE // SELECT ENTRY POINT
          </div>
        </div>

        {/* Workspace cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          marginBottom: "64px",
        }}>
          {WORKSPACES.map((ws, i) => (
            <a
              key={ws.id}
              href={ws.href}
              onMouseEnter={() => setHovered(ws.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "block",
                textDecoration: "none",
                border: `1px solid ${hovered === ws.id ? ws.accent : "rgba(255,255,255,0.07)"}`,
                borderRadius: "6px",
                padding: "28px 28px 24px",
                background: hovered === ws.id
                  ? `rgba(${ws.accent === "#E0AF68" ? "224,175,104" : "125,207,255"},0.04)`
                  : "rgba(255,255,255,0.02)",
                cursor: "pointer",
                transition: "all 0.25s ease",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(16px)",
                transitionDelay: `${0.2 + i * 0.12}s`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Accent glow on hover */}
              <div style={{
                position: "absolute",
                top: 0, left: 0,
                width: "100%",
                height: "2px",
                background: ws.accent,
                opacity: hovered === ws.id ? 0.6 : 0,
                transition: "opacity 0.25s ease",
              }} />

              {/* Status */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "20px",
              }}>
                <div style={{
                  width: "6px", height: "6px",
                  borderRadius: "50%",
                  background: "#4CAF87",
                  boxShadow: "0 0 8px rgba(76,175,135,0.6)",
                  animation: "oct-pulse 2s ease-in-out infinite",
                }} />
                <span style={{
                  fontSize: "9px",
                  letterSpacing: "0.2em",
                  color: "#4CAF87",
                }}>
                  {ws.status}
                </span>
              </div>

              {/* ID */}
              <div style={{
                fontSize: "9px",
                letterSpacing: "0.2em",
                color: "rgba(200,207,224,0.35)",
                marginBottom: "8px",
              }}>
                WORKSPACE · {ws.id}
              </div>

              {/* Name */}
              <div style={{
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: hovered === ws.id ? ws.accent : "#E8ECF8",
                marginBottom: "10px",
                transition: "color 0.25s ease",
              }}>
                {ws.id}
              </div>

              {/* Subtitle */}
              <div style={{
                fontSize: "10px",
                letterSpacing: "0.15em",
                color: "rgba(200,207,224,0.5)",
                marginBottom: "14px",
              }}>
                {ws.subtitle}
              </div>

              {/* Separator */}
              <div style={{
                height: "1px",
                background: "rgba(255,255,255,0.06)",
                marginBottom: "14px",
              }} />

              {/* Description */}
              <div style={{
                fontSize: "11px",
                color: "rgba(200,207,224,0.4)",
                lineHeight: 1.7,
                letterSpacing: "0.02em",
                marginBottom: "20px",
              }}>
                {ws.description}
              </div>

              {/* Enter CTA */}
              <div style={{
                fontSize: "10px",
                letterSpacing: "0.2em",
                color: hovered === ws.id ? ws.accent : "rgba(200,207,224,0.3)",
                transition: "color 0.25s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                ENTER
                <span style={{
                  display: "inline-block",
                  transform: hovered === ws.id ? "translateX(4px)" : "translateX(0)",
                  transition: "transform 0.2s ease",
                }}>→</span>
              </div>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: "center",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.7s ease 0.5s",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            fontSize: "9px",
            letterSpacing: "0.18em",
            color: "rgba(200,207,224,0.2)",
          }}>
            <span>LOCAL NODE · ACTIVE</span>
            <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "rgba(200,207,224,0.2)", display: "inline-block" }} />
            <span>POSTGRES · CONNECTED</span>
            <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "rgba(200,207,224,0.2)", display: "inline-block" }} />
            <span>SOVEREIGNTY · ENFORCED</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes oct-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
