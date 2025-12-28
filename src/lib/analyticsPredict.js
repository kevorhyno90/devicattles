// Simple moving average for time series
export function movingAverage(data, windowSize = 3) {
  if (!Array.isArray(data) || data.length < windowSize) return data;
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const avg = window.reduce((sum, d) => sum + (d.value || 0), 0) / window.length;
    result.push({ ...data[i], value: parseFloat(avg.toFixed(2)) });
  }
  return result;
}

// Simple linear regression for trend line
export function linearRegression(data) {
  if (!Array.isArray(data) || data.length < 2) return [];
  const n = data.length;
  const sumX = data.reduce((sum, d, i) => sum + i, 0);
  const sumY = data.reduce((sum, d) => sum + (d.value || 0), 0);
  const sumXY = data.reduce((sum, d, i) => sum + i * (d.value || 0), 0);
  const sumX2 = data.reduce((sum, d, i) => sum + i * i, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return data.map((d, i) => ({ ...d, value: parseFloat((slope * i + intercept).toFixed(2)) }));
}
