# Single-cell Viewer (h5ad-backed static mode)

This viewer supports GitHub Pages-compatible static loading with selective gene fetch.

## Quick start

```bash
cd /Users/macmini/coding/web_template/singlecell-viewer
npm install
npm run convert:data
npm test
npm run build
```

## What gets generated

- `public/data/umap_columns.json`: UMAP x/y + selected obs columns
- `public/data/metadata.json`: obs field descriptors + gene index
- `public/data/gene_expr/<GENE>.json`: lazy per-gene vector files (URL-encoded filename, one gene per file)

## Behavior

- Base view loads UMAP + obs metadata only (no full matrix payload in frontend path).
- Default color field chooses celltype-like obs field if present, else sample-like, else coordinate-only.
- Gene search lists `var_names`; selecting a gene loads one vector file and applies continuous gradient coloring.
- Obs coloring supports categorical palettes and numeric gradients.

## Validation

```bash
npm run validate:h5ad
```

The validator checks:
- base load shape from `obsm['X_umap'] + obs`
- one-gene selective fetch path (`gene_vector`) returns one vector only
- fallback color-field behavior (`celltype-like -> sample-like -> none`)

## Demo verification steps

1. Generate static data from h5ad:
   ```bash
   npm run convert:data
   ```
2. Build viewer bundle:
   ```bash
   npm run build
   ```
3. Open `dist/index.html` (or `npm run preview`) and verify:
   - default obs coloring uses inferred field when available
   - gene search returns `var_names`
   - selecting a gene updates UMAP with continuous gradient
   - switching to other obs fields supports categorical and numeric coloring
