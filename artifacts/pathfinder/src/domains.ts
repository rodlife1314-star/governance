export type DomainId = "FINANCE" | "MEDICINE" | "LAW" | "IT" | "ASTROPHYSICS";

export interface DomainConfig {
  id: DomainId;
  label: string;
  shortLabel: string;
  live: boolean;
  color: string;
  accentColor: string;
  tagline: string;
  lensNames: string[];
}

export const DOMAINS: DomainConfig[] = [
  {
    id: "FINANCE",
    label: "Finance",
    shortLabel: "FIN",
    live: true,
    color: "#E0AF68",
    accentColor: "#E0AF68",
    tagline: "Market analysis · Authority feeds · Dimensional scoring",
    lensNames: ["Dollar/DXY", "Real Yields", "Inst. Flows", "Futures", "On-Chain", "Risk/VIX", "Commodity", "Geopolitics", "Technical", "Liquidity"],
  },
  {
    id: "MEDICINE",
    label: "Medicine",
    shortLabel: "MED",
    live: false,
    color: "#4CD964",
    accentColor: "#4CD964",
    tagline: "Clinical analysis · Evidence-based · Pathophysiology lens",
    lensNames: ["Pathophysiology", "Pharmacology", "Lab Markers", "Imaging", "Risk Factors", "Evidence Base", "Guidelines", "Contraindications", "Prognosis", "Intervention"],
  },
  {
    id: "LAW",
    label: "Law",
    shortLabel: "LAW",
    live: false,
    color: "#BF7AF0",
    accentColor: "#BF7AF0",
    tagline: "Case precedent · Statutory analysis · Jurisdictional routing",
    lensNames: ["Precedent", "Statute", "Jurisdiction", "Burden of Proof", "Evidence Weight", "Timeline", "Damages", "Appeal Paths", "Regulatory", "Compliance"],
  },
  {
    id: "IT",
    label: "IT / Applied Sci",
    shortLabel: "IT",
    live: false,
    color: "#64D2FF",
    accentColor: "#64D2FF",
    tagline: "Architecture · Security posture · Systems performance",
    lensNames: ["Complexity", "Security", "Performance", "Scalability", "Tech Debt", "Dependencies", "Coverage", "Observability", "Architecture", "Data Flow"],
  },
  {
    id: "ASTROPHYSICS",
    label: "Astrophysics",
    shortLabel: "ASTRO",
    live: true,
    color: "#5E8FFF",
    accentColor: "#5E8FFF",
    tagline: "Observational · Theoretical · Laboratory · Stellar evolution · Cosmology · Exoplanetary · Routes via SPECTRA-7",
    lensNames: ["Photometric", "Spectral", "Orbital", "Temporal", "Energetic", "Spatial", "Cosmological", "Instrument Cal.", "Catalog", "Prediction"],
  },
];

export function getDomain(id: DomainId): DomainConfig {
  return DOMAINS.find((d) => d.id === id) ?? DOMAINS[0];
}
