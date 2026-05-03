async function loadDatabase() {
  if (window.__GENE_FAMILY_DB__) {
    return window.__GENE_FAMILY_DB__;
  }

  const [stats, searchIndex] = await Promise.all([
    fetch("./data/stats.json").then((response) => response.json()),
    fetch("./data/search_index.json").then((response) => response.json()),
  ]);

  return { stats, searchIndex };
}

const { stats, searchIndex } = await loadDatabase();

const elements = {
  metrics: document.getElementById("metrics"),
  resultSummary: document.getElementById("resultSummary"),
  countriesChart: document.getElementById("countriesChart"),
  journalsChart: document.getElementById("journalsChart"),
  organismsChart: document.getElementById("organismsChart"),
  yearsChart: document.getElementById("yearsChart"),
  toolsChart: document.getElementById("toolsChart"),
  validationChart: document.getElementById("validationChart"),
  results: document.getElementById("results"),
  searchInput: document.getElementById("searchInput"),
  yearFilter: document.getElementById("yearFilter"),
  countryFilter: document.getElementById("countryFilter"),
  journalFilter: document.getElementById("journalFilter"),
  organismFilter: document.getElementById("organismFilter"),
  familyFilter: document.getElementById("familyFilter"),
  yearFrom: document.getElementById("yearFrom"),
  yearTo: document.getElementById("yearTo"),
  searchMode: document.getElementById("searchMode"),
  evidenceLevel: document.getElementById("evidenceLevel"),
  rnaSeqOnly: document.getElementById("rnaSeqOnly"),
  qPCRonly: document.getElementById("qPCRonly"),
  pdfOnly: document.getElementById("pdfOnly"),
  sortSelect: document.getElementById("sortSelect"),
  resetFilters: document.getElementById("resetFilters"),
  exportCsv: document.getElementById("exportCsv"),
  pageSizeSelect: document.getElementById("pageSizeSelect"),
  viewDetailed: document.getElementById("viewDetailed"),
  viewCompact: document.getElementById("viewCompact"),
  showMore: document.getElementById("showMore"),
  activeFilters: document.getElementById("activeFilters"),
  compareTray: document.getElementById("compareTray"),
  compareTableWrap: document.getElementById("compareTableWrap"),
  clearCompare: document.getElementById("clearCompare"),
  chatLog: document.getElementById("chatLog"),
  chatInput: document.getElementById("chatInput"),
  chatSend: document.getElementById("chatSend"),
  chatSuggestions: [...document.querySelectorAll(".chat-suggestion")],
  agentFab: document.getElementById("agentFab"),
  agentWindow: document.getElementById("agentWindow"),
  agentClose: document.getElementById("agentClose"),
  chartTabs: [...document.querySelectorAll(".chart-tab")],
  chartPanels: [...document.querySelectorAll(".chart-panel")],
  paperDialog: document.getElementById("paperDrawer"),
  drawerOverlay: document.getElementById("drawerOverlay"),
  modalTitle: document.getElementById("modalTitle"),
  modalBody: document.getElementById("modalBody"),
  closeDialog: document.getElementById("closeDialog"),
  countUps: [...document.querySelectorAll(".count-up")],
  focusFilters: document.getElementById("focusFilters"),
  filtersPanel: document.getElementById("filtersPanel"),
  menuToggle: document.getElementById("menuToggle"),
  topnavLinks: document.getElementById("topnavLinks"),
  mobileFilterToggle: document.getElementById("mobileFilterToggle"),
};

const isMobile = window.innerWidth <= 768;

const state = {
  search: "",
  year: "",
  country: "",
  journal: "",
  organism: "",
  family: "",
  yearFrom: "",
  yearTo: "",
  searchMode: "any",
  evidenceLevel: "",
  rnaSeqOnly: false,
  qPCRonly: false,
  pdfOnly: true,
  sort: "paper-asc",
  pageSize: isMobile ? 5 : 30,
  visibleCount: isMobile ? 5 : 30,
  view: "detailed",
  chartFocus: "all",
  compareIds: [],
};

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { numeric: true })
  );
}

function fillSelect(select, values) {
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
}

fillSelect(elements.yearFilter, uniqueSorted(searchIndex.map((item) => item.year)).reverse());
fillSelect(elements.countryFilter, uniqueSorted(searchIndex.map((item) => item.country)));
fillSelect(elements.journalFilter, uniqueSorted(searchIndex.map((item) => item.journal)));
fillSelect(
  elements.organismFilter,
  uniqueSorted(searchIndex.flatMap((item) => item.primary_organisms || []))
);
fillSelect(
  elements.familyFilter,
  uniqueSorted(searchIndex.flatMap((item) => item.gene_families || []))
);

function renderMetrics() {
  const cards = [
    {
      label: "Papers",
      value: stats.total_papers,
      icon: "Docs",
      note: "Curated studies in the searchable corpus",
      tone: "ocean",
    },
    {
      label: "Organisms",
      value: stats.total_organisms,
      icon: "Taxa",
      note: "Normalized primary and comparative species entries",
      tone: "sun",
    },
    {
      label: "Gene families",
      value: stats.total_gene_families,
      icon: "Fam",
      note: "Distinct family labels across the analyzed literature",
      tone: "berry",
    },
    {
      label: "Journals",
      value: stats.total_journals,
      icon: "Pub",
      note: "Peer-reviewed publication venues represented here",
      tone: "slate",
    },
    {
      label: "RNA-seq rate",
      value: `${stats.rna_seq_rate}%`,
      icon: "RNA",
      note: "Studies that included expression-level transcript evidence",
      tone: "ocean",
    },
    {
      label: "RT-qPCR rate",
      value: `${stats.qPCR_rate}%`,
      icon: "qPCR",
      note: "Studies reporting experimental validation of predictions",
      tone: "forest",
    },
  ];

  elements.metrics.innerHTML = cards
    .map(
      (card) => `
        <article class="metric metric--${card.tone}">
          <div class="metric__top">
            <div class="metric__icon">${card.icon}</div>
            <div class="metric__eyebrow"></div>
          </div>
          <div class="metric__label">${card.label}</div>
          <div class="metric__value">${card.value}</div>
          <div class="metric__note">${card.note}</div>
        </article>
      `
    )
    .join("");
}

function validationTone(value) {
  return value === true ? "is-positive" : "is-muted";
}

function validationText(value) {
  return value === true ? "Included" : "Not reported";
}

function renderActiveFilters() {
  const chips = [];
  if (state.search) chips.push(`Search: ${state.search}`);
  if (state.year) chips.push(`Year: ${state.year}`);
  if (state.country) chips.push(`Country: ${state.country}`);
  if (state.journal) chips.push(`Journal: ${state.journal}`);
  if (state.organism) chips.push(`Organism: ${state.organism}`);
  if (state.family) chips.push(`Family: ${state.family}`);
  if (state.yearFrom) chips.push(`Year from: ${state.yearFrom}`);
  if (state.yearTo) chips.push(`Year to: ${state.yearTo}`);
  if (state.searchMode === "all") chips.push("Search mode: ALL keywords");
  if (state.evidenceLevel) chips.push(`Evidence: ${state.evidenceLevel.toUpperCase()}`);
  if (state.rnaSeqOnly) chips.push("RNA-seq only");
  if (state.qPCRonly) chips.push("RT-qPCR only");
  if (state.pdfOnly) chips.push("PDF linked only");
  elements.activeFilters.innerHTML = chips.length
    ? chips.map((chip) => `<span class="active-filter-chip">${chip}</span>`).join("")
    : `<span class="active-filter-chip">No active filters</span>`;
}

function renderChartFocus() {
  elements.chartTabs.forEach((button) => {
    const isActive = button.dataset.chartTarget === state.chartFocus;
    button.classList.toggle("is-active", isActive);
  });

  elements.chartPanels.forEach((panel) => {
    if (state.chartFocus === "all") {
      panel.hidden = false;
      return;
    }
    panel.hidden = panel.dataset.chartId !== state.chartFocus;
  });
}

function animateCounters() {
  elements.countUps.forEach((element) => {
    const target = Number(element.dataset.count || "0");
    const duration = 1100;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.round(target * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

function countTop(items, extractor, limit = 8) {
  const counts = new Map();
  for (const item of items) {
    for (const value of extractor(item)) {
      if (!value) continue;
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function renderBars(container, items) {
  if (!items.length) {
    container.innerHTML = `<div class="empty">No data for the current view.</div>`;
    return;
  }

  const max = Math.max(...items.map((item) => item.count), 1);
  container.innerHTML = items
    .map(
      (item) => `
        <div class="bar">
          <div class="bar__label"><span>${item.label}</span><strong>${item.count}</strong></div>
          <div class="bar__track"><div class="bar__fill" style="width:${(item.count / max) * 100}%"></div></div>
        </div>
      `
    )
    .join("");
}

function matchesSearch(paper, query) {
  if (!query) return true;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = [
    paper.title,
    paper.journal,
    paper.country,
    ...(paper.authors || []),
    ...(paper.primary_organisms || []),
    ...(paper.secondary_organisms || []),
    ...(paper.gene_families || []),
    ...(paper.tools || []),
    ...(paper.keywords || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (state.searchMode === "all") {
    return terms.every((term) => haystack.includes(term));
  }
  return terms.some((term) => haystack.includes(term));
}

function applyFilters() {
  let items = [...searchIndex];

  items = items.filter((paper) => matchesSearch(paper, state.search));
  if (state.year) items = items.filter((paper) => String(paper.year) === state.year);
  if (state.yearFrom) items = items.filter((paper) => Number(paper.year) >= Number(state.yearFrom));
  if (state.yearTo) items = items.filter((paper) => Number(paper.year) <= Number(state.yearTo));
  if (state.country) items = items.filter((paper) => paper.country === state.country);
  if (state.journal) items = items.filter((paper) => paper.journal === state.journal);
  if (state.organism) {
    items = items.filter((paper) => (paper.primary_organisms || []).includes(state.organism));
  }
  if (state.family) {
    items = items.filter((paper) => (paper.gene_families || []).includes(state.family));
  }
  if (state.rnaSeqOnly) items = items.filter((paper) => paper.rna_seq_used === true);
  if (state.qPCRonly) items = items.filter((paper) => paper.experimental_validation_qpcr === true);
  if (state.evidenceLevel === "rna") items = items.filter((paper) => paper.rna_seq_used === true);
  if (state.evidenceLevel === "qpcr")
    items = items.filter((paper) => paper.experimental_validation_qpcr === true);
  if (state.evidenceLevel === "both")
    items = items.filter(
      (paper) => paper.rna_seq_used === true && paper.experimental_validation_qpcr === true
    );
  if (state.pdfOnly) items = items.filter((paper) => paper.pdf_available === true);

  switch (state.sort) {
    case "paper-asc":
      items.sort((a, b) => a.paper_id - b.paper_id);
      break;
    case "year-asc":
      items.sort((a, b) => (a.year ?? 0) - (b.year ?? 0) || a.paper_id - b.paper_id);
      break;
    case "title-asc":
      items.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "genes-desc":
      items.sort(
        (a, b) =>
          (b.number_of_genes_identified ?? -1) - (a.number_of_genes_identified ?? -1) ||
          a.paper_id - b.paper_id
      );
      break;
    default:
      items.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.paper_id - b.paper_id);
  }

  return items;
}

function tagList(values, fallback = "Not specified") {
  if (!values || values.length === 0) return `<span class="tag">${fallback}</span>`;
  return values.map((value) => `<span class="tag">${value}</span>`).join("");
}

function renderDashboard(items) {
  renderBars(elements.countriesChart, countTop(items, (item) => [item.country], 8));
  renderBars(elements.journalsChart, countTop(items, (item) => [item.journal], 8));
  renderBars(elements.organismsChart, countTop(items, (item) => item.primary_organisms || [], 8));
  renderBars(
    elements.yearsChart,
    countTop(items, (item) => [item.year], 10).sort((a, b) => Number(a.label) - Number(b.label))
  );
  renderBars(elements.toolsChart, countTop(items, (item) => item.tools || [], 8));

  const validationItems = [
    { label: "RNA-seq included", count: items.filter((item) => item.rna_seq_used === true).length },
    {
      label: "RT-qPCR validated",
      count: items.filter((item) => item.experimental_validation_qpcr === true).length,
    },
    {
      label: "With linked PDF",
      count: items.filter((item) => item.pdf_available === true).length,
    },
  ];
  renderBars(elements.validationChart, validationItems);
}

function renderResults(items) {
  elements.resultSummary.textContent = `${items.length} papers match the current filters.`;
  const visibleItems = items.slice(0, state.visibleCount);

  if (items.length === 0) {
    elements.results.innerHTML = `<div class="empty">No papers match the current filters. Try widening the search criteria.</div>`;
    elements.showMore.hidden = true;
    return;
  }

  elements.results.classList.toggle("is-compact", state.view === "compact");
  elements.results.innerHTML = visibleItems
    .map((paper) => {
      const pdfUrl = paper.pdf_available ? paper.pdf_url : null;
      const geneCount = paper.number_of_genes_identified ?? "NA";
      const familyCount = (paper.gene_families || []).length || "NA";
      const primaryCount = (paper.primary_organisms || []).length || "NA";
      return `
        <article class="paper">
          <div class="paper__ribbon">
            <span class="paper__index">Paper ${paper.paper_id}</span>
            <div class="paper__signals">
              <span class="signal-pill ${validationTone(paper.rna_seq_used)}">RNA-seq ${validationText(paper.rna_seq_used)}</span>
              <span class="signal-pill ${validationTone(paper.experimental_validation_qpcr)}">RT-qPCR ${validationText(paper.experimental_validation_qpcr)}</span>
              ${pdfUrl ? `<span class="signal-pill is-outline">PDF linked</span>` : ""}
            </div>
          </div>
          <div class="paper__header">
            <div class="paper__overview">
              <h3 class="paper__title">${paper.paper_id}. ${paper.title}</h3>
              <p class="paper__meta">
                <strong>${paper.year ?? "Year unavailable"}</strong>
                · ${paper.journal ?? "Journal unavailable"}
                · ${paper.country ?? "Country unavailable"}
              </p>
            </div>
            <div class="paper__cta">
              <button class="button-link" type="button" data-detail-id="${paper.paper_id}">View details</button>
              <button class="button-link" type="button" data-compare-id="${paper.paper_id}">${state.compareIds.includes(paper.paper_id) ? "Selected" : "Compare"}</button>
              ${
                pdfUrl
                  ? `<a class="link-pill" href="${pdfUrl}" target="_blank" rel="noreferrer">Open PDF</a>`
                  : `<button class="button-link" type="button" disabled aria-disabled="true">PDF unavailable</button>`
              }
            </div>
          </div>
          <div class="paper__stats">
            <div class="paper-stat">
              <span class="paper-stat__label">Genes</span>
              <strong class="paper-stat__value">${geneCount}</strong>
            </div>
            <div class="paper-stat">
              <span class="paper-stat__label">Families</span>
              <strong class="paper-stat__value">${familyCount}</strong>
            </div>
            <div class="paper-stat">
              <span class="paper-stat__label">Primary organisms</span>
              <strong class="paper-stat__value">${primaryCount}</strong>
            </div>
            <div class="paper-stat">
              <span class="paper-stat__label">Phylogeny</span>
              <strong class="paper-stat__value">${paper.phylogenetic_structure ? "Reported" : "NA"}</strong>
            </div>
          </div>
          <div class="paper__grid">
            <div class="paper__block">
              <strong>Gene family</strong>
              <div class="tags">${tagList(paper.gene_families)}</div>
            </div>
            <div class="paper__block">
              <strong>Primary organism</strong>
              <div class="tags">${tagList(paper.primary_organisms)}</div>
            </div>
            <div class="paper__block">
              <strong>Validation</strong>
              <div class="tags">
                <span class="tag">RNA-seq: ${paper.rna_seq_used === true ? "Yes" : "No / not reported"}</span>
                <span class="tag">RT-qPCR: ${paper.experimental_validation_qpcr === true ? "Yes" : "No / not reported"}</span>
                <span class="tag">Genes identified: ${paper.number_of_genes_identified ?? "NA"}</span>
              </div>
            </div>
            <div class="paper__block">
              <strong>Core tools</strong>
              <div class="tags">${tagList((paper.tools || []).slice(0, 10))}</div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  elements.showMore.hidden = visibleItems.length >= items.length;
  elements.showMore.textContent = `Show more results (${items.length - visibleItems.length} remaining)`;

  elements.results.querySelectorAll("[data-detail-id]").forEach((button) => {
    button.addEventListener("click", () => openPaperDialog(Number(button.dataset.detailId)));
  });
  elements.results.querySelectorAll("[data-compare-id]").forEach((button) => {
    button.addEventListener("click", () => toggleCompare(Number(button.dataset.compareId)));
  });
}

function toggleCompare(paperId) {
  if (state.compareIds.includes(paperId)) {
    state.compareIds = state.compareIds.filter((id) => id !== paperId);
  } else if (state.compareIds.length < 5) {
    state.compareIds.push(paperId);
  }
  render();
}

function renderCompareTray() {
  if (state.compareIds.length < 2) {
    elements.compareTray.hidden = true;
    elements.compareTableWrap.innerHTML = "";
    return;
  }
  const papers = state.compareIds
    .map((id) => searchIndex.find((p) => p.paper_id === id))
    .filter(Boolean);
  const sharedTools = [...new Set(papers.flatMap((p) => p.tools || []))].filter((tool) =>
    papers.every((p) => (p.tools || []).includes(tool))
  );
  const sharedFamilies = [...new Set(papers.flatMap((p) => p.gene_families || []))].filter((gf) =>
    papers.every((p) => (p.gene_families || []).includes(gf))
  );
  const sharedPrimary = [...new Set(papers.flatMap((p) => p.primary_organisms || []))].filter((org) =>
    papers.every((p) => (p.primary_organisms || []).includes(org))
  );

  const rows = [
    ["Paper ID", (p) => p.paper_id],
    ["Year", (p) => p.year ?? "NA"],
    ["Journal", (p) => p.journal ?? "NA"],
    ["Country", (p) => p.country ?? "NA"],
    ["Gene families", (p) => (p.gene_families || []).join("; ") || "NA"],
    ["Primary organisms", (p) => (p.primary_organisms || []).join("; ") || "NA"],
    ["Genes identified", (p) => p.number_of_genes_identified ?? "NA"],
    ["RNA-seq", (p) => (p.rna_seq_used === true ? "Yes" : "No")],
    ["RT-qPCR", (p) => (p.experimental_validation_qpcr === true ? "Yes" : "No")],
    ["Top tools", (p) => (p.tools || []).slice(0, 6).join("; ") || "NA"],
  ];
  const head = papers.map((p) => `<th>${p.paper_id}</th>`).join("");
  const body = rows
    .map(
      ([label, getter]) =>
        `<tr><th>${label}</th>${papers.map((p) => `<td>${getter(p)}</td>`).join("")}</tr>`
    )
    .join("");
  const summary = `
    <div class="compare-summary">
      <span><strong>${papers.length}</strong> papers selected</span>
      <span>Shared families: <strong>${sharedFamilies.length}</strong></span>
      <span>Shared organisms: <strong>${sharedPrimary.length}</strong></span>
      <span>Shared tools: <strong>${sharedTools.length}</strong></span>
      <span>Shared tool list: ${sharedTools.slice(0, 10).join(", ") || "None"}</span>
    </div>
  `;
  elements.compareTableWrap.innerHTML = `${summary}<div class="table-scroll"><table class="compare-table"><thead><tr><th>Field</th>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  elements.compareTray.hidden = false;
}

function openPaperDialog(paperId) {
  const paper = searchIndex.find((item) => item.paper_id === paperId);
  if (!paper) return;

  elements.modalTitle.textContent = `${paper.paper_id}. ${paper.title}`;
  elements.modalBody.innerHTML = `
    <div class="modal__meta">
      <strong>${paper.year ?? "Year unavailable"}</strong> · ${paper.journal ?? "Journal unavailable"} ·
      ${paper.country ?? "Country unavailable"}
    </div>
    <div class="paper__actions">
      ${
        paper.pdf_available
          ? `<a class="link-pill" href="${paper.pdf_url}" target="_blank" rel="noreferrer">Open PDF</a>`
          : ""
      }
    </div>
    <div class="drawer-summary">
      <div class="drawer-stat">
        <span class="drawer-stat__label">Genes identified</span>
        <strong class="drawer-stat__value">${paper.number_of_genes_identified ?? "NA"}</strong>
      </div>
      <div class="drawer-stat">
        <span class="drawer-stat__label">Gene families</span>
        <strong class="drawer-stat__value">${(paper.gene_families || []).length || "NA"}</strong>
      </div>
      <div class="drawer-stat">
        <span class="drawer-stat__label">Primary organisms</span>
        <strong class="drawer-stat__value">${(paper.primary_organisms || []).length || "NA"}</strong>
      </div>
      <div class="drawer-stat">
        <span class="drawer-stat__label">Validation</span>
        <strong class="drawer-stat__value">${paper.experimental_validation_qpcr === true ? "RT-qPCR" : "In silico only"}</strong>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-card">
        <strong>Authors</strong>
        <div class="detail-text">${(paper.authors || []).join(", ") || "Not specified"}</div>
      </div>
      <div class="detail-card">
        <strong>Gene family</strong>
        <div class="tags">${tagList(paper.gene_families)}</div>
      </div>
      <div class="detail-card">
        <strong>Primary organisms</strong>
        <div class="tags">${tagList(paper.primary_organisms)}</div>
      </div>
      <div class="detail-card">
        <strong>Secondary organisms</strong>
        <div class="tags">${tagList(paper.secondary_organisms)}</div>
      </div>
      <div class="detail-card">
        <strong>Keywords</strong>
        <div class="tags">${tagList((paper.keywords || []).slice(0, 18))}</div>
      </div>
      <div class="detail-card">
        <strong>Core tools</strong>
        <div class="tags">${tagList(paper.tools)}</div>
      </div>
      <div class="detail-card">
        <strong>Validation status</strong>
        <div class="detail-text">
          RNA-seq included: ${paper.rna_seq_used === true ? "Yes" : "No / not reported"}<br />
          RT-qPCR validation: ${paper.experimental_validation_qpcr === true ? "Yes" : "No / not reported"}<br />
          Genes identified: ${paper.number_of_genes_identified ?? "Not reported"}
        </div>
      </div>
      <div class="detail-card">
        <strong>Phylogenetic structure</strong>
        <div class="detail-text">${paper.phylogenetic_structure || "Not specified"}</div>
      </div>
      <div class="detail-card">
        <strong>Duplication summary</strong>
        <div class="detail-text">${paper.duplication_summary || "Not specified"}</div>
      </div>
      <div class="detail-card">
        <strong>BLAST threshold</strong>
        <div class="detail-text">${paper.blast_threshold || "Not specified"}</div>
      </div>
      <div class="detail-card">
        <strong>Pfam IDs</strong>
        <div class="tags">${tagList(paper.pfam_ids)}</div>
      </div>
    </div>
  `;

  elements.drawerOverlay.hidden = false;
  elements.paperDialog.classList.add("is-open");
  elements.paperDialog.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
}

function closePaperDialog() {
  elements.paperDialog.classList.remove("is-open");
  elements.paperDialog.setAttribute("aria-hidden", "true");
  elements.drawerOverlay.hidden = true;
  document.body.classList.remove("drawer-open");
}

function exportCsv(items) {
  const rows = items.map((paper) => ({
    paper_id: paper.paper_id,
    title: paper.title,
    year: paper.year ?? "",
    journal: paper.journal ?? "",
    country: paper.country ?? "",
    gene_families: (paper.gene_families || []).join("; "),
    primary_organisms: (paper.primary_organisms || []).join("; "),
    secondary_organisms: (paper.secondary_organisms || []).join("; "),
    authors: (paper.authors || []).join("; "),
    tools: (paper.tools || []).join("; "),
    genes_identified: paper.number_of_genes_identified ?? "",
    rna_seq_used: paper.rna_seq_used === true ? "Yes" : "No",
    rt_qpcr_validation: paper.experimental_validation_qpcr === true ? "Yes" : "No",
    pdf_filename: paper.pdf_filename ?? "",
  }));

  const headers = Object.keys(rows[0] || {});
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "filtered_gene_family_database.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function render() {
  const items = applyFilters();
  renderDashboard(items);
  renderResults(items);
  renderCompareTray();
  renderActiveFilters();
  renderChartFocus();
}

function appendChat(role, text) {
  if (!elements.chatLog) return;
  const row = document.createElement("div");
  row.className = `chat-msg chat-msg--${role}`;
  row.textContent = text;
  elements.chatLog.append(row);
  elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
}

function topCountsFromItems(items, field, limit = 8) {
  const map = new Map();
  for (const item of items) {
    for (const value of item[field] || []) {
      if (!value) continue;
      map.set(value, (map.get(value) || 0) + 1);
    }
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function summarizeActiveFilters() {
  const parts = [];
  if (state.search) parts.push(`search="${state.search}"`);
  if (state.year) parts.push(`year=${state.year}`);
  if (state.yearFrom || state.yearTo) {
    parts.push(`year-range=${state.yearFrom || "any"}..${state.yearTo || "any"}`);
  }
  if (state.country) parts.push(`country=${state.country}`);
  if (state.journal) parts.push(`journal=${state.journal}`);
  if (state.organism) parts.push(`organism=${state.organism}`);
  if (state.family) parts.push(`family=${state.family}`);
  if (state.rnaSeqOnly) parts.push("rna-seq-only");
  if (state.qPCRonly) parts.push("rt-qpcr-only");
  if (state.evidenceLevel) parts.push(`evidence=${state.evidenceLevel}`);
  return parts.length ? parts.join(", ") : "none";
}

const datasetLexicon = {
  countries: uniqueSorted(searchIndex.map((p) => p.country).filter(Boolean)),
  journals: uniqueSorted(searchIndex.map((p) => p.journal).filter(Boolean)),
  organisms: uniqueSorted(searchIndex.flatMap((p) => p.primary_organisms || []).filter(Boolean)),
  families: uniqueSorted(searchIndex.flatMap((p) => p.gene_families || []).filter(Boolean)),
};

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalizeText(text)
    .split(" ")
    .filter((t) => t && t.length > 1);
}

function extractEntities(question) {
  const q = normalizeText(question);
  const out = { countries: [], journals: [], organisms: [], families: [] };
  for (const c of datasetLexicon.countries) if (q.includes(normalizeText(c))) out.countries.push(c);
  for (const j of datasetLexicon.journals) if (q.includes(normalizeText(j))) out.journals.push(j);
  for (const o of datasetLexicon.organisms) if (q.includes(normalizeText(o))) out.organisms.push(o);
  for (const f of datasetLexicon.families) if (q.includes(normalizeText(f))) out.families.push(f);
  return out;
}

function formatPaperEvidence(items, limit = 10) {
  return items
    .slice(0, limit)
    .map(
      (p) =>
        `#${p.paper_id}: ${p.title} (${p.year ?? "NA"}, ${p.journal ?? "NA"})`
    )
    .join(" | ");
}

function recommendIfEmpty(question) {
  const q = question.toLowerCase();
  if (/rna|qpcr|validation/.test(q)) {
    return "No match in current filters. Try clearing Evidence filter or broadening year range.";
  }
  if (/country|journal|organism|family/.test(q)) {
    return "No match in current filters. Try removing one categorical filter (country/journal/organism/family).";
  }
  return "No match in current filters. Try Reset filters, then ask again.";
}

function topPapersByField(items, mode, n = 10) {
  const sorted = [...items];
  if (mode === "genes") {
    sorted.sort(
      (a, b) =>
        (b.number_of_genes_identified ?? -1) - (a.number_of_genes_identified ?? -1) ||
        a.paper_id - b.paper_id
    );
  } else if (mode === "latest") {
    sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.paper_id - b.paper_id);
  } else {
    sorted.sort((a, b) => a.paper_id - b.paper_id);
  }
  return sorted.slice(0, n);
}

function detectIntent(question) {
  const q = normalizeText(question);
  if (/how many|count|number of papers|sample size|dataset size/.test(q)) return "count";
  if (/summary|summarize|overview/.test(q)) return "summary";
  if (/top tools|most used tools|methodology/.test(q)) return "tools";
  if (/top journals|journals/.test(q)) return "journals";
  if (/top countries|countries/.test(q)) return "countries";
  if (/top organisms|organisms|species/.test(q)) return "organisms";
  if (/top families|gene families|families/.test(q)) return "families";
  if (/highest genes|top genes|largest gene count/.test(q)) return "topgenes";
  if (/latest|recent|newest/.test(q)) return "latest";
  if (/rna-?seq.*rt-?q?pcr|high[- ]evidence|both/.test(q)) return "highevidence";
  if (/list papers|paper ids|which papers|show papers/.test(q)) return "list";
  return "semantic";
}

function semanticRetrieve(items, question, topK = 12) {
  const terms = tokenize(question);
  const entities = extractEntities(question);
  const scored = items
    .map((p) => {
      const text = normalizeText(
        [
          p.title,
          p.journal,
          p.country,
          ...(p.authors || []),
          ...(p.primary_organisms || []),
          ...(p.secondary_organisms || []),
          ...(p.gene_families || []),
          ...(p.tools || []),
          ...(p.keywords || []),
        ].join(" ")
      );
      let score = 0;
      for (const t of terms) {
        if (text.includes(t)) score += 2;
      }
      if (entities.countries.includes(p.country)) score += 5;
      if (entities.journals.includes(p.journal)) score += 5;
      if ((p.primary_organisms || []).some((o) => entities.organisms.includes(o))) score += 5;
      if ((p.gene_families || []).some((f) => entities.families.includes(f))) score += 5;
      if (/rna-?seq/.test(question) && p.rna_seq_used === true) score += 4;
      if (/q?pcr/.test(question) && p.experimental_validation_qpcr === true) score += 4;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.p.paper_id - b.p.paper_id)
    .slice(0, topK)
    .map((x) => x.p);
  return scored;
}

function answerDatasetQuestion(questionRaw) {
  const question = (questionRaw || "").trim();
  const qLower = question.toLowerCase();
  const items = applyFilters();
  if (!question) return "Please ask a question about the current dataset view.";
  if (!items.length) return recommendIfEmpty(qLower);

  const filterContext = summarizeActiveFilters();
  const intent = detectIntent(question);

  if (intent === "count") {
    return `Current filtered view contains ${items.length} papers (active filters: ${filterContext}).`;
  }

  if (intent === "tools") {
    const top = topCountsFromItems(items, "tools", 8);
    if (!top.length) return "No tool annotations found in the current filtered view.";
    const evidence = formatPaperEvidence(
      items.filter((p) => (p.tools || []).includes(top[0][0])),
      6
    );
    return `Top tools: ${top.map(([k, v]) => `${k} (${v})`).join(", ")}.\nEvidence papers: ${evidence}`;
  }

  if (intent === "highevidence") {
    const matched = items.filter(
      (p) => p.rna_seq_used === true && p.experimental_validation_qpcr === true
    );
    if (!matched.length) return "No papers with both RNA-seq and RT-qPCR in the current filtered view.";
    const ids = matched.slice(0, 20).map((p) => p.paper_id).join(", ");
    const evidence = formatPaperEvidence(matched, 8);
    return `Found ${matched.length} high-evidence papers (RNA-seq + RT-qPCR). IDs: ${ids}${matched.length > 20 ? ", ..." : ""}.\nEvidence papers: ${evidence}`;
  }

  if (intent === "list") {
    const ids = items.slice(0, 30).map((p) => p.paper_id).join(", ");
    return `Paper IDs in current view (first ${Math.min(items.length, 30)}): ${ids}${items.length > 30 ? ", ..." : ""}.\nEvidence sample: ${formatPaperEvidence(items, 6)}`;
  }

  if (intent === "journals") {
    const map = new Map();
    for (const p of items) {
      if (!p.journal) continue;
      map.set(p.journal, (map.get(p.journal) || 0) + 1);
    }
    const top = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (!top.length) return "No journal data in current filtered view.";
    return `Top journals: ${top.map(([k, v]) => `${k} (${v})`).join(", ")}.\nEvidence sample: ${formatPaperEvidence(items, 6)}`;
  }

  if (intent === "countries") {
    const map = new Map();
    for (const p of items) {
      if (!p.country) continue;
      map.set(p.country, (map.get(p.country) || 0) + 1);
    }
    const top = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (!top.length) return "No country data in current filtered view.";
    return `Top countries: ${top.map(([k, v]) => `${k} (${v})`).join(", ")}.\nEvidence sample: ${formatPaperEvidence(items, 6)}`;
  }

  if (intent === "organisms") {
    const top = topCountsFromItems(items, "primary_organisms", 8);
    if (!top.length) return "No primary organism data in current filtered view.";
    return `Top primary organisms: ${top.map(([k, v]) => `${k} (${v})`).join(", ")}.\nEvidence sample: ${formatPaperEvidence(items, 6)}`;
  }

  if (intent === "families") {
    const top = topCountsFromItems(items, "gene_families", 8);
    if (!top.length) return "No gene family data in current filtered view.";
    return `Top gene families: ${top.map(([k, v]) => `${k} (${v})`).join(", ")}.\nEvidence sample: ${formatPaperEvidence(items, 6)}`;
  }

  if (intent === "topgenes") {
    const top = topPapersByField(items, "genes", 10);
    return `Top papers by genes identified:\n${top
      .map((p) => `#${p.paper_id} (${p.number_of_genes_identified ?? "NA"})`)
      .join(", ")}\nEvidence papers: ${formatPaperEvidence(top, 6)}`;
  }

  if (intent === "latest") {
    const top = topPapersByField(items, "latest", 10);
    return `Most recent papers in current view:\n${top
      .map((p) => `#${p.paper_id} (${p.year ?? "NA"})`)
      .join(", ")}\nEvidence papers: ${formatPaperEvidence(top, 6)}`;
  }

  if (intent === "summary") {
    const valCount = items.filter(
      (p) => p.rna_seq_used === true || p.experimental_validation_qpcr === true
    ).length;
    const topTools = topCountsFromItems(items, "tools", 5)
      .map(([k, v]) => `${k} (${v})`)
      .join(", ");
    return `Summary for current view (${items.length} papers): validation evidence in ${valCount} papers; top tools: ${topTools || "NA"}.\nEvidence sample: ${formatPaperEvidence(items, 6)}`;
  }

  const retrieved = semanticRetrieve(items, question, 12);
  if (!retrieved.length) {
    return `I could not ground this query in the current filtered dataset (filters: ${filterContext}). Try rephrasing with organism, family, country, journal, RNA-seq, or RT-qPCR terms.`;
  }

  const topTools = topCountsFromItems(retrieved, "tools", 5)
    .map(([k, v]) => `${k} (${v})`)
    .join(", ");
  const topFamilies = topCountsFromItems(retrieved, "gene_families", 5)
    .map(([k, v]) => `${k} (${v})`)
    .join(", ");
  return `Grounded synthesis from ${retrieved.length} relevant papers in current view: top families ${topFamilies || "NA"}; top tools ${topTools || "NA"}.\nEvidence papers: ${formatPaperEvidence(retrieved, 8)}`;
}

function renderFromStart() {
  state.visibleCount = state.pageSize;
  render();
}

function resetState() {
  state.search = "";
  state.year = "";
  state.country = "";
  state.journal = "";
  state.organism = "";
  state.family = "";
  state.yearFrom = "";
  state.yearTo = "";
  state.searchMode = "any";
  state.evidenceLevel = "";
  state.rnaSeqOnly = false;
  state.qPCRonly = false;
  state.pdfOnly = true;
  state.sort = "paper-asc";
  state.pageSize = 30;
  state.visibleCount = 30;
  state.view = "detailed";
  state.chartFocus = "all";

  elements.searchInput.value = "";
  elements.yearFilter.value = "";
  elements.countryFilter.value = "";
  elements.journalFilter.value = "";
  elements.organismFilter.value = "";
  elements.familyFilter.value = "";
  elements.yearFrom.value = "";
  elements.yearTo.value = "";
  elements.searchMode.value = "any";
  elements.evidenceLevel.value = "";
  elements.rnaSeqOnly.checked = false;
  elements.qPCRonly.checked = false;
  elements.pdfOnly.checked = true;
  elements.sortSelect.value = "paper-asc";
  elements.pageSizeSelect.value = "30";
  elements.viewDetailed.classList.add("is-active");
  elements.viewCompact.classList.remove("is-active");
}

function bind() {
  function openAgent() {
    if (!elements.agentWindow || !elements.agentFab) return;
    elements.agentWindow.hidden = false;
    elements.agentWindow.style.display = "grid";
    elements.agentFab.hidden = true;
    elements.agentFab.style.display = "none";
    elements.chatInput?.focus();
  }

  function closeAgent() {
    if (!elements.agentWindow || !elements.agentFab) return;
    elements.agentWindow.hidden = true;
    elements.agentWindow.style.display = "none";
    elements.agentFab.hidden = false;
    elements.agentFab.style.display = "inline-flex";
  }

  window.__openDatasetAgent = openAgent;
  window.__closeDatasetAgent = closeAgent;

  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    renderFromStart();
  });

  elements.yearFilter.addEventListener("change", (event) => {
    state.year = event.target.value;
    renderFromStart();
  });

  elements.countryFilter.addEventListener("change", (event) => {
    state.country = event.target.value;
    renderFromStart();
  });

  elements.journalFilter.addEventListener("change", (event) => {
    state.journal = event.target.value;
    renderFromStart();
  });

  elements.organismFilter.addEventListener("change", (event) => {
    state.organism = event.target.value;
    renderFromStart();
  });

  elements.familyFilter.addEventListener("change", (event) => {
    state.family = event.target.value;
    renderFromStart();
  });

  elements.yearFrom.addEventListener("input", (event) => {
    state.yearFrom = event.target.value.trim();
    renderFromStart();
  });

  elements.yearTo.addEventListener("input", (event) => {
    state.yearTo = event.target.value.trim();
    renderFromStart();
  });

  elements.searchMode.addEventListener("change", (event) => {
    state.searchMode = event.target.value;
    renderFromStart();
  });

  elements.evidenceLevel.addEventListener("change", (event) => {
    state.evidenceLevel = event.target.value;
    renderFromStart();
  });

  elements.rnaSeqOnly.addEventListener("change", (event) => {
    state.rnaSeqOnly = event.target.checked;
    renderFromStart();
  });

  elements.qPCRonly.addEventListener("change", (event) => {
    state.qPCRonly = event.target.checked;
    renderFromStart();
  });

  elements.pdfOnly.addEventListener("change", (event) => {
    state.pdfOnly = event.target.checked;
    renderFromStart();
  });

  elements.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderFromStart();
  });

  elements.pageSizeSelect.addEventListener("change", (event) => {
    state.pageSize = Number(event.target.value);
    renderFromStart();
  });

  elements.viewDetailed.addEventListener("click", () => {
    state.view = "detailed";
    elements.viewDetailed.classList.add("is-active");
    elements.viewCompact.classList.remove("is-active");
    render();
  });

  elements.viewCompact.addEventListener("click", () => {
    state.view = "compact";
    elements.viewCompact.classList.add("is-active");
    elements.viewDetailed.classList.remove("is-active");
    render();
  });

  elements.showMore.addEventListener("click", () => {
    state.visibleCount += state.pageSize;
    render();
  });

  elements.resetFilters.addEventListener("click", () => {
    resetState();
    render();
  });

  elements.chartTabs.forEach((button) => {
    button.addEventListener("click", () => {
      state.chartFocus = button.dataset.chartTarget || "all";
      renderChartFocus();
    });
  });

  elements.exportCsv.addEventListener("click", () => {
    exportCsv(applyFilters());
  });

  if (elements.clearCompare) {
    elements.clearCompare.addEventListener("click", () => {
      state.compareIds = [];
      render();
    });
  }

  elements.closeDialog.addEventListener("click", () => {
    closePaperDialog();
  });

  elements.drawerOverlay.addEventListener("click", () => {
    closePaperDialog();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePaperDialog();
  });

  if (elements.focusFilters) {
    elements.focusFilters.addEventListener("click", () => {
      // On mobile, the filters are in a drawer, so we need to open it
      if (window.innerWidth <= 768 && elements.filtersPanel) {
        elements.filtersPanel.classList.add("is-active");
        if (elements.drawerOverlay) elements.drawerOverlay.hidden = false;
      }
      elements.filtersPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
      elements.searchInput?.focus();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement !== elements.searchInput) {
      event.preventDefault();
      elements.searchInput?.focus();
    }
  });

  if (elements.chatSend) {
    elements.chatSend.addEventListener("click", () => {
      const q = elements.chatInput.value.trim();
      if (!q) return;
      appendChat("user", q);
      appendChat("bot", answerDatasetQuestion(q));
      elements.chatInput.value = "";
    });
  }

  if (elements.chatInput) {
    elements.chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") elements.chatSend?.click();
    });
  }

  elements.chatSuggestions.forEach((btn) => {
    btn.addEventListener("click", () => {
      const q = btn.dataset.chatQ || "";
      if (!q) return;
      appendChat("user", q);
      appendChat("bot", answerDatasetQuestion(q));
    });
  });

  if (elements.agentFab && elements.agentWindow) {
    elements.agentFab.addEventListener("click", openAgent);
  }

  if (elements.agentClose && elements.agentWindow) {
    elements.agentClose.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeAgent();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.agentWindow && !elements.agentWindow.hidden) {
      closeAgent();
    }
  });
}

function bindAnimatedEntrance() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.animate(
            [
              { opacity: 0, transform: "translateY(14px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
          );
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.01, rootMargin: "0px 0px -8% 0px" }
  );

  document.querySelectorAll(".metric, .chart-panel, .paper, .footer-card, .command-strip").forEach((node) => {
    node.style.opacity = "0";
    observer.observe(node);
  });
}

function bindParallaxBackground() {
  const blobs = [...document.querySelectorAll(".ambient-bg__blob")];
  if (!blobs.length) return;
  window.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 10;
    const y = (event.clientY / window.innerHeight - 0.5) * 10;
    blobs.forEach((blob, index) => {
      const factor = (index + 1) * 0.5;
      blob.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
    });
  });
}

function runChatbotSelfTest() {
  const tests = [
    { q: "How many papers are in current view?", must: /contains \d+ papers/i },
    { q: "Top tools in this dataset", must: /top tools/i },
    { q: "Show papers with RNA-seq and RT-qPCR", must: /high-evidence|rna-seq \+ rt-qpcr/i },
    { q: "Top journals", must: /top journals/i },
    { q: "Latest papers", must: /most recent papers/i },
    { q: "Summarize this view", must: /summary for current view/i },
  ];
  let pass = 0;
  for (const t of tests) {
    const ans = answerDatasetQuestion(t.q);
    if (t.must.test(ans)) pass += 1;
  }
  return { pass, total: tests.length, pct: Math.round((pass / tests.length) * 100) };
}

function bindMobileToggles() {
  if (elements.menuToggle && elements.topnavLinks) {
    elements.menuToggle.addEventListener("click", () => {
      elements.menuToggle.classList.toggle("is-active");
      elements.topnavLinks.classList.toggle("is-active");
    });

    // Close menu when clicking a link
    elements.topnavLinks.querySelectorAll(".topnav__link").forEach(link => {
      link.addEventListener("click", () => {
        elements.menuToggle.classList.remove("is-active");
        elements.topnavLinks.classList.remove("is-active");
      });
    });
  }

  if (elements.mobileFilterToggle && elements.filtersPanel) {
    elements.mobileFilterToggle.addEventListener("click", () => {
      elements.filtersPanel.classList.add("is-active");
      if (elements.drawerOverlay) elements.drawerOverlay.hidden = false;
    });

    // Reuse drawer overlay to close filters
    if (elements.drawerOverlay) {
      elements.drawerOverlay.addEventListener("click", () => {
        elements.filtersPanel.classList.remove("is-active");
        // Only hide if the main paper drawer is not also open
        if (elements.paperDialog && !elements.paperDialog.classList.contains("is-open")) {
          elements.drawerOverlay.hidden = true;
        }
      });
    }

    // Add a close button inside filters for mobile if it doesn't exist
    if (!document.getElementById("closeFiltersMobile")) {
      const closeBtn = document.createElement("button");
      closeBtn.id = "closeFiltersMobile";
      closeBtn.className = "button button--primary";
      closeBtn.style.width = "100%";
      closeBtn.style.marginTop = "24px";
      closeBtn.style.padding = "14px";
      closeBtn.textContent = "Apply & Close";
      closeBtn.type = "button";
      closeBtn.addEventListener("click", () => {
        elements.filtersPanel.classList.remove("is-active");
        if (elements.drawerOverlay) elements.drawerOverlay.hidden = true;
      });
      elements.filtersPanel.appendChild(closeBtn);
    }
  }
}

renderMetrics();
animateCounters();
bind();
if (elements.pageSizeSelect) {
  elements.pageSizeSelect.value = state.pageSize;
}
bindMobileToggles();
render();
const evalScore = runChatbotSelfTest();
appendChat(
  "bot",
  `I am a dataset-grounded assistant. I synthesize answers from current filtered data with evidence paper IDs. Self-test: ${evalScore.pass}/${evalScore.total} (${evalScore.pct}%).`
);
bindAnimatedEntrance();
bindParallaxBackground();
