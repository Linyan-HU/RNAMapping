export const DATA_VERSION = '2026-03-07.example-mvp.v2';
export const DETERMINISTIC_SEED = 20260307;

export const portalMetrics = [
  { label: 'Total records', value: '312,540' },
  { label: 'Data types', value: '8' },
  { label: 'Cells profiled', value: '26.1M' },
  { label: 'Publications', value: '2,318' }
];

export const dataTypeCards = [
  { name: 'scRNA-seq', desc: 'Single-cell transcriptome', count: '9.8M cells' },
  { name: 'snRNA-seq', desc: 'Single-nucleus RNA', count: '6.4M nuclei' },
  { name: 'scATAC-seq', desc: 'Chromatin accessibility', count: '3.2M cells' },
  { name: 'Spatial', desc: 'Spatial transcriptomics', count: '1,840 slides' }
];

export const stageDiseaseCards = [
  { name: 'Embryonic', count: '4.2M cells' },
  { name: 'Fetal', count: '7.1M cells' },
  { name: 'Postnatal', count: '8.0M cells' },
  { name: 'Adult', count: '6.8M cells' }
];

export const featuredRecords = [
  {
    id: 'BRAIN-HUM-0021',
    title: 'Human cortical excitatory neuron atlas slice',
    confidence: 'high'
  },
  {
    id: 'LUNG-DEV-0142',
    title: 'Fetal lung epithelial lineage trajectory map',
    confidence: 'high'
  },
  {
    id: 'APT-HSA-1007',
    title: 'VEGF DNA aptamer binding assay panel',
    confidence: 'experimental'
  }
];

export const siteSummaries = [
  {
    site: 'RiboCentre',
    scope: 'Curated structured RNA elements',
    records: 12430
  },
  {
    site: 'Riboswitch',
    scope: 'Ligand-responsive RNA motif atlas',
    records: 3912
  },
  {
    site: 'Aptamer',
    scope: 'RNA/DNA binder assays and metadata',
    records: 1884
  }
];

export const recentPublications = [
  {
    doi: '10.1038/s41593-026-01421-3',
    title: 'Cross-stage single-cell atlas of human cortical development',
    year: 2026
  },
  {
    doi: '10.1016/j.cell.2026.02.019',
    title: 'Multi-omics map of human lung developmental transitions',
    year: 2026
  },
  {
    doi: '10.1093/nar/gkae1142',
    title: 'Unified evidence grading for structured RNA annotations',
    year: 2026
  }
];

export const browseRows = [
  {
    id: 'BRAIN-NEU-001',
    name: 'Excitatory neuron cluster map',
    species: 'H. sapiens',
    ligand: 'N/A',
    evidence: 'High'
  },
  {
    id: 'LUNG-DEV-088',
    name: 'AT2 progenitor trajectory branch',
    species: 'H. sapiens',
    ligand: 'N/A',
    evidence: 'High'
  },
  {
    id: 'RB-014',
    name: 'Glycine tandem switch motif',
    species: 'B. subtilis',
    ligand: 'Glycine',
    evidence: 'Medium'
  }
];

export const aptamerMultiSelectRows = [
  {
    id: 'APT-BC-8K7W',
    sequenceName: 'Broccoli aptamer',
    aptamerName: 'Broccoli',
    year: 2025,
    category: 'Fluorogenic',
    sequence: 'GGGACGGUCGGGUCCAGAUAUUCGUAUCUGUCGAGUAGAGUGUGGGCUC',
    description: 'Broccoli-DFHBI-1T complex; local PDB test model (8K7W).',
    pdbId: '8K7W'
  },
  {
    id: 'APT-PSMA-A9',
    sequenceName: 'PSMA binding aptamer',
    aptamerName: 'A9',
    year: 2010,
    category: 'Cancer Targeting',
    sequence: 'GGGAGGACGAUGCGGAUCAGCCAUGUUUACGUCACUCCU',
    description: 'Cell targeting aptamer for prostate-specific membrane antigen.',
    pdbId: '3D2V'
  },
  {
    id: 'APT-MALAT1',
    sequenceName: 'MALAT1 motif aptamer',
    aptamerName: 'MALAT1-motif',
    year: 2021,
    category: 'RNA Motif',
    sequence: 'GGAUCCGGAUUGAGGCUAGUGAAGCUCC',
    description: 'RNA motif recognition and structure-informed design example.',
    pdbId: '7ELR'
  },
  {
    id: 'APT-G4-DFHBI',
    sequenceName: 'Spinach-like G4 aptamer',
    aptamerName: 'Spinach-like G4',
    year: 2020,
    category: 'Fluorogenic',
    sequence: 'GGGUGGUGGUGGUGGUGAAGCCGAUGC',
    description: 'G-quadruplex fluorogenic aptamer family example.',
    pdbId: '5OB3'
  },
  {
    id: 'APT-THR-SELEX',
    sequenceName: 'Thrombin SELEX aptamer',
    aptamerName: 'TBA-like',
    year: 2008,
    category: 'Protein Binding',
    sequence: 'GGTTGGTGTGGTTGG',
    description: 'Protein-binding aptamer class for assay and sensing workflows.',
    pdbId: '4DII'
  }
];

export const detailRecord = {
  id: 'BRAIN-NEU-001',
  name: 'Excitatory neuron cluster map',
  status: 'reviewed',
  organism: 'Homo sapiens',
  family: 'Single-cell transcriptomic atlas',
  updated: '2026-03-07',
  sequenceLength: 0,
  genomicContext: 'Cortical development cohort integration (v2.1)'
};

export const detailEvidenceRows = [
  { method: 'scRNA-seq integration', metric: 'batch-mixing score', score: '0.91' },
  { method: 'Trajectory inference', metric: 'stability', score: '0.87' }
];

export const provenanceHistory = [
  '2026-02-01 imported from brain cohort release v1.8',
  '2026-02-20 QC/annotation harmonization complete',
  '2026-03-07 unified template validation complete'
];
