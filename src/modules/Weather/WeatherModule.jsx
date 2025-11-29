import React, { useState, useEffect } from 'react';

const OPENWEATHER_API_KEY = 'e8b82472e1785fe426645d7d39359924';
const DEFAULT_COORDS = { lat: -0.6266, lon: 34.9406 };

function Forecast({ coords }) {
  const [forecast, setForecast] = useState(null);
  useEffect(() => {
    async function fetchForecast() {
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setForecast(data);
    }
    fetchForecast();
  }, [coords]);
  if (!forecast) return <div>Loading forecast...</div>;
  return (
    <div style={{ marginTop: 16 }}>
      <h4>5-Day Forecast</h4>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
        {forecast.list.slice(0, 5).map((item, idx) => (
          <div key={idx} style={{ background: '#e0f7fa', padding: 8, borderRadius: 6, minWidth: 100 }}>
            <div>{new Date(item.dt * 1000).toLocaleDateString()}</div>
            <div>{item.weather[0].main}</div>
            <div>{item.main.temp}°C</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WeatherModule() {
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    async function fetchWeather() {
      setError(null);
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch weather');
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchWeather();
  }, [coords]);
  return (
    <div style={{ padding: 24, background: '#f1f8e9', borderRadius: 12, boxShadow: '0 2px 8px #0001', maxWidth: 500, margin: '24px auto' }}>
      <h2>Farm Weather Center</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Latitude: </label>
        <input type="number" value={coords.lat} onChange={e => setCoords(c => ({ ...c, lat: parseFloat(e.target.value) }))} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', width: 100 }} />
        <label style={{ marginLeft: 12 }}>Longitude: </label>
        <input type="number" value={coords.lon} onChange={e => setCoords(c => ({ ...c, lon: parseFloat(e.target.value) }))} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', width: 100 }} />
      </div>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {weather ? (
        <div>
          <h3>{weather.name}</h3>
          <div>Temperature: {weather.main.temp}°C</div>
          <div>Condition: {weather.weather[0].description}</div>
          <div>Humidity: {weather.main.humidity}%</div>
          <div>Wind: {weather.wind.speed} m/s</div>
          {/* Farm-specific tips */}
          {weather.weather[0].main === 'Rain' && <div style={{ color: '#1976d2' }}>Rain alert: Consider shelter for livestock!</div>}
          {weather.main.temp > 30 && <div style={{ color: '#d84315' }}>Drought warning: Check water supply!</div>}
        </div>
      ) : <div>Loading weather...</div>}
      <Forecast coords={coords} />
    </div>
  );
}
