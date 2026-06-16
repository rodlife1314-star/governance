import { db, domainAuthorities, dataSources } from "@workspace/db";
import { randomUUID } from "crypto";

type AuthorityInput = {
  domain: string;
  subDomain?: string;
  name: string;
  shortName: string;
  jurisdiction: string;
  url: string;
  tier: "primary" | "regulatory" | "reference" | "standard" | "glossary";
  sourceType: "regulatory_body" | "standards_body" | "reference" | "glossary" | "archive" | "live_feed";
  description: string;
  sortOrder?: number;
};

const AUTHORITIES: AuthorityInput[] = [
  // ── LAW ──────────────────────────────────────────────────────────────────
  { domain: "Law", subDomain: "General", name: "Cornell Legal Information Institute (Wex)", shortName: "Cornell LII", jurisdiction: "US", url: "https://www.law.cornell.edu/wex", tier: "reference", sourceType: "reference", description: "Free legal dictionary and encyclopedia covering US federal and state law.", sortOrder: 10 },
  { domain: "Law", subDomain: "General", name: "Black's Law Dictionary", shortName: "Black's Law", jurisdiction: "US", url: "https://thelawdictionary.org", tier: "reference", sourceType: "glossary", description: "The standard legal reference dictionary for US common law terminology.", sortOrder: 11 },
  { domain: "Law", subDomain: "General", name: "Merriam-Webster's Dictionary of Law", shortName: "MW Legal", jurisdiction: "US", url: "https://www.merriam-webster.com/legal", tier: "glossary", sourceType: "glossary", description: "Legal term definitions with plain-language context.", sortOrder: 12 },
  { domain: "Law", subDomain: "General", name: "USLegal Glossary", shortName: "USLegal", jurisdiction: "US", url: "https://definitions.uslegal.com", tier: "glossary", sourceType: "glossary", description: "Practical legal definitions and sample legal forms.", sortOrder: 13 },
  { domain: "Law", subDomain: "UK", name: "His Majesty's Courts & Tribunals Service", shortName: "HMCTS", jurisdiction: "UK", url: "https://www.judiciary.uk", tier: "primary", sourceType: "regulatory_body", description: "Official UK judiciary authority — courts, tribunals, and judicial terminology.", sortOrder: 1 },
  { domain: "Law", subDomain: "UK", name: "The Law Society", shortName: "Law Society", jurisdiction: "UK", url: "https://www.lawsociety.org.uk", tier: "regulatory", sourceType: "regulatory_body", description: "Governing body for solicitors in England and Wales.", sortOrder: 2 },

  // ── MEDICINE ─────────────────────────────────────────────────────────────
  { domain: "Medicine", subDomain: "UK", name: "NHS Conditions & Terminology", shortName: "NHS", jurisdiction: "UK", url: "https://www.nhs.uk/conditions", tier: "primary", sourceType: "regulatory_body", description: "UK National Health Service conditions index and patient-facing medical terminology.", sortOrder: 1 },
  { domain: "Medicine", subDomain: "UK", name: "NICE (National Institute for Health and Care Excellence)", shortName: "NICE", jurisdiction: "UK", url: "https://www.nice.org.uk/glossary", tier: "primary", sourceType: "regulatory_body", description: "UK evidence-based clinical guidance, guidelines, and terminology standards.", sortOrder: 2 },
  { domain: "Medicine", subDomain: "UK", name: "General Medical Council", shortName: "GMC", jurisdiction: "UK", url: "https://www.gmc-uk.org", tier: "regulatory", sourceType: "regulatory_body", description: "UK regulator for doctors — sets standards for medical practice and fitness to practise.", sortOrder: 3 },
  { domain: "Medicine", subDomain: "UK", name: "Medicines and Healthcare products Regulatory Agency", shortName: "MHRA", jurisdiction: "UK", url: "https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency", tier: "regulatory", sourceType: "regulatory_body", description: "UK regulator for medicines and medical devices.", sortOrder: 4 },
  { domain: "Medicine", subDomain: "US", name: "US Food and Drug Administration", shortName: "FDA", jurisdiction: "US", url: "https://www.fda.gov", tier: "primary", sourceType: "regulatory_body", description: "US federal regulator for drugs, biologics, devices, and food safety.", sortOrder: 5 },
  { domain: "Medicine", subDomain: "US", name: "CDC Health Literacy", shortName: "CDC", jurisdiction: "US", url: "https://www.cdc.gov/health-literacy/index.html", tier: "reference", sourceType: "glossary", description: "Plain-language health and disease terminology from the US Centers for Disease Control.", sortOrder: 6 },
  { domain: "Medicine", subDomain: "US", name: "NIH MedlinePlus Medical Encyclopedia", shortName: "MedlinePlus", jurisdiction: "US", url: "https://medlineplus.gov/encyclopedia.html", tier: "reference", sourceType: "reference", description: "Peer-reviewed, plain-language medical definitions backed by NIH.", sortOrder: 7 },
  { domain: "Medicine", subDomain: "International", name: "World Health Organization", shortName: "WHO", jurisdiction: "International", url: "https://www.who.int", tier: "primary", sourceType: "regulatory_body", description: "UN global health authority — ICD codes, disease classifications, international standards.", sortOrder: 8 },
  { domain: "Medicine", subDomain: "International", name: "SNOMED CT (Clinical Terminology Standard)", shortName: "SNOMED CT", jurisdiction: "International", url: "https://www.snomed.org", tier: "standard", sourceType: "standards_body", description: "The international clinical terminology standard for codeable medical terms.", sortOrder: 9 },
  { domain: "Medicine", subDomain: "International", name: "MeSH (Medical Subject Headings, NLM)", shortName: "MeSH", jurisdiction: "US", url: "https://www.nlm.nih.gov/mesh", tier: "standard", sourceType: "standards_body", description: "NLM controlled vocabulary for indexing biomedical literature — structured MeSH hierarchy.", sortOrder: 10 },

  // ── ASTROPHYSICS ─────────────────────────────────────────────────────────
  { domain: "Astrophysics", subDomain: "Institutions", name: "NASA", shortName: "NASA", jurisdiction: "US", url: "https://www.nasa.gov", tier: "primary", sourceType: "regulatory_body", description: "US National Aeronautics and Space Administration — primary space science authority.", sortOrder: 1 },
  { domain: "Astrophysics", subDomain: "Institutions", name: "NASA Astrophysics Data System", shortName: "NASA ADS", jurisdiction: "US", url: "https://ui.adsabs.harvard.edu", tier: "reference", sourceType: "archive", description: "Research paper and citation archive for astrophysics — Harvard/NASA managed.", sortOrder: 2 },
  { domain: "Astrophysics", subDomain: "Institutions", name: "European Space Agency", shortName: "ESA", jurisdiction: "EU", url: "https://www.esa.int", tier: "primary", sourceType: "regulatory_body", description: "European intergovernmental space authority.", sortOrder: 3 },
  { domain: "Astrophysics", subDomain: "Institutions", name: "European Southern Observatory", shortName: "ESO", jurisdiction: "EU/International", url: "https://www.eso.org", tier: "primary", sourceType: "regulatory_body", description: "Operates the world's most productive ground-based telescopes including the VLT.", sortOrder: 4 },
  { domain: "Astrophysics", subDomain: "Reference", name: "NASA Science Education", shortName: "NASA Science", jurisdiction: "US", url: "https://science.nasa.gov", tier: "glossary", sourceType: "glossary", description: "NASA Science education hub — missions, discoveries, and plain-language astronomical concepts.", sortOrder: 5 },
  { domain: "Astrophysics", subDomain: "Standards", name: "International Astronomical Union", shortName: "IAU", jurisdiction: "International", url: "https://www.iau.org", tier: "standard", sourceType: "standards_body", description: "Root authority for astronomical terminology, naming conventions, and classification (e.g. planet definitions).", sortOrder: 6 },
  { domain: "Astrophysics", subDomain: "Reference", name: "arXiv (astro-ph section)", shortName: "arXiv", jurisdiction: "International", url: "https://arxiv.org/list/astro-ph/recent", tier: "reference", sourceType: "archive", description: "Open-access preprint repository for astrophysics research.", sortOrder: 7 },

  // ── ENGINEERING ──────────────────────────────────────────────────────────
  { domain: "Engineering", subDomain: "Electrical", name: "IEEE", shortName: "IEEE", jurisdiction: "International", url: "https://www.ieee.org", tier: "standard", sourceType: "standards_body", description: "World's largest technical professional organisation — electrical and electronics standards.", sortOrder: 1 },
  { domain: "Engineering", subDomain: "Mechanical", name: "ASME (American Society of Mechanical Engineers)", shortName: "ASME", jurisdiction: "US/International", url: "https://www.asme.org", tier: "standard", sourceType: "standards_body", description: "Mechanical engineering codes and standards.", sortOrder: 2 },
  { domain: "Engineering", subDomain: "Civil (UK)", name: "Institution of Civil Engineers", shortName: "ICE", jurisdiction: "UK", url: "https://www.ice.org.uk", tier: "regulatory", sourceType: "regulatory_body", description: "UK professional body for civil engineers.", sortOrder: 3 },
  { domain: "Engineering", subDomain: "Measurement", name: "NIST (National Institute of Standards and Technology)", shortName: "NIST", jurisdiction: "US", url: "https://www.nist.gov", tier: "primary", sourceType: "standards_body", description: "Root US measurement and standards authority — most domain-specific bodies defer to or align with NIST.", sortOrder: 4 },

  // ── COMPUTING ────────────────────────────────────────────────────────────
  { domain: "Technology", subDomain: "Computing", name: "ACM (Association for Computing Machinery)", shortName: "ACM", jurisdiction: "International", url: "https://www.acm.org", tier: "standard", sourceType: "standards_body", description: "World's largest computing professional society — research and education.", sortOrder: 1 },
  { domain: "Technology", subDomain: "Internet", name: "IETF (Internet Engineering Task Force)", shortName: "IETF", jurisdiction: "International", url: "https://www.ietf.org", tier: "standard", sourceType: "standards_body", description: "Develops and promotes Internet standards including protocols and RFCs.", sortOrder: 2 },
  { domain: "Technology", subDomain: "Web", name: "W3C (World Wide Web Consortium)", shortName: "W3C", jurisdiction: "International", url: "https://www.w3.org", tier: "standard", sourceType: "standards_body", description: "Web standards authority — HTML, CSS, accessibility, and semantic web.", sortOrder: 3 },
  { domain: "Technology", subDomain: "Software", name: "ISO/IEC JTC1 (Software & IT Standards)", shortName: "ISO/IEC JTC1", jurisdiction: "International", url: "https://www.iso.org/committee/45020.html", tier: "standard", sourceType: "standards_body", description: "Joint ISO/IEC technical committee for information technology standards.", sortOrder: 4 },

  // ── MATERIALS / EARTH ────────────────────────────────────────────────────
  { domain: "Materials Science", subDomain: "Testing", name: "ASTM International", shortName: "ASTM", jurisdiction: "International", url: "https://www.astm.org", tier: "standard", sourceType: "standards_body", description: "International standards for materials testing, products, systems, and services.", sortOrder: 1 },
  { domain: "Materials Science", subDomain: "Database", name: "Materials Project (DOE)", shortName: "Materials Project", jurisdiction: "US", url: "https://materialsproject.org", tier: "reference", sourceType: "reference", description: "DOE-backed open database of computed properties of known and predicted materials.", sortOrder: 2 },
  { domain: "Earth Science", subDomain: "Geology", name: "USGS (US Geological Survey)", shortName: "USGS", jurisdiction: "US", url: "https://www.usgs.gov", tier: "primary", sourceType: "regulatory_body", description: "US federal science agency for geology, hydrology, biology, and geography.", sortOrder: 1 },
  { domain: "Earth Science", subDomain: "Meteorology", name: "UK Met Office", shortName: "Met Office", jurisdiction: "UK", url: "https://www.metoffice.gov.uk", tier: "primary", sourceType: "regulatory_body", description: "UK national meteorological service — weather and climate authority.", sortOrder: 2 },
  { domain: "Earth Science", subDomain: "Climate", name: "IPCC (Intergovernmental Panel on Climate Change)", shortName: "IPCC", jurisdiction: "International", url: "https://www.ipcc.ch", tier: "primary", sourceType: "regulatory_body", description: "UN body providing comprehensive assessments of climate science.", sortOrder: 3 },

  // ── CROSS-DOMAIN STANDARDS ───────────────────────────────────────────────
  { domain: "Standards", subDomain: "UK", name: "BSI (British Standards Institution)", shortName: "BSI", jurisdiction: "UK", url: "https://www.bsigroup.com", tier: "standard", sourceType: "standards_body", description: "UK national standards body — produces BS standards across all sectors.", sortOrder: 1 },
  { domain: "Standards", subDomain: "International", name: "ISO (International Organization for Standardization)", shortName: "ISO", jurisdiction: "International", url: "https://www.iso.org", tier: "primary", sourceType: "standards_body", description: "Root international standards body — most domain bodies defer to or align with ISO.", sortOrder: 2 },

  // ── FINANCE ──────────────────────────────────────────────────────────────
  { domain: "Finance", subDomain: "Derivatives", name: "CME Group", shortName: "CME", jurisdiction: "US", url: "https://www.cmegroup.com", tier: "primary", sourceType: "regulatory_body", description: "World's largest financial derivatives exchange — futures and options on BTC, gold, FX, rates.", sortOrder: 1 },
  { domain: "Finance", subDomain: "Crypto", name: "Coinbase Exchange", shortName: "Coinbase", jurisdiction: "US", url: "https://www.coinbase.com", tier: "reference", sourceType: "live_feed", description: "Primary BTC/USD spot price feed used by RAPIDS for live field analysis.", sortOrder: 2 },
  { domain: "Finance", subDomain: "Regulation (UK)", name: "Financial Conduct Authority", shortName: "FCA", jurisdiction: "UK", url: "https://www.fca.org.uk", tier: "regulatory", sourceType: "regulatory_body", description: "UK financial services regulator — conduct and consumer protection authority.", sortOrder: 3 },
  { domain: "Finance", subDomain: "Regulation (US)", name: "US Securities and Exchange Commission", shortName: "SEC", jurisdiction: "US", url: "https://www.sec.gov", tier: "regulatory", sourceType: "regulatory_body", description: "US federal securities regulator.", sortOrder: 4 },
];

type DataSourceInput = {
  domain: string;
  name: string;
  shortName: string;
  endpointUrl: string;
  updateFrequency: string;
  authRequired: boolean;
  dataType: string;
  description: string;
  notes?: string;
};

const DATA_SOURCES: DataSourceInput[] = [
  { domain: "Finance", name: "Coinbase BTC Spot Price API", shortName: "Coinbase API", endpointUrl: "https://api.coinbase.com/v2/prices/BTC-USD/spot", updateFrequency: "real-time", authRequired: false, dataType: "spot_price", description: "Live BTC/USD spot price from Coinbase exchange.", notes: "Used directly by RAPIDS field analysis." },
  { domain: "Finance", name: "Yahoo Finance Futures", shortName: "YF Futures", endpointUrl: "https://query2.finance.yahoo.com/v8/finance/chart/{symbol}", updateFrequency: "15min delay", authRequired: false, dataType: "futures_price", description: "Delayed futures prices for GC=F (Gold), SI=F (Silver), ^NDX, ^DJI.", notes: "15-minute delay. OI not available via this feed — see CME DataMine for live OI." },
  { domain: "Finance", name: "CME DataMine (Open Interest)", shortName: "CME DataMine", endpointUrl: "https://www.cmegroup.com/market-data/datamine-historical-data.html", updateFrequency: "EOD / subscription", authRequired: true, dataType: "open_interest", description: "CME's official historical and end-of-day open interest data for all futures contracts.", notes: "Requires CME DataMine subscription. Current RAPIDS OI values are microstructure models, not live CME feeds." },
  { domain: "Astrophysics", name: "NASA Open APIs (APOD, NEO, EPIC)", shortName: "NASA APIs", endpointUrl: "https://api.nasa.gov", updateFrequency: "daily / real-time", authRequired: false, dataType: "observation_data", description: "APOD, near-earth objects, EPIC earth imagery, and more. Free API key registration.", notes: "Requires free NASA API key from api.nasa.gov." },
  { domain: "Astrophysics", name: "NOAA Space Weather Prediction Center", shortName: "NOAA SWPC", endpointUrl: "https://www.swpc.noaa.gov", updateFrequency: "real-time", authRequired: false, dataType: "space_weather", description: "Real-time solar activity, geomagnetic indices, and space weather alerts.", notes: "Live feeds available at services.swpc.noaa.gov/json" },
  { domain: "Astrophysics", name: "Space-Track (Satellite Telemetry)", shortName: "Space-Track", endpointUrl: "https://www.space-track.org", updateFrequency: "real-time", authRequired: true, dataType: "orbital_telemetry", description: "Official US Space Command satellite telemetry and orbital element sets (TLEs).", notes: "Requires free registration at space-track.org" },
  { domain: "Astrophysics", name: "MAST (Mikulski Archive — Hubble, JWST)", shortName: "MAST", endpointUrl: "https://archive.stsci.edu", updateFrequency: "near-real-time", authRequired: false, dataType: "telescope_archive", description: "Space Telescope Science Institute archive for Hubble and JWST data.", notes: "Public access — no auth for public data." },
  { domain: "Astrophysics", name: "ESA Sky Interactive Sky Viewer", shortName: "ESA Sky", endpointUrl: "https://sky.esa.int", updateFrequency: "near-real-time", authRequired: false, dataType: "sky_survey", description: "Interactive multi-wavelength sky viewer with live ESA mission data.", notes: "Browser-based and REST API available." },
  // ── LAW ──────────────────────────────────────────────────────────────────
  { domain: "Law", name: "BAILII (British and Irish Legal Information Institute)", shortName: "BAILII", endpointUrl: "https://www.bailii.org", updateFrequency: "daily", authRequired: false, dataType: "case_law", description: "Free online database of UK and Irish case law — the primary open-access equivalent of PACER for British and Irish courts.", notes: "No API. HTML scraping only. Covers England & Wales, Scotland, Northern Ireland, and Ireland." },
  // ── MEDICINE ─────────────────────────────────────────────────────────────
  { domain: "Medicine", name: "ClinicalTrials.gov", shortName: "ClinicalTrials", endpointUrl: "https://clinicaltrials.gov/api/v2/studies", updateFrequency: "daily", authRequired: false, dataType: "clinical_trials", description: "Primary US and global clinical trial registry — study protocols, phase, status, outcomes, and sponsor information.", notes: "REST API v2 available at clinicaltrials.gov/api/v2. No auth required. Returns JSON." },
  { domain: "Medicine", name: "Cochrane Library", shortName: "Cochrane", endpointUrl: "https://www.cochranelibrary.com", updateFrequency: "monthly", authRequired: false, dataType: "systematic_reviews", description: "Gold-standard source for systematic reviews and evidence synthesis in medicine and healthcare — Cochrane Reviews, Cochrane Protocols, CENTRAL trial register.", notes: "Full text requires institutional access. Abstracts and search are free. No public REST API — use site search." },
  // ── ASTROPHYSICS ─────────────────────────────────────────────────────────
  { domain: "Astrophysics", name: "Simbad Astronomical Database", shortName: "Simbad", endpointUrl: "https://simbad.u-strasbg.fr/simbad/sim-tap/sync", updateFrequency: "continuous", authRequired: false, dataType: "object_catalog", description: "CDS Strasbourg astronomical object catalog and identifier database — cross-references names, coordinates, and measurements for millions of objects.", notes: "TAP (ADQL) endpoint at simbad.u-strasbg.fr/simbad/sim-tap/sync. Also supports script and VOTable formats. No auth required." },
  { domain: "Astrophysics", name: "VizieR Catalogue Service", shortName: "VizieR", endpointUrl: "https://vizier.u-strasbg.fr/viz-bin/votable", updateFrequency: "continuous", authRequired: false, dataType: "catalog_tables", description: "CDS Strasbourg archive of astronomical data tables from published papers — over 20,000 catalogues accessible via TAP and VOTable.", notes: "TAP endpoint at tapvizier.u-strasbg.fr/TAPVizieR/tap. VOTable/JSON output supported. No auth required." },
  { domain: "Astrophysics", name: "SDSS SkyServer", shortName: "SDSS", endpointUrl: "https://skyserver.sdss.org/dr18/SkyServerWS/SearchTools/SqlSearch", updateFrequency: "static (DR18)", authRequired: false, dataType: "sky_survey", description: "Sloan Digital Sky Survey data archive — photometry, spectra, and object classifications for hundreds of millions of objects. DR18 is the current release.", notes: "SQL query API at skyserver.sdss.org/dr18/SkyServerWS/SearchTools/SqlSearch. No auth. Returns JSON/CSV." },
];

async function main() {
  console.log("Seeding domain authorities...");

  for (const a of AUTHORITIES) {
    await db.insert(domainAuthorities).values({
      id: randomUUID(),
      domain: a.domain,
      subDomain: a.subDomain ?? null,
      name: a.name,
      shortName: a.shortName,
      jurisdiction: a.jurisdiction,
      url: a.url,
      tier: a.tier,
      sourceType: a.sourceType,
      description: a.description,
      active: true,
      sortOrder: a.sortOrder ?? 99,
    }).onConflictDoNothing();
  }

  console.log(`  Inserted ${AUTHORITIES.length} authority records.`);

  console.log("Seeding data sources...");

  for (const s of DATA_SOURCES) {
    await db.insert(dataSources).values({
      id: randomUUID(),
      domain: s.domain,
      name: s.name,
      shortName: s.shortName,
      endpointUrl: s.endpointUrl,
      updateFrequency: s.updateFrequency,
      authRequired: s.authRequired,
      dataType: s.dataType,
      description: s.description,
      active: true,
      notes: s.notes ?? null,
    }).onConflictDoNothing();
  }

  console.log(`  Inserted ${DATA_SOURCES.length} data source records.`);
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
