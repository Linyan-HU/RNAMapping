from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from h5ad_loader import H5adUmapLoader

H5AD_PATH = os.environ.get("H5AD_PATH", "/Users/macmini/coding/data/pbmc3k.h5ad")
PORT = int(os.environ.get("H5AD_PORT", "8765"))
loader = H5adUmapLoader(H5AD_PATH)


class Handler(BaseHTTPRequestHandler):
    def _send(self, payload: dict, code: int = 200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        try:
            if parsed.path == "/api/health":
                return self._send({"ok": True, "h5ad": H5AD_PATH, "n_obs": loader.n_obs, "n_vars": loader.n_vars})
            if parsed.path == "/api/umap":
                return self._send(loader.load_base())
            if parsed.path == "/api/genes":
                q = qs.get("q", [""])[0]
                limit = int(qs.get("limit", ["50"])[0])
                return self._send({"genes": loader.list_genes(q, limit)})
            if parsed.path.startswith("/api/gene/"):
                gene = parsed.path.split("/api/gene/", 1)[1]
                return self._send(loader.gene_vector(gene))
            if parsed.path == "/api/obs":
                field = qs.get("field", [""])[0]
                if not field:
                    return self._send({"error": "field is required"}, 400)
                return self._send(loader.obs_vector(field))
            return self._send({"error": "not found"}, 404)
        except Exception as exc:  # noqa: BLE001
            return self._send({"error": str(exc)}, 500)


if __name__ == "__main__":
    print(f"Serving h5ad API on http://127.0.0.1:{PORT} using {H5AD_PATH}")
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    server.serve_forever()
