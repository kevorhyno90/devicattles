import React, { useState, useEffect } from 'react'
import {
  calculateHealthScore,
  detectOutbreaks,
  predictHealthRisks,
  generateHealthTrends,
  calculateVeterinaryCosts,
  generateHealthRecommendations
} from '../lib/healthAnalytics'
import { formatDate, formatCurrency, formatRelativeTime } from '../lib/language'

/**
 * Advanced Health Analytics Dashboard
 * Disease tracking, outbreak detection, predictive health monitoring
 */
export default function HealthAnalyticsDashboard({ onNavigate }) {
  const [animals, setAnimals] = useState([])
  const [healthRecords, setHealthRecords] = useState([])
  const [treatments, setTreatments] = useState([])
  const [vaccinations, setVaccinations] = useState([])
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [period, setPeriod] = useState(90)
  const [activeTab, setActiveTab] = useState('overview') // overview, risks, outbreaks, trends, costs

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    try {
      const storedAnimals = JSON.parse(localStorage.getItem('animals') || '[]')
      setAnimals(storedAnimals)
      
      const storedHealth = JSON.parse(localStorage.getItem('animalHealthRecords') || '[]')
      setHealthRecords(storedHealth)
      
      const storedVaccines = JSON.parse(localStorage.getItem('animalVaccinations') || '[]')
      setVaccinations(storedVaccines)
      
      const storedTreatments = JSON.parse(localStorage.getItem('animalTreatments') || '[]')
      setTreatments(storedTreatments)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const outbreaks = detectOutbreaks(healthRecords, animals)
  const trends = generateHealthTrends(healthRecords, period)
  const costs = calculateVeterinaryCosts(healthRecords, treatments, vaccinations, period)
  const recommendations = generateHealthRecommendations(animals, healthRecords, treatments, vaccinations)

  const animalsWithScores = animals.map(animal => ({
    ...animal,
    healthScore: calculateHealthScore(animal, healthRecords, treatments, vaccinations),
    risks: predictHealthRisks(animal, healthRecords, treatments, vaccinations)
  })).sort((a, b) => a.healthScore - b.healthScore)

  const averageHealthScore = animalsWithScores.length > 0
    ? animalsWithScores.reduce((sum, a) => sum + a.healthScore, 0) / animalsWithScores.length
    : 0

  const criticalAnimals = animalsWithScores.filter(a => a.healthScore < 50)
  const atRiskAnimals = animalsWithScores.filter(a => a.healthScore >= 50 && a.healthScore < 70)
  const healthyAnimals = animalsWithScores.filter(a => a.healthScore >= 70)

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          🏥 Health Analytics Dashboard
        </h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Disease tracking, outbreak detection, and predictive health monitoring
        </p>
      </div>

      {/* Urgent Alerts */}
      {(outbreaks.length > 0 || recommendations.filter(r => r.priority === 'urgent').length > 0) && (
        <div style={{
          background: '#fee2e2',
          border: '2px solid #dc2626',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <strong style={{ display: 'block', marginBottom: '8px', color: '#991b1b', fontSize: '16px' }}>
            ⚠️ Urgent Attention Required
          </strong>
          {outbreaks.map(outbreak => (
            <div key={outbreak.id} style={{ marginBottom: '8px', fontSize: '14px', color: '#7f1d1d' }}>
              🦠 <strong>Outbreak Alert:</strong> {outbreak.condition} affecting {outbreak.affectedAnimals} animals ({outbreak.caseCount} cases in past 7 days)
            </div>
          ))}
          {recommendations.filter(r => r.priority === 'urgent').map((rec, idx) => (
            <div key={idx} style={{ marginBottom: '8px', fontSize: '14px', color: '#7f1d1d' }}>
              🚨 {rec.message}
            </div>
          ))}
        </div>
      )}

      {/* Period Selector */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Analysis Period:</span>
        {[30, 90, 180, 365].map(days => (
          <button
            key={days}
            onClick={() => setPeriod(days)}
            style={{
              padding: '6px 12px',
              background: period === days ? '#3b82f6' : '#f3f4f6',
              color: period === days ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {days} days
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'risks', label: '⚠️ Risk Analysis' },
          { id: 'outbreaks', label: '🦠 Outbreaks' },
          { id: 'trends', label: '📈 Trends' },
          { id: 'costs', label: '💰 Costs' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : 'none',
              color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? '600' : '400',
              fontSize: '14px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Average Health Score</div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: averageHealthScore >= 80 ? '#10b981' : averageHealthScore >= 60 ? '#f59e0b' : '#ef4444'
              }}>
                {averageHealthScore.toFixed(1)}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                out of 100
              </div>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Critical Animals</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
                {criticalAnimals.length}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Health score below 50
              </div>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>At Risk</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
                {atRiskAnimals.length}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Health score 50-70
              </div>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Healthy Animals</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                {healthyAnimals.length}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Health score above 70
              </div>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Active Outbreaks</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: outbreaks.length > 0 ? '#dc2626' : '#10b981' }}>
                {outbreaks.length}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                In past 7 days
              </div>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Vet Costs</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                ${costs.totalCost.toFixed(0)}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Last {period} days
              </div>
            </div>
          </div>

          {/* Priority Recommendations */}
          {recommendations.length > 0 && (
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>📋 Priority Recommendations</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {recommendations.slice(0, 10).map((rec, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      background: rec.priority === 'urgent' ? '#fee2e2' : rec.priority === 'high' ? '#fed7aa' : '#fef3c7',
                      border: `1px solid ${rec.priority === 'urgent' ? '#dc2626' : rec.priority === 'high' ? '#ea580c' : '#f59e0b'}`,
                      borderRadius: '6px',
                      marginBottom: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <span style={{
                        padding: '2px 8px',
                        background: rec.priority === 'urgent' ? '#dc2626' : rec.priority === 'high' ? '#ea580c' : '#f59e0b',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {rec.priority}
                      </span>
                      {rec.animalName && (
                        <span style={{ fontSize: '12px', color: '#666' }}>{rec.animalName}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>{rec.message}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      <strong>Action:</strong> {rec.action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Animal Health Scores */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>🐄 Animal Health Scores</h3>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {animalsWithScores.map(animal => (
                <div
                  key={animal.id}
                  onClick={() => setSelectedAnimal(selectedAnimal?.id === animal.id ? null : animal)}
                  style={{
                    padding: '12px',
                    background: selectedAnimal?.id === animal.id ? '#eff6ff' : '#f9fafb',
                    border: selectedAnimal?.id === animal.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{animal.name || animal.tag || animal.id}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {animal.breed || animal.type || 'Unknown'} • {animal.tag || animal.id}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: animal.healthScore >= 80 ? '#10b981' : animal.healthScore >= 60 ? '#f59e0b' : '#ef4444'
                        }}>
                          {animal.healthScore.toFixed(0)}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666' }}>Health Score</div>
                      </div>
                      {animal.risks.length > 0 && (
                        <span style={{
                          padding: '4px 8px',
                          background: '#fee2e2',
                          color: '#991b1b',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          {animal.risks.length} risks
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {selectedAnimal?.id === animal.id && animal.risks.length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                      <strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>Identified Risks:</strong>
                      {animal.risks.map((risk, idx) => (
                        <div key={idx} style={{ fontSize: '12px', marginBottom: '6px', paddingLeft: '12px' }}>
                          • <strong>{risk.type.replace(/_/g, ' ')}:</strong> {risk.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Risk Analysis Tab */}
      {activeTab === 'risks' && (
        <div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>⚠️ Detailed Risk Analysis</h3>
            
            {animalsWithScores.filter(a => a.risks.length > 0).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <div>No significant health risks detected</div>
              </div>
            ) : (
              animalsWithScores.filter(a => a.risks.length > 0).map(animal => (
                <div key={animal.id} style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    {animal.name || animal.tag || animal.id}
                    <span style={{
                      marginLeft: '12px',
                      padding: '4px 8px',
                      background: animal.healthScore < 50 ? '#fee2e2' : '#fed7aa',
                      color: animal.healthScore < 50 ? '#991b1b' : '#9a3412',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      Health Score: {animal.healthScore.toFixed(0)}
                    </span>
                  </h4>
                  
                  {animal.risks.map((risk, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        background: 'white',
                        border: `1px solid ${risk.severity === 'critical' ? '#dc2626' : risk.severity === 'high' ? '#ea580c' : '#f59e0b'}`,
                        borderRadius: '6px',
                        marginBottom: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          background: risk.severity === 'critical' ? '#dc2626' : risk.severity === 'high' ? '#ea580c' : risk.severity === 'moderate' ? '#f59e0b' : '#84cc16',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {risk.severity}
                        </span>
                        <span style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>
                          {risk.type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', marginBottom: '8px' }}>{risk.message}</div>
                      <div style={{ fontSize: '13px', color: '#666', paddingLeft: '12px', borderLeft: '3px solid #3b82f6' }}>
                        <strong>Recommendation:</strong> {risk.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Outbreaks Tab */}
      {activeTab === 'outbreaks' && (
        <div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>🦠 Disease Outbreak Detection</h3>
            
            {outbreaks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <div>No disease outbreaks detected in the past 7 days</div>
              </div>
            ) : (
              outbreaks.map(outbreak => (
                <div
                  key={outbreak.id}
                  style={{
                    padding: '16px',
                    background: outbreak.severity === 'critical' ? '#fee2e2' : outbreak.severity === 'severe' ? '#fed7aa' : '#fef3c7',
                    border: `2px solid ${outbreak.severity === 'critical' ? '#dc2626' : outbreak.severity === 'severe' ? '#ea580c' : '#f59e0b'}`,
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                      {outbreak.condition}
                    </h4>
                    <span style={{
                      padding: '4px 12px',
                      background: outbreak.severity === 'critical' ? '#dc2626' : outbreak.severity === 'severe' ? '#ea580c' : '#f59e0b',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {outbreak.severity}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Total Cases</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{outbreak.caseCount}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Affected Animals</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{outbreak.affectedAnimals}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Duration</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                        {Math.ceil((outbreak.lastCase - outbreak.startDate) / (1000 * 60 * 60 * 24))} days
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                    <strong>First Case:</strong> {formatDate(outbreak.startDate)}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                    <strong>Last Case:</strong> {formatDate(outbreak.lastCase)}
                  </div>
                  
                  <div style={{ padding: '12px', background: 'white', borderRadius: '6px' }}>
                    <strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>⚠️ Recommended Actions:</strong>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                      <li>Isolate all affected animals immediately</li>
                      <li>Contact veterinarian for diagnosis and treatment plan</li>
                      <li>Implement strict biosecurity measures</li>
                      <li>Monitor all animals for symptoms daily</li>
                      <li>Review and improve sanitation protocols</li>
                      <li>Consider vaccination if available</li>
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>📈 Health Trends</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Total Health Records</h4>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {trends.totalRecords}
                </div>
              </div>
              
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Severity Distribution</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(trends.severityDistribution).map(([severity, count]) => (
                    <div key={severity} style={{ flex: '1', minWidth: '80px' }}>
                      <div style={{ fontSize: '11px', color: '#666', textTransform: 'capitalize' }}>{severity}</div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: severity === 'critical' ? '#dc2626' : severity === 'severe' ? '#ea580c' : severity === 'moderate' ? '#f59e0b' : '#84cc16'
                      }}>
                        {count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline Chart */}
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Weekly Health Cases</h4>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', minWidth: '600px', height: '200px' }}>
                {trends.timelineData.map((week, idx) => {
                  const maxCases = Math.max(...trends.timelineData.map(w => w.totalCases), 1)
                  const height = (week.totalCases / maxCases) * 180
                  
                  return (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <div style={{ fontSize: '10px', color: '#666' }}>{week.totalCases}</div>
                      <div
                        style={{
                          width: '100%',
                          height: `${height}px`,
                          background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                          borderRadius: '4px 4px 0 0',
                          position: 'relative'
                        }}
                        title={`Week ${week.week}: ${week.totalCases} cases`}
                      />
                      <div style={{ fontSize: '10px', color: '#999' }}>W{week.week}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Most Common Conditions */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Most Common Conditions</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {trends.mostCommonConditions.map((condition, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', textTransform: 'capitalize' }}>
                      {condition.condition}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {condition.affectedAnimals} animals affected
                    </div>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                    {condition.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Costs Tab */}
      {activeTab === 'costs' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Veterinary Costs</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                ${costs.totalCost.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Last {period} days
              </div>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Health Records</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                ${costs.healthRecordsCost.toFixed(2)}
              </div>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Treatments</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
                ${costs.treatmentsCost.toFixed(2)}
              </div>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Vaccinations</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>
                ${costs.vaccinationsCost.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Monthly Cost Trend */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Monthly Cost Trend</h3>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', minWidth: '600px', height: '200px' }}>
                {costs.costTrend.map((month, idx) => {
                  const maxCost = Math.max(...costs.costTrend.map(m => m.cost), 1)
                  const height = (month.cost / maxCost) * 180
                  
                  return (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <div style={{ fontSize: '10px', color: '#666' }}>${month.cost.toFixed(0)}</div>
                      <div
                        style={{
                          width: '100%',
                          height: `${height}px`,
                          background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                          borderRadius: '4px 4px 0 0'
                        }}
                        title={`Month ${month.month}: $${month.cost.toFixed(2)}`}
                      />
                      <div style={{ fontSize: '10px', color: '#999' }}>M{month.month}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Cost by Animal */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Cost by Animal</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {Object.entries(costs.byAnimal)
                .sort((a, b) => b[1] - a[1])
                .map(([animalId, cost]) => {
                  const animal = animals.find(a => a.id === animalId)
                  return (
                    <div
                      key={animalId}
                      style={{
                        padding: '12px',
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          {animal?.name || animal?.tag || animalId}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {animal?.breed || animal?.type || 'Unknown'}
                        </div>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
                        ${cost.toFixed(2)}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
