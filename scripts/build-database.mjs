import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const rawCsvPath = path.join(rootDir, "raw_data", "Data.csv");
const pdfDir = path.join(rootDir, "database");
const outDir = path.join(rootDir, "data");

fs.mkdirSync(outDir, { recursive: true });

function parseCsv(csvPath) {
  const input = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current);
      current = "";
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  const [headers, ...dataRows] = rows;
  return dataRows.map((cells) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = cells[index] ?? "";
    });
    return entry;
  });
}

function cleanText(value) {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/\uFFFD/g, " ")
    .replace(/[×]/g, "x")
    .replace(/[–—]/g, "-")
    .replace(/\s*\.\s*/g, ". ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+\)/g, ")")
    .replace(/\(\s+/g, "(")
    .replace(/\s+-\s+/g, " - ")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .trim();
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitList(value) {
  const text = cleanText(value);
  if (!text || /^(no|none|not specified|unknown)$/i.test(text)) return [];
  return [
    ...new Set(
      text
        .split(",")
        .map((item) =>
          cleanText(item)
            .replace(/^and\s+/i, "")
            .replace(/^including\s+/i, "")
        )
        .filter(Boolean)
    ),
  ];
}

function uniqueNormalized(values) {
  return [...new Set(values.map((item) => cleanText(item)).filter(Boolean))];
}

function splitOrganismList(value) {
  const entries = [];
  for (const item of splitList(value)) {
    const cleaned = cleanText(item);
    if (/^Actinidia chinensis and A\.\s*eriantha$/i.test(cleaned)) {
      entries.push("Actinidia chinensis", "Actinidia eriantha");
      continue;
    }
    if (/^Actinidia chinensis and Actinidia eriantha$/i.test(cleaned)) {
      entries.push("Actinidia chinensis", "Actinidia eriantha");
      continue;
    }
    entries.push(cleaned);
  }
  return entries;
}

const countryAliases = new Map([
  ["error reading pdf", "Unknown"],
]);

const journalAliases = new Map([
  ["plos one", "PLOS ONE"],
  ["pLOS ONE", "PLOS ONE"],
  ["3 biotech", "3 Biotech"],
  ["journal of king saud university - science", "Journal of King Saud University - Science"],
]);

const genomeSourceAliases = new Map([
  ["phytozome v13", "Phytozome"],
  ["phytozome v13.0", "Phytozome"],
  ["phytozome v12.1", "Phytozome"],
  ["phytozome v12", "Phytozome"],
  ["phytozome v11", "Phytozome"],
  ["phytozome (v3.0)", "Phytozome"],
  ["ensembl plants (iwgsc)", "Ensembl Plants"],
  ["sol genomics network (sgn)", "Sol Genomics Network"],
  ["cotton gen", "CottonGen"],
  ["banana genome database", "Banana Genome Database"],
  ["genome sequence archive database", "Genome Sequence Archive Database"],
  ["sgn", "Sol Genomics Network"],
  ["tair10", "TAIR"],
]);

const organismAliases = new Map([
  ["brassica rapa l.", "Brassica rapa L."],
  ["brassica rapa", "Brassica rapa L."],
  ["capsicum annuum l.", "Capsicum annuum L."],
  ["capsicum annuum", "Capsicum annuum L."],
  ["triticum aestivum l.", "Triticum aestivum L."],
  ["hordeum vulgare l.", "Hordeum vulgare L."],
  ["hordeum vulgare", "Hordeum vulgare L."],
  ["spinacia oleracea l.", "Spinacia oleracea L."],
  ["spinacia oleracea", "Spinacia oleracea L."],
  ["arachis hypogaea l.", "Arachis hypogaea L."],
  ["arachis hypogaea", "Arachis hypogaea L."],
  ["phaseolus vulgaris l.", "Phaseolus vulgaris L."],
  ["citrus sinensis l.", "Citrus sinensis L."],
  ["solanum lycopersicum l.", "Solanum lycopersicum L."],
  ["oryza sativa l.", "Oryza sativa L."],
  ["zea mays l.", "Zea mays L."],
  ["glycine max l.", "Glycine max L."],
  ["scutellaria baicalensis georgi", "Scutellaria baicalensis Georgi"],
  ["gossypium arboreum", "Gossypium arboreum"],
  ["gossypium arboretum", "Gossypium arboreum"],
  ["gossypium ramondii", "Gossypium raimondii"],
  ["musa acuminate", "Musa acuminata"],
  ["coffee arabica", "Coffea arabica"],
  ["chickpea", "Cicer arietinum"],
  ["actinidia chinensis and a. eriantha", "Actinidia chinensis, Actinidia eriantha"],
  ["medicago truncatula cv.", "Medicago truncatula"],
  ["oryza sativa l. ssp. indica", "Oryza sativa L. ssp. indica"],
  ["capsicum annum", "Capsicum annuum L."],
  ["selaginella moellendorffi", "Selaginella moellendorffii"],
  ["g. hirsutum", "Gossypium hirsutum L."],
  ["g. raimondii", "Gossypium raimondii"],
  ["g. arboreum", "Gossypium arboreum"],
  ["g. barbadense", "Gossypium barbadense"],
  ["g. herbaceum", "Gossypium herbaceum"],
  ["g. mustelinum", "Gossypium mustelinum"],
  ["g. darwinii", "Gossypium darwinii"],
  ["g. tomentosum", "Gossypium tomentosum"],
  ["g. thurberi", "Gossypium thurberi"],
  ["g. turneri", "Gossypium turneri"],
  ["a. lyrata", "Arabidopsis lyrata"],
  ["a. thaliana", "Arabidopsis thaliana"],
  ["b. napus", "Brassica napus"],
  ["m. balbisiana", "Musa balbisiana"],
  ["apple", "Malus domestica"],
  ["sesame", "Sesamum indicum"],
  ["bougainvillea x buttiana 'mrs butt' (bbmb)", "Bougainvillea buttiana 'Mrs Butt' (BBMB)"],
  ["arabidopsis thaliana, oryza sativa", "Arabidopsis thaliana, Oryza sativa"],
  ["oryza sativa", "Oryza sativa L."],
  ["solanum lycopersicum", "Solanum lycopersicum L."],
  ["zea mays", "Zea mays L."],
  ["glycine max", "Glycine max L."],
  ["phaseolus vulgaris", "Phaseolus vulgaris L."],
  ["citrus sinensis", "Citrus sinensis L."],
  ["vitis vinifera", "Vitis vinifera L."],
  ["triticum aestivum", "Triticum aestivum L."],
]);

const toolAliases = new Map([
  ["wolf psort", "WoLF PSORT"],
  ["wolfpsort", "WoLF PSORT"],
  ["expsay protparam", "ExPASy ProtParam"],
  ["expasy", "ExPASy"],
  ["expasy protparam", "ExPASy ProtParam"],
  ["ex pasy protparam", "ExPASy ProtParam"],
  ["itol", "iTOL"],
  ["clustal x", "ClustalX"],
  ["clustalx", "ClustalX"],
  ["clustal w", "ClustalW"],
  ["mega-x", "MEGA"],
  ["mega x", "MEGA"],
  ["tbtools", "TBtools"],
  ["plantcare", "PlantCARE"],
  ["interproscan", "InterProScan"],
  ["blast2go", "Blast2GO"],
  ["biogrid", "BioGRID"],
  ["swiss-model", "SWISS-MODEL"],
  ["string", "STRING"],
  ["cytoscape", "Cytoscape"],
]);

function applyAlias(map, value) {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  return map.get(cleaned.toLowerCase()) || cleaned;
}

function normalizeCountry(value) {
  return applyAlias(countryAliases, value);
}

function normalizeJournal(value) {
  return applyAlias(journalAliases, value);
}

function normalizeGenomeSource(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  if (shouldSkipGenomeSource(cleaned)) return "";
  const direct = applyAlias(genomeSourceAliases, cleaned);
  if (direct !== cleaned) return direct;
  if (/database/i.test(cleaned) && /phytozome/i.test(cleaned)) return "Phytozome";
  if (/^phytozome\b/i.test(cleaned)) return "Phytozome";
  if (/^ensembl plants\b/i.test(cleaned)) return "Ensembl Plants";
  if (/^sol genomics network\b/i.test(cleaned)) return "Sol Genomics Network";
  if (/^ncbi\b/i.test(cleaned)) return "NCBI";
  if (/^tair\d*\b/i.test(cleaned)) return "TAIR";
  if (/^gramene database$/i.test(cleaned)) return "Gramene";
  if (/^rice genome annotation project database$/i.test(cleaned)) return "Rice Genome Annotation Project";
  if (/^rice genome annotation project$/i.test(cleaned)) return "Rice Genome Annotation Project";
  if (/^rice genome annotation project \(rgap\)$/i.test(cleaned)) return "Rice Genome Annotation Project";
  if (/^msu rice genome annotation project \(rgap\) release \d+$/i.test(cleaned))
    return "Rice Genome Annotation Project";
  if (/^tigr \(rice genome annotation project\)$/i.test(cleaned)) return "Rice Genome Annotation Project";
  if (/^rice genome annotation project \(rap\) database$/i.test(cleaned))
    return "Rice Genome Annotation Project";
  if (/^rice genome annotation database$/i.test(cleaned)) return "Rice Genome Annotation Project";
  if (/^citrus sinensis annotation project( \(cap\))?$/i.test(cleaned))
    return "Citrus sinensis Annotation Project";
  return cleaned;
}

function normalizeOrganism(value) {
  let cleaned = cleanText(value)
    .replace(/\bOryza Sativa\b/g, "Oryza sativa")
    .replace(/\bHordium vulgare\b/g, "Hordeum vulgare")
    .replace(/\bTiticum urartu\b/g, "Triticum urartu")
    .replace(/\bPopulus alba - Populus tremula var\. glandulosa\b/g, "Populus alba x Populus tremula var. glandulosa")
    .replace(/\bPopulus alba - Populus tremula var\. glandulosa clone '84K'\b/g, "Populus alba x Populus tremula var. glandulosa clone '84K'")
    .replace(/\bMrs Butt\b/g, "Mrs Butt")
    .replace(/\bSesamum indicum sesame\b/gi, "Sesamum indicum")
    .replace(/\bsesame\b/gi, "Sesamum indicum")
    .replace(/\bapple\b/gi, "Malus domestica")
    .replace(/\bA\.\s*eriantha\b/g, "Actinidia eriantha")
    .replace(/\bA\.\s*lyrata\b/g, "Arabidopsis lyrata")
    .replace(/\bB\.\s*napus\b/g, "Brassica napus")
    .replace(/\bB\.\s*oleracea\b/g, "Brassica oleracea")
    .replace(/\bM\.\s*balbisiana\b/g, "Musa balbisiana");
  cleaned = cleaned
    .replace(/^and\s+/i, "")
    .replace(/^including\s+/i, "")
    .replace(/\s+\)$/, ")")
    .replace(/\(\s+/g, "(");
  if (shouldSkipOrganism(cleaned)) return "";
  cleaned = applyAlias(organismAliases, cleaned);
  return cleaned;
}

function normalizeTool(value) {
  const cleaned = cleanText(value)
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return applyAlias(toolAliases, cleaned);
}

function canonicalGenomeSourceGroup(value) {
  const cleaned = normalizeGenomeSource(value);
  if (/^Phytozome$/i.test(cleaned)) return "Phytozome";
  if (/^Ensembl Plants$/i.test(cleaned)) return "Ensembl Plants";
  if (/^NCBI$/i.test(cleaned)) return "NCBI";
  if (/^TAIR$/i.test(cleaned)) return "TAIR";
  if (/^Sol Genomics Network$/i.test(cleaned)) return "Sol Genomics Network";
  if (/^CottonGen$/i.test(cleaned) || /^CottonMD$/i.test(cleaned)) return "Cotton/CottonGen resources";
  if (/GDR|Genome Database for Rosaceae/i.test(cleaned)) return "Rosaceae databases";
  if (/Banana/i.test(cleaned)) return "Banana genome resources";
  if (/Brassica|BRAD/i.test(cleaned)) return "Brassica databases";
  if (/Rice Genome Annotation|RAP-DB|Gramene|TIGR|Oryzabase/i.test(cleaned)) return "Rice genome resources";
  return "Other";
}

function canonicalToolGroup(toolName, category) {
  const cleaned = cleanText(toolName).toLowerCase();
  if (/blast/.test(cleaned)) return "Sequence similarity search";
  if (/hmmer|pfam|smart|cdd|interpro|scanprosite|prosite/.test(cleaned)) return "Domain identification and validation";
  if (/mega|iq-tree|raxml|phyml|mrbayes|trimal|ufboot|muscle|clustal|mafft|gblocks|pal2nal|paml|dnasp/.test(cleaned))
    return "Phylogeny and evolutionary analysis";
  if (/mcscanx|circos|coge|plaza|mapgene|mapchart|collinearity|synteny/.test(cleaned))
    return "Synteny and chromosomal mapping";
  if (/meme|mast|weblogo|motif/.test(cleaned)) return "Motif analysis";
  if (/plantcare|place|promoter|cis-element/.test(cleaned)) return "Promoter and cis-element analysis";
  if (/tbtools|itol|evolview|figtree|gsds|heml|excel|graphpad|photoshop|illustrator|chiplot|tvbot|phenogram/.test(cleaned))
    return "Visualization";
  if (/hisat2|stringtie|featurecounts|deseq|tophat|cufflinks|rna-seq|genespring|geo/.test(cleaned))
    return "Expression analysis";
  if (/wolf psort|plant-mploc|cello|busca|targetp|signalp|tmhmm|subcellular/.test(cleaned))
    return "Protein characterization and localization";
  if (/spss|r package|r program|minitab|student/.test(cleaned)) return "Statistics";
  if (/qpcr|primer|trizol|agrobacterium|confocal|assay|staining|cdna|sybr/.test(cleaned))
    return "Experimental validation";
  return category || "Other";
}

function normalizeGeneFamily(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  const aliases = new Map([
    ["hsp20", "Hsp20"],
    ["hsp70", "Hsp70"],
    ["bzr", "BZR"],
    ["bzip", "bZIP"],
  ]);
  return aliases.get(cleaned.toLowerCase()) || cleaned;
}

function shouldSkipOrganism(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return true;
  if (/^other\b/i.test(cleaned)) return true;
  if (/^and \d+ other species\b/i.test(cleaned)) return true;
  if (/^including\b/i.test(cleaned)) return true;
  if (/^comparison with\b/i.test(cleaned)) return true;
  if (/^varieties?\b/i.test(cleaned)) return true;
  if (/^cultivars?\b/i.test(cleaned)) return true;
  if (/^\(?cv\./i.test(cleaned)) return true;
  if (/\bcv\.$/i.test(cleaned)) return false;
  if (/^\d+\s+species\b/i.test(cleaned)) return true;
  if (/species used for comparison/i.test(cleaned)) return true;
  if (/^proteins?\b/i.test(cleaned)) return true;
  if (/^genome\b/i.test(cleaned)) return true;
  if (/\bother\b.*\bspecies\b/i.test(cleaned)) return true;
  if (/^[A-Z]\.\s*[a-z-]+$/i.test(cleaned) && !organismAliases.has(cleaned.toLowerCase())) return true;
  if (/^[A-Za-z0-9 .'-]+\)$/.test(cleaned) && cleaned.indexOf("(") === -1) return true;
  return false;
}

function shouldSkipGenomeSource(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return true;
  if (/^unpublished\)?$/i.test(cleaned)) return true;
  if (/^unpublished sequencing data$/i.test(cleaned)) return false;
  if (/^cited literature$/i.test(cleaned)) return true;
  if (/^annotation files?\)?$/i.test(cleaned)) return true;
  if (/^ice plant genome \(not specified$/i.test(cleaned)) return true;
  if (/but data from previous reports/i.test(cleaned)) return true;
  if (/not specified/i.test(cleaned) && /genome/i.test(cleaned)) return true;
  if (/^\d{4}\)?$/.test(cleaned)) return true;
  if (/^(proteome|genome|protein|annotation files?)$/i.test(cleaned)) return true;
  if (/^and annotation files?\)?$/i.test(cleaned)) return true;
  if (/^lab data$/i.test(cleaned)) return true;
  if (/^version\s*[\d.]+$/i.test(cleaned)) return true;
  if (/^[A-Za-z]\.\s*[a-z-]+\b.*\(lab data$/i.test(cleaned)) return true;
  if (/^\(?see supplementary/i.test(cleaned)) return true;
  return false;
}

function yesNoUnknown(value) {
  const text = cleanText(value).toLowerCase();
  if (!text) return null;
  if (text.startsWith("yes")) return true;
  if (text.startsWith("no")) return false;
  return null;
}

function toInteger(value) {
  const text = cleanText(value);
  if (!text) return null;
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function normalizeDoi(value) {
  const text = cleanText(value)
    .replace(/^doi:\s*/i, "")
    .replace(/^doi\.org\//i, "")
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .trim();
  return text || null;
}

function extractBlastThreshold(value) {
  const text = cleanText(value);
  const match = text.match(/\(([^)]+)\)/);
  if (!match) return null;
  const inner = cleanText(match[1]);
  if (/not specified/i.test(inner)) return null;
  return inner;
}

function extractPfamId(value) {
  const text = cleanText(value);
  const matches = text.match(/PF\d+/gi);
  if (!matches) return [];
  return [...new Set(matches.map((item) => item.toUpperCase()))];
}

function upsertEntity(map, label, extra = {}) {
  const cleaned = cleanText(label);
  if (!cleaned) return null;
  const key = slugify(cleaned);
  if (!map.has(key)) {
    map.set(key, {
      id: map.size + 1,
      name: cleaned,
      slug: key,
      ...extra,
    });
  }
  return map.get(key);
}

const standardizationReport = {
  country_changes: new Map(),
  journal_changes: new Map(),
  organism_changes: new Map(),
  genome_source_changes: new Map(),
  tool_changes: new Map(),
};

function recordNormalization(reportMap, rawValue, normalizedValue) {
  const raw = cleanText(rawValue);
  const normalized = cleanText(normalizedValue);
  if (!raw || !normalized || raw === normalized) return;
  const key = `${raw} => ${normalized}`;
  reportMap.set(key, (reportMap.get(key) || 0) + 1);
}

const rows = parseCsv(rawCsvPath);

const countryMap = new Map();
const journalMap = new Map();
const organismMap = new Map();
const geneFamilyMap = new Map();
const genomeSourceMap = new Map();
const toolMap = new Map();
const keywordMap = new Map();
const authorMap = new Map();

const fixedTools = [
  { column: "HMMER (with Pfam domains)", name: "HMMER", category: "identification" },
  { column: "BLAST (E-value cut-off used)", name: "BLAST", category: "identification" },
  { column: "SMART", name: "SMART", category: "domain_verification" },
  { column: "CDD", name: "CDD", category: "domain_verification" },
  { column: "MEGA", name: "MEGA", category: "phylogeny" },
  { column: "IQ-TREE", name: "IQ-TREE", category: "phylogeny" },
  { column: "MEME", name: "MEME", category: "motif_analysis" },
  { column: "MCScanX", name: "MCScanX", category: "synteny" },
  { column: "TBTools", name: "TBTools", category: "visualization" },
];

const papers = [];
const paperAuthors = [];
const paperOrganisms = [];
const paperGeneFamilies = [];
const paperGenomeSources = [];
const paperKeywords = [];
const paperTools = [];
const validations = [];
const results = [];

for (const row of rows) {
  const paperId = Number(row["Paper ID"]);
  const normalizedCountry = normalizeCountry(row["Country of Origin"]);
  const normalizedJournal = normalizeJournal(row["Journal"]);
  const normalizedGeneFamily = normalizeGeneFamily(row["Gene Family"]);
  recordNormalization(standardizationReport.country_changes, row["Country of Origin"], normalizedCountry);
  recordNormalization(standardizationReport.journal_changes, row["Journal"], normalizedJournal);
  const country = upsertEntity(countryMap, normalizedCountry);
  const journal = upsertEntity(journalMap, normalizedJournal);
  const geneFamily = upsertEntity(geneFamilyMap, normalizedGeneFamily);

  const primaryOrganisms = uniqueNormalized(
    splitOrganismList(row["Primary Organism"]).map((item) => {
      const normalized = normalizeOrganism(item);
      recordNormalization(standardizationReport.organism_changes, item, normalized || "[filtered]");
      return normalized;
    })
  );
  const secondaryOrganisms = uniqueNormalized(
    splitOrganismList(row["Secondary Organism"]).map((item) => {
      const normalized = normalizeOrganism(item);
      recordNormalization(standardizationReport.organism_changes, item, normalized || "[filtered]");
      return normalized;
    })
  );
  const genomeSources = uniqueNormalized(
    splitList(row["Genome Source"]).map((item) => {
      const normalized = normalizeGenomeSource(item);
      recordNormalization(standardizationReport.genome_source_changes, item, normalized || "[filtered]");
      return normalized;
    })
  );
  const keywords = splitList(row["Keywords"]);
  const authors = splitList(row["Authors"]);

  const pdfFilename = `${paperId}.pdf`;
  const pdfExists = fs.existsSync(path.join(pdfDir, pdfFilename));

  papers.push({
    paper_id: paperId,
    title: cleanText(row["Title"]),
    year: Number(row["Year"]) || null,
    journal_id: journal?.id ?? null,
    country_id: country?.id ?? null,
    doi: normalizeDoi(row["DOI"]),
    raw_doi: cleanText(row["DOI"]),
    pdf_filename: pdfFilename,
    pdf_available: pdfExists,
    pdf_url: `./database/${pdfFilename}`,
    number_of_genes_identified: toInteger(row["Number of Genes Identified"]),
    phylogenetic_structure: cleanText(row["Phylogenetic Structure"]),
    duplication_summary: cleanText(row["Gene Duplication Events (TANDEM/SEGMENTAL)"]),
    expression_summary: cleanText(row["Expression Analysis (RNA-seq)"]),
  });

  if (geneFamily) {
    paperGeneFamilies.push({
      paper_id: paperId,
      gene_family_id: geneFamily.id,
    });
  }

  for (const authorName of authors) {
    const author = upsertEntity(authorMap, authorName);
    paperAuthors.push({
      paper_id: paperId,
      author_id: author.id,
      author_name: author.name,
    });
  }

  for (const name of primaryOrganisms) {
    const organism = upsertEntity(organismMap, name);
    paperOrganisms.push({
      paper_id: paperId,
      organism_id: organism.id,
      organism_name: organism.name,
      role: "primary",
    });
  }

  for (const name of secondaryOrganisms) {
    const organism = upsertEntity(organismMap, name);
    paperOrganisms.push({
      paper_id: paperId,
      organism_id: organism.id,
      organism_name: organism.name,
      role: "secondary",
    });
  }

  for (const sourceName of genomeSources) {
    const source = upsertEntity(genomeSourceMap, sourceName);
    paperGenomeSources.push({
      paper_id: paperId,
      genome_source_id: source.id,
      genome_source_name: source.name,
      canonical_group: canonicalGenomeSourceGroup(source.name),
    });
  }

  for (const keyword of keywords) {
    const entity = upsertEntity(keywordMap, keyword);
    paperKeywords.push({
      paper_id: paperId,
      keyword_id: entity.id,
      keyword: entity.name,
    });
  }

  for (const tool of fixedTools) {
    const used = yesNoUnknown(row[tool.column]);
    if (used !== true) continue;
    const entity = upsertEntity(toolMap, tool.name, { category: tool.category });
    paperTools.push({
      paper_id: paperId,
      tool_id: entity.id,
      tool_name: entity.name,
      category: entity.category,
      canonical_group: canonicalToolGroup(entity.name, entity.category),
      source_column: tool.column,
      detail: cleanText(row[tool.column]),
    });
  }

  const extraToolColumns = [
    { column: "Other (Tools for Domain Analysis)", category: "domain_verification" },
    { column: "Others (Tools for Motif Analysis)", category: "motif_analysis" },
    { column: "Other (Tools for Synteny)", category: "synteny" },
    { column: "Other (Tools for Visualization)", category: "visualization" },
    { column: "Other Tools Used In Methodology", category: "other_methodology" },
  ];

  for (const toolColumn of extraToolColumns) {
    for (const item of splitList(row[toolColumn.column])) {
      const normalizedTool = normalizeTool(item);
      recordNormalization(standardizationReport.tool_changes, item, normalizedTool);
      const entity = upsertEntity(toolMap, normalizedTool, { category: toolColumn.category });
      paperTools.push({
        paper_id: paperId,
        tool_id: entity.id,
        tool_name: entity.name,
        category: entity.category,
        canonical_group: canonicalToolGroup(entity.name, entity.category),
        source_column: toolColumn.column,
        detail: normalizedTool,
      });
    }
  }

  const hmmPfamIds = extractPfamId(row["HMMER (with Pfam domains)"]);
  validations.push({
    paper_id: paperId,
    rna_seq_used: yesNoUnknown(row["Expression Analysis (RNA-seq)"]),
    experimental_validation_qpcr: yesNoUnknown(row["Experimental Validation (qPCR)"]),
    hmm_used: yesNoUnknown(row["HMMER (with Pfam domains)"]),
    blast_used: /^blast/i.test(cleanText(row["BLAST (E-value cut-off used)"])),
    blast_threshold: extractBlastThreshold(row["BLAST (E-value cut-off used)"]),
    pfam_ids: hmmPfamIds,
  });

  results.push({
    paper_id: paperId,
    number_of_genes_identified: toInteger(row["Number of Genes Identified"]),
    phylogenetic_structure: cleanText(row["Phylogenetic Structure"]),
    duplication_pattern: cleanText(row["Gene Duplication Events (TANDEM/SEGMENTAL)"]),
    expression_analysis: cleanText(row["Expression Analysis (RNA-seq)"]),
  });
}

const countries = [...countryMap.values()];
const journals = [...journalMap.values()];
const organisms = [...organismMap.values()];
const geneFamilies = [...geneFamilyMap.values()];
const genomeSourcesList = [...genomeSourceMap.values()];
const keywordsList = [...keywordMap.values()];
const tools = [...toolMap.values()];
const authorsList = [...authorMap.values()];

const countryById = new Map(countries.map((item) => [item.id, item]));
const journalById = new Map(journals.map((item) => [item.id, item]));
const geneFamilyById = new Map(geneFamilies.map((item) => [item.id, item]));

const papersWithRelations = papers.map((paper) => {
  const primary = paperOrganisms
    .filter((item) => item.paper_id === paper.paper_id && item.role === "primary")
    .map((item) => item.organism_name);
  const secondary = paperOrganisms
    .filter((item) => item.paper_id === paper.paper_id && item.role === "secondary")
    .map((item) => item.organism_name);
  const familyLinks = paperGeneFamilies
    .filter((item) => item.paper_id === paper.paper_id)
    .map((item) => geneFamilyById.get(item.gene_family_id)?.name)
    .filter(Boolean);
  const toolLinks = paperTools.filter((item) => item.paper_id === paper.paper_id).map((item) => item.tool_name);
  const keywordLinks = paperKeywords.filter((item) => item.paper_id === paper.paper_id).map((item) => item.keyword);
  const authorLinks = paperAuthors.filter((item) => item.paper_id === paper.paper_id).map((item) => item.author_name);
  const validation = validations.find((item) => item.paper_id === paper.paper_id);
  const journal = journalById.get(paper.journal_id)?.name ?? null;
  const country = countryById.get(paper.country_id)?.name ?? null;

  return {
    ...paper,
    journal,
    country,
    primary_organisms: primary,
    secondary_organisms: secondary,
    gene_families: familyLinks,
    authors: authorLinks,
    tools: [...new Set(toolLinks)].sort(),
    keywords: keywordLinks,
    rna_seq_used: validation?.rna_seq_used ?? null,
    experimental_validation_qpcr: validation?.experimental_validation_qpcr ?? null,
    blast_threshold: validation?.blast_threshold ?? null,
    pfam_ids: validation?.pfam_ids ?? [],
  };
});

function topCounts(items, valueKey, limit = 10) {
  const counts = new Map();
  for (const item of items) {
    const value = item[valueKey];
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

const stats = {
  total_papers: papers.length,
  total_pdfs: fs.readdirSync(pdfDir).filter((name) => name.toLowerCase().endsWith(".pdf")).length,
  total_organisms: organismMap.size,
  total_gene_families: geneFamilyMap.size,
  total_journals: journalMap.size,
  total_tools: toolMap.size,
  rna_seq_rate: Number(
    (
      (validations.filter((item) => item.rna_seq_used === true).length / validations.length) *
      100
    ).toFixed(1)
  ),
  qPCR_rate: Number(
    (
      (validations.filter((item) => item.experimental_validation_qpcr === true).length /
        validations.length) *
      100
    ).toFixed(1)
  ),
  top_countries: topCounts(
    papersWithRelations.filter((item) => item.country),
    "country",
    8
  ),
  top_journals: topCounts(
    papersWithRelations.filter((item) => item.journal),
    "journal",
    8
  ),
  top_primary_organisms: [],
  publications_by_year: topCounts(
    papersWithRelations.filter((item) => item.year),
    "year",
    papersWithRelations.length
  ),
};

const primaryCounts = new Map();
for (const item of paperOrganisms.filter((entry) => entry.role === "primary")) {
  primaryCounts.set(item.organism_name, (primaryCounts.get(item.organism_name) || 0) + 1);
}
stats.top_primary_organisms = [...primaryCounts.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, 8)
  .map(([label, count]) => ({ label, count }));

function writeJson(filename, data) {
  fs.writeFileSync(path.join(outDir, filename), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function mapToSortedArray(map) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([change, count]) => ({ change, count }));
}

writeJson("papers.json", papers);
writeJson("authors.json", authorsList);
writeJson("paper_authors.json", paperAuthors);
writeJson("countries.json", countries);
writeJson("journals.json", journals);
writeJson("organisms.json", organisms);
writeJson("paper_organisms.json", paperOrganisms);
writeJson("gene_families.json", geneFamilies);
writeJson("paper_gene_families.json", paperGeneFamilies);
writeJson("genome_sources.json", genomeSourcesList);
writeJson("paper_genome_sources.json", paperGenomeSources);
writeJson("keywords.json", keywordsList);
writeJson("paper_keywords.json", paperKeywords);
writeJson("tools.json", tools);
writeJson("paper_tools.json", paperTools);
writeJson("validations.json", validations);
writeJson("results.json", results);
writeJson("search_index.json", papersWithRelations.sort((a, b) => a.paper_id - b.paper_id));
writeJson("stats.json", stats);
writeJson("standardization_report.json", {
  countries: mapToSortedArray(standardizationReport.country_changes),
  journals: mapToSortedArray(standardizationReport.journal_changes),
  organisms: mapToSortedArray(standardizationReport.organism_changes),
  genome_sources: mapToSortedArray(standardizationReport.genome_source_changes),
  tools: mapToSortedArray(standardizationReport.tool_changes),
});
fs.writeFileSync(
  path.join(outDir, "bundle.js"),
  `window.__GENE_FAMILY_DB__ = ${JSON.stringify(
    {
      stats,
      searchIndex: papersWithRelations.sort((a, b) => a.paper_id - b.paper_id),
    },
    null,
    2
  )};\n`,
  "utf8"
);

console.log(`Built normalized database and web search index for ${papers.length} papers.`);
