// Shared export/import utilities for all modules

// Export to CSV
export function exportToCSV(data, filename = 'export.csv', headers = null) {
  try {
    if (!data || data.length === 0) {
      alert('No data to export')
      return
    }

    // Auto-detect headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0])
    
    // Escape CSV values
    const escape = (val) => {
      if (val === null || val === undefined) return ''
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    // Build CSV rows
    const rows = data.map(item => 
      csvHeaders.map(header => escape(item[header])).join(',')
    )

    // Combine headers and rows
    const csv = [csvHeaders.join(','), ...rows].join('\n')

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('CSV export failed:', error)
    alert('Export failed: ' + error.message)
  }
}

// Export to Excel-compatible CSV (with BOM for proper UTF-8)
export function exportToExcel(data, filename = 'export.csv', headers = null) {
  try {
    if (!data || data.length === 0) {
      alert('No data to export')
      return
    }

    const csvHeaders = headers || Object.keys(data[0])
    
    const escape = (val) => {
      if (val === null || val === undefined) return ''
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const rows = data.map(item => 
      csvHeaders.map(header => escape(item[header])).join(',')
    )

    const csv = [csvHeaders.join(','), ...rows].join('\n')

    // Add BOM for Excel UTF-8 recognition
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename.replace('.csv', '') + '.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Excel export failed:', error)
    alert('Export failed: ' + error.message)
  }
}

// Export to JSON
export function exportToJSON(data, filename = 'export.json') {
  try {
    if (!data) {
      alert('No data to export')
      return
    }

    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('JSON export failed:', error)
    alert('Export failed: ' + error.message)
  }
}

// Import from CSV
export function importFromCSV(file, callback) {
  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const text = e.target.result
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        alert('File is empty')
        return
      }

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      
      // Parse data rows
      const data = []
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        if (values.length === headers.length) {
          const obj = {}
          headers.forEach((header, idx) => {
            obj[header] = values[idx]
          })
          data.push(obj)
        }
      }

      callback(data, null)
    } catch (error) {
      console.error('CSV import failed:', error)
      callback(null, error)
    }
  }

  reader.onerror = () => {
    callback(null, new Error('Failed to read file'))
  }

  reader.readAsText(file)
}

// Import from JSON
export function importFromJSON(file, callback) {
  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      callback(data, null)
    } catch (error) {
      console.error('JSON import failed:', error)
      callback(null, error)
    }
  }

  reader.onerror = () => {
    callback(null, new Error('Failed to read file'))
  }

  reader.readAsText(file)
}

// Helper: Parse CSV line handling quotes
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

// Print utility with custom styles
export function printElement(elementId, title = 'Print', reportType = 'Report') {
  const printWindow = window.open('', '_blank')
  const element = document.getElementById(elementId)
  
  if (!element) {
    alert('Element not found')
    return
  }

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page { 
          margin: 20mm; 
          size: A4;
        }
        body { 
          font-family: Arial, sans-serif; 
          font-size: 12pt;
          line-height: 1.4;
          color: #000;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 20px;
        }
        th, td { 
          border: 1px solid #000; 
          padding: 8px; 
          text-align: left; 
        }
        th { 
          background: #f0f0f0; 
          font-weight: bold;
        }
        h1, h2, h3 { 
          margin-top: 0;
        }
        .no-print {
          display: none;
        }
        @media print {
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 15px;">
        <h1 style="margin: 0; font-size: 28pt; letter-spacing: 2px;">HEADINGJR FARM</h1>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
          <div style="flex: 1;"></div>
          <div style="flex: 2; text-align: center;">
            <p style="margin: 5px 0; font-size: 11pt;">${reportType}</p>
            <p style="margin: 5px 0; font-size: 10pt; color: #555;">Date: ${today}</p>
          </div>
          <div style="flex: 1; text-align: right; font-size: 9pt; font-style: italic; color: #666;">
            Made by<br/>Dr. Devin Omwenga
          </div>
        </div>
      </div>
      ${element.innerHTML}
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

// Batch print multiple items
export function batchPrint(items, renderItem, title = 'Batch Print', reportType = 'Report') {
  const printWindow = window.open('', '_blank')
  
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  
  const content = items.map((item, index) => `
    <div class="print-page" style="page-break-after: ${index < items.length - 1 ? 'always' : 'auto'};">
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 15px;">
        <h1 style="margin: 0; font-size: 28pt; letter-spacing: 2px;">HEADINGJR FARM</h1>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
          <div style="flex: 1;"></div>
          <div style="flex: 2; text-align: center;">
            <p style="margin: 5px 0; font-size: 11pt;">${reportType}</p>
            <p style="margin: 5px 0; font-size: 10pt; color: #555;">Date: ${today}</p>
          </div>
          <div style="flex: 1; text-align: right; font-size: 9pt; font-style: italic; color: #666;">
            Made by<br/>Dr. Devin Omwenga
          </div>
        </div>
      </div>
      ${renderItem(item)}
    </div>
  `).join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page { 
          margin: 20mm; 
          size: A4;
        }
        body { 
          font-family: Arial, sans-serif; 
          font-size: 12pt;
          line-height: 1.4;
          color: #000;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 20px;
        }
        th, td { 
          border: 1px solid #000; 
          padding: 8px; 
          text-align: left; 
        }
        th { 
          background: #f0f0f0; 
          font-weight: bold;
        }
        h1, h2, h3 { 
          margin-top: 0;
        }
        .print-page {
          min-height: 100vh;
        }
      </style>
    </head>
    <body>
      ${content}
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}
