#!/usr/bin/env python3
import argparse
import json
import math
import os
import random
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent / 'public' / 'data'
GENE_DIR = OUT_DIR / 'gene_expr'


def ensure_dirs():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    GENE_DIR.mkdir(parents=True, exist_ok=True)


def generate_dummy(n=10000, seed=20260307):
    random.seed(seed)
    organs = ['Lung', 'Airway', 'Nose']
    cell_types = ['AT2', 'AT1', 'Basal', 'Club', 'Ciliated', 'Macrophage']
    centers = {
        'Lung': [(-5, 2), (4, -2)],
        'Airway': [(-1, -5), (2, 5)],
        'Nose': [(-7, -4), (7, 4)]
    }

    x, y, organ_col, cell_type_col = [], [], [], []
    for _ in range(n):
        organ = random.choices(organs, weights=[0.6, 0.25, 0.15])[0]
        cx, cy = random.choice(centers[organ])
        theta = random.uniform(0, 2 * math.pi)
        r = abs(random.gauss(0, 1.4))
        x.append(round(cx + math.cos(theta) * r, 4))
        y.append(round(cy + math.sin(theta) * r, 4))
        organ_col.append(organ)
        cell_type_col.append(random.choice(cell_types))

    genes = ['LST1', 'MS4A1', 'NKG7', 'LYZ', 'CD3D']
    for gene in genes:
        vals = [max(0.0, random.gauss(1.5, 1.2)) for _ in range(n)]
        with (GENE_DIR / f'{gene}.json').open('w', encoding='utf-8') as f:
            json.dump({'gene': gene, 'values': vals}, f)

    umap_columns = {
        'x': x,
        'y': y,
        'organ': organ_col,
        'cell_type': cell_type_col,
        'obs': {
            'organ': organ_col,
            'cell_type': cell_type_col
        }
    }
    metadata = {
        'default_color_field': 'cell_type',
        'obs_fields': [
            {'name': 'cell_type', 'kind': 'categorical'},
            {'name': 'organ', 'kind': 'categorical'}
        ],
        'genes': genes,
        'n_obs': n,
        'n_vars': len(genes)
    }
    return umap_columns, metadata


def main():
    p = argparse.ArgumentParser(description='Setup local static data for single-cell viewer')
    p.add_argument('--n-cells', type=int, default=10000, help='Dummy cell count')
    p.add_argument('--seed', type=int, default=20260307, help='Deterministic seed')
    args = p.parse_args()

    ensure_dirs()
    umap_columns, metadata = generate_dummy(n=args.n_cells, seed=args.seed)

    with (OUT_DIR / 'umap_columns.json').open('w', encoding='utf-8') as f:
        json.dump(umap_columns, f)
    with (OUT_DIR / 'metadata.json').open('w', encoding='utf-8') as f:
        json.dump(metadata, f)

    print(f'Wrote {args.n_cells} rows to {OUT_DIR / "umap_columns.json"}')
    print(f'Wrote metadata to {OUT_DIR / "metadata.json"}')
    print(f'Wrote {len(metadata["genes"])} dummy gene vectors to {GENE_DIR}')


if __name__ == '__main__':
    main()
