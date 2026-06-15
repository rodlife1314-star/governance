export default function WebGLFallback() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Space Mono', monospace",
        color: "#00ff41",
        gap: 20,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.3em",
          border: "1px solid rgba(0,255,65,0.3)",
          padding: "6px 16px",
          background: "rgba(0,255,65,0.05)",
        }}
      >
        OCTAGON // OPERATOR INSTRUMENT ROOM // v0.1
      </div>
      <div
        style={{
          fontSize: 9,
          color: "rgba(0,255,65,0.5)",
          letterSpacing: "0.2em",
          marginTop: 12,
        }}
      >
        WEBGL_CONTEXT_ERROR
      </div>
      <div
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.15em",
          textAlign: "center",
          maxWidth: 400,
          lineHeight: 2,
        }}
      >
        The spatial room requires a WebGL-capable browser.
        <br />
        Open in Chrome, Firefox, or Safari with hardware acceleration enabled.
      </div>
    </div>
  );
}
