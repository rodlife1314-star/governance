import { useEffect, useState } from "react";
import type { SelectedItem } from "../App";

interface Props {
  selected: SelectedItem;
}

export default function HUD({ selected }: Props) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (d: Date) =>
    d.toISOString().replace("T", " ").substring(0, 19) + " UTC";

  return (
    <div className="hud-overlay">
      <div className="hud-title">OCTAGON // OPERATOR INSTRUMENT ROOM // v0.1</div>

      <div className={`hud-selected ${selected ? "visible" : ""}`}>
        {selected && (
          <>
            <div style={{ color: "#00ff41", marginBottom: 6, fontSize: 11 }}>
              {selected.name}
            </div>
            <div style={{ color: "rgba(0,255,65,0.5)", fontSize: 9, marginBottom: 8 }}>
              {selected.subtitle}
            </div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 9, lineHeight: 1.7 }}>
              {selected.description}
            </div>
          </>
        )}
      </div>

      <div className="hud-status">
        <div>KERNEL_STATE &nbsp;// ACTIVE</div>
        <div>LOCAL_NODE &nbsp;&nbsp;// ONLINE</div>
        <div>ROUTING_ENG // LIVE</div>
        <div>TIMESTAMP &nbsp;&nbsp;// {fmt(time)}</div>
      </div>

      <div className="hud-hint">
        <div>DRAG &nbsp;// ORBIT</div>
        <div>SCROLL // ZOOM</div>
        <div>CLICK &nbsp;// SELECT</div>
      </div>
    </div>
  );
}
