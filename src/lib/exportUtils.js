// Utility functions for exporting data to CSV, Excel, and PDF
// For Excel and PDF, use dynamic imports to avoid increasing bundle size if not used


// Path to logo (publicly accessible)
const LOGO_URL = '/assets/jr-farm-logo.png'
const LOGO_TEXT = 'JR FARM'

export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) return
  // Insert logo row at the top (CSV can't embed images, so use text)
  const logoRow = [LOGO_TEXT, '', '', '', '']
  const processRow = row => row.map(String).map(v => '"' + v.replace(/"/g, '""') + '"').join(',')
  const csvContent = [logoRow, ...rows].map(processRow).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : filename + '.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function exportToExcel(filename, rows) {
  const XLSX = await import('xlsx')
  // Insert logo row at the top (Excel: text only, unless using advanced image embedding)
  const logoRow = [LOGO_TEXT, '', '', '', '']
  const ws = XLSX.utils.aoa_to_sheet([logoRow, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : filename + '.xlsx')
}

export async function exportToPDF(filename, rows, title = 'Report') {
  const jsPDF = (await import('jspdf')).default
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF()
  // Add logo image at the top (if available)
  try {
    const img = new Image()
    img.src = LOGO_URL
    await new Promise(resolve => { img.onload = resolve; img.onerror = resolve })
    doc.addImage(img, 'PNG', 14, 8, 32, 32)
    doc.text(title, 50, 24)
  } catch {
    doc.text(LOGO_TEXT, 14, 16)
    doc.text(title, 14, 28)
  }
  autoTable(doc, { head: [rows[0]], body: rows.slice(1), startY: 44 })
  doc.save(filename.endsWith('.pdf') ? filename : filename + '.pdf')
}
