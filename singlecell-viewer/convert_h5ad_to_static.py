#!/usr/bin/env python3
"""Convert h5ad into static JSON/columnar files for GitHub Pages deployment.

Outputs under ./public/data:
- umap_columns.json          (columnar x/y + selected obs columns)
- metadata.json              (obs field descriptors + gene index)
- gene_expr/<GENE>.json      (one-gene vector for lazy loading)

Usage:
  python3 convert_h5ad_to_static.py --h5ad /Users/macmini/coding/data/pbmc3k.h5ad
  python3 convert_h5ad_to_static.py --h5ad ... --genes LST1,MS4A1,NKG7
"""

from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
from typing import List
from urllib.parse import quote

import anndata as ad
import numpy as np

from h5ad_loader import H5adUmapLoader


def to_py_list(arr: np.ndarray):
    if np.issubdtype(arr.dtype, np.floating):
        return [float(x) if np.isfinite(x) else None for x in arr]
    if np.issubdtype(arr.dtype, np.integer):
        return [int(x) for x in arr]
    return [None if x is None else str(x) for x in arr]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--h5ad", required=True, help="Path to input h5ad")
    p.add_argument("--out", default="public/data", help="Output data directory")
    p.add_argument("--obs", default="", help="Optional comma-separated obs columns to export. Empty means all obs columns")
    p.add_argument("--genes", default="", help="Optional comma-separated genes. If empty, export all genes as lazy files")
    args = p.parse_args()

    out_dir = Path(args.out)
    gene_dir = out_dir / "gene_expr"
    out_dir.mkdir(parents=True, exist_ok=True)
    gene_dir.mkdir(parents=True, exist_ok=True)

    loader = H5adUmapLoader(args.h5ad)
    adata = ad.read_h5ad(args.h5ad, backed="r")

    base_payload = loader.load_base()
    x = np.asarray(base_payload["data"]["x"], dtype=float)
    y = np.asarray(base_payload["data"]["y"], dtype=float)

    requested_obs = [c.strip() for c in args.obs.split(",") if c.strip()]
    available_obs = [str(c) for c in adata.obs.columns]
    target_obs = requested_obs or available_obs

    obs_payload = {}
    obs_fields = []
    for col in target_obs:
        if col not in adata.obs.columns:
            continue
        vals = np.asarray(adata.obs[col]).reshape(-1)
        obs_payload[col] = to_py_list(vals)
        field_info = next((f for f in base_payload["obsFields"] if f["name"] == col), None)
        kind = field_info["kind"] if field_info else "categorical"
        obs_fields.append({"name": col, "kind": kind})

    # Ensure organ/cell_type always exist for UI fallbacks
    if "organ" not in obs_payload:
        obs_payload["organ"] = ["All"] * adata.n_obs
        obs_fields.insert(0, {"name": "organ", "kind": "categorical"})
    if "cell_type" not in obs_payload:
        fallback_source = base_payload.get("defaultColorField")
        fallback = obs_payload.get(fallback_source, ["unknown"] * adata.n_obs) if fallback_source else ["unknown"] * adata.n_obs
        obs_payload["cell_type"] = [str(v) if v is not None else "unknown" for v in fallback]
        obs_fields.insert(0, {"name": "cell_type", "kind": "categorical"})

    umap_columns = {
        "x": [float(v) for v in x],
        "y": [float(v) for v in y],
        "organ": obs_payload["organ"],
        "cell_type": obs_payload["cell_type"],
        "obs": obs_payload,
    }

    genes_all: List[str] = [str(g) for g in adata.var_names.tolist()]
    if args.genes.strip():
        gene_list = [g.strip() for g in args.genes.split(",") if g.strip()]
    else:
        gene_list = genes_all

    genes_set = set(genes_all)
    valid_genes = [g for g in gene_list if g in genes_set]
    gene_to_idx = {g: i for i, g in enumerate(genes_all)}

    for gene in valid_genes:
        col_idx = gene_to_idx[gene]
        vec = np.asarray(adata.X[:, col_idx].toarray()).reshape(-1) if hasattr(adata.X, "toarray") else np.asarray(adata.X[:, col_idx]).reshape(-1)
        payload = {"gene": gene, "values": [float(v) for v in vec]}
        filename = f"{quote(gene, safe='')}.json"
        with (gene_dir / filename).open("w", encoding="utf-8") as f:
            json.dump(payload, f)

    metadata = {
        "default_color_field": base_payload.get("defaultColorField") or "",
        "obs_fields": obs_fields,
        "genes": valid_genes,
        "n_obs": int(adata.n_obs),
        "n_vars": int(adata.n_vars),
    }

    with (out_dir / "umap_columns.json").open("w", encoding="utf-8") as f:
        json.dump(umap_columns, f)
    with (out_dir / "metadata.json").open("w", encoding="utf-8") as f:
        json.dump(metadata, f)

    print(f"Wrote: {out_dir / 'umap_columns.json'}")
    print(f"Wrote: {out_dir / 'metadata.json'}")
    print(f"Wrote gene vectors: {len(valid_genes)} files under {gene_dir}")


if __name__ == "__main__":
    main()
