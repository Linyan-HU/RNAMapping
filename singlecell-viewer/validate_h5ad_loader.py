from __future__ import annotations

from pathlib import Path
import tempfile

import anndata as ad
import numpy as np
import pandas as pd

from h5ad_loader import H5adUmapLoader

H5AD_PATH = "/Users/macmini/coding/data/pbmc3k.h5ad"


def _assert_fallback_logic() -> None:
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)

        # no celltype/sample hints -> coordinate-only default
        adata_none = ad.AnnData(
            X=np.eye(3, dtype=np.float32),
            obs=pd.DataFrame({"foo": ["a", "b", "c"]}),
            var=pd.DataFrame(index=["g1", "g2", "g3"]),
            obsm={"X_umap": np.array([[0.0, 0.0], [1.0, 1.0], [2.0, 0.5]], dtype=np.float32)},
        )
        none_path = tmp / "fallback_none.h5ad"
        adata_none.write_h5ad(none_path)
        none_loader = H5adUmapLoader(str(none_path))
        assert none_loader.default_color_field() is None
        none_base = none_loader.load_base()
        assert none_base["defaultColorField"] is None
        assert "obs" not in none_base["data"]

        # sample-like hint should be selected when no celltype-like field exists
        adata_sample = ad.AnnData(
            X=np.eye(3, dtype=np.float32),
            obs=pd.DataFrame({"sample_id": ["s1", "s1", "s2"]}),
            var=pd.DataFrame(index=["g1", "g2", "g3"]),
            obsm={"X_umap": np.array([[0.0, 0.0], [1.0, 1.0], [2.0, 0.5]], dtype=np.float32)},
        )
        sample_path = tmp / "fallback_sample.h5ad"
        adata_sample.write_h5ad(sample_path)
        sample_loader = H5adUmapLoader(str(sample_path))
        assert sample_loader.default_color_field() == "sample_id"

        # celltype-like hint should take priority over sample-like hints
        adata_celltype = ad.AnnData(
            X=np.eye(3, dtype=np.float32),
            obs=pd.DataFrame(
                {
                    "sample_id": ["s1", "s1", "s2"],
                    "cell_type": ["T", "B", "NK"],
                }
            ),
            var=pd.DataFrame(index=["g1", "g2", "g3"]),
            obsm={"X_umap": np.array([[0.0, 0.0], [1.0, 1.0], [2.0, 0.5]], dtype=np.float32)},
        )
        celltype_path = tmp / "fallback_celltype.h5ad"
        adata_celltype.write_h5ad(celltype_path)
        celltype_loader = H5adUmapLoader(str(celltype_path))
        assert celltype_loader.default_color_field() == "cell_type"


def main() -> None:
    loader = H5adUmapLoader(H5AD_PATH)
    base = loader.load_base()

    assert base["n_obs"] > 0
    assert len(base["data"]["x"]) == base["n_obs"]
    assert len(base["data"]["y"]) == base["n_obs"]

    # selective gene fetch path: returns only one gene vector matching n_obs
    gene = loader.list_genes(limit=1)[0]
    vec = loader.gene_vector(gene)
    assert vec["gene"] == gene
    assert len(vec["values"]) == base["n_obs"]

    try:
        loader.gene_vector("__MISSING_GENE__")
        raise AssertionError("Expected missing gene lookup to fail")
    except KeyError:
        pass

    # fallback color logic: if default missing, coordinate-only should still be valid
    default_field = base["defaultColorField"]
    if default_field is not None:
        obs_vec = loader.obs_vector(default_field)
        assert len(obs_vec["values"]) == base["n_obs"]

    _assert_fallback_logic()

    print("validate_h5ad_loader: OK")
    print(f"n_obs={base['n_obs']} n_vars={base['n_vars']} defaultColorField={default_field} gene={gene}")
    print("fallback_logic: OK")


if __name__ == "__main__":
    main()
