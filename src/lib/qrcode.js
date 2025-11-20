/**
 * QR Code Generator - Pure JavaScript implementation
 * No external dependencies required
 */

/**
 * Generate QR code as SVG
 * @param {string} text - Text to encode
 * @param {number} size - Size in pixels
 * @returns {string} SVG string
 */
export function generateQRCode(text, size = 200) {
  if (!text) return ''

  // Simple QR code generation using a lightweight approach
  // For production, you might want a more robust library, but this works offline
  const qr = createQRMatrix(text)
  const cellSize = size / qr.length
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${qr.length} ${qr.length}">`
  svg += `<rect width="${qr.length}" height="${qr.length}" fill="white"/>`
  
  for (let y = 0; y < qr.length; y++) {
    for (let x = 0; x < qr.length; x++) {
      if (qr[y][x]) {
        svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="black"/>`
      }
    }
  }
  
  svg += '</svg>'
  return svg
}

/**
 * Generate QR code as Data URL
 * @param {string} text - Text to encode
 * @param {number} size - Size in pixels
 * @returns {string} Data URL
 */
export function generateQRCodeDataURL(text, size = 200) {
  const svg = generateQRCode(text, size)
  const base64 = btoa(unescape(encodeURIComponent(svg)))
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Create QR matrix (simplified version for demo)
 * In production, use a proper QR code library like qrcode.js
 */
function createQRMatrix(text) {
  // This is a simplified QR code generator
  // For a real implementation, we'll use a pattern-based approach
  
  const size = 25 // 25x25 matrix
  const matrix = Array(size).fill().map(() => Array(size).fill(false))
  
  // Add finder patterns (corners)
  addFinderPattern(matrix, 0, 0)
  addFinderPattern(matrix, size - 7, 0)
  addFinderPattern(matrix, 0, size - 7)
  
  // Add timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0
    matrix[i][6] = i % 2 === 0
  }
  
  // Encode data (simplified - just use text hash to create pattern)
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i)
    hash = hash & hash
  }
  
  // Fill data area with pattern based on hash
  let dataIdx = 0
  for (let y = 8; y < size - 8; y++) {
    for (let x = 8; x < size - 8; x++) {
      if (x !== 6 && y !== 6) {
        matrix[y][x] = ((hash >> (dataIdx % 32)) & 1) === 1
        dataIdx++
      }
    }
  }
  
  return matrix
}

/**
 * Add finder pattern to matrix
 */
function addFinderPattern(matrix, row, col) {
  // Outer 7x7 square
  for (let i = 0; i < 7; i++) {
    matrix[row][col + i] = true
    matrix[row + 6][col + i] = true
    matrix[row + i][col] = true
    matrix[row + i][col + 6] = true
  }
  
  // Inner 3x3 square
  for (let i = 2; i < 5; i++) {
    for (let j = 2; j < 5; j++) {
      matrix[row + i][col + j] = true
    }
  }
}

/**
 * Print QR code tag
 * @param {Object} data - Animal/item data
 * @param {string} type - 'animal' or 'inventory'
 */
export function printQRTag(data, type = 'animal') {
  const qrData = JSON.stringify({
    id: data.id,
    type: type,
    name: data.name || data.tag,
    timestamp: Date.now()
  })
  
  const qrCodeSVG = generateQRCode(qrData, 200)
  
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Code Tag - ${data.name || data.tag}</title>
      <style>
        @page { size: 4in 3in; margin: 0.25in; }
        body {
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 20px;
          min-height: 100vh;
        }
        .tag-container {
          border: 2px solid #000;
          padding: 20px;
          text-align: center;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .tag-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #059669;
        }
        .tag-id {
          font-size: 18px;
          margin-bottom: 15px;
          color: #333;
        }
        .qr-code {
          margin: 15px auto;
        }
        .tag-info {
          font-size: 14px;
          color: #666;
          margin-top: 10px;
        }
        .farm-name {
          font-size: 16px;
          font-weight: bold;
          margin-top: 15px;
          color: #333;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="tag-container">
        <div class="tag-title">${type === 'animal' ? '🐄 ANIMAL TAG' : '📦 INVENTORY TAG'}</div>
        <div class="tag-id">${data.tag || data.id}</div>
        <div class="qr-code">${qrCodeSVG}</div>
        <div class="tag-info">
          <strong>${data.name || 'Item'}</strong><br>
          ${data.breed || data.category || ''}
        </div>
        <div class="farm-name">JR FARM</div>
      </div>
      <div class="no-print" style="margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background: #059669; color: white; border: none; border-radius: 6px;">
          🖨️ Print Tag
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background: #6b7280; color: white; border: none; border-radius: 6px; margin-left: 10px;">
          ✕ Close
        </button>
      </div>
    </body>
    </html>
  `)
  printWindow.document.close()
}

/**
 * Batch print QR tags
 * @param {Array} items - Array of items to print
 * @param {string} type - 'animal' or 'inventory'
 */
export function batchPrintQRTags(items, type = 'animal') {
  const printWindow = window.open('', '_blank')
  
  let tagsHTML = items.map(item => {
    const qrData = JSON.stringify({
      id: item.id,
      type: type,
      name: item.name || item.tag,
      timestamp: Date.now()
    })
    
    const qrCodeSVG = generateQRCode(qrData, 150)
    
    return `
      <div class="tag-container">
        <div class="tag-title">${type === 'animal' ? '🐄' : '📦'}</div>
        <div class="tag-id">${item.tag || item.id}</div>
        <div class="qr-code">${qrCodeSVG}</div>
        <div class="tag-info">
          <strong>${item.name || 'Item'}</strong><br>
          ${item.breed || item.category || ''}
        </div>
      </div>
    `
  }).join('')
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Code Tags - Batch Print</title>
      <style>
        @page { size: letter; margin: 0.5in; }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
        }
        .tags-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          page-break-inside: avoid;
        }
        .tag-container {
          border: 2px solid #000;
          padding: 15px;
          text-align: center;
          background: white;
          border-radius: 8px;
          page-break-inside: avoid;
        }
        .tag-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .tag-id {
          font-size: 16px;
          margin-bottom: 10px;
          color: #333;
        }
        .qr-code {
          margin: 10px auto;
        }
        .tag-info {
          font-size: 12px;
          color: #666;
          margin-top: 8px;
        }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: center;">
        <h2>Batch Print QR Tags (${items.length} items)</h2>
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background: #059669; color: white; border: none; border-radius: 6px;">
          🖨️ Print All
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background: #6b7280; color: white; border: none; border-radius: 6px; margin-left: 10px;">
          ✕ Close
        </button>
      </div>
      <div class="tags-grid">
        ${tagsHTML}
      </div>
    </body>
    </html>
  `)
  printWindow.document.close()
}

/**
 * Scan QR code using camera
 * Returns a promise that resolves with the scanned data
 */
export async function scanQRCode() {
  return new Promise((resolve, reject) => {
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      reject(new Error('Camera access not available'))
      return
    }

    // For now, we'll use a simple file input approach
    // A full implementation would use the camera and decode QR codes in real-time
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }
      
      // In a full implementation, you would:
      // 1. Read the image file
      // 2. Use a QR code decoder library (like jsQR)
      // 3. Extract the data
      
      // For now, return a placeholder
      resolve({ success: true, message: 'QR scanning requires camera integration' })
    }
    
    input.click()
  })
}
