import React, { useRef, useEffect } from 'react';

const DEFAULT_CENTER = { lat: -0.6266, lng: 34.9406 };
const DEFAULT_NAME = 'Nyaronde along B3 road';

export default function MapModule() {
  const mapRef = useRef(null);
  useEffect(() => {
    if (window.google && window.google.maps) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: 16,
        mapTypeId: 'satellite',
      });
      new window.google.maps.Marker({
        position: DEFAULT_CENTER,
        map,
        title: DEFAULT_NAME,
      });
      // Add more farm markers or boundaries here as needed
    }
  }, []);
  return (
    <div style={{ padding: 24, background: '#e3f2fd', borderRadius: 12, boxShadow: '0 2px 8px #0001', maxWidth: 700, margin: '24px auto' }}>
      <h2>Farm Map Center</h2>
      <div style={{ marginBottom: 12 }}>
        <strong>Location:</strong> {DEFAULT_NAME}
      </div>
      <div ref={mapRef} style={{ width: '100%', height: 400, borderRadius: 8, border: '1px solid #90caf9' }} />
      <div style={{ marginTop: 16 }}>
        <ul>
          <li>Farm boundaries and key locations can be added</li>
          <li>Interactive map tools (search, measure, routes) can be expanded</li>
        </ul>
      </div>
      {/* Note: For full Google Maps JS API, ensure the script is loaded in index.html */}
    </div>
  );
}
