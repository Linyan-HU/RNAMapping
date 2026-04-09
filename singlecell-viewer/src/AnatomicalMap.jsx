import React from 'react';

export default function AnatomicalMap({ selectedOrgan, onSelectOrgan, organs = ['All'] }) {
  const colorFor = (organ) => (selectedOrgan === organ ? '#0ea5e9' : '#d1d5db');
  const hasRespiratory = ['All', 'Lung', 'Airway', 'Nose'].every((o) => organs.includes(o));

  return (
    <div className="panel">
      <h3>Anatomical SVG Map</h3>
      {hasRespiratory ? (
        <svg viewBox="0 0 260 320" className="anatomy-svg" role="img" aria-label="Respiratory map">
          <rect x="100" y="20" width="60" height="55" rx="16" fill={colorFor('Nose')} onClick={() => onSelectOrgan('Nose')} />
          <rect x="118" y="75" width="24" height="70" rx="8" fill={colorFor('Airway')} onClick={() => onSelectOrgan('Airway')} />
          <ellipse cx="85" cy="220" rx="60" ry="80" fill={colorFor('Lung')} onClick={() => onSelectOrgan('Lung')} />
          <ellipse cx="175" cy="220" rx="60" ry="80" fill={colorFor('Lung')} onClick={() => onSelectOrgan('Lung')} />
          <text x="130" y="52" textAnchor="middle">Nose</text>
          <text x="130" y="115" textAnchor="middle">Airway</text>
          <text x="130" y="220" textAnchor="middle">Lung</text>
        </svg>
      ) : (
        <p className="hint">Organ map unavailable for this dataset; use buttons below.</p>
      )}

      <div className="region-buttons">
        {organs.map((organ) => (
          <button key={organ} className={selectedOrgan === organ ? 'active' : ''} onClick={() => onSelectOrgan(organ)}>
            {organ}
          </button>
        ))}
      </div>
    </div>
  );
}
