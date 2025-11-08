import React from 'react'

export default function FarmMap(){
  // Placeholder farm map view. This is intentionally minimal so it builds quickly.
  // Future: integrate Leaflet/Mapbox and allow plotting pastures/animal locations.
  return (
    <section>
      <h2>Farm Map</h2>
      <div style={{width:'100%',height:360,background:'#eef',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid #ddd',borderRadius:8}}>
        <div style={{color:'#447'}}>Map placeholder — integrate mapping library to show pastures and assets.</div>
      </div>
    </section>
  )
}
