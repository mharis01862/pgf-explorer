async function loadDatabase() {
  if (window.__GENE_FAMILY_DB__) return window.__GENE_FAMILY_DB__;
  const [stats, searchIndex] = await Promise.all([
    fetch("./data/stats.json").then((r) => r.json()),
    fetch("./data/search_index.json").then((r) => r.json()),
  ]);
  return { stats, searchIndex };
}

function downloadText(filename, text, mime = "text/plain;charset=utf-8;") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function makeBibtexEntry(paper) {
  const id = `paper${paper.paper_id}`;
  const author = (paper.authors || []).join(" and ") || "Unknown";
  const title = (paper.title || "").replace(/[{}]/g, "");
  const journal = (paper.journal || "Unknown Journal").replace(/[{}]/g, "");
  const year = paper.year || "Unknown";
  const doi = paper.doi || "";
  return `@article{${id},
  author = {${author}},
  title = {${title}},
  journal = {${journal}},
  year = {${year}}${doi ? `,\n  doi = {${doi}}` : ""}
}`;
}

function toCsv(items) {
  const rows = items.map((paper) => ({
    paper_id: paper.paper_id,
    title: paper.title,
    year: paper.year ?? "",
    journal: paper.journal ?? "",
    country: paper.country ?? "",
    doi: paper.doi ?? "",
    gene_families: (paper.gene_families || []).join("; "),
    primary_organisms: (paper.primary_organisms || []).join("; "),
    rna_seq_used: paper.rna_seq_used === true ? "Yes" : "No",
    rt_qpcr_validation: paper.experimental_validation_qpcr === true ? "Yes" : "No",
  }));
  const headers = Object.keys(rows[0] || {});
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
}

const statusEl = document.getElementById("resourceStatus");
const copyBtn = document.getElementById("copyDbCitation");
const citationEl = document.getElementById("dbCitation");
const pkgBtn = document.getElementById("exportFullPackage");
const bibBtn = document.getElementById("exportFullBibtex");

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(citationEl.innerText.trim());
  statusEl.textContent = "Database citation copied.";
});

const { stats, searchIndex } = await loadDatabase();

pkgBtn.addEventListener("click", () => {
  const metadata = {
    exported_at: new Date().toISOString(),
    total_items: searchIndex.length,
    total_papers_reported: stats.total_papers,
    source: "interactive_database_academic",
  };
  const csv = toCsv(searchIndex);
  const bib = searchIndex.map((paper) => makeBibtexEntry(paper)).join("\n\n");
  const packageText = [
    "=== metadata.json ===",
    JSON.stringify(metadata, null, 2),
    "",
    "=== full_data.csv ===",
    csv,
    "",
    "=== citations.bib ===",
    bib,
  ].join("\n");
  downloadText("reproducibility_package_full.txt", packageText);
  statusEl.textContent = "Reproducibility package exported.";
});

bibBtn.addEventListener("click", () => {
  const bib = searchIndex.map((paper) => makeBibtexEntry(paper)).join("\n\n");
  downloadText("all_papers.bib", bib);
  statusEl.textContent = "All-paper BibTeX exported.";
});
