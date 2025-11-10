// Small image helper: resize/compress image files to Data URLs and estimate size
export function estimateDataUrlSize(dataUrl) {
  const base64 = (dataUrl || '').split(',')[1] || ''
  return Math.round(base64.length * 3 / 4)
}

export function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 9)
}

export function fileToDataUrl(file, { maxDim = 1024, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file'))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('File read error'))
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (Math.max(width, height) > maxDim) {
          const scale = maxDim / Math.max(width, height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        // prefer webp/jpg for smaller size; fall back to original mime if necessary
        const mime = 'image/jpeg'
        try {
          const dataUrl = canvas.toDataURL(mime, quality)
          const size = estimateDataUrlSize(dataUrl)
          resolve({ dataUrl, mime, size })
        } catch (err) {
          // fallback: return original reader.result
          const dataUrl = reader.result
          const size = estimateDataUrlSize(dataUrl)
          resolve({ dataUrl, mime: file.type || 'image/jpeg', size })
        }
      }
      img.onerror = () => reject(new Error('Invalid image'))
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
