import React, { useEffect, useMemo, useRef } from 'react';

export default function SingleCellPlot({ data, selectedOrgan }) {
  const canvasRef = useRef(null);

  const filtered = useMemo(
    () => (selectedOrgan === 'All' ? data : data.filter((d) => d.organ === selectedOrgan)),
    [data, selectedOrgan]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth || 900;
    const height = canvas.clientHeight || 560;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, width, height);

    if (!filtered.length) return;

    const minX = Math.min(...filtered.map((d) => d.x));
    const maxX = Math.max(...filtered.map((d) => d.x));
    const minY = Math.min(...filtered.map((d) => d.y));
    const maxY = Math.max(...filtered.map((d) => d.y));

    const spanX = Math.max(maxX - minX, 1e-6);
    const spanY = Math.max(maxY - minY, 1e-6);
    const pad = 16;

    for (const d of filtered) {
      const x = ((d.x - minX) / spanX) * (width - pad * 2) + pad;
      const y = height - (((d.y - minY) / spanY) * (height - pad * 2) + pad);
      const c = d.color || [120, 120, 120, 220];
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.82)`;
      ctx.fillRect(x, y, 1.8, 1.8);
    }
  }, [filtered]);

  return (
    <div className="panel plot-panel">
      <h3>UMAP Scatterplot ({filtered.length.toLocaleString()} cells)</h3>
      <p className="hint">Canvas renderer with organ filtering and dynamic color modes.</p>
      <canvas ref={canvasRef} style={{ width: '100%', height: '560px', border: '1px solid #374151', borderRadius: 8 }} />
    </div>
  );
}
