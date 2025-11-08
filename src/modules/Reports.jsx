import React from 'react'

export default function Reports(){
  // Minimal reports placeholder. Future work: add charts and export CSV/PDF.
  return (
    <section>
      <h2>Reports</h2>
      <p>Generate reports for animals, feed, finance, and operations. This is a placeholder.</p>
      <div style={{display:'flex',gap:12}}>
        <button onClick={()=>alert('Exporting CSV (demo)')}>Export CSV</button>
        <button onClick={()=>alert('Generating PDF (demo)')}>Export PDF</button>
      </div>
    </section>
  )
}
