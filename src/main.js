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
  initSequenceDetailMolstar,
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

function renderSequenceDetailSecondaryContent(row) {
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

function renderSequenceDetailReferenceContent(row) {
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
        ${renderSequenceDetailSecondaryContent(row)}
      </section>

      <section class="sequence-detail-panel">
        <h2>Tertiary Structure</h2>
        <div class="sequence-detail-rule"></div>
        ${renderSequenceDetailTertiaryContent(row)}
      </section>

      <section class="sequence-detail-panel">
        <h2>Reference</h2>
        <div class="sequence-detail-rule"></div>
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
      aptamerName: 'XX',
      category: 'Virus',
      type: 'UCGUUGACAGGACACGAGUAACUCGUCUAUCUUCUGCAGGCUGCUUACGGUUUCGUCCGUGUUGCAGCCGAUCAUCAGCACAUCUAGGUUUCGUCCGGGUGUGACCGAAAGGUAAGAUGGAGAGCCUUGUCCCUGGUUUCAACGA',
      chemicalProbing: 'XX',
      article: '2024',
      sequence: '100%',
      confidence: 'high'
    },
    {
      id: '5KPY-5-HTP-RNA-APTAMER',
      pdbName: '5KPY',
      sequenceName: '5-hydroxytryptophan RNA aptamer',
      aptamerName: 'XX',
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
      aptamerName: 'XX',
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
      aptamerName: 'XX',
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
      aptamerName: 'XX',
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
  initSequenceDetailSecondaryHeatmap();
  initAnimatedStats();

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

window.addEventListener('hashchange', () => {
  route = routeFromHash(window.location.hash);
  render();
});


async function initApp() {
  await loadSequenceRows();
  render();
}

initApp();
