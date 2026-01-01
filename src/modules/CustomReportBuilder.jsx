import React, { useState, useEffect } from 'react'
import OfflineIndicator from '../components/OfflineIndicator'
import { scheduleReminder, getReminders } from '../lib/notifications'
import { useNavigate } from 'react-router-dom'
import { LineChart, BarChart, PieChart } from '../components/Charts'
import { loadData } from '../lib/storage'
import { exportToCSV, exportToPDF, exportToExcel, exportToDocx, printElement, batchPrint } from '../lib/exportImport'
export default function CustomReportBuilder() {
    // Helper component to render animals table
    function AnimalsTable() {
      // Try both keys for animal data
      let animals = loadData('cattalytics:animals', null);
      if (!animals || !Array.isArray(animals) || !animals.length) {
        animals = loadData('animals', []);
      }

      // Sample data for seeding (3 animals)
      const SAMPLE_ANIMALS = [
        { id: 'A-001', tag: 'TAG1001', name: 'Daisy', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2024-03-15', weight: 320, status: 'Active' },
        { id: 'A-002', tag: 'TAG1002', name: 'Bessie', breed: 'Jersey', sex: 'F', color: 'Brown', dob: '2021-05-10', weight: 480, status: 'Active' },
        { id: 'A-003', tag: 'DOG-001', name: 'Max', breed: 'German Shepherd', sex: 'M', color: 'Black/Tan', dob: '2022-04-15', weight: 38, status: 'Active' }
      ];

      // Seed function
      const handleSeedAnimals = () => {
        try {
          localStorage.setItem('cattalytics:animals', JSON.stringify(SAMPLE_ANIMALS));
          window.location.reload();
        } catch (e) {
          alert('Failed to seed animals: ' + e.message);
        }
      };

      // Clear and reseed function
      const handleClearAndReseed = () => {
        try {
          localStorage.removeItem('cattalytics:animals');
          localStorage.setItem('cattalytics:animals', JSON.stringify(SAMPLE_ANIMALS));
          window.location.reload();
        } catch (e) {
          alert('Failed to clear/reseed animals: ' + e.message);
        }
      };

      if (!animals || !Array.isArray(animals) || !animals.length) {
        return (
          <div>
            No animals found.<br />
            <button onClick={handleSeedAnimals} style={{marginTop:8, padding:'6px 16px', borderRadius:6, background:'#059669', color:'#fff', border:'none', cursor:'pointer'}}>Seed Sample Animals</button>
            <button onClick={handleClearAndReseed} style={{marginTop:8, marginLeft:8, padding:'6px 16px', borderRadius:6, background:'#dc2626', color:'#fff', border:'none', cursor:'pointer'}}>Clear & Reseed</button>
          </div>
        );
      }

      // Filter out any non-object entries
      const validAnimals = Array.isArray(animals)
        ? animals.filter(a => typeof a === 'object' && a !== null && Object.keys(a).length > 0)
        : [];

      if (!validAnimals || !validAnimals.length) {
        return (
          <div style={{color:'#dc2626',fontWeight:'bold',margin:'16px 0'}}>
            Animal data format error.<br />
            Please clear and reseed using the button above.<br />
            <pre style={{background:'#f3f4f6',padding:'8px',borderRadius:'6px',marginTop:'8px'}}>{JSON.stringify(animals, null, 2)}</pre>
          </div>
        );
      }

      // Compute union of all keys in all valid animal objects - with safety check
      const columnsSet = new Set();
      try {
        validAnimals.forEach(obj => {
          if (obj && typeof obj === 'object') {
            Object.keys(obj).forEach(k => columnsSet.add(k));
          }
        });
      } catch (e) {
        console.error('Error computing columns:', e);
        return <div style={{color:'#dc2626'}}>Error processing animal data</div>;
      }
      
      const columns = Array.from(columnsSet);
      
      // Ensure we have columns, otherwise show error
      if (!columns || columns.length === 0) {
        return <div style={{color:'#dc2626', padding: '12px', background: '#fee2e2', borderRadius: '6px'}}>No columns found in animal data</div>;
      }

      return (
        <div style={{ maxHeight: 500, overflow: 'auto', marginTop: 16, border: '1px solid #e5e7eb', borderRadius: '6px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                {columns.map(key => (
                  <th key={key} style={{ border: '1px solid #ddd', padding: 12, textAlign: 'left', fontWeight: 600 }}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {validAnimals.map((animal, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  {columns.map((col, i) => (
                    <td key={i} style={{ border: '1px solid #eee', padding: 10 }}>
                      {String(animal[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  // State for report configuration
  const [reportConfig, setReportConfig] = useState({
    dataSources: [],
    fields: [],
    filters: {},
    calculatedFields: []
  });

  const [scheduleConfig, setScheduleConfig] = useState({
    frequency: 'weekly',
    time: '09:00'
  });

  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedModule, setSelectedModule] = useState('custom');
  const [reportData, setReportData] = useState(null);

  // Multi-source report generation function
  const generateReport = () => {
    if (!reportConfig.dataSources || reportConfig.dataSources.length === 0) {
      alert('Please select at least one data source')
      return
    }
    if (reportConfig.fields.length === 0) {
      alert('Please select at least one field')
      return
    }
    try {
      const allData = {};
      reportConfig.dataSources.forEach(sourceKey => {
        allData[sourceKey] = loadData(sourceKey, [])
      })
      let combined = []
      if (reportConfig.dataSources.length === 1) {
        combined = allData[reportConfig.dataSources[0]].map(item => ({ [reportConfig.dataSources[0]]: item }))
      } else {
        const [first, ...rest] = reportConfig.dataSources
        combined = allData[first].map(item => ({ [first]: item }))
        rest.forEach(sourceKey => {
          const newCombined = []
          combined.forEach(row => {
            allData[sourceKey].forEach(item => {
              newCombined.push({ ...row, [sourceKey]: item })
            })
          })
          combined = newCombined
        })
      }
      // Store the report data for export
      setReportData(combined)
      alert('Report generated successfully!')
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error generating report: ' + error.message)
    }
  }

  // Handle schedule report
  const handleScheduleReport = () => {
    try {
      const reminder = {
        id: Date.now(),
        type: 'report',
        frequency: scheduleConfig.frequency,
        time: scheduleConfig.time,
        createdAt: new Date().toISOString()
      };
      scheduleReminder(reminder);
      setShowScheduleDialog(false);
      alert('Report scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling report:', error);
      alert('Error scheduling report: ' + error.message);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <label htmlFor="module-select" style={{ fontWeight: 'bold', marginRight: 8 }}>Select Module:</label>
        <select
          id="module-select"
          value={selectedModule}
          onChange={e => setSelectedModule(e.target.value)}
          style={{ padding: 8, minWidth: 180 }}
        >
          <option value="animals">Animals</option>
          <option value="custom">Custom Report</option>
          <option value="groups">Groups</option>
          <option value="finance">Finance</option>
          <option value="tasks">Tasks</option>
          <option value="crops">Crops</option>
          <option value="inventory">Inventory</option>
          <option value="resources">Resources</option>
          <option value="health">Health</option>
          <option value="marketPrices">Market Prices</option>
          <option value="weather">Weather</option>
          <option value="alerts">Alerts</option>
          <option value="schedules">Schedules</option>
          <option value="pastures">Pastures</option>
          <option value="photoGallery">Photo Gallery</option>
          <option value="canineManagement">Canine Management</option>
          <option value="bulkOperations">Bulk Operations</option>
          <option value="advancedAnalytics">Advanced Analytics</option>
          <option value="additionalReports">Additional Reports</option>
        </select>
      </div>

      {/* Render full report for selected module */}
      <div style={{ marginBottom: 32 }}>
        {selectedModule === 'custom' && (
          <>
            <h2>Custom Report Builder</h2>
            <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 'bold', marginRight: 8 }}>Select Data Sources:</label>
                <div>
                  {['animals', 'finance', 'crops', 'tasks'].map(source => (
                    <label key={source} style={{ marginRight: 16, display: 'inline-block' }}>
                      <input
                        type="checkbox"
                        checked={reportConfig.dataSources.includes(source)}
                        onChange={e => {
                          if (e.target.checked) {
                            setReportConfig({ ...reportConfig, dataSources: [...reportConfig.dataSources, source] });
                          } else {
                            setReportConfig({ ...reportConfig, dataSources: reportConfig.dataSources.filter(s => s !== source) });
                          }
                        }}
                      />
                      {source.charAt(0).toUpperCase() + source.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 'bold', marginRight: 8 }}>Select Fields:</label>
                <div>
                  {['ID', 'Name', 'Date', 'Status', 'Amount'].map(field => (
                    <label key={field} style={{ marginRight: 16, display: 'inline-block' }}>
                      <input
                        type="checkbox"
                        checked={reportConfig.fields.includes(field)}
                        onChange={e => {
                          if (e.target.checked) {
                            setReportConfig({ ...reportConfig, fields: [...reportConfig.fields, field] });
                          } else {
                            setReportConfig({ ...reportConfig, fields: reportConfig.fields.filter(f => f !== field) });
                          }
                        }}
                      />
                      {field}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={generateReport} style={{ padding: '8px 16px', borderRadius: 6, background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Generate Report</button>
                <button onClick={() => setShowScheduleDialog(true)} style={{ padding: '8px 16px', borderRadius: 6, background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Schedule Report</button>
                <button onClick={() => reportData ? exportToCSV(reportData, 'custom-report.csv') : alert('Please generate a report first')} style={{ padding: '8px 16px', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Download CSV</button>
                <button onClick={() => reportData ? exportToExcel(reportData, 'custom-report.xlsx') : alert('Please generate a report first')} style={{ padding: '8px 16px', borderRadius: 6, background: '#f59e0b', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Download Excel</button>
                <button onClick={() => reportData ? exportToPDF(reportData, 'custom-report.pdf', 'Custom Report') : alert('Please generate a report first')} style={{ padding: '8px 16px', borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Download PDF</button>
                <button onClick={() => reportData ? exportToDocx(reportData, 'custom-report.docx', 'Custom Report') : alert('Please generate a report first')} style={{ padding: '8px 16px', borderRadius: 6, background: '#8b5cf6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Download DOCX</button>
              </div>
            </div>
          </>
        )}
        {selectedModule === 'animals' && (
          <>
            <h2>Animals Full Report</h2>
            <div style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => {
                const animals = loadData('cattalytics:animals', null) || loadData('animals', []);
                if (animals && animals.length > 0) {
                  exportToCSV(animals, 'animals-report.csv');
                } else {
                  alert('No animals to export');
                }
              }} style={{ padding: '8px 16px', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500 }}>📥 Download CSV</button>
              <button onClick={() => {
                const animals = loadData('cattalytics:animals', null) || loadData('animals', []);
                if (animals && animals.length > 0) {
                  exportToExcel(animals, 'animals-report.xlsx');
                } else {
                  alert('No animals to export');
                }
              }} style={{ padding: '8px 16px', borderRadius: 6, background: '#f59e0b', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500 }}>📥 Download Excel</button>
              <button onClick={() => {
                const animals = loadData('cattalytics:animals', null) || loadData('animals', []);
                if (animals && animals.length > 0) {
                  exportToPDF(animals, 'animals-report.pdf', 'Animals Report');
                } else {
                  alert('No animals to export');
                }
              }} style={{ padding: '8px 16px', borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500 }}>📥 Download PDF</button>
              <button onClick={() => {
                const animals = loadData('cattalytics:animals', null) || loadData('animals', []);
                if (animals && animals.length > 0) {
                  exportToDocx(animals, 'animals-report.docx', 'Animals Report');
                } else {
                  alert('No animals to export');
                }
              }} style={{ padding: '8px 16px', borderRadius: 6, background: '#8b5cf6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500 }}>📥 Download DOCX</button>
              <button onClick={() => printElement('.animals-table')} style={{ padding: '8px 16px', borderRadius: 6, background: '#6b7280', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500 }}>🖨️ Print</button>
            </div>
            <div className="animals-table">
              <AnimalsTable />
            </div>
          </>
        )}
        {selectedModule === 'groups' && (
          <>
            <h2>Groups Full Report</h2>
            {/* ...groups report UI... */}
          </>
        )}
        {selectedModule === 'finance' && (
          <>
            <h2>Finance Full Report</h2>
            {/* ...finance report UI... */}
          </>
        )}
        {selectedModule === 'tasks' && (
          <>
            <h2>Tasks Full Report</h2>
            {/* ...tasks report UI... */}
          </>
        )}
        {selectedModule === 'crops' && (
          <>
            <h2>Crops Full Report</h2>
            {/* ...crops report UI... */}
          </>
        )}
        {selectedModule === 'inventory' && (
          <>
            <h2>Inventory Full Report</h2>
            {/* ...inventory report UI... */}
          </>
        )}
        {selectedModule === 'resources' && (
          <>
            <h2>Resources Full Report</h2>
            {/* ...resources report UI... */}
          </>
        )}
        {selectedModule === 'health' && (
          <>
            <h2>Health Full Report</h2>
            {/* ...health report UI... */}
          </>
        )}
        {selectedModule === 'marketPrices' && (
          <>
            <h2>Market Prices Full Report</h2>
            {/* ...market prices report UI... */}
          </>
        )}
        {selectedModule === 'weather' && (
          <>
            <h2>Weather Full Report</h2>
            {/* ...weather report UI... */}
          </>
        )}
        {selectedModule === 'alerts' && (
          <>
            <h2>Alerts Full Report</h2>
            {/* ...alerts report UI... */}
          </>
        )}
        {selectedModule === 'schedules' && (
          <>
            <h2>Schedules Full Report</h2>
            {/* ...schedules report UI... */}
          </>
        )}
        {selectedModule === 'pastures' && (
          <>
            <h2>Pastures Full Report</h2>
            {/* ...pastures report UI... */}
          </>
        )}
        {selectedModule === 'photoGallery' && (
          <>
            <h2>Photo Gallery Full Report</h2>
            {/* ...photo gallery report UI... */}
          </>
        )}
        {selectedModule === 'canineManagement' && (
          <>
            <h2>Canine Management Full Report</h2>
            {/* ...canine management report UI... */}
          </>
        )}
        {selectedModule === 'bulkOperations' && (
          <>
            <h2>Bulk Operations Full Report</h2>
            {/* ...bulk operations report UI... */}
          </>
        )}
        {selectedModule === 'advancedAnalytics' && (
          <>
            <h2>Advanced Analytics Full Report</h2>
            {/* ...advanced analytics report UI... */}
          </>
        )}
        {selectedModule === 'additionalReports' && (
          <>
            <h2>Additional Reports Full Report</h2>
            {/* ...additional reports report UI... */}
          </>
        )}
      </div>
      {showScheduleDialog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: 'white', borderRadius: 10, padding: 32, minWidth: 320, boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
            <h3 style={{ marginTop: 0 }}>⏰ Schedule Report</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 'bold', fontSize: 14 }}>Frequency</label>
              <select value={scheduleConfig.frequency} onChange={e => setScheduleConfig({ ...scheduleConfig, frequency: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', marginTop: 4 }}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 'bold', fontSize: 14 }}>Time</label>
              <input type="time" value={scheduleConfig.time} onChange={e => setScheduleConfig({ ...scheduleConfig, time: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', marginTop: 4 }} />
            </div>
            {/* Add more schedule dialog controls as needed */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowScheduleDialog(false)} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#e5e7eb', color: '#374151', fontWeight: 500 }}>Cancel</button>
              <button onClick={handleScheduleReport} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#6366f1', color: 'white', fontWeight: 500 }}>Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
