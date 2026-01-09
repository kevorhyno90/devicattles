// Lightweight runtime loaders for large third-party ESM libs.
// Prototype: try loading `docx` from a CDN first to avoid bundling it.
export async function importDocx() {
  const cdnCandidates = [
    'https://cdn.jsdelivr.net/npm/docx@7.3.0/build/docx.mjs',
    'https://cdn.jsdelivr.net/npm/docx@7.3.0/dist/docx.mjs',
    'https://cdn.jsdelivr.net/npm/docx@7.3.0/dist/docx.es.mjs'
  ]

  for (const url of cdnCandidates) {
    try {
      // Dynamic import from CDN (won't be bundled by Vite)
      const m = await import(/* @vite-ignore */ url)
      if (m) return m
    } catch (e) {
      // continue to next candidate
      console.warn('CDN docx import failed for', url, e && e.message)
    }
  }

  // Fallback to local package (this will create a chunk if used)
  try {
    const local = await import('docx')
    return local
  } catch (e) {
    console.error('Both CDN and local import of docx failed', e)
    throw e
  }
}

export default { importDocx }
