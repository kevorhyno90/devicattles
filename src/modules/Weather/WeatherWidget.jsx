

import React from 'react';
import WeatherModule from './WeatherModule';

// Example: Use Nairobi, Kenya coordinates
const NAIROBI = { latitude: -1.286389, longitude: 36.817223 };

export default function WeatherWidget() {
  return (
    <div style={{margin:'1em 0'}}>
      <WeatherModule latitude={NAIROBI.latitude} longitude={NAIROBI.longitude} />
    </div>
  );
}
