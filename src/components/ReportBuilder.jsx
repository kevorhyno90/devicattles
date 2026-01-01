
import React, { useState } from 'react';
import { LineChart, BarChart, PieChart } from './Charts';

// Placeholder for available modules and fields. In production, fetch dynamically.
const MODULES = [
  { name: 'Livestock', fields: ['Animal ID', 'Breed', 'Weight', 'Health Status', 'Date Added'] },
  { name: 'Finance', fields: ['Transaction ID', 'Type', 'Amount', 'Date', 'Category'] },
  { name: 'Crops', fields: ['Field', 'Crop Type', 'Yield', 'Planting Date', 'Harvest Date'] },
  // Add more modules as needed
];


export default function ReportBuilder() {
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);
  const [filters, setFilters] = useState([]);
  const [reportName, setReportName] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [chartType, setChartType] = useState('table');

  const handleModuleChange = (e) => {
    setSelectedModule(e.target.value);
    setSelectedFields([]);
    setFilters([]);
    setPreviewData(null);
  };

  const handleFieldToggle = (field) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const handleAddFilter = () => {
    setFilters([...filters, { field: '', value: '' }]);
  };

  const handleFilterChange = (idx, key, value) => {
    setFilters(filters.map((f, i) => i === idx ? { ...f, [key]: value } : f));
  };

  const handlePreview = () => {
    // Placeholder: fetch preview data based on selections
    setPreviewData({
      columns: selectedFields,
      rows: [
        selectedFields.map(f => `${f} Example 1`),
        selectedFields.map(f => `${f} Example 2`),
      ],
    });
  };

  // Prepare chart data from previewData
  const getChartData = () => {
    if (!previewData || !previewData.columns.length) return [];
    // For demo: use first column as label, second as value if possible
    if (previewData.columns.length < 2) return [];
    return previewData.rows.map(row => ({
      label: row[0],
      value: parseFloat(row[1]) || 1
    }));
  };

  return (
    <div className="report-builder">
      <h2>Custom Report Builder</h2>
      <div>
        <label>Report Name: <input value={reportName} onChange={e => setReportName(e.target.value)} /></label>
      </div>
      <div>
        <label>Module:
          <select value={selectedModule} onChange={handleModuleChange}>
            <option value="">Select Module</option>
            {MODULES.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
          </select>
        </label>
      </div>
      {selectedModule && (
        <>
          <div>
            <strong>Fields:</strong>
            {MODULES.find(m => m.name === selectedModule).fields.map(field => (
              <label key={field} style={{ marginRight: 8 }}>
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field)}
                  onChange={() => handleFieldToggle(field)}
                /> {field}
              </label>
            ))}
          </div>
          <div>
            <strong>Filters:</strong>
            {filters.map((filter, idx) => (
              <div key={idx}>
                <select
                  value={filter.field}
                  onChange={e => handleFilterChange(idx, 'field', e.target.value)}
                >
                  <option value="">Select Field</option>
                  {MODULES.find(m => m.name === selectedModule).fields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
                <input
                  placeholder="Value"
                  value={filter.value}
                  onChange={e => handleFilterChange(idx, 'value', e.target.value)}
                />
              </div>
            ))}
            <button onClick={handleAddFilter}>Add Filter</button>
          </div>
          <div style={{ marginTop: 16 }}>
            <button onClick={handlePreview} disabled={!selectedFields.length}>Preview Report</button>
          </div>
        </>
      )}
      {previewData && (
        <div style={{ marginTop: 24 }}>
          <h3>Preview</h3>
          <div style={{ marginBottom: 12 }}>
            <label>Visualization: </label>
            <select value={chartType} onChange={e => setChartType(e.target.value)}>
              <option value="table">Table</option>
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="pie">Pie Chart</option>
            </select>
          </div>
          {chartType === 'table' && (
            <table border="1">
              <thead>
                <tr>
                  {previewData.columns.map(col => <th key={col}>{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {previewData.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => <td key={j}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {chartType === 'line' && <LineChart data={getChartData()} title="Line Chart" xLabel={previewData.columns[0]} yLabel={previewData.columns[1]} />}
          {chartType === 'bar' && <BarChart data={getChartData()} title="Bar Chart" xLabel={previewData.columns[0]} yLabel={previewData.columns[1]} />}
          {chartType === 'pie' && <PieChart data={getChartData()} title="Pie Chart" />}
        </div>
      )}
    </div>
  );
}
