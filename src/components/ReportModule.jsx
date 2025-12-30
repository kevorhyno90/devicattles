
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Button, Grid } from '@mui/material';
import { Bar, Line, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import ReportSummaryCard from './ReportSummaryCard';
import { getDashboardData } from '../lib/analytics';

const modules = [
  { name: 'Livestock', key: 'livestock' },
  { name: 'Finance', key: 'finance' },
  { name: 'Health', key: 'health' },
  { name: 'Crops', key: 'crops' },
];

const ReportModule = () => {
  const [selectedModule, setSelectedModule] = useState(modules[0].key);
  const [dashboard, setDashboard] = useState(null);
  // Editable insights state for each module
  const [editableInsights, setEditableInsights] = useState({
    livestock: {
      analysis: 'Livestock numbers are stable, with a slight increase in cattle. Feed costs remain the largest expense.',
      challenges: 'Disease outbreaks and feed price volatility.',
      recommendations: 'Implement regular health checks and explore alternative feed sources.'
    },
    finance: {
      analysis: 'Net profit has increased due to higher crop yields. Expenses are mostly labor and feed.',
      challenges: 'Managing cash flow during off-season.',
      recommendations: 'Diversify income streams and optimize expense tracking.'
    },
    health: {
      analysis: 'Health alerts are down, but vaccination rates need improvement.',
      challenges: 'Timely treatment and vaccination coverage.',
      recommendations: 'Automate health reminders and improve record-keeping.'
    },
    crops: {
      analysis: 'Crop yields are above average, but water usage is high.',
      challenges: 'Water management and pest control.',
      recommendations: 'Adopt drip irrigation and integrated pest management.'
    }
  });

  // Handler for editing insights
  const handleInsightChange = (moduleKey, field, value) => {
    setEditableInsights(prev => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [field]: value
      }
    }));
  };

  useEffect(() => {
    setDashboard(getDashboardData());
  }, []);

  // Filtering and sorting state
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  // Get detailed data for selected module
  const getModuleData = () => {
    if (!dashboard) return [];
    switch (selectedModule) {
      case 'livestock':
        return Object.entries(dashboard.animals?.byType || {}).map(([type, val]) => ({ type, count: val }));
      case 'finance':
        return [
          { key: 'Income', value: dashboard.finance?.income },
          { key: 'Expenses', value: dashboard.finance?.expenses },
          { key: 'Net Profit', value: dashboard.finance?.netProfit },
          { key: 'Transactions', value: dashboard.finance?.transactionCount },
        ];
      case 'health':
        return [
          { key: 'Health Alerts', value: dashboard.health?.totalAlerts },
          { key: 'Under Treatment', value: dashboard.health?.underTreatment },
          { key: 'Due Treatments', value: dashboard.health?.dueTreatments },
          { key: 'Needs Vaccination', value: dashboard.health?.needsVaccination },
        ];
      case 'crops':
        return Object.entries(dashboard.crops?.byType || {}).map(([type, val]) => ({ type, count: val }));
      default:
        return [];
    }
  };

  // Example analysis, challenges, recommendations for each module
  const moduleInsights = {
    livestock: {
      analysis: 'Livestock numbers are stable, with a slight increase in cattle. Feed costs remain the largest expense.',
      challenges: 'Disease outbreaks and feed price volatility.',
      recommendations: 'Implement regular health checks and explore alternative feed sources.'
    },
    finance: {
      analysis: 'Net profit has increased due to higher crop yields. Expenses are mostly labor and feed.',
      challenges: 'Managing cash flow during off-season.',
      recommendations: 'Diversify income streams and optimize expense tracking.'
    },
    health: {
      analysis: 'Health alerts are down, but vaccination rates need improvement.',
      challenges: 'Timely treatment and vaccination coverage.',
      recommendations: 'Automate health reminders and improve record-keeping.'
    },
    crops: {
      analysis: 'Crop yields are above average, but water usage is high.',
      challenges: 'Water management and pest control.',
      recommendations: 'Adopt drip irrigation and integrated pest management.'
    }
  };

  // Filter and sort data
  const filteredData = getModuleData().filter(item => {
    if (!filter) return true;
    return Object.values(item).some(val => String(val).toLowerCase().includes(filter.toLowerCase()));
  });
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortKey) return 0;
    if (sortOrder === 'asc') {
      return a[sortKey] > b[sortKey] ? 1 : -1;
    } else {
      return a[sortKey] < b[sortKey] ? 1 : -1;
    }
  });

  // Export CSV
  const handleExportCSV = () => {
    const rows = sortedData;
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(row => keys.map(k => row[k]).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedModule}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF (simple text table)
  const handleExportPDF = () => {
    import('jspdf').then(jsPDF => {
      const doc = new jsPDF.jsPDF();
      let y = 10;
      doc.text(`${selectedModule.charAt(0).toUpperCase() + selectedModule.slice(1)} Report`, 10, y);
      y += 10;
      sortedData.forEach(row => {
        doc.text(Object.values(row).join(' | '), 10, y);
        y += 10;
      });
      doc.save(`${selectedModule}-report.pdf`);
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Comprehensive Farm Report
      </Typography>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <label htmlFor="module-select" style={{ marginRight: 8 }}>Select Module:</label>
        <select
          id="module-select"
          value={selectedModule}
          onChange={e => setSelectedModule(e.target.value)}
          style={{ padding: 8, minWidth: 180 }}
          aria-label="Select report module"
        >
          {modules.map((mod) => (
            <option key={mod.key} value={mod.key}>{mod.name}</option>
          ))}
        </select>
      </Box>
      {(() => {
        const mod = modules.find(m => m.key === selectedModule);
        let moduleData = [];
        switch (mod.key) {
          case 'livestock':
            moduleData = Object.entries(dashboard?.animals?.byType || {}).map(([type, val]) => ({ type, count: val }));
            break;
          case 'finance':
            moduleData = [
              { key: 'Income', value: dashboard?.finance?.income },
              { key: 'Expenses', value: dashboard?.finance?.expenses },
              { key: 'Net Profit', value: dashboard?.finance?.netProfit },
              { key: 'Transactions', value: dashboard?.finance?.transactionCount },
            ];
            break;
          case 'health':
            moduleData = [
              { key: 'Health Alerts', value: dashboard?.health?.totalAlerts },
              { key: 'Under Treatment', value: dashboard?.health?.underTreatment },
              { key: 'Due Treatments', value: dashboard?.health?.dueTreatments },
              { key: 'Needs Vaccination', value: dashboard?.health?.needsVaccination },
            ];
            break;
          case 'crops':
            moduleData = Object.entries(dashboard?.crops?.byType || {}).map(([type, val]) => ({ type, count: val }));
            break;
          default:
            moduleData = [];
        }
        return (
          <Paper key={mod.key} sx={{ mb: 4, p: 2 }} elevation={3}>
            <Typography variant="h5" gutterBottom>{mod.name} Report</Typography>
            <ReportSummaryCard title={mod.name + ' Summary'} stats={moduleData.map(item => ({ label: Object.keys(item).join(' | '), value: Object.values(item).join(' | ')}))} />
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Analysis</Typography>
              <textarea
                value={editableInsights[mod.key].analysis}
                onChange={e => handleInsightChange(mod.key, 'analysis', e.target.value)}
                style={{ width: '100%', minHeight: 40, marginBottom: 8 }}
                aria-label={`Edit analysis for ${mod.name}`}
              />
              <Typography variant="h6">Challenges</Typography>
              <textarea
                value={editableInsights[mod.key].challenges}
                onChange={e => handleInsightChange(mod.key, 'challenges', e.target.value)}
                style={{ width: '100%', minHeight: 40, marginBottom: 8 }}
                aria-label={`Edit challenges for ${mod.name}`}
              />
              <Typography variant="h6">Recommendations</Typography>
              <textarea
                value={editableInsights[mod.key].recommendations}
                onChange={e => handleInsightChange(mod.key, 'recommendations', e.target.value)}
                style={{ width: '100%', minHeight: 40 }}
                aria-label={`Edit recommendations for ${mod.name}`}
              />
            </Box>
          </Paper>
        );
      })()}
    </Box>
  );
};

export default ReportModule;
