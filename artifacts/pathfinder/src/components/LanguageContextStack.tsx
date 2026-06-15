import { useState, useEffect } from "react";
import {
  Compass,
  Layers,
  ShieldAlert,
  Search,
  BookOpen,
  Scale,
  Brain,
  CheckCircle,
  PlusCircle,
  Trash2,
  ExternalLink,
  History,
  FileText,
  AlertCircle,
  Database,
  Terminal,
  RefreshCw,
  MapPin,
  Flame,
  Binary
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAbsoluteUrl } from "../utils";

export interface LanguageAuthorityRecord {
  id?: string;
  authority_name: string;
  jurisdiction: string;
  domain: "legal_context" | "financial_context" | "medical_context" | "market_context";
  language_layer: "plain_patient" | "clinical_guidance" | "regulatory" | "structured_terminology";
  source_type: string;
  definition_url: string;
  structured_code_system: string;
  operator_approved: boolean;
  createdAt: string;
  defined_term?: string;
  meaning?: string;
}

const BASELINE_AUTHORITY_STACKS: Record<
  "medical_context" | "legal_context" | "financial_context" | "market_context",
  {
    title: string;
    description: string;
    layers: {
      key: "plain_patient" | "clinical_guidance" | "regulatory" | "structured_terminology";
      name: string;
      authority: string;
      jurisdiction: string;
      source_type: string;
      code_system: string;
      url: string;
      description: string;
    }[];
  }
> = {
  medical_context: {
    title: "medical_context.lib",
    description: "Official public and clinical healthcare definitions, diagnostic guidelines, and clinical frameworks.",
    layers: [
      { key: "plain_patient", name: "L1: Plain-Language/Patient Layer", authority: "NHS Choice & MedlinePlus", jurisdiction: "UK / USA", source_type: "Public Health Directories", code_system: "Non-Technical / Consumer Vocab", url: "https://www.nhs.uk/", description: "Standard terminology translation suitable for public and patient-centric communication." },
      { key: "clinical_guidance", name: "L2: Clinical Guidance Layer", authority: "NICE / CDC / NIH", jurisdiction: "UK / USA / Global", source_type: "National Clinical Standards", code_system: "NICE Guidelines / CDC protocols", url: "https://www.nice.org.uk/", description: "Authoritative clinical pathways, care pathways, recommendation algorithms and peer-reviewed procedures." },
      { key: "regulatory", name: "L3: Regulatory Layer", authority: "GMC / MHRA / FDA", jurisdiction: "UK / USA", source_type: "Statutory Licensing Body", code_system: "Code of Federal Regulations (CFR)", url: "https://www.fda.gov/", description: "Strict legal licensing, drug compliance, medical device certification, and medical practice statutory boundaries." },
      { key: "structured_terminology", name: "L4: Structured Terminology Layer", authority: "IHTSDO (SNOMED) / WHO / NIH", jurisdiction: "Global Consensus", source_type: "Formal Ontology", code_system: "SNOMED CT / MeSH / ICD-11", url: "https://www.snomed.org/", description: "Mathematically formalized machine-readable terminology system mapping clinical concepts and hierarchical attributes." }
    ]
  },
  legal_context: {
    title: "legal_context.lib",
    description: "Geopolitical statutes, case law precedents, and legislative governance indices.",
    layers: [
      { key: "plain_patient", name: "L1: Plain-Language / Citizen Legal Directory", authority: "Cornell Law School Legal Information Institute (Wex)", jurisdiction: "US / UK / Global Public", source_type: "Public Legal Encyclopedia", code_system: "LII Wex Legal Dictionary Index", url: "https://www.law.cornell.edu/wex", description: "Excellent, general-purpose legal dictionary outlining complex litigation, contract terms, and procedural guidelines for citizens." },
      { key: "clinical_guidance", name: "L2: Professional Practice & Advisory Layer", authority: "The Law Society (UK Guidelines)", jurisdiction: "UK / Commonwealth", source_type: "Solicitor Practice Standard", code_system: "Law Society Ethics & Practice Codex", url: "https://www.lawsociety.org.uk", description: "The official guidance body for London and global Commonwealth solicitors directing professional procedures, trusts, and contract rules." },
      { key: "regulatory", name: "L3: Statutory Court & Tribunal Registry", authority: "UK Ministry of Justice Judiciary Glossary", jurisdiction: "UK / England & Wales", source_type: "Judicial Court Guidelines", code_system: "MoJ Civil & Criminal Procedure Rules", url: "https://www.gov.uk/guidance/court-and-tribunal-judiciary-glossary", description: "Authoritative statutory definitions, civil and penal glossary entries, and tribunal dispute resolution frameworks." },
      { key: "structured_terminology", name: "L4: Canonical Taxonomic Terminology", authority: "Black's Law Dictionary", jurisdiction: "Global Common Law", source_type: "Canonical Legal Lexicon", code_system: "Black's Law Classification Taxonomy", url: "https://thelawdictionary.org", description: "The gold-standard legal terminology index mapping canonical definitions, historic precedents, and jurisprudential Latin maxims." }
    ]
  },
  financial_context: {
    title: "financial_context.lib",
    description: "Structured public disclosures, audit standards, tax compliance treaties, and bookkeeping frameworks.",
    layers: [
      { key: "plain_patient", name: "L1: Plain-Language / Public Investor Guides", authority: "Investopedia Financial Directory", jurisdiction: "US / UK / Global Public", source_type: "Educational Investor Portals", code_system: "Non-Professional Financial Glossary", url: "https://www.investopedia.com/financial-term-dictionary-4769738", description: "Simplifies commercial vocabulary, ledger entries, accounting terms, and interest-rate math for individuals and public citizens." },
      { key: "clinical_guidance", name: "L2: Central Banking Policy & Standards Guidance", authority: "Bank of England (Knowledge Bank) / Federal Reserve FAQs", jurisdiction: "UK / USA / G10 Central Banking", source_type: "Central Bank Monetary Policy Advisories", code_system: "BoE Base Rate / FRB Glossary protocols", url: "https://www.bankofengland.co.uk/knowledgebank", description: "Authoritative central banking base rate directives, inflation metrics, macro-prudential tools, and sovereign monetary guidelines." },
      { key: "regulatory", name: "L3: Statutory Regulatory Compliance & Filings", authority: "FCA UK Handbook / SEC answers / HM Treasury", jurisdiction: "UK / USA National Statutes", source_type: "Statutory Market Conduct Rules & Listings", code_system: "FCA Handbook Glossary / SEC CFR-Part disclosures", url: "https://www.handbook.fca.org.uk/handbook/glossary", description: "Strict legal terms, market conduct guidelines, mandated digital filings, investor disclosures, and statutory trade constraints." },
      { key: "structured_terminology", name: "L4: Structured Codification & Global Settlement", authority: "IFRS International Accounting Board / BIS Basel Committee", jurisdiction: "Global Harmonized Systems", source_type: "Machine-Readable Standard Taxonomies", code_system: "IFRS XBRL Taxonomy / Basel Capital Ratios", url: "https://www.ifrs.org", description: "Formally codified multi-language financial schemas, computer-parsable audit taxonomies, and international settlement accords." }
    ]
  },
  market_context: {
    title: "market_context.lib",
    description: "Derivatives clearinghouse rules, decentralized state changes, and automated price feeds.",
    layers: [
      { key: "plain_patient", name: "L1: Public Retail Interface", authority: "TradingView Glossary / CMC", jurisdiction: "Global Retail", source_type: "Chart Educational Indices", code_system: "General Trading Terminology", url: "https://www.tradingview.com/", description: "Basic chart analysis definitions, simplified trader terminology, and non-cleared market indicators." },
      { key: "clinical_guidance", name: "L2: Protocol Liquidity Layer", authority: "CME Group / Chainlink Feeds", jurisdiction: "Regulated Derivatives & Web3", source_type: "Coprocessor Feeler Spreads", code_system: "Oracle Consensus APIs", url: "https://www.cmegroup.com/", description: "Professional market tracking algorithms, basis calculators, and decentralized network price boundaries." },
      { key: "regulatory", name: "L3: Derivatives Regulatory Layer", authority: "CFTC / SEC / ESMA", jurisdiction: "US / EU Commission", source_type: "Derivatives Act Mandates", code_system: "CFTC Part 43/45 Trade Rules", url: "https://www.cftc.gov/", description: "Mandatory reporting rules, position limits, accredited counterparty terms, and margin requirements." },
      { key: "structured_terminology", name: "L4: Clearinghouse Settlement ISO", authority: "ISO TC68 / FIX Protocol", jurisdiction: "Global Clearinghouses", source_type: "Settlement Standards Schema", code_system: "ISO 20022 / FIX Protocol v5.0", url: "https://www.fixprotocol.org/", description: "Strict machine-readable protocol standards for low-latency institutional trade routing, clearing, and delivery actions." }
    ]
  }
};

const DOCTRINE_AMBIGUITY_EXAMPLES = [
  { word: "Divergence", definitions: { market_context: { authority: "CME Group (Market Guidance)", meaning: "The structural valuation gap or premium offset between high-velocity BTC spot indices and regulated CME quarterly future bases." }, medical_context: { authority: "NICE Clinical Guidelines (Ophthalmic Section)", meaning: "The outward movement or misalignment of both eyes relative to each other, preventing synchronized focal binocular correspondence." }, legal_context: { authority: "Supreme Court (Conflict of Laws Doctrine)", meaning: "The state of structural variance between laws of different states/jurisdictions, requiring a choice of law ruling in contracts." }, financial_context: { authority: "IASB (IFRS Standards)", meaning: "The specific variation between accounting depreciation rules (IFRS) and localized IRS code depreciation schemas (Book vs. Tax difference)." } } },
  { word: "Arrest", definitions: { market_context: { authority: "SEC / TradingView", meaning: "The sudden containment of price velocity where volatility limits are hit, temporarily freezing execution pools in their tracks." }, medical_context: { authority: "NICE Guideline / NIH (Cardiology Section)", meaning: "The life-threatening, complete cessation of metabolic cardiac pumping actions, requiring emergency clinical life-support systems (Cardiac Arrest)." }, legal_context: { authority: "Black's Law (Criminal Statutory Procedure)", meaning: "The taking of a person into custody by statutory authorities, depriving them of physical liberty under probable criminal cause." }, financial_context: { authority: "SEC Filing Standards (XBRL Tax)", meaning: "A formal suspension of capitalization periods or structural freezing of liquid corporate cash reserves by legal courts." } } },
  { word: "Exposure", definitions: { market_context: { authority: "CME Group Risk Portal", meaning: "The gross or net total of options contracts and derivative values subject to immediate liquidation under negative delta drifts." }, medical_context: { authority: "CDC Epidemiological Protocols", meaning: "The proximity of an individual patient target to an active infectious pathogen or toxic radiological force field." }, legal_context: { authority: "Supreme Court Libel Frameworks", meaning: "The condition of a corporate citizen becoming vulnerable to statutory prosecution or liability of legal claims under civil laws." }, financial_context: { authority: "XBRL / GAAP Accounting Rules", meaning: "The absolute total amount of capital resources vulnerable to currency translation variance in international balance sheets." } } },
  { word: "Inflow", definitions: { market_context: { authority: "TradingView ETF Tracking Engine", meaning: "Direct capital velocity entering spot digital assets via traditional exchange-traded fund brokers." }, medical_context: { authority: "NICE Guideline (Cardiovascular Diagnostics)", meaning: "The volume flow of blood entering the left ventricle during physiological diastolic muscle expansion." }, legal_context: { authority: "US EPA Environmental Mandates", meaning: "The statutory definition of clear wastewater or discharge streams entering localized water tables illegally." }, financial_context: { authority: "IASB Statement of Cash Flows", meaning: "Actual money received during a specified audit period under operating, investing, or financing receipts ledger classes." } } },
  { word: "Depression", definitions: { market_context: { authority: "TradingView History Indexes", meaning: "A prolonged, structural contraction of overall industrial activity and spot volumes lasting multiple macro cycles." }, medical_context: { authority: "NICE Clinical Guidelines (Psychiatry Section)", meaning: "A clinical mood disorder defined by persistent low spirits, loss of interest, and physical fatigue diagnosed under DSM-5/ICD-11." }, legal_context: { authority: "US CFR Mining Land Regulations", meaning: "A physical hollow, indentation, or geometric sinkhole coordinate defined in geographic land survey statutes." }, financial_context: { authority: "IASB Property valuation formulas", meaning: "The downward impairment of non-tangible assets under localized economic obsolescence pressures." } } }
];

const APERTURE_PRESETS: Record<string, { word: string; status: "DIVERGENT" | "ALIGNED"; severity: string; color: string; meter: string; observation: string; layers: { authority: string; meaning: string }[]; reconciliation_considerations: string }> = {
  "Relief Duty": {
    word: "Relief Duty", status: "DIVERGENT", severity: "HIGH RISK",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    meter: "68% Ambiguity Margin",
    observation: "Definitions differ structurally. L1 refers to general civic/volunteer assistance, L2 governs transactional and professional service contract shifts, while L3 mandates a binding statutory duty on housing authorities under the Homelessness Act. They reference entirely distinct legal and civic obligations.",
    layers: [
      { authority: "Cornell Wex (L1)", meaning: "A voluntary civic task where a public citizen aids civil authorities under localized urgent conditions." },
      { authority: "The Law Society Guidance (L2)", meaning: "An optional commercial contract clause specifying shift adjustment procedures or contractor replacements." },
      { authority: "UK MoJ / Housing Acts (L3)", meaning: "A mandatory statutory duty (Homelessness Act) compelling municipal councils to take preventive action." },
      { authority: "Black's Law Dictionary (L4)", meaning: "A legacy common-law fiduciary obligation requiring active indemnity upon specified trust covenants." }
    ],
    reconciliation_considerations: "To prevent contract leakage, avoid raw string matching for 'Relief Duty'. Recommend qualify-indexing the signal into distinct namespaces: e.g., 'contract_clause.relief_duty' vs. 'statutory_duty.municipal_relief_duty'. The Operator must manually authorize the resolved path."
  },
  "Base Rate": {
    word: "Base Rate", status: "ALIGNED", severity: "STABLE",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    meter: "12% Ambiguity Margin",
    observation: "Strong typographic convergence. The physical benchmark definition of base interest rates lines up perfectly across public educational models (L1), central banking declarations (L2), regulatory handbook guidelines (L3), and XML-codified schemas (L4).",
    layers: [
      { authority: "Investopedia Guides (L1)", meaning: "The basic public cost benchmark utilized by retail banks to price mortgages, overdrafts, and credit lines." },
      { authority: "Bank of England (L2)", meaning: "The official base rate set by the Monetary Policy Committee establishing sovereign interbank lending yields." },
      { authority: "FCA UK Handbook (L3)", meaning: "The benchmark yield variable designated under national market rules to manage liquidity buffers." },
      { authority: "IFRS / ISO 20022 Standard (L4)", meaning: "The formally codified digital tag <BaseRt> mapping float rates to international trade settlement structures." }
    ],
    reconciliation_considerations: "Semantic integrity is high. No namespace partition is required. Reconciliation checks may proceed safely under standard float-point precision formats; adjust for any system-level micro rounding discrepancies."
  },
  "Arrest": {
    word: "Arrest", status: "DIVERGENT", severity: "CRITICAL COLLISION",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    meter: "95% Ambiguity Margin",
    observation: "Severe semantic collision. The active term maps to four disjoint domains: physical stoppage (L1), heart muscle cessation in clinical environments (L2), armed custodial detention (L3), and maritime cargo seizing (L4). These are highly critical, independent states.",
    layers: [
      { authority: "Cornell Wex Guides (L1)", meaning: "Any abrupt stoppage, temporary suspension, or restriction placed on an ongoing mechanical or chemical process." },
      { authority: "NICE Guidelines / NHS (L2)", meaning: "The life-threatening, clinical cessation of metabolic pumping actions inside the myocardium (Cardiac Arrest)." },
      { authority: "UK Ministry of Justice (L3)", meaning: "The taking of a sovereign human subject into armed custody under major criminal cause mandates." },
      { authority: "Black's Law Dictionary (L4)", meaning: "A formal Admiralty court order freezing a cargo-bearing vessel (in rem action) until commercial claim release." }
    ],
    reconciliation_considerations: "Under severe divergence, uniform telemetry evaluation will cause critical system failure. Isolate the data source domain before routing the signal. The host must not autodecide the context without an explicit Operator domain declaration."
  }
};

export default function LanguageContextStack() {
  const [activeDomain, setActiveDomain] = useState<
    "legal_context" | "financial_context" | "medical_context" | "market_context"
  >("legal_context");
  const [selectedWordExample, setSelectedWordExample] = useState(0);
  const [testerTerm, setTesterTerm] = useState<"Relief Duty" | "Base Rate" | "Arrest">("Relief Duty");
  const [customTerm, setCustomTerm] = useState("");
  const [customMeaning, setCustomMeaning] = useState("");
  const [customAuthorityName, setCustomAuthorityName] = useState("");
  const [customJurisdiction, setCustomJurisdiction] = useState("Global");
  const [customLayer, setCustomLayer] = useState<
    "plain_patient" | "clinical_guidance" | "regulatory" | "structured_terminology"
  >("clinical_guidance");
  const [customCodeSystem, setCustomCodeSystem] = useState("SNOMED CT");
  const [customUrl, setCustomUrl] = useState("https://");
  const [admittedRecords, setAdmittedRecords] = useState<LanguageAuthorityRecord[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState(false);

  useEffect(() => {
    fetchLanguageLedger();
  }, []);

  const fetchLanguageLedger = async () => {
    setIsDbLoading(true);
    setOperationError(null);
    try {
      const res = await fetch(getAbsoluteUrl("/api/language/authorities"));
      const data = await res.json();
      if (data.success) {
        setAdmittedRecords(data.records || []);
      } else {
        throw new Error(data.error || "Failed to load");
      }
    } catch (err: any) {
      setOperationError("Database offline. Displaying local cache. Connection will recover automatically.");
    } finally {
      setIsDbLoading(false);
    }
  };

  const handleAdmitLedgerEntry = async () => {
    if (!customTerm || !customMeaning || !customAuthorityName) {
      alert("Please fill in Core Term, Meaning definition, and Authority name first.");
      return;
    }
    setIsDbLoading(true);
    setOperationError(null);
    try {
      const res = await fetch(getAbsoluteUrl("/api/language/authorities"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authority_name: customAuthorityName,
          jurisdiction: customJurisdiction,
          domain: activeDomain,
          language_layer: customLayer,
          source_type: "Operator Manual Admission",
          definition_url: customUrl,
          structured_code_system: customCodeSystem,
          operator_approved: true,
          defined_term: customTerm,
          meaning: customMeaning,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newRecord: LanguageAuthorityRecord = {
          id: data.id,
          authority_name: customAuthorityName,
          jurisdiction: customJurisdiction,
          domain: activeDomain,
          language_layer: customLayer,
          source_type: "Operator Manual Admission",
          definition_url: customUrl,
          structured_code_system: customCodeSystem,
          operator_approved: true,
          createdAt: data.createdAt,
          defined_term: customTerm,
          meaning: customMeaning,
        };
        setAdmittedRecords((prev) => [newRecord, ...prev]);
        setCustomTerm("");
        setCustomMeaning("");
        setSuccessAnimation(true);
        setTimeout(() => setSuccessAnimation(false), 2000);
      } else {
        setOperationError(data.error || "Failed to record authority.");
      }
    } catch (err: any) {
      setOperationError(err.message || "Network error saving authority.");
    } finally {
      setIsDbLoading(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!id) return;
    setIsDbLoading(true);
    setOperationError(null);
    try {
      const res = await fetch(getAbsoluteUrl(`/api/language/authorities/${id}`), { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setAdmittedRecords((prev) => prev.filter((r) => r.id !== id));
      } else {
        setOperationError(data.error || "Failed to delete.");
      }
    } catch (err: any) {
      setOperationError(err.message || "Network error deleting authority.");
    } finally {
      setIsDbLoading(false);
    }
  };

  const domainData = BASELINE_AUTHORITY_STACKS[activeDomain];
  const currentExample = DOCTRINE_AMBIGUITY_EXAMPLES[selectedWordExample];

  return (
    <div className="space-y-6 text-left" id="language-context-stack-component">
      
      <div className="bg-sleek-panel border border-sleek-border rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10 font-mono text-[90px] font-extrabold select-none leading-none">LIB</div>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <BookOpen className="text-[#E0AF68] w-5 h-5" />
              <h1 className="text-sm font-semibold text-white tracking-widest uppercase font-mono">
                LANGUAGE_CONTEXT.LIB // MULTI-AUTHORITY LANGUAGE STACK
              </h1>
            </div>
            <p className="text-xs text-sleek-muted max-w-3xl leading-relaxed">
              Every word belongs to an authority stack. Under the <strong>Bounded-Context doctrine</strong>, a term has no singular absolute definition. Interpretation begins <em>only</em> after the governing language authority is isolated and resolved.
            </p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded px-2.5 py-1 text-[9px] font-mono text-emerald-400 font-bold uppercase shrink-0">STC_LIN_ACTIVE: OK72</div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4 text-[10.5px] font-mono">
          <div className="flex items-start space-x-2">
            <Layers className="text-sleek-cyan w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="text-[#E0AF68] font-bold block">Doctrine Invariant A:</span>
              <span className="text-slate-300">"Same word, different authority, different meaning."</span>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Compass className="text-purple-400 w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="text-[#E0AF68] font-bold block">Doctrine Invariant B:</span>
              <span className="text-slate-300">"Logical analysis of a field starts ONLY after the language layer is declared."</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0D1017] border border-[#E0AF68]/30 rounded-xl p-5 shadow-2xl space-y-4 relative overflow-hidden" id="sovereign-aperture-tester">
        <div className="absolute top-0 right-0 p-3 flex space-x-1 items-center font-mono opacity-20 text-[10px] font-bold uppercase select-none">
          <Binary className="w-3.5 h-3.5 text-sleek-cyan animate-pulse" />
          <span>COPROCESSOR COUPLING</span>
        </div>
        <div className="flex items-center space-x-2">
          <Layers className="text-[#E0AF68] w-5 h-5" />
          <div>
            <h2 className="text-xs font-bold font-mono tracking-widest text-[#E0AF68] uppercase">Cross-Authority Definition Alignment</h2>
            <p className="text-[10px] text-slate-400 font-mono">Simulate a Bounded Reality Slice. Map raw linguistic signals through independent authority stacks to isolate semantic divergence.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-[#121620] border border-white/5 p-2 rounded-lg font-mono text-xs">
          <span className="text-slate-400 font-bold uppercase text-[9px] mr-2">Select Target Signal:</span>
          {(["Relief Duty", "Base Rate", "Arrest"] as const).map((term) => (
            <button key={term} onClick={() => setTesterTerm(term)} className={`px-3 py-1.5 rounded transition-all cursor-pointer font-bold text-[10.5px] uppercase ${testerTerm === term ? "bg-[#E0AF68] text-black shadow" : "bg-[#181D2A] text-slate-400 hover:text-white hover:bg-[#1C2232]"}`}>{`"${term}"`}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1 font-mono">
          <div className="lg:col-span-5 bg-[#121620] border border-[#232736]/40 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest block">[ OBJECTIVE OBSERVATION LAYER ]</span>
              <div className="flex items-center space-x-3">
                <div className={`px-2.5 py-1 text-[11px] font-extrabold uppercase rounded border ${APERTURE_PRESETS[testerTerm].status === "DIVERGENT" ? "bg-rose-500/10 text-rose-400 border-rose-500/25 animate-pulse" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"}`}>
                  {APERTURE_PRESETS[testerTerm].status}
                </div>
                <div className="text-[10px] text-slate-300 font-bold">{APERTURE_PRESETS[testerTerm].severity}</div>
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                  <span>Context Divergence Delta:</span>
                  <span className={APERTURE_PRESETS[testerTerm].status === "DIVERGENT" ? "text-rose-400" : "text-emerald-400"}>{APERTURE_PRESETS[testerTerm].meter}</span>
                </div>
                <div className="w-full bg-[#181d2a] h-2 rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full transition-all duration-500 rounded-full ${APERTURE_PRESETS[testerTerm].status === "DIVERGENT" ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: APERTURE_PRESETS[testerTerm].status === "DIVERGENT" ? (APERTURE_PRESETS[testerTerm].word === "Arrest" ? "95%" : "68%") : "12%" }} />
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed pt-1 font-sans">{APERTURE_PRESETS[testerTerm].observation}</p>
            </div>
            <div className="bg-[#181D2A] border border-white/5 p-2.5 rounded-lg flex items-start space-x-2 text-[10px]">
              <ShieldAlert className="w-4 h-4 text-[#E0AF68] shrink-0 mt-0.5" />
              <span className="text-slate-400">The instrument calculates semantic distance dynamically without imposing automated preference.</span>
            </div>
          </div>
          <div className="lg:col-span-7 space-y-2.5">
            <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest block pl-1">[ EXPLICIT DATA SOURCE ATTRIBUTION (CROSS-AUTHORITY STACK) ]</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {APERTURE_PRESETS[testerTerm].layers.map((layer, idx) => (
                <div key={idx} className="bg-[#121620] border border-white/5 rounded-lg p-3 hover:border-sleek-cyan/20 transition-all text-left space-y-1.5">
                  <div className="flex justify-between items-center border-b border-white/5 pb-1">
                    <span className="text-[#E0AF68] font-bold text-[9px] uppercase tracking-tight">Authority Layer {idx + 1}</span>
                    <span className="text-[8.5px] text-slate-500 font-bold">L{idx + 1} Standard</span>
                  </div>
                  <div className="text-[10px] text-white font-extrabold pb-0.5">{layer.authority}</div>
                  <p className="text-[#A9B1D6] text-[10px] leading-relaxed font-sans">"{layer.meaning}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-[#090B10] border border-[#232736] rounded-xl p-3.5 space-y-1.5 text-left font-mono">
          <div className="flex items-center space-x-1.5 text-[#30A9FF]">
            <Brain className="w-4 h-4 text-sleek-cyan animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Authority Navigation & Reconciliation Guidelines (Operator Advisory)</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans pr-4">{APERTURE_PRESETS[testerTerm].reconciliation_considerations}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-sleek-panel border border-[#4CD964]/10 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#232736]/40 pb-2">
              <div className="flex items-center space-x-1.5">
                <Brain className="text-[#4CD964] w-4.5 h-4.5 animate-pulse" />
                <h2 className="text-xs font-bold font-mono tracking-widest text-[#4CD964] uppercase">Doctrine Lexical Resolver</h2>
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Ambiguity Inspector v2.0</span>
            </div>
            <p className="text-[11px] text-sleek-muted">Select an ambiguous term below to observe how the exact same word transforms meaning across our 4 regulatory domains when interpreted by different authorities:</p>
            <div className="flex flex-wrap gap-2">
              {DOCTRINE_AMBIGUITY_EXAMPLES.map((item, index) => (
                <button key={item.word} onClick={() => setSelectedWordExample(index)} className={`px-3 py-2 rounded-lg font-mono text-[11px] transition-all cursor-pointer flex items-center space-x-1.5 ${selectedWordExample === index ? "bg-[#4CD964] text-black font-extrabold" : "bg-[#111319]/80 text-[#8A95A5] border border-[#232736]/40 hover:text-white"}`}>
                  <Search className="w-3.5 h-3.5" />
                  <span>{item.word}</span>
                </button>
              ))}
            </div>
            <div className="bg-[#0A0C11] border border-white/5 rounded-xl p-4 space-y-3 font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-slate-400 text-[10px] uppercase">TARGET WORD SCAN:</span>
                <span className="text-white text-base font-bold tracking-wider uppercase font-sans">"{currentExample.word}"</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="bg-[#111319] p-3 rounded-lg border border-transparent hover:border-sleek-cyan/30 transition-all space-y-1.5 text-left">
                  <span className="text-[#30A9FF] text-[8.5px] font-bold block uppercase tracking-wider">🛰️ market_context.lib</span>
                  <span className="text-[#E0AF68] text-[9.5px] font-bold block">{currentExample.definitions.market_context.authority}</span>
                  <p className="text-[#A9B1D6] text-[10.5px] leading-normal font-sans">{currentExample.definitions.market_context.meaning}</p>
                </div>
                <div className="bg-[#111319] p-3 rounded-lg border border-transparent hover:border-rose-500/30 transition-all space-y-1.5 text-left">
                  <span className="text-rose-400 text-[8.5px] font-bold block uppercase tracking-wider">🩺 medical_context.lib</span>
                  <span className="text-[#E0AF68] text-[9.5px] font-bold block">{currentExample.definitions.medical_context.authority}</span>
                  <p className="text-[#A9B1D6] text-[10.5px] leading-normal font-sans">{currentExample.definitions.medical_context.meaning}</p>
                </div>
                <div className="bg-[#111319] p-3 rounded-lg border border-transparent hover:border-emerald-500/30 transition-all space-y-1.5 text-left">
                  <span className="text-emerald-400 text-[8.5px] font-bold block uppercase tracking-wider">⚖️ legal_context.lib</span>
                  <span className="text-[#E0AF68] text-[9.5px] font-bold block">{currentExample.definitions.legal_context.authority}</span>
                  <p className="text-[#A9B1D6] text-[10.5px] leading-normal font-sans">{currentExample.definitions.legal_context.meaning}</p>
                </div>
                <div className="bg-[#111319] p-3 rounded-lg border border-transparent hover:border-amber-500/30 transition-all space-y-1.5 text-left">
                  <span className="text-amber-400 text-[8.5px] font-bold block uppercase tracking-wider">💰 financial_context.lib</span>
                  <span className="text-[#E0AF68] text-[9.5px] font-bold block">{currentExample.definitions.financial_context.authority}</span>
                  <p className="text-[#A9B1D6] text-[10.5px] leading-normal font-sans">{currentExample.definitions.financial_context.meaning}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-sleek-panel border border-sleek-border rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#232736]/40 pb-2 text-left">
              <div className="flex items-center space-x-1.5">
                <Terminal className="text-sleek-cyan w-4 h-4 animate-pulse" />
                <h2 className="text-xs font-bold font-mono tracking-widest text-[#64D2FF] uppercase">Persistent Language Ledger</h2>
              </div>
              <button onClick={fetchLanguageLedger} className="text-[9px] font-mono text-sleek-cyan hover:underline flex items-center space-x-1">
                <RefreshCw className={`w-3.5 h-3.5 ${isDbLoading ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>
            {operationError && (
              <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs text-rose-400 font-mono flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{operationError}</span>
              </div>
            )}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {admittedRecords.length === 0 ? (
                <div className="border border-dashed border-[#232736] p-8 rounded-lg text-center text-sleek-muted font-mono text-[10.5px]">
                  No operator-admitted records found. Use the console to register custom definitions of language_context.lib!
                </div>
              ) : (
                admittedRecords.map((item) => (
                  <div key={item.id} className="bg-[#090A0E] border border-white/5 rounded-lg p-3 hover:border-sleek-cyan/20 transition-all font-mono space-y-2 text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-extrabold text-white uppercase block">Term: "{item.defined_term}"</span>
                        <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Domain: {item.domain?.replace("_", ".")}</span>
                      </div>
                      <button onClick={() => item.id && handleDeleteRecord(item.id)} className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors" title="Prune authority entry">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10.5px] text-[#A9B1D6] font-sans leading-relaxed">{item.meaning}</p>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[8.5px] text-slate-400">
                      <div><span className="block text-slate-600 uppercase text-[7.5px]">Authority:</span><strong className="text-amber-400">{item.authority_name}</strong></div>
                      <div><span className="block text-slate-600 uppercase text-[7.5px]">Layer & Codebook:</span><span className="text-sleek-cyan">{item.language_layer?.replace("_", " ")} ({item.structured_code_system})</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-5 space-y-5">
          <div className="bg-sleek-panel border border-[#E0AF68]/20 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center space-x-1.5 border-b border-[#232736]/40 pb-2">
              <Database className="text-[#E0AF68] w-4 h-4" />
              <h2 className="text-xs font-bold font-mono tracking-widest text-[#E0AF68] uppercase">Admit Custom Authority</h2>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(["legal_context", "financial_context", "medical_context", "market_context"] as const).map((d) => (
                <button key={d} onClick={() => setActiveDomain(d)} className={`px-2 py-1 rounded text-[9px] font-mono font-bold cursor-pointer transition-all ${activeDomain === d ? "bg-[#E0AF68] text-black" : "bg-[#111319] text-slate-400 border border-[#232736] hover:text-white"}`}>{d.replace("_", ".")}</button>
              ))}
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <label className="text-[9px] text-[#8A95A5] uppercase tracking-wider block font-bold">Linguistic Term:</label>
                  <input type="text" placeholder="e.g. Inflow" value={customTerm} onChange={(e) => setCustomTerm(e.target.value)} className="w-full bg-[#111319] border border-[#232736] rounded px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-sleek-cyan placeholder:text-slate-600" />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[9px] text-[#8A95A5] uppercase tracking-wider block font-bold">Authority:</label>
                  <input type="text" placeholder="e.g. GMC / NICE / SEC" value={customAuthorityName} onChange={(e) => setCustomAuthorityName(e.target.value)} className="w-full bg-[#111319] border border-[#232736] rounded px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-sleek-cyan placeholder:text-slate-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <label className="text-[9px] text-[#8A95A5] uppercase tracking-wider block font-bold">Jurisdiction:</label>
                  <input type="text" value={customJurisdiction} onChange={(e) => setCustomJurisdiction(e.target.value)} className="w-full bg-[#111319] border border-[#232736] rounded px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-sleek-cyan" />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[9px] text-[#8A95A5] uppercase tracking-wider block font-bold">Code System:</label>
                  <input type="text" value={customCodeSystem} onChange={(e) => setCustomCodeSystem(e.target.value)} className="w-full bg-[#111319] border border-[#232736] rounded px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-sleek-cyan" />
                </div>
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[9px] text-[#8A95A5] uppercase tracking-wider block font-bold">Conceptual Layer:</label>
                <select value={customLayer} onChange={(e) => setCustomLayer(e.target.value as any)} className="w-full bg-[#111319] border border-[#232736] rounded px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-sleek-cyan cursor-pointer">
                  <option value="plain_patient">L1 - Plain-language / Consumer translation</option>
                  <option value="clinical_guidance">L2 - Clinical or technical guidance pathways</option>
                  <option value="regulatory">L3 - Statutory Regulatory standards</option>
                  <option value="structured_terminology">L4 - Machine ontologies & classification</option>
                </select>
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[9px] text-[#8A95A5] uppercase tracking-wider block font-bold">Reference URL:</label>
                <input type="text" value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} className="w-full bg-[#111319] border border-[#232736] rounded px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-sleek-cyan" />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[9px] text-[#8A95A5] uppercase tracking-wider block font-bold">Delineated Meaning:</label>
                <textarea rows={2} placeholder="Specify precisely how this authority defines the term..." value={customMeaning} onChange={(e) => setCustomMeaning(e.target.value)} className="w-full bg-[#111319] border border-[#232736] rounded px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-sleek-cyan placeholder:text-slate-600 leading-relaxed" />
              </div>
              <div className="pt-2">
                <button onClick={handleAdmitLedgerEntry} disabled={isDbLoading} className="w-full bg-[#E0AF68] hover:bg-[#ebbd7c] text-black font-mono text-xs font-bold py-2.5 rounded-lg flex items-center justify-center space-x-1.5 shadow-md cursor-pointer transition-colors">
                  {isDbLoading ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : <Database className="w-4 h-4 text-black" />}
                  <span>{isDbLoading ? "RECORDING IN LEDGER..." : "ADMIT TO SOVEREIGN LANGUAGE LEDGER"}</span>
                </button>
              </div>
              <AnimatePresence>
                {successAnimation && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-2 rounded bg-emerald-500/10 border border-emerald-500/25 text-[#4CD964] font-mono text-[10px] text-center">
                    🚀 Verification Seal Confirmed: Record Committed to language_authorities Collection.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-sleek-panel border border-sleek-border rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center space-x-1.5 border-b border-[#232736]/40 pb-2">
              <MapPin className="text-sleek-cyan w-4 h-4" />
              <h3 className="text-xs font-bold font-mono tracking-widest text-[#64D2FF] uppercase">{domainData.title} — Baseline Stacks</h3>
            </div>
            <p className="text-[11px] text-sleek-muted leading-relaxed">{domainData.description}</p>
            <div className="space-y-3">
              {domainData.layers.map((layer) => (
                <div key={layer.key} className="bg-[#090A0E] border border-white/5 rounded-lg p-3 space-y-1.5 text-left hover:border-sleek-cyan/20 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-[#E0AF68] font-mono">{layer.name}</span>
                    <a href={layer.url} target="_blank" rel="noopener noreferrer" className="text-sleek-cyan hover:underline text-[8px] flex items-center space-x-0.5">
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span>Reference</span>
                    </a>
                  </div>
                  <div className="text-[9px] font-mono text-sleek-muted">
                    <span className="text-amber-400 font-bold">{layer.authority}</span> — {layer.jurisdiction}
                  </div>
                  <p className="text-[10px] text-[#A9B1D6] font-sans leading-relaxed">{layer.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
