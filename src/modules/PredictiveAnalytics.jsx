import React, { useState, useEffect } from 'react'
import {
  predictMilkYield,
  predictCropHarvest,
  predictExpenses,
  predictRevenue,
  getPredictiveDashboard
} from '../lib/predictiveAnalytics'

// Helper to get data from localStorage
const getAllAnimals = () => {
  const data = localStorage.getItem('devinsfarm:animals')
  return data ? JSON.parse(data) : []
}

const getAllCrops = () => {
  const data = localStorage.getItem('devinsfarm:crops')
  return data ? JSON.parse(data) : []
}

const getFinanceRecords = () => {
  const data = localStorage.getItem('devinsfarm:finance')
  return data ? JSON.parse(data) : []
}

const getMilkRecords = () => {
  const data = localStorage.getItem('devinsfarm:milkYield')
  return data ? JSON.parse(data) : []
}

const getCropYieldRecords = () => {
  const data = localStorage.getItem('devinsfarm:cropYields')
  return data ? JSON.parse(data) : []
}

/**
 * Predictive Analytics Dashboard
 * ML-powered forecasting for milk, crops, expenses, and revenue
 */
export default function PredictiveAnalytics() {
  const [forecastData, setForecastData] = useState(null)
  const [selectedAnimal, setSelectedAnimal] = useState('all')
  const [selectedCrop, setSelectedCrop] = useState('all')
  const [forecastPeriod, setForecastPeriod] = useState(30)
  const [loading, setLoading] = useState(true)
  const [animals, setAnimals] = useState([])
  const [crops, setCrops] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!loading) {
      generateForecasts()
    }
  }, [selectedAnimal, selectedCrop, forecastPeriod])

  const loadData = () => {
    const animalData = getAllAnimals()
    const cropData = getAllCrops()
    setAnimals(animalData)
    setCrops(cropData)
    setLoading(false)
  }

  const generateForecasts = () => {
    const financeData = getFinanceRecords()
    const milkData = getMilkRecords()
    const yieldData = getCropYieldRecords()
    
    const forecast = getPredictiveDashboard(animals, crops, financeData, milkData, yieldData)
    setForecastData(forecast)
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading analytics...</div>
      </div>
    )
  }

  const milkAnimals = animals.filter(a => 
    a.species?.toLowerCase() === 'cattle' || a.species?.toLowerCase() === 'goat'
  )

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>
          🔮 Predictive Analytics
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          AI-powered forecasting and trend predictions
        </p>
      </div>

      {/* Controls */}
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
            Forecast Period
          </label>
          <select
            value={forecastPeriod}
            onChange={(e) => setForecastPeriod(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value={7}>7 Days</option>
            <option value={14}>14 Days</option>
            <option value={30}>30 Days</option>
            <option value={60}>60 Days</option>
            <option value={90}>90 Days</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
            Milk Animal
          </label>
          <select
            value={selectedAnimal}
            onChange={(e) => setSelectedAnimal(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="all">All Animals</option>
            {milkAnimals.map(animal => (
              <option key={animal.id} value={animal.id}>
                {animal.tag} - {animal.breed}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
            Crop Field
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="all">All Crops</option>
            {crops.filter(c => c.stage !== 'harvested').map(crop => (
              <option key={crop.id} value={crop.id}>
                {crop.crop} - {crop.area} ha
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={generateForecasts}
          style={{
            padding: '8px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            alignSelf: 'flex-end'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Forecast Summary Cards */}
      {forecastData && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Milk Forecast */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderTop: '4px solid #3b82f6'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                Milk Production ({forecastPeriod}d)
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>
                {forecastData.milk?.totalPredicted || 0}L
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Trend: {forecastData.milk?.trend === 'increasing' ? '📈' : 
                       forecastData.milk?.trend === 'decreasing' ? '📉' : '➡️'} 
                {' '}{forecastData.milk?.trend || 'stable'}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                Confidence: {forecastData.milk?.confidence || 0}%
              </div>
            </div>

            {/* Crop Yield Forecast */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderTop: '4px solid #22c55e'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                Est. Crop Yield
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#22c55e', marginBottom: '8px' }}>
                {forecastData.crop?.totalYield || 0}kg
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                {forecastData.crop?.activeCrops || 0} active crops
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                Avg: {forecastData.crop?.avgYieldPerHa || 0} kg/ha
              </div>
            </div>

            {/* Revenue Forecast */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderTop: '4px solid #f59e0b'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                Projected Revenue ({forecastPeriod}d)
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>
                ${forecastData.revenue?.predicted || 0}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Trend: {forecastData.revenue?.trend === 'increasing' ? '📈' : 
                       forecastData.revenue?.trend === 'decreasing' ? '📉' : '➡️'}
                {' '}{forecastData.revenue?.trend || 'stable'}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                Daily avg: ${forecastData.revenue?.dailyAvg || 0}
              </div>
            </div>

            {/* Expense Forecast */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderTop: '4px solid #ef4444'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                Projected Expenses ({forecastPeriod}d)
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>
                ${forecastData.expenses?.predicted || 0}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Trend: {forecastData.expenses?.trend === 'increasing' ? '📈' : 
                       forecastData.expenses?.trend === 'decreasing' ? '📉' : '➡️'}
                {' '}{forecastData.expenses?.trend || 'stable'}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                Daily avg: ${forecastData.expenses?.dailyAvg || 0}
              </div>
            </div>
          </div>

          {/* Detailed Forecasts */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '20px'
          }}>
            {/* Milk Production Chart */}
            {forecastData.milk?.predictions && forecastData.milk.predictions.length > 0 && (
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
                  📊 Milk Production Forecast
                </h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                    Confidence: {forecastData.milk.confidence}% | 
                    Current: {forecastData.milk.currentAverage || 0}L/day
                  </div>
                </div>

                {/* Simple bar chart */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {forecastData.milk.predictions.slice(0, 10).map((pred, idx) => {
                    const maxVal = Math.max(...forecastData.milk.predictions.map(p => p.predicted))
                    const width = (pred.predicted / maxVal) * 100
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', width: '60px' }}>
                          {new Date(pred.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{
                          flex: 1,
                          height: '24px',
                          background: `linear-gradient(to right, #3b82f6 ${width}%, #e5e7eb ${width}%)`,
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '8px'
                        }}>
                          <span style={{ fontSize: '12px', fontWeight: '500', color: width > 50 ? '#fff' : '#1f2937' }}>
                            {pred.predicted}L
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {forecastData.milk.predictions.length > 10 && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
                    Showing first 10 days of {forecastData.milk.predictions.length} day forecast
                  </div>
                )}
              </div>
            )}

            {/* Crop Yield Details */}
            {forecastData.crop?.crops && forecastData.crop.crops.length > 0 && (
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
                  🌾 Crop Yield Estimates
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {forecastData.crop.crops.map(crop => (
                    <div key={crop.id} style={{
                      padding: '12px',
                      background: '#f9fafb',
                      borderRadius: '6px',
                      borderLeft: '4px solid #22c55e'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '500', fontSize: '14px' }}>{crop.crop}</span>
                        <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{crop.predictedYield}kg</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Area: {crop.area}ha | Stage: {crop.stage}
                      </div>
                      {crop.harvestDate && (
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                          Est. harvest: {new Date(crop.harvestDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Trends */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
                💰 Financial Forecast
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Revenue Trend */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>
                    Revenue Projection
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      flex: 1,
                      height: '8px',
                      background: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: '70%',
                        background: 'linear-gradient(to right, #22c55e, #f59e0b)',
                        borderRadius: '4px'
                      }} />
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b' }}>
                      ${forecastData.revenue?.predicted || 0}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                    Based on {forecastData.revenue?.dataPoints || 0} historical transactions
                  </div>
                </div>

                {/* Expense Trend */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>
                    Expense Projection
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      flex: 1,
                      height: '8px',
                      background: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: '60%',
                        background: 'linear-gradient(to right, #fbbf24, #ef4444)',
                        borderRadius: '4px'
                      }} />
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444' }}>
                      ${forecastData.expenses?.predicted || 0}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                    Based on {forecastData.expenses?.dataPoints || 0} historical transactions
                  </div>
                </div>

                {/* Net Projection */}
                <div style={{
                  padding: '12px',
                  background: '#f0fdf4',
                  borderRadius: '6px',
                  borderLeft: '4px solid #22c55e'
                }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                    Net Projection ({forecastPeriod} days)
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
                    ${((forecastData.revenue?.predicted || 0) - (forecastData.expenses?.predicted || 0)).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Insights & Recommendations */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
                💡 AI Insights
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Milk Insights */}
                {forecastData.milk?.trend && (
                  <div style={{
                    padding: '12px',
                    background: '#eff6ff',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px', color: '#1e40af' }}>
                      🐄 Milk Production
                    </div>
                    <div style={{ color: '#6b7280' }}>
                      {forecastData.milk.trend === 'increasing' 
                        ? 'Production is increasing. Good time to consider expanding dairy operations.'
                        : forecastData.milk.trend === 'decreasing'
                        ? 'Production is declining. Review animal health and nutrition.'
                        : 'Production is stable. Maintain current practices.'}
                    </div>
                  </div>
                )}

                {/* Crop Insights */}
                {forecastData.crop?.totalYield > 0 && (
                  <div style={{
                    padding: '12px',
                    background: '#f0fdf4',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px', color: '#166534' }}>
                      🌾 Crop Forecast
                    </div>
                    <div style={{ color: '#6b7280' }}>
                      Expected yield of {forecastData.crop.totalYield}kg from {forecastData.crop.activeCrops} crops.
                      {forecastData.crop.avgYieldPerHa > 5 
                        ? ' Above average performance!'
                        : ' Consider optimizing farming practices.'}
                    </div>
                  </div>
                )}

                {/* Financial Insights */}
                {forecastData.revenue && forecastData.expenses && (
                  <div style={{
                    padding: '12px',
                    background: '#fef3c7',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px', color: '#92400e' }}>
                      💰 Financial Health
                    </div>
                    <div style={{ color: '#6b7280' }}>
                      {(forecastData.revenue.predicted - forecastData.expenses.predicted) > 0
                        ? `Projected profit of $${((forecastData.revenue.predicted - forecastData.expenses.predicted).toFixed(2))}. Healthy financial outlook.`
                        : 'Expenses projected to exceed revenue. Review cost optimization.'}
                    </div>
                  </div>
                )}

                {/* Data Quality Warning */}
                {forecastData.milk?.confidence < 60 && (
                  <div style={{
                    padding: '12px',
                    background: '#fef2f2',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px', color: '#991b1b' }}>
                      ⚠️ Limited Data
                    </div>
                    <div style={{ color: '#6b7280' }}>
                      Predictions have low confidence due to limited historical data. 
                      Continue recording data for more accurate forecasts.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* No Data Warning */}
      {!forecastData && (
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
            No Historical Data Available
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Start recording milk production, crop harvests, and financial transactions
            to generate predictive analytics.
          </div>
        </div>
      )}
    </div>
  )
}
