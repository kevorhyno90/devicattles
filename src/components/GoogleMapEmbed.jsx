import React from 'react'

// Replace with your farm's coordinates or address
const FARM_LAT = -0.6266
const FARM_LNG = 34.9406
const FARM_NAME = 'Nyaronde, Matutu'

export default function GoogleMapEmbed({ lat = FARM_LAT, lng = FARM_LNG, name = FARM_NAME }) {
  const mapSrc = `https://www.google.com/maps/embed/v1/view?key=AIzaSyDaWQosYNtS0V_S2R7R1xVAPMmpGsXY4Vk&center=${lat},${lng}&zoom=15&maptype=satellite`
  return (
    <div style={{ margin: '16px 0', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px #0001' }}>
      <h3 style={{ margin: '8px 0' }}>Farm Location: {name}</h3>
      <iframe
        title="Farm Map"
        width="100%"
        height="350"
        frameBorder="0"
        style={{ border: 0 }}
        src={mapSrc}
        allowFullScreen
      ></iframe>
    </div>
  )
}
