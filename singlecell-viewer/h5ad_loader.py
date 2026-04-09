from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import anndata as ad
import numpy as np
from pandas.api.types import is_numeric_dtype


CELLTYPE_HINTS = ("celltype", "cell_type", "cell-type", "annotation", "cluster", "louvain")
SAMPLE_HINTS = ("sample", "batch", "donor", "patient", "organ")


@dataclass
class ObsFieldInfo:
    name: str
    kind: str  # categorical | numeric


class H5adUmapLoader:
    def __init__(self, h5ad_path: str):
        self._adata = ad.read_h5ad(h5ad_path, backed="r")
        if "X_umap" not in self._adata.obsm:
            raise ValueError("h5ad missing obsm['X_umap'] coordinates")

    @property
    def n_obs(self) -> int:
        return int(self._adata.n_obs)

    @property
    def n_vars(self) -> int:
        return int(self._adata.n_vars)

    def _umap(self) -> np.ndarray:
        umap = np.asarray(self._adata.obsm["X_umap"])
        if umap.shape[1] < 2:
            raise ValueError("X_umap must have at least 2 columns")
        return umap[:, :2]

    def obs_fields(self) -> list[ObsFieldInfo]:
        infos: list[ObsFieldInfo] = []
        for c in self._adata.obs.columns:
            col = self._adata.obs[c]
            if is_numeric_dtype(col.dtype):
                kind = "numeric"
            else:
                kind = "categorical"
            infos.append(ObsFieldInfo(name=str(c), kind=kind))
        return infos

    def default_color_field(self) -> str | None:
        names = [str(c) for c in self._adata.obs.columns]
        lower = [n.lower() for n in names]
        for hints in (CELLTYPE_HINTS, SAMPLE_HINTS):
            for i, name in enumerate(lower):
                if any(h in name for h in hints):
                    return names[i]
        return None

    def load_base(self) -> dict[str, Any]:
        umap = self._umap()
        default_field = self.default_color_field()

        rows: dict[str, Any] = {
            "x": umap[:, 0].astype(float).tolist(),
            "y": umap[:, 1].astype(float).tolist(),
        }
        if default_field is not None:
            series = self._adata.obs[default_field]
            rows["obs"] = [None if v is None else str(v) for v in series.tolist()]

        return {
            "n_obs": self.n_obs,
            "n_vars": self.n_vars,
            "defaultColorField": default_field,
            "obsFields": [info.__dict__ for info in self.obs_fields()],
            "data": rows,
        }

    def list_genes(self, query: str = "", limit: int = 50) -> list[str]:
        names = [str(v) for v in self._adata.var_names.tolist()]
        if query:
            q = query.lower()
            names = [n for n in names if q in n.lower()]
        return names[:limit]

    def gene_vector(self, gene: str) -> dict[str, Any]:
        idx = self._adata.var_names.get_loc(gene)
        vec = self._adata[:, idx].X
        if hasattr(vec, "toarray"):
            vec = vec.toarray().ravel()
        else:
            vec = np.asarray(vec).ravel()

        vec = vec.astype(float)
        finite = vec[np.isfinite(vec)]
        if finite.size:
            vmin = float(np.min(finite))
            vmax = float(np.max(finite))
        else:
            vmin = 0.0
            vmax = 0.0

        return {
            "gene": gene,
            "values": vec.tolist(),
            "min": vmin,
            "max": vmax,
        }

    def obs_vector(self, field: str) -> dict[str, Any]:
        if field not in self._adata.obs.columns:
            raise KeyError(field)
        col = self._adata.obs[field]
        if is_numeric_dtype(col.dtype):
            vals = np.asarray(col, dtype=float)
            return {
                "field": field,
                "kind": "numeric",
                "values": vals.tolist(),
                "min": float(np.nanmin(vals)),
                "max": float(np.nanmax(vals)),
            }
        vals = [None if v is None else str(v) for v in col.tolist()]
        uniques = sorted({v for v in vals if v is not None})
        return {
            "field": field,
            "kind": "categorical",
            "values": vals,
            "categories": uniques,
        }
