import { cssVarsFor, themeTokens } from './theme.js';
import {
  renderGlobalSearch,
  renderFacetPanel,
  renderResultList,
  renderEvidenceTable,
  renderProvenanceSummary,
  renderProvenanceHistory,
  renderVisualizationShowcase,
  initHeaderSearch,
  initAptamerMultiSelect,
  initSecondaryStructureModule,
  initMolstarModule,
  initSequenceDetailMolstar
} from './modules.js';
import {
  dataTypeCards,
  detailRecord,
  featuredRecords,
  portalMetrics,
  recentPublications,
  siteSummaries,
  stageDiseaseCards
} from './data.js';
import { normalizeRoute, routeFromHash } from './router.js';
import { downloadRowsAsCsv } from './modules.js';
let sequenceRows = [];
let selectedSequenceIds = new Set();
let sequenceSearchQuery = '';
const DEMO_SEQUENCE_COUNT = 10;

function subNav() {
  return `<div class="hero-subnav">
    <nav>
      <button
        class="nav-btn ${route === 'home' ? 'active' : ''}"
        data-route="home"
        aria-current="${route === 'home' ? 'page' : 'false'}"
      >
        Home
      </button>

      <button
        class="nav-btn ${route === 'structure' ? 'active' : ''}"
        data-route="structure"
        aria-current="${route === 'structure' ? 'page' : 'false'}"
      >
        Structure
      </button>

      <div class="nav-dropdown ${isDownloadMenuOpen ? 'open' : ''}">
        <button
          class="nav-btn nav-dropdown-toggle ${route === 'download-sequences' || route === 'download-structures' ? 'active' : ''}"
          id="download-menu-toggle"
          type="button"
          aria-haspopup="true"
          aria-expanded="${isDownloadMenuOpen ? 'true' : 'false'}"
        >
          Download
          <span class="dropdown-caret">▲</span>
        </button>

        <div class="nav-dropdown-menu">
          <button class="nav-dropdown-item" data-route="download-sequences">Sequences</button>
          <button class="nav-dropdown-item" data-route="download-structures">Structures</button>
        </div>
      </div>

      <button
        class="nav-btn ${route === 'detail' ? 'active' : ''}"
        data-route="detail"
        aria-current="${route === 'detail' ? 'page' : 'false'}"
      >
        Detail
      </button>

      <button
        class="nav-btn ${route === 'publications' ? 'active' : ''}"
        data-route="publications"
        aria-current="${route === 'publications' ? 'page' : 'false'}"
      >
        Publications
      </button>

      <button
        class="nav-btn ${route === 'help' ? 'active' : ''}"
        data-route="help"
        aria-current="${route === 'help' ? 'page' : 'false'}"
      >
        Help
      </button>
    </nav>
  </div>`;
}


function getSequenceIdFromHash() {
  const hash = window.location.hash || '';
  const [, queryString = ''] = hash.split('?');
  const params = new URLSearchParams(queryString);
  return params.get('sequenceId');
}

function getPdbNameFromHash() {
  const hash = window.location.hash || '';
  const [, queryString = ''] = hash.split('?');
  const params = new URLSearchParams(queryString);
  return params.get('pdbName');
}

function getFilteredSequenceRows() {
  const query = sequenceSearchQuery.trim().toLowerCase();
  if (!query) return sequenceRows;
  return sequenceRows.filter((row) =>
    [
      row.sequenceName,
      row.aptamerName,
      row.category,
      row.type,
      row.chemicalProbing,
      row.pdbName,
      row.article,
      row.sequence
    ].some((value) => String(value ?? '').toLowerCase().includes(query))
  );
}

function sequenceDetailPage() {
  const sequenceId = getSequenceIdFromHash();
  const pdbName = getPdbNameFromHash();
  const row = sequenceRows.find((item) => item.id === sequenceId)
    ?? sequenceRows.find((item) => item.pdbName === pdbName);

  if (!row) {
    return `<main class="page-sequence-detail">
      ${renderGlobalSearch()}
      ${subNav()}
      <section class="card">
        <h1>Sequence Not Found</h1>
        <p>No sequence record matched this link.</p>
      </section>
    </main>`;
  }

  return `<main class="page-sequence-detail">
    ${renderGlobalSearch()}
    ${subNav()}
    <section class="card sequence-detail-card">
      <div class="sequence-detail-header">
        <h1>${row.sequenceName ?? ''}</h1>
      </div>

      <section class="sequence-detail-panel">
        <h2>Description</h2>
        <div class="sequence-detail-rule"></div>
        <div class="sequence-detail-placeholder">
          <p>Description content will be added here.</p>
        </div>
      </section>

      <section class="sequence-detail-panel">
        <h2>Primary Sequence</h2>
        <div class="sequence-detail-rule"></div>
        <div class="sequence-detail-placeholder">
          <p>Primary sequence content will be added here.</p>
        </div>
      </section>

      <section class="sequence-detail-panel">
        <h2>Secondary Structure</h2>
        <div class="sequence-detail-rule"></div>
        <div class="sequence-detail-media">
          <img
            src="./SL5.png"
            alt="Secondary structure diagram"
            class="sequence-detail-image"
          />
        </div>
      </section>

      <section class="sequence-detail-panel">
        <h2>Tertiary Structure</h2>
        <div class="sequence-detail-rule"></div>
        <div class="sequence-detail-media">
          <div id="sequence-detail-molstar-status" class="mini-note">Loading interactive 3D structure…</div>
          <div id="sequence-detail-molstar" class="sequence-detail-viewer"></div>
        </div>
      </section>
    </section>
  </main>`;
}



async function loadSequenceRows() {
  const response = await fetch('./singlecell-viewer/dist/data/sequences.json');
  if (!response.ok) {
    throw new Error('Failed to load sequences.json');
  }

  const rawRows = await response.json();
  const firstRow = rawRows[0] ?? {};
  sequenceRows = Array.from({ length: DEMO_SEQUENCE_COUNT }, (_, index) => ({
    id: `${firstRow['PDB Name'] ?? 'SEQ'}-${index + 1}`,
    pdbName: '8QO5',
    sequenceName: 'SARS-CoV-2-SL5',
    aptamerName: 'XX',
    category: 'Virus',
    type: 'UCGUUGACAGGACACGAGUAACUCGUCUAUCUUCUGCAGGCUGCUUACGGUUUCGUCCGUGUUGCAGCCGAUCAUCAGCACAUCUAGGUUUCGUCCGGGUGUGACCGAAAGGUAAGAUGGAGAGCCUUGUCCCUGGUUUCAACGA',
    chemicalProbing: 'XX',
    article: '2024',
    sequence: '100%',
    confidence: 'high',
    detailPage: firstRow.detailPage ?? '#'
  }));
}



function downloadSequencesPage() {
  const visibleRows = getFilteredSequenceRows();
  const rows = visibleRows.map((row) => `
    <tr>
      <td>
        <input
          type="checkbox"
          class="sequence-select"
          data-sequence-id="${row.id}"
          ${selectedSequenceIds.has(row.id) ? 'checked' : ''}
        />
      </td>
      <td><a href="#sequence-detail?pdbName=${encodeURIComponent(row.pdbName ?? '')}" class="sequence-link">${row.sequenceName ?? ''}</a></td>
      <td>${row.aptamerName ?? ''}</td>
      <td>${row.article ?? ''}</td>
      <td>${row.category ?? ''}</td>
      <td>
        <span class="sequence-preview" title="${row.type ?? ''}">
          ${row.type ? `${row.type.slice(0, 10)}...` : ''}
        </span>
      </td>
      <td>${row.chemicalProbing ?? ''}</td>
      <td><a href="https://www.rcsb.org/structure/${encodeURIComponent(row.pdbName ?? '')}" class="sequence-link" target="_blank" rel="noopener noreferrer">${row.pdbName ?? ''}</a></td>
      <td>${row.sequence ?? ''}</td>
      <td>${row.confidence ?? ''}</td>
    </tr>
  `).join('');

  return `<main class="page-download-sequences">
    ${renderGlobalSearch()}
    ${subNav()}
    <section class="card download-card">
      <h1>Sequences</h1>
      <p class="download-intro">Select one or more rows below to download example sequence records. Current data are demo entries copied from the first available record.</p>

      <div class="download-toolbar">
        <input
          id="sequence-search"
          class="download-search"
          type="search"
          placeholder="Search..."
          value="${sequenceSearchQuery.replace(/"/g, '&quot;')}"
        />
        <button id="export-selected-sequences" type="button" class="download-outline-btn" ${selectedSequenceIds.size ? '' : 'disabled'}>
          Export Selected (${selectedSequenceIds.size})
        </button>
        <button id="export-all-sequences" type="button" class="download-outline-btn">
          Export All Results
        </button>
        <button id="select-visible-sequences" type="button" class="download-outline-btn">
          Select Current Page
        </button>
        <button id="clear-selected-sequences" type="button" class="download-outline-btn">
          Clear Selection
        </button>
      </div>

      <div class="download-table-wrap">
      <table class="structure-table download-table">
        <thead>
          <tr>
            <th>Select</th>
            <th>Name</th>
            <th>Description</th>
            <th>Discovery Year</th>
            <th>Category</th>
            <th>Sequence</th>
            <th>Chemical Probing</th>
            <th>PDB ID</th>
            <th>PDB Coverage</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      </div>

      <div class="download-footnote">
        <span>Showing 1-${visibleRows.length} of ${visibleRows.length} entries</span>
      </div>
    </section>
  </main>`;
}





const routes = ['home', 'download-sequences', 'download-structures', 'detail', 'publications', 'help'];
let route = routeFromHash(window.location.hash);
let theme = 'blue';
let mode = 'light';

function setTheme(themeKey, modeKey) {
  const styleTag = document.getElementById('theme-vars') ?? document.createElement('style');
  styleTag.id = 'theme-vars';
  styleTag.textContent = `:root { ${cssVarsFor(themeKey, modeKey)} }`;
  document.head.appendChild(styleTag);
  document.body.setAttribute('data-mode', modeKey);
}

let isDownloadMenuOpen = false;

function nav() {
  return `<header>
    <div class="black-nav" aria-label="GZNL global navigation">
      <a href="http://www.gznl.org/" target="_blank" rel="noopener noreferrer"><img src="./src/assets/header/home.svg" alt=""/>Home</a>
      <a href="https://www.gznl.org/database/" target="_blank" rel="noopener noreferrer"><img src="./src/assets/header/database.svg" alt=""/>Database</a>
      <a href="https://www.gznl.org/research/" target="_blank" rel="noopener noreferrer"><img src="./src/assets/header/research.svg" alt=""/>Research</a>
      <a href="https://www.gznl.org/aboutus/" target="_blank" rel="noopener noreferrer"><img src="./src/assets/header/aboutus.svg" alt=""/>About us</a>
      <a href="https://gzlab.ac.cn/" target="_blank" rel="noopener noreferrer"><img src="./src/assets/header/gznl2.svg" alt=""/>GZNL-RDC</a>
    </div>
  </header>`;
}



function parseMetricValue(raw) {
  const text = String(raw).trim();
  const multiplier = text.endsWith('M') ? 1_000_000 : text.endsWith('K') ? 1_000 : 1;
  const numeric = Number(text.replace(/[^\d.]/g, '')) * multiplier;
  return Number.isFinite(numeric) ? Math.round(numeric) : 0;
}

function formatAnimatedValue(target, original) {
  const text = String(original).trim();
  if (text.endsWith('M')) return `${(target / 1_000_000).toFixed(1)}M`;
  if (text.endsWith('K')) return `${(target / 1_000).toFixed(1)}K`;
  return target.toLocaleString();
}

function initAnimatedStats() {
  const nodes = Array.from(document.querySelectorAll('[data-animate-number="true"]'));
  const duration = 1200;

  nodes.forEach((node) => {
    if (node.dataset.animated === 'true') return;
    const target = Number(node.dataset.target || '0');
    const original = node.dataset.original || '0';
    const start = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(target * eased);
      node.textContent = formatAnimatedValue(value, original);
      if (t < 1) requestAnimationFrame(tick);
      else {
        node.textContent = original;
        node.dataset.animated = 'true';
      }
    }

    requestAnimationFrame(tick);
  });
}

function renderFooter() {
  return `<footer class="black-footer">
    <div class="black-footer-inner">
      <span>© Guangzhou National Laboratory</span>
      <span class="sep">|</span>
      <a href="http://www.gznl.org/" target="_blank" rel="noopener noreferrer">Home</a>
      <a href="https://www.gznl.org/database/" target="_blank" rel="noopener noreferrer">Database</a>
      <a href="https://www.gznl.org/research/" target="_blank" rel="noopener noreferrer">Research</a>
      <a href="https://www.gznl.org/aboutus/" target="_blank" rel="noopener noreferrer">About us</a>
      <a href="https://gzlab.ac.cn/" target="_blank" rel="noopener noreferrer">GZNL-RDC</a>
    </div>
  </footer>`;
}

function homePage() {
  const activeThemeLabel = themeTokens[theme]?.label ?? 'Blue';
  return `<main class="page-home">
    ${renderGlobalSearch()}
    ${subNav()}

    <section class="hero card">
      <div>
        <h1>RNA structure mapping</h1>
        <p>A database enabling systematic mapping between RNA secondary structure elements and three-dimensional RNA architecture.</p>
        <p><strong>Active visual theme:</strong> ${activeThemeLabel} (${mode})</p>
        <div class="actions"><button data-route="browse">Explore Datasets</button><button class="ghost" data-route="detail">Open Detail Example</button></div>
      </div>
      <div class="hero-metrics">
        ${portalMetrics.map((m) => `<div><strong data-animate-number="true" data-target="${parseMetricValue(m.value)}" data-original="${m.value}">0</strong><span>${m.label}</span></div>`).join('')}
      </div>
    </section>

    <section class="stats-grid">
      ${dataTypeCards.map((item) => `<article class="card"><h3>${item.name}</h3><p>${item.desc}</p><strong>${item.count}</strong></article>`).join('')}
    </section>

    <section class="card">
      <h2>Experiment Overview</h2>
      <div class="stats-grid compact">
        ${stageDiseaseCards.map((item) => `<article class="mini-card"><strong>${item.name}</strong><span>${item.count}</span></article>`).join('')}
      </div>
    </section>

    <section class="card">
      <h2>Data Statistics Dashboard</h2>
      <ul>
        ${siteSummaries.map((summary) => `<li><strong>${summary.site}</strong>: ${summary.scope} (${summary.records.toLocaleString()} records)</li>`).join('')}
      </ul>
    </section>

    ${renderVisualizationShowcase()}

    <section class="card">
      <h2>Highlighted records</h2>
      <ul>
        ${featuredRecords.map((record) => `<li>${record.id}: ${record.title} (confidence: ${record.confidence})</li>`).join('')}
      </ul>
    </section>

    <section class="card">
      <h2>Recent publications</h2>
      <ul>
        ${recentPublications.map((paper) => `<li>${paper.year} — ${paper.title} (${paper.doi})</li>`).join('')}
      </ul>
    </section>
  </main>`;
}


function detailPage() {
  return `<main class="page-detail">
    ${renderGlobalSearch()}
    ${subNav()}
    <section class="card"><h1>C-ENTITY-001 Entity Header</h1><p>Entry ID: ${detailRecord.id} • Name: ${detailRecord.name} • Status: ${detailRecord.status}</p></section>
    <section class="card"><h2>Overview</h2><p>Organism: ${detailRecord.organism} • Family: ${detailRecord.family} • Updated: ${detailRecord.updated}</p><p>Sequence length: ${detailRecord.sequenceLength} nt • Context: ${detailRecord.genomicContext}</p></section>
    ${renderEvidenceTable()}
    ${renderProvenanceSummary()}
    ${renderProvenanceHistory()}
  </main>`;
}

function structurePage() {
  const headers = Array.from({ length: 10 }, (_, i) => `<th>Column ${i + 1}</th>`).join('');
  const rows = Array.from({ length: 5 }, () => `
    <tr>
      ${Array.from({ length: 10 }, () => '<td>&nbsp;</td>').join('')}
    </tr>
  `).join('');

  return `<main class="page-structure">
    ${renderGlobalSearch()}
    ${subNav()}
    <section class="card">
      <h1>Structure Page</h1>
      <table class="structure-table">
        <thead>
          <tr>${headers}</tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  </main>`;
}


function downloadStructuresPage() {
  return `<main class="page-download">
    ${renderGlobalSearch()}
    ${subNav()}
    <section class="card">
      <h1>Download Structures</h1>
      <p>Structure download content goes here.</p>
    </section>
  </main>`;
}

function publicationsPage() {
  const headers = Array.from({ length: 10 }, (_, i) => `<th>Column ${i + 1}</th>`).join('');
  const rows = Array.from({ length: 5 }, () => `
    <tr>
      ${Array.from({ length: 10 }, () => '<td>&nbsp;</td>').join('')}
    </tr>
  `).join('');

  return `<main class="page-publications">
    ${renderGlobalSearch()}
    ${subNav()}
    <section class="card">
      <h1>Publications Page</h1>
      <table class="structure-table">
        <thead>
          <tr>${headers}</tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  </main>`;
}

function helpPage() {
  return `<main class="page-help">
    ${renderGlobalSearch()}
    ${subNav()}
    <section class="card">
      <h1>Help</h1>
      <p>Use the navigation above to browse structures, download sequence records, and view detail pages.</p>
      <p>If you cannot find a record, try checking the download pages first and then open the related detail entry.</p>
    </section>
  </main>`;
}


function pageFor(name) {
  const safeRoute = normalizeRoute(name);
  if (safeRoute === 'structure') return structurePage();
  if (safeRoute === 'download-sequences') return downloadSequencesPage();
  if (safeRoute === 'download-structures') return downloadStructuresPage();
  if (safeRoute === 'detail') return detailPage();
  if (safeRoute === 'publications') return publicationsPage();
  if (safeRoute === 'help') return helpPage();
  if (safeRoute === 'sequence-detail') return sequenceDetailPage();
  return homePage();
}

function render(options = {}) {
  const { preserveScroll = false } = options;
  const previousScrollX = window.scrollX;
  const previousScrollY = window.scrollY;

  setTheme(theme, mode);
  document.getElementById('app').innerHTML = `${nav()}${pageFor(route)}${renderFooter()}`;
  const exportAllBtn = document.getElementById('export-all-sequences');
  if (exportAllBtn) {
    exportAllBtn.addEventListener('click', () => {
      downloadRowsAsCsv(getFilteredSequenceRows(), 'sequences-export.csv');
    });
  }
  const exportSelectedBtn = document.getElementById('export-selected-sequences');
  if (exportSelectedBtn) {
    exportSelectedBtn.addEventListener('click', () => {
      const selectedRows = sequenceRows.filter((row) => selectedSequenceIds.has(row.id));
      downloadRowsAsCsv(selectedRows, 'sequences-selected.csv');
    });
  }
  const selectVisibleBtn = document.getElementById('select-visible-sequences');
  if (selectVisibleBtn) {
    selectVisibleBtn.addEventListener('click', () => {
      getFilteredSequenceRows().forEach((row) => selectedSequenceIds.add(row.id));
      render({ preserveScroll: true });
    });
  }
  const clearSelectedBtn = document.getElementById('clear-selected-sequences');
  if (clearSelectedBtn) {
    clearSelectedBtn.addEventListener('click', () => {
      selectedSequenceIds.clear();
      render({ preserveScroll: true });
    });
  }
  const sequenceSearchInput = document.getElementById('sequence-search');
  if (sequenceSearchInput) {
    sequenceSearchInput.addEventListener('input', (event) => {
      sequenceSearchQuery = event.target.value;
      render({ preserveScroll: true });
    });
  }
  document.querySelectorAll('.sequence-select').forEach((checkbox) => {
    checkbox.addEventListener('change', (event) => {
      const id = event.target.getAttribute('data-sequence-id');
      if (event.target.checked) {
        selectedSequenceIds.add(id);
      } else {
        selectedSequenceIds.delete(id);
      }
      render({ preserveScroll: true });
    });
  });


  initHeaderSearch();
  initAptamerMultiSelect();
  initSecondaryStructureModule();
  initMolstarModule();
  initSequenceDetailMolstar();
  initAnimatedStats();

const downloadToggle = document.getElementById('download-menu-toggle');
const downloadDropdown = document.querySelector('.nav-dropdown');

if (downloadToggle && downloadDropdown) {
  downloadToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    isDownloadMenuOpen = !isDownloadMenuOpen;
    render({ preserveScroll: true });
  });

  downloadDropdown.querySelectorAll('.nav-dropdown-item').forEach((item) => {
    item.addEventListener('click', () => {
      isDownloadMenuOpen = false;
    });
  });
}

document.addEventListener('click', () => {
  if (isDownloadMenuOpen) {
    isDownloadMenuOpen = false;
    render({ preserveScroll: true });
  }
});


  document.querySelectorAll('[data-route]').forEach((el) => {
    el.addEventListener('click', () => {
      route = normalizeRoute(el.getAttribute('data-route'));
      window.location.hash = route;
    });
  });

  if (preserveScroll) {
    requestAnimationFrame(() => window.scrollTo(previousScrollX, previousScrollY));
  }
}

window.addEventListener('hashchange', () => {
  route = routeFromHash(window.location.hash);
  render();
});


async function initApp() {
  await loadSequenceRows();
  render();
}

initApp();
