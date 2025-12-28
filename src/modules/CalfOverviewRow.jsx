import React, { useState } from 'react';

// Basic CalfOverviewRow component to resolve missing import
export default function CalfOverviewRow({ calf, batchMode, selected, onBatchSelect }) {
  const [expanded, setExpanded] = useState(false);
  const preview = (calf.photos && calf.photos.length) ? calf.photos[0].dataUrl : (calf.photo || null);
  return (
    <div className="card" style={{ marginBottom: 12, padding: 16, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      {batchMode && (
        <input type="checkbox" checked={selected} onChange={onBatchSelect} style={{marginRight:8, marginTop: 8}} />
      )}
      {preview && (
        <img src={preview} alt={calf.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{calf.name || 'Unnamed Calf'}</h4>
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: 4 }}>
              {calf.tag && <span style={{ marginRight: 12 }}>🏷️ {calf.tag}</span>}
              <span style={{ marginRight: 12 }}>{calf.sex === 'F' ? '♀' : '♂'} {calf.breed}</span>
              <span>📊 {calf.healthStatus || '-'}</span>
            </div>
          </div>
        </div>
        {expanded && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb', fontSize: '0.9rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {calf.dob && <div><strong>DOB:</strong> {calf.dob}</div>}
              {calf.birthWeight && <div><strong>Birth Wt:</strong> {calf.birthWeight} kg</div>}
              {calf.currentWeight && <div><strong>Current Wt:</strong> {calf.currentWeight} kg</div>}
              {calf.damName && <div><strong>Dam:</strong> {calf.damName}</div>}
              {calf.sireName && <div><strong>Sire:</strong> {calf.sireName}</div>}
              {calf.housingType && <div><strong>Housing:</strong> {calf.housingType}</div>}
              {calf.colostrumIntake && <div><strong>Colostrum:</strong> {calf.colostrumIntake}</div>}
              {calf.weaningDate && <div><strong>Weaning Date:</strong> {calf.weaningDate}</div>}
            </div>
            {calf.notes && (
              <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 6 }}>
                <strong>Notes:</strong> {calf.notes}
              </div>
            )}
          </div>
        )}
        <button 
          onClick={() => setExpanded(e => !e)}
          style={{ marginTop: 12, padding: '6px 12px', fontSize: '0.85rem', background: '#f3f4f6', border: '1px solid #d1d5db', width: 'auto' }}
        >
          {expanded ? '▲ Show Less' : '▼ Show More'}
        </button>
      </div>
    </div>
  );
}
