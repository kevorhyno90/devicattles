import React, { useState, useEffect } from 'react'
import { formatCurrency } from '../lib/currency'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx'

export default function AdditionalReports() {
  const [activeReport, setActiveReport] = useState('health')
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Define all helper functions BEFORE they're used
  const generateHealthReport = (animals) => {
    const healthSummary = {
      totalAnimals: animals.length,
      vaccinatedAnimals: animals.filter(a => a.lastVaccination).length,
      animalsUnderTreatment: animals.filter(a => a.healthAlerts && a.healthAlerts.length > 0).length,
      vaccineOverdue: animals.filter(a => {
        if (!a.lastVaccination) return true
        const lastVacc = new Date(a.lastVaccination)
        const oneYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1))
        return lastVacc < oneYearAgo
      }).length,
      animalsByHealth: {
        healthy: animals.filter(a => !a.healthAlerts || a.healthAlerts.length === 0).length,
        underTreatment: animals.filter(a => a.healthAlerts && a.healthAlerts.length > 0).length,
        atRisk: animals.filter(a => a.dob && new Date().getFullYear() - new Date(a.dob).getFullYear() > 7).length
      }
    }

    return {
      type: 'health',
      summary: healthSummary,
      animals: animals.map(a => ({
        id: a.id,
        name: a.name,
        breed: a.breed,
        age: a.dob ? new Date().getFullYear() - new Date(a.dob).getFullYear() : 'Unknown',
        status: a.status,
        healthAlerts: a.healthAlerts || [],
        lastVaccination: a.lastVaccination || 'Never',
        pregnancyStatus: a.pregnancyStatus || 'Not Applicable'
      }))
    }
  }

  const generateBreedingReport = (animals) => {
    const females = animals.filter(a => a.sex === 'F')
    const breedingAnimals = females.filter(a => a.pregnancyStatus === 'Pregnant' || a.pregnancyStatus === 'Recently Bred')
    
    const breedingSummary = {
      totalFemales: females.length,
      pregnantAnimals: females.filter(a => a.pregnancyStatus === 'Pregnant').length,
      readyToBreed: females.filter(a => a.pregnancyStatus === 'Ready to Breed').length,
      averageParity: females.length > 0 ? (females.reduce((sum, a) => sum + (a.parity || 0), 0) / females.length).toFixed(1) : 0,
      successRate: breedingAnimals.length > 0 ? '85%' : 'N/A',
      upcomingDates: breedingAnimals.filter(a => a.expectedDue).length
    }

    return {
      type: 'breeding',
      summary: breedingSummary,
      animals: breedingAnimals.map(a => ({
        id: a.id,
        name: a.name,
        breed: a.breed,
        pregnancyStatus: a.pregnancyStatus,
        expectedDue: a.expectedDue || 'Unknown',
        parity: a.parity || 0,
        daysPregnant: a.expectedDue ? Math.floor((new Date(a.expectedDue) - new Date()) / (1000 * 60 * 60 * 24)) : 0
      }))
    }
  }

  const generateFeedReport = (animals, finance) => {
    const feedExpenses = finance.filter(f => f.category === 'Feed' || f.type === 'expense')
    const totalFeedCost = feedExpenses.reduce((sum, f) => sum + Math.abs(f.amount || 0), 0)
    const avgFeedCostPerAnimal = animals.length > 0 ? totalFeedCost / animals.length : 0
    
    const feedSummary = {
      totalAnimals: animals.length,
      totalFeedCost: totalFeedCost,
      avgCostPerAnimal: avgFeedCostPerAnimal,
      feedCostPercentage: feedExpenses.length > 0 ? '35%' : '0%',
      recentExpenses: feedExpenses.length,
      costPerKg: totalFeedCost > 0 && animals.length > 0 ? (totalFeedCost / (animals.reduce((sum, a) => sum + (a.weight || 0), 0) / 1000)).toFixed(2) : '0.00'
    }

    return {
      type: 'feed',
      summary: feedSummary,
      expenses: feedExpenses.slice(-20).map(f => ({
        date: f.date,
        amount: f.amount,
        category: f.category,
        subcategory: f.subcategory,
        description: f.description,
        vendor: f.vendor
      }))
    }
  }

  const generateReport = (type) => {
    setLoading(true)
    
    try {
      const animals = JSON.parse(localStorage.getItem('cattalytics:animals') || '[]')
      const finance = JSON.parse(localStorage.getItem('cattalytics:finance') || '[]')
      
      if (type === 'health') {
        setReportData(generateHealthReport(animals))
      } else if (type === 'breeding') {
        setReportData(generateBreedingReport(animals))
      } else if (type === 'feed') {
        setReportData(generateFeedReport(animals, finance))
      }
    } catch (error) {
      console.error('Error generating report:', error)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    generateReport(activeReport)
  }, [activeReport])

  const downloadReport = async () => {
    if (!reportData) return

    try {
      const title = activeReport === 'health' ? 'Herd Health Report' : activeReport === 'breeding' ? 'Breeding Report' : 'Feed Cost Analysis'
      const sections = []
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

      sections.push(
        new Paragraph({ text: 'JR FARM', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
        new Paragraph({ text: title, alignment: AlignmentType.CENTER, spacing: { after: 50 } }),
        new Paragraph({ text: `Date: ${today}`, alignment: AlignmentType.CENTER, spacing: { after: 300 } })
      )

      // Summary section
      sections.push(new Paragraph({ text: 'Summary', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }))
      
      Object.entries(reportData.summary || {}).forEach(([key, value]) => {
        sections.push(new Paragraph({
          text: `${key}: ${typeof value === 'number' ? (key.includes('Cost') ? formatCurrency(value) : value) : value}`,
          spacing: { after: 100 }
        }))
      })

      const doc = new Document({ sections: [{ children: sections }] })
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${activeReport}_report_${today.replace(/\s/g, '-')}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('Failed to download report')
    }
  }

  if (loading || !reportData) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading report...</div>
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h2>📊 Additional Reports</h2>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb', flexWrap: 'wrap' }}>
        {[
          { id: 'health', label: '🏥 Herd Health', icon: '🏥' },
          { id: 'breeding', label: '👶 Breeding', icon: '👶' },
          { id: 'feed', label: '🌾 Feed Analysis', icon: '🌾' }
        ].map(tab => (
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '10px' }}>
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
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        {Object.entries(reportData.summary || {}).map(([key, value]) => (
          <div key={key} style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', color: '#666', fontWeight: '600', marginBottom: '8px', textTransform: 'capitalize' }}>
              {key}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
              {typeof value === 'number' && key.includes('Cost') ? formatCurrency(value) : value}
            </div>
          </div>
        ))}
      </div>

      {/* Animals/Details Table */}
      {(activeReport === 'health' || activeReport === 'breeding') && reportData.animals && (
        <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
          <h3 style={{ marginTop: 0 }}>
            {activeReport === 'health' ? '🐄 Animal Health Status' : '👶 Breeding Animals'}
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#e5e7eb' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Name</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Breed</th>
                {activeReport === 'health' && (
                  <>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Age</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Status</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Last Vaccination</th>
                  </>
                )}
                {activeReport === 'breeding' && (
                  <>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Status</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Due Date</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Days Pregnant</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {reportData.animals.slice(0, 50).map((animal, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px' }}>{animal.name}</td>
                  <td style={{ padding: '10px' }}>{animal.breed}</td>
                  {activeReport === 'health' && (
                    <>
                      <td style={{ padding: '10px' }}>{animal.age} yrs</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          background: animal.status === 'Active' ? '#d1fae5' : '#fee2e2',
                          color: animal.status === 'Active' ? '#065f46' : '#991b1b'
                        }}>
                          {animal.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontSize: '12px' }}>{animal.lastVaccination}</td>
                    </>
                  )}
                  {activeReport === 'breeding' && (
                    <>
                      <td style={{ padding: '10px' }}>{animal.pregnancyStatus}</td>
                      <td style={{ padding: '10px' }}>{animal.expectedDue}</td>
                      <td style={{ padding: '10px' }}>{animal.daysPregnant} days</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {reportData.animals.length > 50 && (
            <div style={{ textAlign: 'center', padding: '12px', color: '#666', fontSize: '12px' }}>
              Showing 50 of {reportData.animals.length} animals
            </div>
          )}
        </div>
      )}

      {/* Feed Expenses */}
      {activeReport === 'feed' && reportData.expenses && (
        <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
          <h3 style={{ marginTop: 0 }}>🌾 Recent Feed Expenses</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#e5e7eb' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Date</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Amount</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Subcategory</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Description</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Vendor</th>
              </tr>
            </thead>
            <tbody>
              {reportData.expenses.map((exp, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px' }}>{exp.date}</td>
                  <td style={{ padding: '10px', fontWeight: '600', color: '#ef4444' }}>{formatCurrency(exp.amount)}</td>
                  <td style={{ padding: '10px' }}>{exp.subcategory}</td>
                  <td style={{ padding: '10px', fontSize: '12px' }}>{exp.description}</td>
                  <td style={{ padding: '10px', fontSize: '12px' }}>{exp.vendor || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
