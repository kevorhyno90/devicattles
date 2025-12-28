import React from 'react';

/**
 * ReportSummaryCard - displays summary stats for a report section
 * Props:
 *   - title: string
 *   - stats: array of { label, value, color? }
 *   - style?: object
 */
export default function ReportSummaryCard({ title, stats = [], style = {} }) {
  return (
    <div className="card" style={{ marginBottom: 20, padding: 20, background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#fff', ...style }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
        {stats.map((stat, idx) => (
          <div key={idx}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: stat.color || '#fff' }}>{stat.value}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
