import React, { useState, useEffect, useCallback } from 'react'
import { exportToCSV, exportToJSON } from '../lib/exportImport'
import { useUIStore } from '../stores/uiStore'
import { formatCurrency } from '../lib/currency'
import { Document, Packer, Paragraph, AlignmentType, HeadingLevel } from 'docx'

export default function AdditionalReports() {
  const [activeReport, setActiveReport] = useState('health')
  const [scheduleEmail, setScheduleEmail] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const showSuccess = useUIStore((state) => state.showSuccess)
  const showError = useUIStore((state) => state.showError)
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Add more report types here
  const reportTypes = [
    { id: 'health', label: '🏥 Herd Health' },
    { id: 'breeding', label: '👶 Breeding' },
    { id: 'feed', label: '🌾 Feed Analysis' },
    { id: 'mortality', label: '⚰️ Mortality' },
    { id: 'growth', label: '📈 Growth Trends' },
    { id: 'finance', label: '💰 Financial Summary' }
  ];

  const generateReport = useCallback((type) => {
    setLoading(true)
    setError(null)

    let data = {}
    try {
      const animals = JSON.parse(localStorage.getItem('cattalytics:animals') || '[]')
      const finance = JSON.parse(localStorage.getItem('cattalytics:finance') || '[]')

      if (type === 'health') {
        const healthSummary = {
          totalAnimals: animals.length,
          vaccinatedAnimals: animals.filter(a => a.lastVaccination).length,
          animalsUnderTreatment: animals.filter(a => a.healthAlerts && a.healthAlerts.length > 0).length,
          vaccineOverdue: animals.filter(a => {
            if (!a.lastVaccination) return true
            const lastVacc = new Date(a.lastVaccination)
            const oneYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1))
            return lastVacc < oneYearAgo
          }).length
        }

        data = {
          type: 'health',
          summary: healthSummary,
          animals: animals.map(a => ({
            id: a.id,
            name: a.name,
            breed: a.breed,
            age: a.dob ? new Date().getFullYear() - new Date(a.dob).getFullYear() : 'Unknown',
            status: a.status,
            lastVaccination: a.lastVaccination || 'Never'
          }))
        }
      } else if (type === 'breeding') {
        const females = animals.filter(a => a.sex === 'F')
        const breedingAnimals = females.filter(a => a.pregnancyStatus === 'Pregnant' || a.pregnancyStatus === 'Recently Bred')

        data = {
          type: 'breeding',
          summary: {
            totalFemales: females.length,
            pregnantAnimals: females.filter(a => a.pregnancyStatus === 'Pregnant').length,
            readyToBreed: females.filter(a => a.pregnancyStatus === 'Ready to Breed').length
          },
          animals: breedingAnimals.map(a => ({
            id: a.id,
            name: a.name,
            breed: a.breed,
            pregnancyStatus: a.pregnancyStatus,
            expectedDue: a.expectedDue || 'Unknown',
            daysPregnant: a.expectedDue ? Math.floor((new Date(a.expectedDue) - new Date()) / (1000 * 60 * 60 * 24)) : 0
          }))
        }
      } else if (type === 'feed') {
        const feedExpenses = finance.filter(f => f.category === 'Feed' || (f.type === 'expense' && !f.category))
        const totalFeedCost = feedExpenses.reduce((sum, f) => sum + Math.abs(f.amount || 0), 0)

        data = {
          type: 'feed',
          summary: {
            totalAnimals: animals.length,
            totalFeedCost: totalFeedCost,
            avgCostPerAnimal: animals.length > 0 ? (totalFeedCost / animals.length).toFixed(2) : 0,
            recentExpenses: feedExpenses.length
          },
          expenses: feedExpenses.slice(-20).map(f => ({
            date: f.date,
            amount: f.amount,
            subcategory: f.subcategory || f.category,
            description: f.description,
            vendor: f.vendor || 'N/A'
          }))
        }
      } else if (type === 'mortality') {
        // Example: Mortality report
        const deaths = animals.filter(a => a.status === 'Dead' || a.status === 'Deceased')
        data = {
          type: 'mortality',
          summary: {
            totalDeaths: deaths.length,
            totalAnimals: animals.length,
            mortalityRate: animals.length > 0 ? ((deaths.length / animals.length) * 100).toFixed(2) + '%' : '0%'
          },
          animals: deaths.map(a => ({
            id: a.id,
            name: a.name,
            breed: a.breed,
            age: a.dob ? new Date().getFullYear() - new Date(a.dob).getFullYear() : 'Unknown',
            dateOfDeath: a.dateOfDeath || 'Unknown',
            cause: a.causeOfDeath || 'Unknown'
          }))
        }
      } else if (type === 'growth') {
        // Example: Growth Trends report
        data = {
          type: 'growth',
          summary: {
            totalAnimals: animals.length,
            avgGrowth: animals.length > 0 ? (animals.reduce((sum, a) => sum + (a.growthRate || 0), 0) / animals.length).toFixed(2) : 0
          },
          animals: animals.map(a => ({
            id: a.id,
            name: a.name,
            breed: a.breed,
            growthRate: a.growthRate || 'N/A',
            age: a.dob ? new Date().getFullYear() - new Date(a.dob).getFullYear() : 'Unknown',
            status: a.status
          }))
        }
      } else if (type === 'finance') {
        // Example: Financial Summary report
        const income = finance.filter(f => f.type === 'income').reduce((sum, f) => sum + Math.abs(f.amount || 0), 0)
        const expenses = finance.filter(f => f.type === 'expense').reduce((sum, f) => sum + Math.abs(f.amount || 0), 0)
        data = {
          type: 'finance',
          summary: {
            totalIncome: income,
            totalExpenses: expenses,
            net: income - expenses
          },
          transactions: finance.slice(-50)
        }
      }
      setReportData(data)
    } catch (err) {
      console.error('Error generating report:', err)
      setError(err.message)
      setReportData(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    generateReport(activeReport)
  }, [activeReport, generateReport])

  const downloadReport = async () => {
    if (!reportData) return
    
    try {
      const title = activeReport === 'health' ? 'Herd Health Report' : activeReport === 'breeding' ? 'Breeding Report' : 'Feed Cost Analysis'
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      
      const sections = [
        new Paragraph({ text: 'JR FARM', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
        new Paragraph({ text: title, alignment: AlignmentType.CENTER, spacing: { after: 50 } }),
        new Paragraph({ text: `Date: ${today}`, alignment: AlignmentType.CENTER, spacing: { after: 300 } })
      ]
      
      Object.entries(reportData.summary || {}).forEach(([key, value]) => {
        sections.push(new Paragraph({
          text: `${key}: ${value}`,
          spacing: { after: 100 }
        }))
      })
      
      const doc = new Document({ sections: [{ children: sections }] })
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${activeReport}_report_${today}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      showError('Error downloading report: ' + err.message)
    }
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h2>📊 Additional Reports</h2>
      
      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        {reportTypes.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeReport === tab.id ? '3px solid #059669' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeReport === tab.id ? '600' : '400',
              color: activeReport === tab.id ? '#059669' : '#666',
              marginBottom: '-2px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '18px' }}>⏳ Loading {activeReport} report...</div>
        </div>
      ) : !reportData ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '18px' }}>No data available</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={downloadReport}
              style={{
                padding: '10px 20px',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📥 Download DOCX
            </button>
            <button
              onClick={() => {
                if (!reportData) return;
                if (reportData.animals) exportToCSV(reportData.animals, `${activeReport}_report.csv`)
                else if (reportData.transactions) exportToCSV(reportData.transactions, `${activeReport}_report.csv`)
                else if (reportData.expenses) exportToCSV(reportData.expenses, `${activeReport}_report.csv`)
                showSuccess('Exported CSV!')
              }}
              style={{
                padding: '10px 20px',
                background: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              ⬇️ Export CSV
            </button>
            <button
              onClick={() => {
                if (!reportData) return;
                if (reportData.animals) exportToJSON(reportData.animals, `${activeReport}_report.json`)
                else if (reportData.transactions) exportToJSON(reportData.transactions, `${activeReport}_report.json`)
                else if (reportData.expenses) exportToJSON(reportData.expenses, `${activeReport}_report.json`)
                showSuccess('Exported JSON!')
              }}
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              ⬇️ Export JSON
            </button>
          </div>
          {/* Scheduled/Automatic Report UI */}
          <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="Email for scheduled report"
              value={scheduleEmail}
              onChange={e => setScheduleEmail(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', minWidth: 220 }}
            />
            <input
              type="time"
              placeholder="Time (24h)"
              value={scheduleTime}
              onChange={e => setScheduleTime(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', minWidth: 120 }}
            />
            <button
              onClick={() => {
                if (!scheduleEmail || !scheduleTime) { showError('Enter email and time'); return; }
                showSuccess('Scheduled! (Backend integration required)');
              }}
              style={{ padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
            >
              ⏰ Schedule Email
            </button>
            <span style={{ fontSize: '13px', color: '#666' }}>
              (This is a UI placeholder. Backend integration needed for real scheduling.)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '30px' }}>
            {Object.entries(reportData.summary || {}).map(([key, value]) => (
              <div key={key} style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '12px', color: '#666', fontWeight: '600', marginBottom: '8px', textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1')}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                  {typeof value === 'number' && key.includes('Cost') ? formatCurrency(value) : value}
                </div>
              </div>
            ))}
          </div>

          {reportData.animals && reportData.animals.length > 0 && (
            <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
              <h3 style={{ marginTop: 0 }}>
                {activeReport === 'health' ? '🐄 Animal Health Status' : '👶 Breeding Animals'}
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#e5e7eb' }}>
                    {Object.keys(reportData.animals[0] || {}).map(key => (
                      <th key={key} style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>
                        {key.replace(/([A-Z])/g, ' $1')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.animals.slice(0, 50).map((animal, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      {Object.values(animal).map((val, vidx) => (
                        <td key={vidx} style={{ padding: '10px' }}>
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportData.expenses && reportData.expenses.length > 0 && (
            <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', overflowX: 'auto', marginTop: '20px' }}>
              <h3 style={{ marginTop: 0 }}>🌾 Feed Expenses</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#e5e7eb' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Date</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Amount</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Category</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.expenses.map((exp, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '10px' }}>{exp.date}</td>
                      <td style={{ padding: '10px', color: '#ef4444', fontWeight: '600' }}>{formatCurrency(exp.amount)}</td>
                      <td style={{ padding: '10px' }}>{exp.subcategory}</td>
                      <td style={{ padding: '10px', fontSize: '12px' }}>{exp.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
