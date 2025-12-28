

import React, { useEffect, useState } from 'react';

// Example: Open-Meteo API (no key required)
const API_URL = 'https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current_weather=true';

export default function WeatherModule({ latitude = 0, longitude = 0 }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`)
      .then(res => res.json())
      .then(data => {
        setWeather(data.current_weather);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch weather');
        setLoading(false);
      });
  }, [latitude, longitude]);

  if (loading) return <div>Loading weather...</div>;
  if (error) return <div style={{color:'red'}}>{error}</div>;
  if (!weather) return <div>No weather data available.</div>;

  return (
    <div style={{padding:'1em',border:'1px solid #e5e7eb',borderRadius:'8px',background:'#f9fafb',maxWidth:300}}>
      <h3>Current Weather</h3>
      <div><b>Temperature:</b> {weather.temperature}°C</div>
      <div><b>Wind Speed:</b> {weather.windspeed} km/h</div>
      <div><b>Weather Code:</b> {weather.weathercode}</div>
      <div style={{fontSize:'0.9em',color:'#888'}}>Powered by Open-Meteo</div>
    </div>
  );
}
