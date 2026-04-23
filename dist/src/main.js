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
  initHomeStructureShowcase,
  initSequenceDetailMolstar,
  initSequenceDetailForna,
  initSequenceDetailSecondaryHeatmap
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
let homeDashboardFilters = {
  years: [],
  categories: []
};

function subNav() {
  return `<div class="hero-subnav">
    <div class="hero-subnav-inner">
      <button
        class="subnav-menu-toggle"
        id="subnav-menu-toggle"
        type="button"
        aria-label="Toggle navigation menu"
        aria-expanded="${isSubnavMenuOpen ? 'true' : 'false'}"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    <nav class="${isSubnavMenuOpen ? 'open' : ''}">
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
          <span class="dropdown-caret" aria-hidden="true"></span>
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
    </div>
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

function renderColoredSequence(sequence) {
  return String(sequence ?? '')
    .split('')
    .map((char) => {
      const upper = char.toUpperCase();
      if (!'AUGCT'.includes(upper)) return char;
      const cls = upper === 'T' ? 'nucleotide-u' : `nucleotide-${upper.toLowerCase()}`;
      const display = upper === 'T' ? 'U' : char;
      return `<span class="sequence-nucleotide ${cls}">${display}</span>`;
    })
    .join('');
}

function renderSequenceDetailTimeline() {
  const items = ['2004', '2009', '2013']
    .map((year) => `<article class="sequence-detail-timeline-item">
      <time>${year}</time>
      <div class="sequence-detail-timeline-card">
        <p>xxx</p>
      </div>
    </article>`)
    .join('');

  return `<section class="sequence-detail-panel sequence-detail-timeline-panel">
    <h2>Timeline</h2>
    <div class="sequence-detail-timeline">
      ${items}
    </div>
  </section>`;
}

function renderSequenceDetailFornaPanel(row, structureText) {
  return `<section class="sequence-secondary-card sequence-secondary-forna-card">
    <div class="sequence-secondary-card-header">
      <h3>Forna Secondary Structure</h3>
      <span id="sequence-detail-forna-status" class="mini-note">Loading Forna viewer…</span>
    </div>
    <div class="sequence-detail-forna-frame">
      <div
        id="sequence-detail-forna"
        class="sequence-detail-forna-host"
        data-sequence="${row.type ?? ''}"
        data-structure="${structureText ?? ''}"
        aria-label="Forna secondary structure viewer"
      ></div>
    </div>
  </section>`;
}

function renderSequenceDetailSecondaryContent(row) {
  if (row.pdbName === '8QO5') {
    return `<div class="sequence-secondary-layout">
      <div class="sequence-secondary-top">
        <div class="sequence-secondary-block">
          <span class="sequence-secondary-label">Sequence</span>
          <code class="sequence-secondary-code">${row.type ?? ''}</code>
        </div>
        <div class="sequence-secondary-block">
          <span class="sequence-secondary-label">Structure</span>
          <code class="sequence-secondary-code">${row.structureText ?? ''}</code>
        </div>
      </div>

      <section class="sequence-secondary-card sequence-secondary-figure-card">
        <div class="sequence-secondary-card-header">
          <h3>Secondary Structure Diagram</h3>
          <span class="mini-note">Annotated structure for the conserved SL5 region.</span>
        </div>
        <img
          class="sequence-secondary-image"
          src="./src/assets/references/8QO5-secondary-structure.png"
          alt="Secondary structure diagram for SARS-CoV-2-SL5"
        />
      </section>

      ${renderSequenceDetailFornaPanel(row, row.structureText ?? '')}
    </div>`;
  }

  if (row.pdbName !== '5KPY' && row.pdbName !== '1AM0' && row.pdbName !== '4L81' && row.pdbName !== '5TPY') {
    return `<div class="sequence-detail-placeholder">
      <p>Secondary structure content will be added here.</p>
    </div>`;
  }

  const is5kpy = row.pdbName === '5KPY';
  const is1am0 = row.pdbName === '1AM0';
  const is4l81 = row.pdbName === '4L81';
  const structureText = is5kpy
    ? '.......................................................................'
    : is1am0
      ? '((((((...........((((((....)))))).))))))'
      : is4l81
        ? '................................................................................................'
        : '....(((((((((....)))).(((((((.[[[[..)))))))..)))))...]]]](((((....)))))';
  const heatmapTitle = is5kpy ? 'Mutate-and-map Heatmap' : is1am0 ? 'ATP Titration Reactivity Map' : 'Mutate-and-map Heatmap';
  const rdatUrl = is5kpy
    ? './src/assets/data/RNAPZ9_1M7_0001.rdat'
    : is1am0
      ? './src/assets/data/ATPCON_TITR_0001.rdat'
      : is4l81
        ? './src/assets/data/RNAPZ8_1M7_0001.rdat'
        : './src/assets/data/RNAPZ18_1M7_0000.rdat';
  const summaryMarkup = is5kpy
    ? `<div><dt>Dataset</dt><dd>RNA Puzzle 9</dd></div>
          <div><dt>Modifier</dt><dd>SHAPE</dd></div>
          <div><dt>Ligand</dt><dd>5-hydroxytryptophan (8.5 mM)</dd></div>
          <div><dt>Buffer</dt><dd>50 mM Na-HEPES, pH 8.0</dd></div>
          <div><dt>MgCl2</dt><dd>10 mM</dd></div>
          <div><dt>Temperature</dt><dd>24 C</dd></div>`
    : is1am0
      ? `<div><dt>Dataset</dt><dd>control point ATP titration</dd></div>
          <div><dt>Assay</dt><dd>StandardState</dd></div>
          <div><dt>Ligand</dt><dd>ATP titration (0-5000 uM)</dd></div>
          <div><dt>Buffer</dt><dd>50 mM Na-HEPES, pH 8.0</dd></div>
          <div><dt>Temperature</dt><dd>24 C</dd></div>
          <div><dt>Processing</dt><dd>background subtraction, overmodification correction</dd></div>`
      : is4l81
        ? `<div><dt>Dataset</dt><dd>RNA Puzzle 8</dd></div>
          <div><dt>Modifier</dt><dd>SHAPE</dd></div>
          <div><dt>Ligand</dt><dd>S-adenosylmethionine (8.8 mM)</dd></div>
          <div><dt>Buffer</dt><dd>50 mM Na-HEPES, pH 8.0</dd></div>
          <div><dt>MgCl2</dt><dd>10 mM</dd></div>
          <div><dt>Temperature</dt><dd>24 C</dd></div>`
        : `<div><dt>Dataset</dt><dd>RNA Puzzle 18</dd></div>
          <div><dt>Experiment Type</dt><dd>Mutate and Map</dd></div>
          <div><dt>Modifier</dt><dd>1M7</dd></div>
          <div><dt>Buffer</dt><dd>50 mM Na-HEPES, pH 8.0</dd></div>
          <div><dt>MgCl2</dt><dd>10 mM</dd></div>
          <div><dt>Temperature</dt><dd>24 C</dd></div>
          <div><dt>Processing</dt><dd>background subtraction, overmodification correction, normalization GAGUA</dd></div>`;
  const filesMarkup = is5kpy
    ? `<a class="sequence-secondary-link" href="./src/assets/data/RNAPZ9_1M7_0001.rdat" download>Download RDAT</a>`
    : is1am0
      ? `<a class="sequence-secondary-link" href="./src/assets/data/ATPCON_TITR_0001.rdat" download>Download RDAT</a>
       <a class="sequence-secondary-link" href="./src/assets/data/ATPCON_TITR_0001_2.xls" download>Download XLS</a>`
      : is4l81
        ? `<a class="sequence-secondary-link" href="./src/assets/data/RNAPZ8_1M7_0001.rdat" download>Download RDAT</a>
       <a class="sequence-secondary-link" href="./src/assets/data/RNAPZ8_1M7_0001_2.xls" download>Download XLS</a>`
        : `<a class="sequence-secondary-link" href="./src/assets/data/RNAPZ18_1M7_0000.rdat" download>Download RDAT</a>
       <a class="sequence-secondary-link" href="./src/assets/data/RNAPZ18_1M7_0000_1.xls" download>Download XLS</a>`;
  const footnoteText = is5kpy
    ? 'The local RDAT file is included in this project for future heatmap or reactivity visualization work.'
    : is1am0
      ? 'The local RDAT and XLS files are included in this project as source data for the ATP-responsive aptamer record.'
      : is4l81
        ? 'The local RDAT and XLS files are included in this project as source data for the SAM-responsive aptamer record.'
        : 'The local RDAT and XLS files are included in this project as source data for the RNA Puzzle 18 record.';

  return `<div class="sequence-secondary-layout">
    <div class="sequence-secondary-top">
      <div class="sequence-secondary-block">
        <span class="sequence-secondary-label">Sequence</span>
        <code class="sequence-secondary-code">${row.type ?? ''}</code>
      </div>
      <div class="sequence-secondary-block">
        <span class="sequence-secondary-label">Structure</span>
        <code class="sequence-secondary-code">${structureText}</code>
      </div>
    </div>

    <div class="sequence-secondary-bottom">
      <div class="sequence-secondary-main">
      <section class="sequence-secondary-card sequence-secondary-heatmap-card">
        <div class="sequence-secondary-card-header">
          <h3>${heatmapTitle}</h3>
          <span id="sequence-secondary-heatmap-status" class="mini-note">Loading heatmap…</span>
        </div>
        <div
          id="sequence-secondary-heatmap"
          class="sequence-secondary-heatmap-host"
          data-rdat-url="${rdatUrl}"
        ></div>
      </section>

      ${renderSequenceDetailFornaPanel(row, structureText)}
      </div>

      <aside class="sequence-secondary-side">
      <div class="sequence-secondary-card">
        <h3>Experiment Summary</h3>
        <dl class="sequence-secondary-meta">
          ${summaryMarkup}
        </dl>
      </div>

      <div class="sequence-secondary-card">
        <h3>Files</h3>
        <div class="sequence-secondary-actions">
          ${filesMarkup}
        </div>
        <p class="sequence-secondary-footnote">${footnoteText}</p>
      </div>
      </aside>
    </div>
  </div>`;
}

function renderSequenceDetailTertiaryContent(row) {
  if (!row.structureFile) {
    return `<div class="sequence-detail-placeholder">
      <p>Tertiary structure content will be added here.</p>
    </div>`;
  }

  return `<div class="sequence-detail-media">
    <div id="sequence-detail-molstar-status" class="mini-note">Loading interactive 3D structure…</div>
    <div
      id="sequence-detail-molstar"
      class="sequence-detail-viewer"
      data-structure-url="./${row.structureFile}"
      data-structure-format="cif"
      data-structure-label="${row.pdbName ?? 'local structure'}"
    ></div>
  </div>`;
}

function getHomeSecondaryStructureMarkup(row) {
  const structureMap = {
    '8QO5': {
      image: './src/assets/references/8QO5-secondary-structure.png',
      alt: 'Secondary structure diagram for SARS-CoV-2-SL5',
      structure: row.structureText || '. . . . . . ( ( ( ( ( . ( ( ( ( ( . . . . ) ) ) ) ) . . ) ) ) ) ) . . . . . .'
    },
    '5KPY': {
      image: './src/assets/references/5KPY-secondary-heatmap.png',
      alt: 'Reference secondary map for 5-hydroxytryptophan RNA aptamer',
      structure: '.......................................................................'
    },
    '1AM0': {
      structure: '((((((...........((((((....)))))).))))))'
    },
    '4L81': {
      structure: '................................................................................................'
    },
    '5TPY': {
      structure: '....(((((((((....)))).(((((((.[[[[..)))))))..)))))...]]]](((((....)))))'
    }
  };

  const entry = structureMap[row.pdbName] || {};
  const structure = entry.structure || row.structureText || 'Secondary structure preview will be added here.';

  return `
    <div class="home-secondary-panel">
      <div class="home-secondary-header">
        <h3>Secondary Structure</h3>
        <span class="mini-note">${row.pdbName || 'N/A'}</span>
      </div>
      ${entry.image ? `
        <div class="home-secondary-figure-wrap">
          <img class="home-secondary-image" src="${entry.image}" alt="${entry.alt || 'Secondary structure preview'}" />
        </div>
      ` : `
        <div class="home-secondary-code-wrap">
          <span class="home-secondary-label">Dot-bracket preview</span>
          <code class="home-secondary-code">${structure}</code>
        </div>
      `}
      <div class="home-secondary-sequence">
        <span class="home-secondary-label">Sequence</span>
        <code class="home-secondary-code">${row.type ?? ''}</code>
      </div>
    </div>
  `;
}

function renderSequenceDetailReferenceContent(row) {
  if (row.pdbName === '8QO5') {
    return `<div class="sequence-detail-reference-card">
      <div class="sequence-detail-reference-list">
        <article class="sequence-detail-reference-item">
          <h3>[1] Conserved structures and dynamics in 5'-proximal regions of Betacoronavirus RNA genomes.</h3>
          <p class="sequence-detail-reference-authors">de Moura, T.R., Purta, E., Bernat, A., Martin-Cuevas, E.M., Kurkowska, M., Baulin, E.F., Mukherjee, S., Nowak, J., Biela, A.P., Rawski, M., Glatt, S., Moreno-Herrero, F., Bujnicki, J.M. (2024)</p>
          <p class="sequence-detail-reference-source">Nucleic Acids Research 52:3419-3432</p>
          <div class="sequence-detail-reference-links">
            <a class="sequence-detail-reference-link" href="https://pubmed.ncbi.nlm.nih.gov/38426934/" target="_blank" rel="noopener noreferrer">PubMed: 38426934</a>
            <a class="sequence-detail-reference-link" href="https://doi.org/10.1093/nar/gkae144" target="_blank" rel="noopener noreferrer">DOI: 10.1093/nar/gkae144</a>
          </div>
        </article>
      </div>
    </div>`;
  }

  if (row.pdbName === '5KPY') {
    return `<div class="sequence-detail-reference-card">
      <div class="sequence-detail-reference-list">
        <article class="sequence-detail-reference-item">
          <h3>[1] RNA-Puzzles Round IV: 3D structure predictions of four ribozymes and two aptamers.</h3>
          <p class="sequence-detail-reference-authors">Miao Z, Adamiak RW, Antczak M, Boniecki MJ, Bujnicki J, Chen SJ, Cheng CY, Cheng Y, Chou FC, Das R, Dokholyan NV, Ding F, Geniesse C, Jiang Y, Joshi A, Krokhotin A, Magnus M, Mailhot O, Major F, Mann TH, Piatkowski P, Pluta R, Popenda M, Sarzynska J, Sun L, Szachniuk M, Tian S, Wang J, Wang J, Watkins AM, Wiedemann J, Xiao Y, Xu X, Yesselman JD, Zhang D, Zhang Y, Zhang Z, Zhao C, Zhao P, Zhou Y, Zok T, Zyla A, Ren A, Batey RT, Golden BL, Huang L, Lilley DM, Liu Y, Patel DJ, Westhof E. (2020)</p>
          <p class="sequence-detail-reference-source">RNA (New York, N.Y.) 26(8):982-995</p>
          <div class="sequence-detail-reference-links">
            <a class="sequence-detail-reference-link" href="https://pubmed.ncbi.nlm.nih.gov/32371455/" target="_blank" rel="noopener noreferrer">PMID: 32371455</a>
            <a class="sequence-detail-reference-link" href="https://doi.org/10.1261/rna.075341.120" target="_blank" rel="noopener noreferrer">DOI: 10.1261/rna.075341.120</a>
          </div>
        </article>

        <article class="sequence-detail-reference-item">
          <h3>[2] Recurrent RNA motifs as scaffolds for genetically encodable small-molecule biosensors.</h3>
          <p class="sequence-detail-reference-authors">Porter, E.B., Polaski, J.T., Morck, M.M., Batey, R.T. (2017)</p>
          <p class="sequence-detail-reference-source">Nature Chemical Biology 13:295-301</p>
          <div class="sequence-detail-reference-links">
            <a class="sequence-detail-reference-link" href="https://pubmed.ncbi.nlm.nih.gov/28092358/" target="_blank" rel="noopener noreferrer">PubMed: 28092358</a>
            <a class="sequence-detail-reference-link" href="https://doi.org/10.1038/nchembio.2278" target="_blank" rel="noopener noreferrer">DOI: 10.1038/nchembio.2278</a>
          </div>
        </article>
      </div>
    </div>`;
  }

  if (row.pdbName === '1AM0') {
    return `<div class="sequence-detail-reference-card">
      <div class="sequence-detail-reference-list">
        <article class="sequence-detail-reference-item">
          <h3>[1] Computational design of three-dimensional RNA structure and function.</h3>
          <p class="sequence-detail-reference-authors">Yesselman JD, Eiler D, Carlson ED, Gotrik MR, d'Aquino AE, Ooms AN, Kladwang W, Carlson PD, Shi X, Costantino DA, Herschlag D, Lucks JB, Jewett MC, Kieft JS, Das R. (2019)</p>
          <p class="sequence-detail-reference-source">Nature Nanotechnology 14(9):866-873</p>
          <div class="sequence-detail-reference-links">
            <a class="sequence-detail-reference-link" href="https://pubmed.ncbi.nlm.nih.gov/31427748/" target="_blank" rel="noopener noreferrer">PMID: 31427748</a>
            <a class="sequence-detail-reference-link" href="https://doi.org/10.1038/s41565-019-0517-8" target="_blank" rel="noopener noreferrer">DOI: 10.1038/s41565-019-0517-8</a>
          </div>
        </article>

        <article class="sequence-detail-reference-item">
          <h3>[2] Structural Basis of RNA Folding and Recognition in an AMP-RNA Aptamer Complex.</h3>
          <p class="sequence-detail-reference-authors">Jiang, F., Kumar, R.A., Jones, R.A., Patel, D.J. (1996)</p>
          <p class="sequence-detail-reference-source">Nature 382:183-186</p>
          <div class="sequence-detail-reference-links">
            <a class="sequence-detail-reference-link" href="https://pubmed.ncbi.nlm.nih.gov/8700212/" target="_blank" rel="noopener noreferrer">PubMed: 8700212</a>
            <a class="sequence-detail-reference-link" href="https://doi.org/10.1038/382183a0" target="_blank" rel="noopener noreferrer">DOI: 10.1038/382183a0</a>
          </div>
        </article>
      </div>
    </div>`;
  }

  if (row.pdbName === '4L81') {
    return `<div class="sequence-detail-reference-card">
      <div class="sequence-detail-reference-list">
        <article class="sequence-detail-reference-item">
          <h3>[1] RNA-Puzzles Round III: 3D RNA structure prediction of five riboswitches and one ribozyme.</h3>
          <p class="sequence-detail-reference-authors">Miao Z, Adamiak RW, Antczak M, Batey RT, Becka AJ, Biesiada M, Boniecki MJ, Bujnicki JM, Chen SJ, Cheng CY, Chou FC, Ferre-D'Amare AR, Das R, Dawson WK, Ding F, Dokholyan NV, Dunin-Horkawicz S, Geniesse C, Kappel K, Kladwang W, Krokhotin A, Lach GE, Major F, Mann TH, Magnus M, Pachulska-Wieczorek K, Patel DJ, Piccirilli JA, Popenda M, Purzycka KJ, Ren A, Rice GM, Santalucia J Jr, Sarzynska J, Szachniuk M, Tandon A, Trausch JJ, Tian S, Wang J, Weeks KM, Williams B 2nd, Xiao Y, Xu X, Zhang D, Zok T, Westhof E. (2017)</p>
          <p class="sequence-detail-reference-source">RNA (New York, N.Y.) 23(5):655-672</p>
          <div class="sequence-detail-reference-links">
            <a class="sequence-detail-reference-link" href="https://pubmed.ncbi.nlm.nih.gov/28138060/" target="_blank" rel="noopener noreferrer">PMID: 28138060</a>
            <a class="sequence-detail-reference-link" href="https://doi.org/10.1261/rna.060368.116" target="_blank" rel="noopener noreferrer">DOI: 10.1261/rna.060368.116</a>
          </div>
        </article>

        <article class="sequence-detail-reference-item">
          <h3>[2] Structural basis for diversity in the SAM clan of riboswitches.</h3>
          <p class="sequence-detail-reference-authors">Trausch, J.J., Xu, Z., Edwards, A.L., Reyes, F.E., Ross, P.E., Knight, R., Batey, R.T. (2014)</p>
          <p class="sequence-detail-reference-source">Proceedings of the National Academy of Sciences of the United States of America 111:6624-6629</p>
          <div class="sequence-detail-reference-links">
            <a class="sequence-detail-reference-link" href="https://pubmed.ncbi.nlm.nih.gov/24753586/" target="_blank" rel="noopener noreferrer">PubMed: 24753586</a>
            <a class="sequence-detail-reference-link" href="https://doi.org/10.1073/pnas.1312918111" target="_blank" rel="noopener noreferrer">DOI: 10.1073/pnas.1312918111</a>
          </div>
        </article>
      </div>
    </div>`;
  }

  if (row.pdbName === '5TPY') {
    return `<div class="sequence-detail-reference-card">
      <div class="sequence-detail-reference-list">
        <article class="sequence-detail-reference-item">
          <h3>[1] Zika virus produces noncoding RNAs using a multi-pseudoknot structure that confounds a cellular exonuclease.</h3>
          <p class="sequence-detail-reference-authors">Akiyama, B.M., Laurence, H.M., Massey, A.R., Costantino, D.A., Xie, X., Yang, Y., Shi, P.Y., Nix, J.C., Beckham, J.D., Kieft, J.S. (2016)</p>
          <p class="sequence-detail-reference-source">Science 354:1148-1152</p>
          <div class="sequence-detail-reference-links">
            <a class="sequence-detail-reference-link" href="https://pubmed.ncbi.nlm.nih.gov/27934765/" target="_blank" rel="noopener noreferrer">PubMed: 27934765</a>
            <a class="sequence-detail-reference-link" href="https://doi.org/10.1126/science.aah3963" target="_blank" rel="noopener noreferrer">DOI: 10.1126/science.aah3963</a>
          </div>
        </article>
      </div>
    </div>`;
  }

  return `<div class="sequence-detail-reference-card">
    <p>This tertiary structure is based on the PDB entry <strong>${row.pdbName ?? ''}</strong>.</p>
    <div class="sequence-detail-reference-links">
      <a class="sequence-detail-reference-link" href="https://www.rcsb.org/structure/${encodeURIComponent(row.pdbName ?? '')}" target="_blank" rel="noopener noreferrer">Open PDB Entry</a>
    </div>
  </div>`;
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
    <section class="sequence-detail-card">
      <div class="sequence-detail-header">
        <a class="sequence-detail-back" href="#download-sequences">Back to sequence list</a>
        <div class="sequence-detail-title-row">
          <div>
            <p class="sequence-detail-kicker">${row.category ?? 'RNA'} record</p>
            <h1>${row.sequenceName ?? ''}</h1>
            <p>${row.aptamerName ?? ''}</p>
          </div>
          <dl class="sequence-detail-meta">
            <div><dt>PDB</dt><dd>${row.pdbName ?? 'N/A'}</dd></div>
            <div><dt>Year</dt><dd>${row.article ?? 'N/A'}</dd></div>
            <div><dt>Coverage</dt><dd>${row.sequence ?? 'N/A'}</dd></div>
            <div><dt>Confidence</dt><dd>${row.confidence ?? 'N/A'}</dd></div>
          </dl>
        </div>
      </div>

      ${renderSequenceDetailTimeline()}

      <section class="sequence-detail-panel">
        <h2>Description</h2>
        <div class="sequence-detail-placeholder">
          <p>${row.aptamerName ?? 'Description content will be added here.'}</p>
        </div>
      </section>

      <section class="sequence-detail-panel">
        <h2>Primary Sequence</h2>
        <div class="sequence-secondary-block">
          <code class="sequence-secondary-code sequence-primary-code">${renderColoredSequence(row.type ?? '')}</code>
        </div>
      </section>

      <section class="sequence-detail-panel">
        <h2>Secondary Structure</h2>
        ${renderSequenceDetailSecondaryContent(row)}
      </section>

      <section class="sequence-detail-panel">
        <h2>Tertiary Structure</h2>
        ${renderSequenceDetailTertiaryContent(row)}
      </section>

      <section class="sequence-detail-panel">
        <h2>Reference</h2>
        ${renderSequenceDetailReferenceContent(row)}
      </section>
    </section>
  </main>`;
}



async function loadSequenceRows() {
  sequenceRows = [
    {
      id: '8QO5-SARS-COV-2-SL5',
      pdbName: '8QO5',
      sequenceName: 'SARS-CoV-2-SL5',
      aptamerName: "Conserved Structures and Dynamics in 5'-Proximal Regions of Betacoronavirus RNA Genomes",
      category: 'Virus',
      type: 'AUUAAAGGUUUAUACCUUCCCAGGUAACAAACCAACCAACUUUCGAUCUCUUGUAGAUCUGUUCUCUAAACGAACUUUAAAAUCUGUGUGGCUGUCACUCGGCUGCAUGCUUAGUGCACUCACGCAGUAUAAUUAAUAACUAAUUACUGUCGUUGACAGGACACGAGUAACUCGUCUAUCUUCUGCAGGCUGCUUACGGUUUCGUCCGUGUUGCAGCCGAUCAUCAGCACAUCUAGGUUUCGUCCGGGUGUGACCGAAAGGUAAGAUGGAGAGCCUUGUCCCUGGUUUCAACGAGAAAAC',
      chemicalProbing: 'XX',
      article: '2024',
      sequence: '100%',
      confidence: 'high',
      structureFile: 'src/assets/structures/8QO5-assembly1.cif',
      structureText: '. . . . . . ( ( ( ( ( . ( ( ( ( ( . . . . ) ) ) ) ) . . ) ) ) ) ) . . . . . . . . . . . ( ( ( ( ( . . . . . ) ) ) ) ) . ( ( ( ( . . . . . . . ) ) ) ) . . . . . . . . ( ( ( ( ( ( ( ( . ( ( . ( ( ( ( . ( ( ( . . . . . ) ) ) . ) ) ) ) ) ) . ) ) ) ) ) ) ) ) . . ( ( ( ( ( ( . . . . . ) ) ) ) ) ) . . . ( ( ( ( ( ( ( ( ( ( ( . . ( ( ( ( ( . . . ( ( ( . ( ( ( ( ( ( ( ( ( ( ( . . ( ( ( ( ( ( . ( ( ( ( ( . . . . . . ) ) ) ) ) . . ) ) ) ) ) ) . . . . . . ) ) ) ( ( ( ( ( ( ( . ( ( . . . . . . ) ) ) ) ) ) ) ) ) ( ( ( . . . . ) ) ) ) ) ) ) ) ) ) ) ) ) ) . ) ) ) ) ) . ) ) ) ) . . . ) ) ) ) ) ) ) . . . . . .',
    },
    {
      id: '5KPY-5-HTP-RNA-APTAMER',
      pdbName: '5KPY',
      sequenceName: '5-hydroxytryptophan RNA aptamer',
      aptamerName: 'Structure of a 5-hydroxytryptophan aptamer',
      category: 'RNA',
      type: 'GGACACUGAUGAUCGCGUGGAUAUGGCACGCAUUGAAUUGUUGGACACCGUAAAUGUCCUAACACGUGUCC',
      chemicalProbing: 'XX',
      article: '2017',
      sequence: '100%',
      confidence: 'high',
      structureFile: 'src/assets/structures/5KPY-assembly1.cif'
    },
    {
      id: '1AM0-RNA-APTAMER',
      pdbName: '1AM0',
      sequenceName: 'RNA APTAMER',
      aptamerName: 'AMP RNA APTAMER COMPLEX, NMR, 8 STRUCTURES',
      category: 'RNA',
      type: 'GGGUUGGGAAGAAACUGUGGCACUUCGGUGCCAGCAACCC',
      chemicalProbing: 'XX',
      article: '1997',
      sequence: '100%',
      confidence: 'high',
      structureFile: 'src/assets/structures/1AM0-assembly1.cif'
    },
    {
      id: '4L81-SAM-I-IV-VARIANT-RIBOSWITCH-APTAMER-DOMAIN',
      pdbName: '4L81',
      sequenceName: 'SAM-I/IV variant riboswitch aptamer domain',
      aptamerName: 'Structure of the SAM-I/IV riboswitch (env87(deltaU92, deltaG93))',
      category: 'RNA',
      type: 'GGAUCACGAGGGGGAGACCCCGGCAACCUGGGACGGACACCCAAGGUGCUCACACCGGAGACGGUGGAUCCGGCCCGAGAGGGCAACGAAGUCCGU',
      chemicalProbing: 'XX',
      article: '2014',
      sequence: '100%',
      confidence: 'high',
      structureFile: 'src/assets/structures/4L81-assembly1.cif'
    },
    {
      id: '5TPY-RNA-71-MER',
      pdbName: '5TPY',
      sequenceName: 'RNA (71-MER)',
      aptamerName: 'Crystal structure of an exonuclease resistant RNA from Zika virus',
      category: 'RNA',
      type: 'GGGUCAGGCCGGCGAAAGUCGCCACAGUUUGGGGAAAGCUGUGCAGCCUGUAACCCCCCCACGAAAGUGGG',
      chemicalProbing: 'XX',
      article: '2016',
      sequence: '100%',
      confidence: 'high',
      structureFile: 'src/assets/structures/5TPY-assembly1.cif'
    }
  ].map((row) => ({
    ...row,
    detailPage: `#sequence-detail?sequenceId=${encodeURIComponent(row.id)}`
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
      <td><a href="#sequence-detail?sequenceId=${encodeURIComponent(row.id ?? '')}" class="sequence-link">${row.sequenceName ?? ''}</a></td>
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
            <th>Description(PDB)</th>
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
let isSubnavMenuOpen = false;

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

function buildHomeDashboardData() {
  const rows = sequenceRows;
  const yearCounts = new Map();
  const categoryCounts = new Map();

  rows.forEach((row) => {
    const year = String(row.article ?? '');
    const category = String(row.category ?? 'Unknown');
    yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  });

  const yearEntries = [...yearCounts.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
  const years = rows.map((row) => Number(row.article)).filter((value) => Number.isFinite(value));
  const minYear = years.length ? Math.min(...years) : null;
  const maxYear = years.length ? Math.max(...years) : null;
  const denseYearEntries = minYear !== null && maxYear !== null
    ? Array.from({ length: maxYear - minYear + 1 }, (_, offset) => {
        const year = String(minYear + offset);
        return [year, yearCounts.get(year) || 0];
      })
    : yearEntries;
  const displayYearEntries = denseYearEntries.filter(([year, count], index, entries) => {
    const numericYear = Number(year);
    const isBoundary = index === 0 || index === entries.length - 1;
    const isFiveYearTick = numericYear % 5 === 0;
    const hasData = count > 0;
    return isBoundary || isFiveYearTick || hasData;
  });
  const categoryEntries = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]);
  const totalSequenceLength = rows.reduce((sum, row) => sum + String(row.type ?? '').length, 0);
  const avgLength = rows.length ? Math.round(totalSequenceLength / rows.length) : 0;
  const yearValues = displayYearEntries.map(([, count]) => count);
  const maxYearCount = Math.max(...yearValues, 1);
  const donutPalette = ['#8FC8BE', '#E8BF8B', '#B9C8EC', '#DDBEE9', '#BFD8A5', '#E7B4AA', '#C7B9E8'];
  const barPalette = ['#E9A693', '#B8D9EE', '#C7E8D2', '#E8D6B0', '#D0BCEB', '#B9E2DB', '#EAB8CF', '#CFE3AE', '#B8C8EF', '#E6C39A', '#B9E7EA', '#DDB8B8'];
  const highConfidenceCount = rows.filter((row) => String(row.confidence).toLowerCase() === 'high').length;

  return {
    rows,
    yearEntries,
    displayYearEntries,
    categoryEntries,
    maxYearCount,
    avgLength,
    minYear: minYear ?? '—',
    maxYear: maxYear ?? '—',
    highConfidenceCount,
    barPalette,
    donutPalette
  };
}

function getFilteredHomeDashboardRows(rows) {
  return rows.filter((row) => {
    const matchesYear = homeDashboardFilters.years.length
      ? homeDashboardFilters.years.includes(String(row.article ?? ''))
      : true;
    const matchesCategory = homeDashboardFilters.categories.length
      ? homeDashboardFilters.categories.includes(String(row.category ?? ''))
      : true;
    return matchesYear && matchesCategory;
  });
}

function filterRowsByDashboardFilters(rows, filters = homeDashboardFilters) {
  return rows.filter((row) => {
    const matchesYear = filters.years?.length ? filters.years.includes(String(row.article ?? '')) : true;
    const matchesCategory = filters.categories?.length ? filters.categories.includes(String(row.category ?? '')) : true;
    return matchesYear && matchesCategory;
  });
}

function summarizeRowsByYear(rows, availableYears) {
  const counts = new Map();
  rows.forEach((row) => {
    const year = String(row.article ?? '');
    counts.set(year, (counts.get(year) || 0) + 1);
  });
  return availableYears.map(([year]) => [year, counts.get(String(year)) || 0]);
}

function summarizeRowsByCategory(rows, availableCategories) {
  const counts = new Map();
  rows.forEach((row) => {
    const category = String(row.category ?? '');
    counts.set(category, (counts.get(category) || 0) + 1);
  });
  return availableCategories.map(([category]) => [category, counts.get(String(category)) || 0]);
}

function createDonutSegments(entries, palette) {
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  if (!total) return [];
  let startAngle = 0;
  return entries.map(([label, count], index) => {
    const angle = (count / total) * 360;
    const endAngle = startAngle + angle;
    const segment = {
      label,
      count,
      color: palette[index % palette.length],
      startAngle,
      endAngle
    };
    startAngle = endAngle;
    return segment;
  });
}

function describeDonutArc(cx, cy, outerRadius, innerRadius, startAngle, endAngle) {
  const polarToCartesian = (radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angleInRadians),
      y: cy + radius * Math.sin(angleInRadians)
    };
  };

  const startOuter = polarToCartesian(outerRadius, endAngle);
  const endOuter = polarToCartesian(outerRadius, startAngle);
  const startInner = polarToCartesian(innerRadius, startAngle);
  const endInner = polarToCartesian(innerRadius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
    'Z'
  ].join(' ');
}

function homePage() {
  const dashboard = buildHomeDashboardData();
  const filteredRows = getFilteredHomeDashboardRows(dashboard.rows);
  const rowsForYearChart = filterRowsByDashboardFilters(dashboard.rows, {
    years: [],
    categories: homeDashboardFilters.categories
  });
  const rowsForCategoryChart = filterRowsByDashboardFilters(dashboard.rows, {
    years: homeDashboardFilters.years,
    categories: []
  });
  const yearChartEntries = summarizeRowsByYear(rowsForYearChart, dashboard.displayYearEntries);
  const categoryChartEntries = summarizeRowsByCategory(rowsForCategoryChart, dashboard.categoryEntries);
  const yearMaxCount = Math.max(...yearChartEntries.map(([, count]) => count), 1);
  const donutSegments = createDonutSegments(categoryChartEntries, dashboard.donutPalette);
  const yearColorMap = Object.fromEntries(
    dashboard.displayYearEntries.map(([year], index) => [String(year), dashboard.barPalette[index % dashboard.barPalette.length]])
  );
  const categoryColorMap = Object.fromEntries(
    dashboard.categoryEntries.map(([category], index) => [String(category), dashboard.donutPalette[index % dashboard.donutPalette.length]])
  );
  const heroTitle = 'Welcome to RNA Mapping Database';
  const heroSubtitle = '— XXX placeholder text for a future one-sentence database introduction';
  const renderAnimatedText = (text, baseDelay = 0) =>
    Array.from(text)
      .map((char, index) => {
        const display = char === ' ' ? '&nbsp;' : char;
        return `<span class="intro-letter" style="--char-index:${baseDelay + index};">${display}</span>`;
      })
      .join('');

  return `<main class="page-home">
    ${renderGlobalSearch()}
    ${subNav()}

    <section class="card dashboard-home">
      <section class="database-intro-panel" aria-labelledby="database-intro-title">
        <div class="database-intro-stage">
          <div class="database-intro-orbit orbit-a"></div>
          <div class="database-intro-orbit orbit-b"></div>
          <div class="database-intro-orbit orbit-c"></div>
          <div class="database-intro-node node-a"></div>
          <div class="database-intro-node node-b"></div>
          <div class="database-intro-node node-c"></div>
          <div class="database-intro-copy">
            <h2 id="database-intro-title" class="database-intro-title" aria-label="${heroTitle}">
              <span class="intro-line" aria-hidden="true">${renderAnimatedText(heroTitle, 0)}</span>
            </h2>
            <p class="database-intro-subtitle" aria-label="${heroSubtitle}">
              <span class="intro-line intro-line-subtitle" aria-hidden="true">${renderAnimatedText(heroSubtitle, heroTitle.length + 4)}</span>
            </p>
          </div>
        </div>
      </section>

      <div class="dashboard-section-heading">
        <div>
          <h1>Data Overview</h1>
        </div>
      </div>

      <div class="dashboard-home-panels">
        <article class="dashboard-panel">
          <div class="dashboard-panel-header">
            <h2>Year Distribution</h2>
            <span class="dashboard-panel-note">Based on current sequence records</span>
          </div>
          <div class="dashboard-year-chart">
            <div class="dashboard-year-plot">
            ${yearChartEntries.map(([year, count], index) => {
              const isActive = homeDashboardFilters.years.includes(String(year));
              const isEmpty = count === 0;
              return `
              <button
                type="button"
                class="dashboard-year-bar-wrap ${isActive ? 'active' : ''} ${isEmpty ? 'is-empty' : ''}"
                style="--year-color:${dashboard.barPalette[index % dashboard.barPalette.length]};"
                ${isEmpty ? 'disabled' : `data-home-filter-kind="year" data-home-filter-value="${year}" aria-pressed="${isActive ? 'true' : 'false'}"`}
              >
                <strong>${count}</strong>
                <span class="dashboard-year-bar-track">
                  <span class="dashboard-year-bar" style="height:${count > 0 ? Math.max((count / yearMaxCount) * 120, 16) : 3}px; background:${dashboard.barPalette[index % dashboard.barPalette.length]};"></span>
                </span>
                <span>${year}</span>
              </button>
            `;
            }).join('')}
            </div>
          </div>
        </article>

        <article class="dashboard-panel">
          <div class="dashboard-panel-header">
            <h2>Category Distribution</h2>
            <span class="dashboard-panel-note">Current sequence categories</span>
          </div>
          <div class="dashboard-category-layout">
            <div class="dashboard-donut-shell">
              <svg class="dashboard-donut" viewBox="0 0 180 180" aria-label="Category distribution chart">
                ${donutSegments.length
                  ? donutSegments.map((segment) => {
                    const isActive = homeDashboardFilters.categories.includes(String(segment.label));
                    const isFullCircle = segment.endAngle - segment.startAngle >= 359.999;
                    return `
                      ${isFullCircle
                        ? `<circle
                            class="dashboard-donut-segment ${isActive ? 'active' : ''}"
                            cx="90"
                            cy="90"
                            r="56"
                            fill="none"
                            stroke="${segment.color}"
                            stroke-width="36"
                            style="--segment-color:${segment.color};"
                            data-home-filter-kind="category"
                            data-home-filter-value="${segment.label}"
                            role="button"
                            tabindex="0"
                            aria-pressed="${isActive ? 'true' : 'false'}"
                          ></circle>`
                        : `<path
                            class="dashboard-donut-segment ${isActive ? 'active' : ''}"
                            d="${describeDonutArc(90, 90, 74, 38, segment.startAngle, segment.endAngle)}"
                            fill="${segment.color}"
                            style="--segment-color:${segment.color};"
                            data-home-filter-kind="category"
                            data-home-filter-value="${segment.label}"
                            role="button"
                            tabindex="0"
                            aria-pressed="${isActive ? 'true' : 'false'}"
                          ></path>`}
                    `;
                  }).join('')
                  : `<circle cx="90" cy="90" r="74" fill="#dfe9e4"></circle>`}
                <circle class="dashboard-donut-hole" cx="90" cy="90" r="34"></circle>
              </svg>
            </div>
            <div class="dashboard-category-list">
              ${categoryChartEntries.map(([category, count], index) => {
                const isActive = homeDashboardFilters.categories.includes(String(category));
                return `
                <button
                  type="button"
                  class="dashboard-category-item ${isActive ? 'active' : ''}"
                  data-home-filter-kind="category"
                  data-home-filter-value="${category}"
                  aria-pressed="${isActive ? 'true' : 'false'}"
                  style="--category-color:${dashboard.donutPalette[index % dashboard.donutPalette.length]};"
                >
                  <span class="dashboard-category-swatch" style="background:${dashboard.donutPalette[index % dashboard.donutPalette.length]}"></span>
                  <span>${category}</span>
                  <strong>${count}</strong>
                </button>
              `;
              }).join('')}
            </div>
          </div>
        </article>
      </div>

      ${(homeDashboardFilters.years.length || homeDashboardFilters.categories.length) ? `
      <section class="dashboard-filter-strip" aria-label="Dashboard filters">
        <div class="dashboard-filter-left">
          <div class="dashboard-filter-info">
            <strong>Data Filtering</strong>
          </div>
          <div class="dashboard-filter-tags">
            ${homeDashboardFilters.years.map((year) => `<button type="button" class="dashboard-filter-tag" style="--filter-color:${yearColorMap[String(year)] || '#7CCFA2'};" data-home-filter-clear="year" data-home-filter-value="${year}"><span class="dashboard-filter-tag-dot"></span>Year: ${year} ×</button>`).join('')}
            ${homeDashboardFilters.categories.map((category) => `<button type="button" class="dashboard-filter-tag" style="--filter-color:${categoryColorMap[String(category)] || '#3E8E7E'};" data-home-filter-clear="category" data-home-filter-value="${category}"><span class="dashboard-filter-tag-dot"></span>Category: ${category} ×</button>`).join('')}
          </div>
        </div>
        <div class="dashboard-filter-actions">
          <button type="button" class="dashboard-filter-export" id="home-dashboard-export">Export Data</button>
          <button type="button" class="dashboard-filter-reset" id="home-dashboard-reset">Reset All</button>
        </div>
      </section>` : ''}

      <article class="dashboard-table-card">
        <div class="dashboard-panel-header">
          <h2>Data Details</h2>
          <span class="dashboard-panel-note">Showing ${filteredRows.length} of ${dashboard.rows.length} records</span>
        </div>
        <div class="download-table-wrap">
          <table class="structure-table download-table dashboard-home-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Name</th>
                <th>PDB ID</th>
                <th>Discovery Year</th>
                <th>Category</th>
                <th>Sequence</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRows.length
                ? filteredRows.map((row, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td><a href="#sequence-detail?sequenceId=${encodeURIComponent(row.id ?? '')}" class="sequence-link">${row.sequenceName ?? ''}</a></td>
                  <td><a href="https://www.rcsb.org/structure/${encodeURIComponent(row.pdbName ?? '')}" class="sequence-link" target="_blank" rel="noopener noreferrer">${row.pdbName ?? ''}</a></td>
                  <td>${row.article ?? ''}</td>
                  <td>${row.category ?? ''}</td>
                  <td><span class="sequence-preview" title="${row.type ?? ''}">${row.type ? `${row.type.slice(0, 18)}...` : ''}</span></td>
                  <td>${row.confidence ?? ''}</td>
                </tr>
              `).join('')
                : `<tr><td colspan="7" class="dashboard-empty-cell">No records match the current filter.</td></tr>`}
            </tbody>
          </table>
        </div>
      </article>

      <div class="dashboard-summary-cards">
        <article class="dashboard-summary-card">
          <span>Visible Records</span>
          <strong>${filteredRows.length}</strong>
        </article>
        <article class="dashboard-summary-card">
          <span>Average Length</span>
          <strong>${dashboard.avgLength} nt</strong>
        </article>
        <article class="dashboard-summary-card">
          <span>Year Range</span>
          <strong>${dashboard.minYear}–${dashboard.maxYear}</strong>
        </article>
        <article class="dashboard-summary-card">
          <span>High Confidence</span>
          <strong>${dashboard.highConfidenceCount}</strong>
        </article>
      </div>

      <article class="dashboard-structure-card">
        <div class="dashboard-panel-header">
          <h2>Structure Gallery</h2>
          <span class="dashboard-panel-note">Secondary and tertiary views of the selected RNA entry</span>
        </div>
        <div class="dashboard-structure-actions">
          ${dashboard.rows
            .filter((row) => row.structureFile)
            .map((row, index) => `
              <button
                type="button"
                class="dashboard-structure-chip ${index === 0 ? 'active' : ''}"
                data-home-structure-url="./${row.structureFile}"
                data-home-structure-label="${row.pdbName ?? ''}"
                data-home-structure-name="${row.sequenceName ?? ''}"
                data-home-structure-sequence="${row.type ?? ''}"
                data-home-structure-structure="${row.structureText ?? ''}"
              >
                ${row.pdbName ?? ''}
              </button>
            `).join('')}
        </div>
        <div id="home-structure-status" class="mini-note">Loading interactive 3D structure…</div>
        <div class="dashboard-structure-meta" id="home-structure-meta">
          <strong>${dashboard.rows.find((row) => row.structureFile)?.sequenceName ?? ''}</strong>
          <span>${dashboard.rows.find((row) => row.structureFile)?.pdbName ?? ''}</span>
        </div>
        <div class="dashboard-structure-split">
          <div
            id="home-secondary-viewer"
            class="dashboard-secondary-viewer"
            data-home-secondary-pdb="${dashboard.rows.find((row) => row.structureFile)?.pdbName ?? ''}"
          >${getHomeSecondaryStructureMarkup(dashboard.rows.find((row) => row.structureFile) ?? {})}</div>
          <div
            id="home-structure-viewer"
            class="dashboard-structure-viewer"
            data-structure-url="./${dashboard.rows.find((row) => row.structureFile)?.structureFile ?? ''}"
            data-structure-format="cif"
            data-structure-label="${dashboard.rows.find((row) => row.structureFile)?.pdbName ?? ''}"
          ></div>
        </div>
      </article>
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
  initHomeStructureShowcase();
  initSequenceDetailMolstar();
  initSequenceDetailForna();
  initSequenceDetailSecondaryHeatmap();
  initAnimatedStats();
  initHomeDashboardFilters();

const downloadToggle = document.getElementById('download-menu-toggle');
const downloadDropdown = document.querySelector('.nav-dropdown');
const subnavMenuToggle = document.getElementById('subnav-menu-toggle');
const subnavNav = document.querySelector('.hero-subnav nav');

if (subnavMenuToggle && subnavNav) {
  subnavMenuToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    isSubnavMenuOpen = !isSubnavMenuOpen;
    render({ preserveScroll: true });
  });

  subnavNav.addEventListener('click', (event) => {
    event.stopPropagation();
  });
}

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
  let shouldRender = false;
  if (isDownloadMenuOpen) {
    isDownloadMenuOpen = false;
    shouldRender = true;
  }
  if (isSubnavMenuOpen) {
    isSubnavMenuOpen = false;
    shouldRender = true;
  }
  if (shouldRender) {
    render({ preserveScroll: true });
  }
});


  document.querySelectorAll('[data-route]').forEach((el) => {
    el.addEventListener('click', () => {
      isDownloadMenuOpen = false;
      isSubnavMenuOpen = false;
      route = normalizeRoute(el.getAttribute('data-route'));
      window.location.hash = route;
    });
  });

  if (preserveScroll) {
    requestAnimationFrame(() => window.scrollTo(previousScrollX, previousScrollY));
  }
}

function initHomeDashboardFilters() {
  const filterButtons = document.querySelectorAll('[data-home-filter-kind]');
  if (!filterButtons.length) return;

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const kind = button.getAttribute('data-home-filter-kind');
      const value = button.getAttribute('data-home-filter-value');
      if (!kind || !value) return;
      const key = kind === 'year' ? 'years' : 'categories';
      const values = new Set(homeDashboardFilters[key]);
      if (values.has(value)) values.delete(value);
      else values.add(value);
      homeDashboardFilters[key] = [...values];
      render({ preserveScroll: true });
    });
  });

  document.querySelectorAll('[data-home-filter-clear]').forEach((button) => {
    button.addEventListener('click', () => {
      const kind = button.getAttribute('data-home-filter-clear');
      const value = button.getAttribute('data-home-filter-value');
      if (!kind || !value) return;
      const key = kind === 'year' ? 'years' : 'categories';
      homeDashboardFilters[key] = homeDashboardFilters[key].filter((item) => item !== value);
      render({ preserveScroll: true });
    });
  });

  const resetButton = document.getElementById('home-dashboard-reset');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      homeDashboardFilters = { years: [], categories: [] };
      render({ preserveScroll: true });
    });
  }

  const exportButton = document.getElementById('home-dashboard-export');
  if (exportButton) {
    exportButton.addEventListener('click', () => {
      const rows = getFilteredHomeDashboardRows(sequenceRows);
      downloadRowsAsCsv(rows, 'home-dashboard-filtered.csv');
    });
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
