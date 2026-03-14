import { NOTIFICATION_TYPES, PRIORITIES, scheduleReminder, getReminders } from './notifications'

const LIVESTOCK_QUALITY_DISMISSED_KEY = 'cattalytics:livestock:quality:dismissed'
const LIVESTOCK_QUALITY_TREND_KEY = 'cattalytics:livestock:quality:trend'

function parseDateSafe(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function validateFeedingEventInput(input) {
  const errors = []
  const quantity = Number(input.quantity)
  const cost = Number(input.cost || 0)
  const eventDate = parseDateSafe(input.date)

  if (!input.feedType || !String(input.feedType).trim()) errors.push('Feed type is required')
  if (!eventDate) errors.push('A valid feeding date is required')
  if (!Number.isFinite(quantity) || quantity <= 0) errors.push('Quantity must be greater than 0')
  if (!Number.isFinite(cost) || cost < 0) errors.push('Cost cannot be negative')
  if (!Array.isArray(input.animals) || input.animals.length === 0) errors.push('Select at least one animal')

  return { valid: errors.length === 0, errors }
}

export function validateTreatmentInput(input) {
  const errors = []
  const cost = Number(input.cost || 0)
  const nextDue = parseDateSafe(input.nextDue)

  if (!input.animalId) errors.push('Animal is required')
  if (!input.treatment || !String(input.treatment).trim()) errors.push('Treatment description is required')
  if (!Number.isFinite(cost) || cost < 0) errors.push('Cost cannot be negative')
  if (input.nextDue && !nextDue) errors.push('Next due date is invalid')

  return { valid: errors.length === 0, errors }
}

export function validateMilkInput(input) {
  const errors = []
  const liters = Number(input.liters)
  const milkSold = Number(input.milkSold || 0)
  const milkToCalf = Number(input.milkToCalf || 0)
  const milkConsumed = Number(input.milkConsumed || 0)
  const spoiledMilk = Number(input.spoiledMilk || 0)
  const pricePerLiter = Number(input.pricePerLiter || 0)

  if (!input.animalId) errors.push('Animal is required')
  if (!Number.isFinite(liters) || liters <= 0) errors.push('Milk liters must be greater than 0')
  if (!Number.isFinite(milkSold) || milkSold < 0) errors.push('Milk sold cannot be negative')
  if (!Number.isFinite(pricePerLiter) || pricePerLiter < 0) errors.push('Price per liter cannot be negative')

  const totalAllocated = milkSold + milkToCalf + milkConsumed + spoiledMilk
  if (Number.isFinite(liters) && totalAllocated > liters + 0.001) {
    errors.push('Sold, calf, consumed, and spoiled milk cannot exceed total milk')
  }

  if (input.sold && milkSold <= 0) {
    errors.push('Milk sold must be greater than 0 when marked as sold')
  }

  return { valid: errors.length === 0, errors }
}

export function scheduleLivestockReminder(reminder) {
  const dueDate = parseDateSafe(reminder.dueDate)
  if (!dueDate) return null

  const title = reminder.title || 'Livestock reminder'
  const entityId = reminder.entityId || null
  const entityType = reminder.entityType || 'livestock'

  // Deduplicate by title + dueDate + entity on the same day.
  const existing = getReminders().find((r) => {
    return (
      r.title === title &&
      r.entityId === entityId &&
      r.entityType === entityType &&
      new Date(r.dueDate).toDateString() === dueDate.toDateString()
    )
  })

  if (existing) return existing

  return scheduleReminder({
    type: reminder.type || NOTIFICATION_TYPES.GENERAL,
    title,
    body: reminder.body || '',
    dueDate: dueDate.toISOString(),
    entityId,
    entityType,
    priority: reminder.priority || PRIORITIES.MEDIUM
  })
}

export function validateGoatHealthInput(input) {
  const errors = []
  const cost = Number(input.cost || 0)

  if (!input.goatId) errors.push('Goat is required')
  if (!input.eventType || !String(input.eventType).trim()) errors.push('Health event type is required')
  if (!Number.isFinite(cost) || cost < 0) errors.push('Health cost cannot be negative')
  if (input.followUpDate && !parseDateSafe(input.followUpDate)) errors.push('Follow-up date is invalid')

  return { valid: errors.length === 0, errors }
}

export function validateGoatBreedingInput(input) {
  const errors = []

  if (!input.goatId) errors.push('Goat is required')
  if (!input.eventType || !String(input.eventType).trim()) errors.push('Breeding event type is required')
  if (input.expectedDueDate && !parseDateSafe(input.expectedDueDate)) errors.push('Expected due date is invalid')

  return { valid: errors.length === 0, errors }
}

export function validateKidHealthInput(input) {
  const errors = []
  const cost = Number(input.cost || 0)

  if (!input.kidId) errors.push('Kid is required')
  if (!input.type || !String(input.type).trim()) errors.push('Kid health event type is required')
  if (!Number.isFinite(cost) || cost < 0) errors.push('Kid health cost cannot be negative')
  if (input.nextVisit && !parseDateSafe(input.nextVisit)) errors.push('Next visit date is invalid')

  return { valid: errors.length === 0, errors }
}

export function validatePoultryEggInput(input) {
  const errors = []
  const collected = Number(input.collected || 0)
  const broken = Number(input.broken || 0)
  const sold = Number(input.sold || 0)
  const used = Number(input.used || 0)
  const price = Number(input.price || 0)

  if (!input.flockId) errors.push('Flock is required')
  if (!Number.isFinite(collected) || collected <= 0) errors.push('Collected eggs must be greater than 0')
  if ([broken, sold, used].some((v) => !Number.isFinite(v) || v < 0)) {
    errors.push('Broken, sold, and used eggs cannot be negative')
  }
  if (broken + sold + used > collected) errors.push('Broken + sold + used cannot exceed collected eggs')
  if (!Number.isFinite(price) || price < 0) errors.push('Egg sale price cannot be negative')

  return { valid: errors.length === 0, errors }
}

export function validatePoultryHealthInput(input) {
  const errors = []
  const cost = Number(input.cost || 0)

  if (!input.flockId) errors.push('Flock is required')
  if (!input.type || !String(input.type).trim()) errors.push('Health record type is required')
  if (!Number.isFinite(cost) || cost < 0) errors.push('Health cost cannot be negative')

  return { valid: errors.length === 0, errors }
}

export function validateCanineHealthInput(input) {
  const errors = []

  if (!input.canineId) errors.push('Canine is required')
  if (!input.condition || !String(input.condition).trim()) errors.push('Health condition is required')
  if (input.date && !parseDateSafe(input.date)) errors.push('Health date is invalid')

  return { valid: errors.length === 0, errors }
}

export function validateCanineVaccineInput(input) {
  const errors = []

  if (!input.canineId) errors.push('Canine is required')
  if (!input.vaccineType || !String(input.vaccineType).trim()) errors.push('Vaccine type is required')
  if (input.date && !parseDateSafe(input.date)) errors.push('Vaccine date is invalid')
  if (input.boosterDue && !parseDateSafe(input.boosterDue)) errors.push('Booster due date is invalid')

  return { valid: errors.length === 0, errors }
}

export function validateCanineHusbandryInput(input) {
  const errors = []

  if (!input.canineId) errors.push('Canine is required')
  if (!input.feedType || !String(input.feedType).trim()) errors.push('Feed type is required')

  return { valid: errors.length === 0, errors }
}

export function validateBSFColonyInput(input) {
  const errors = []
  const population = Number(input.population || 0)

  if (!input.name || !String(input.name).trim()) errors.push('Colony name is required')
  if (input.establishedDate && !parseDateSafe(input.establishedDate)) errors.push('Established date is invalid')
  if (!Number.isFinite(population) || population < 0) errors.push('Population cannot be negative')

  return { valid: errors.length === 0, errors }
}

export function validateBSFFeedingInput(input) {
  const errors = []
  const amount = Number(input.amount || 0)
  const cost = Number(input.cost || 0)

  if (!input.colonyId) errors.push('Colony is required')
  if (!Number.isFinite(amount) || amount <= 0) errors.push('Feeding amount must be greater than 0')
  if (!Number.isFinite(cost) || cost < 0) errors.push('Feeding cost cannot be negative')

  return { valid: errors.length === 0, errors }
}

export function validateBSFHarvestInput(input) {
  const errors = []
  const quantity = Number(input.quantity || 0)
  const salePrice = Number(input.salePrice || 0)

  if (!input.colonyId) errors.push('Colony is required')
  if (!Number.isFinite(quantity) || quantity <= 0) errors.push('Harvest quantity must be greater than 0')
  if (!Number.isFinite(salePrice) || salePrice < 0) errors.push('Sale price cannot be negative')

  return { valid: errors.length === 0, errors }
}

function getLocalList(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocalList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

function getDismissedIssueFingerprints() {
  try {
    const raw = localStorage.getItem(LIVESTOCK_QUALITY_DISMISSED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function makeIssueFingerprint(issue) {
  return `${issue.module}:${issue.code}:${issue.entityId || issue.id}`
}

function pushQualityTrendSnapshot(summary) {
  try {
    const existing = getLocalList(LIVESTOCK_QUALITY_TREND_KEY)
    const now = new Date()
    const bucket = now.toISOString().slice(0, 13) // hourly bucket

    const point = {
      bucket,
      timestamp: now.toISOString(),
      total: summary.totalIssues,
      high: summary.high,
      medium: summary.medium,
      low: summary.low
    }

    const idx = existing.findIndex((p) => p.bucket === bucket)
    if (idx >= 0) existing[idx] = point
    else existing.push(point)

    const recent = existing.slice(-168) // last 7 days in hourly buckets
    saveLocalList(LIVESTOCK_QUALITY_TREND_KEY, recent)
  } catch {
    // no-op
  }
}

export function getLivestockQualityTrend(limit = 24) {
  const points = getLocalList(LIVESTOCK_QUALITY_TREND_KEY)
  return points.slice(-Math.max(1, Number(limit || 24)))
}

export function dismissLivestockQualityIssue(fingerprint) {
  if (!fingerprint) return false
  const existing = getDismissedIssueFingerprints()
  if (existing.includes(fingerprint)) return true
  return saveLocalList(LIVESTOCK_QUALITY_DISMISSED_KEY, [...existing, fingerprint])
}

export function clearDismissedLivestockQualityIssues() {
  try {
    localStorage.removeItem(LIVESTOCK_QUALITY_DISMISSED_KEY)
    return true
  } catch {
    return false
  }
}

export function applyLivestockAutoFix(issue) {
  if (!issue || !issue.fixable) return { ok: false, message: 'Issue is not auto-fixable' }

  try {
    if (issue.code === 'dairy-invalid-expected-due') {
      const animals = getLocalList('cattalytics:animals')
      const updated = animals.map((a) => a.id === issue.entityId ? { ...a, expectedDue: '' } : a)
      saveLocalList('cattalytics:animals', updated)
      return { ok: true, message: 'Cleared invalid expected due date' }
    }

    if (issue.code === 'goat-negative-weight') {
      const goats = getLocalList('cattalytics:goats')
      const updated = goats.map((g) => g.id === issue.entityId ? { ...g, weight: '' } : g)
      saveLocalList('cattalytics:goats', updated)
      return { ok: true, message: 'Cleared negative goat weight value' }
    }

    if (issue.code === 'canine-missing-role') {
      const animals = getLocalList('cattalytics:animals')
      const updated = animals.map((a) => a.id === issue.entityId ? { ...a, role: a.role || 'Guard Dog' } : a)
      saveLocalList('cattalytics:animals', updated)
      return { ok: true, message: 'Applied default canine role' }
    }

    if (issue.code === 'bsf-invalid-population') {
      const colonies = getLocalList('cattalytics:bsf:colonies')
      const updated = colonies.map((c) => c.id === issue.entityId ? { ...c, population: Math.max(0, Number(c.population || 0)) } : c)
      saveLocalList('cattalytics:bsf:colonies', updated)
      return { ok: true, message: 'Normalized BSF population to non-negative value' }
    }

    return { ok: false, message: 'No auto-fix available for this issue' }
  } catch (error) {
    return { ok: false, message: error?.message || 'Auto-fix failed' }
  }
}

export function applyAllLivestockAutoFixes(issues = []) {
  const fixable = Array.isArray(issues) ? issues.filter((i) => i?.fixable) : []
  let fixed = 0
  let failed = 0

  fixable.forEach((issue) => {
    const result = applyLivestockAutoFix(issue)
    if (result.ok) fixed += 1
    else failed += 1
  })

  return {
    totalFixable: fixable.length,
    fixed,
    failed
  }
}

export function getLivestockDataQualityReport(options = {}) {
  const maxIssues = Number(options.maxIssues || 20)
  const includeDismissed = Boolean(options.includeDismissed)
  const dismissed = getDismissedIssueFingerprints()
  const issues = []

  const animals = getLocalList('cattalytics:animals')
  const goats = getLocalList('cattalytics:goats')
  const flocks = getLocalList('cattalytics:flocks')
  const eggRecords = getLocalList('cattalytics:egg_production')
  const bsfColonies = getLocalList('cattalytics:bsf:colonies')
  const canines = animals.filter((a) => a?.groupId === 'G-008')

  animals.forEach((a) => {
    if (!a?.id || !a?.tag || !a?.name) {
      issues.push({
        id: a?.id || `animal-missing-${issues.length}`,
        entityId: a?.id || null,
        code: 'dairy-missing-core-fields',
        module: 'Dairy',
        severity: 'high',
        message: `Animal ${a?.name || 'Unknown'} is missing ID/tag/name fields.`,
        actionView: 'animals',
        fixable: false
      })
    }
    if (a?.expectedDue && !parseDateSafe(a.expectedDue)) {
      issues.push({
        id: a?.id || `animal-date-${issues.length}`,
        entityId: a?.id || null,
        code: 'dairy-invalid-expected-due',
        module: 'Dairy',
        severity: 'medium',
        message: `Animal ${a?.name || 'Unknown'} has an invalid expected due date.`,
        actionView: 'animals',
        fixable: true
      })
    }
  })

  goats.forEach((g) => {
    if (!g?.tagNumber || !g?.name) {
      issues.push({
        id: g?.id || `goat-missing-${issues.length}`,
        entityId: g?.id || null,
        code: 'goat-missing-core-fields',
        module: 'Goat',
        severity: 'high',
        message: `Goat ${g?.name || 'Unknown'} is missing tag or name.`,
        actionView: 'goats',
        fixable: false
      })
    }
    if (g?.weight !== '' && g?.weight != null && Number(g.weight) < 0) {
      issues.push({
        id: g?.id || `goat-weight-${issues.length}`,
        entityId: g?.id || null,
        code: 'goat-negative-weight',
        module: 'Goat',
        severity: 'medium',
        message: `Goat ${g?.name || 'Unknown'} has a negative weight value.`,
        actionView: 'goats',
        fixable: true
      })
    }
  })

  canines.forEach((d) => {
    if (!d?.name || !d?.role) {
      issues.push({
        id: d?.id || `canine-missing-${issues.length}`,
        entityId: d?.id || null,
        code: 'canine-missing-role',
        module: 'Canine',
        severity: 'medium',
        message: `Canine ${d?.name || 'Unknown'} is missing name or role.`,
        actionView: 'canines',
        fixable: true
      })
    }
  })

  flocks.forEach((f) => {
    if (!f?.name || Number(f?.quantity || 0) <= 0) {
      issues.push({
        id: f?.id || `flock-missing-${issues.length}`,
        entityId: f?.id || null,
        code: 'poultry-invalid-flock-quantity',
        module: 'Poultry',
        severity: 'high',
        message: `Flock ${f?.name || 'Unknown'} has missing name or invalid quantity.`,
        actionView: 'poultry',
        fixable: false
      })
    }
  })

  eggRecords.forEach((r) => {
    const collected = Number(r?.collected || 0)
    const broken = Number(r?.broken || 0)
    const sold = Number(r?.sold || 0)
    const used = Number(r?.used || 0)
    if (broken + sold + used > collected && collected > 0) {
      issues.push({
        id: r?.id || `egg-inconsistent-${issues.length}`,
        entityId: r?.id || null,
        code: 'poultry-egg-totals-inconsistent',
        module: 'Poultry',
        severity: 'high',
        message: `Egg record ${r?.id || ''} has inconsistent collected/sold/used totals.`,
        actionView: 'poultry',
        fixable: false
      })
    }
  })

  bsfColonies.forEach((c) => {
    const population = Number(c?.population || 0)
    if (!c?.name || population < 0) {
      issues.push({
        id: c?.id || `bsf-missing-${issues.length}`,
        entityId: c?.id || null,
        code: 'bsf-invalid-population',
        module: 'BSF',
        severity: 'high',
        message: `BSF colony ${c?.name || 'Unknown'} has invalid name or population.`,
        actionView: 'bsf',
        fixable: true
      })
    }
  })

  const enriched = issues.map((issue) => {
    const fingerprint = makeIssueFingerprint(issue)
    return { ...issue, fingerprint, dismissed: dismissed.includes(fingerprint) }
  })

  const visible = includeDismissed ? enriched : enriched.filter((i) => !i.dismissed)
  const cappedIssues = visible.slice(0, Math.max(1, maxIssues))

  const summary = {
    totalIssues: visible.length,
    dismissedIssues: enriched.filter((i) => i.dismissed).length,
    high: visible.filter((i) => i.severity === 'high').length,
    medium: visible.filter((i) => i.severity === 'medium').length,
    low: visible.filter((i) => i.severity === 'low').length,
    modules: {
      dairy: visible.filter((i) => i.module === 'Dairy').length,
      goat: visible.filter((i) => i.module === 'Goat').length,
      canine: visible.filter((i) => i.module === 'Canine').length,
      poultry: visible.filter((i) => i.module === 'Poultry').length,
      bsf: visible.filter((i) => i.module === 'BSF').length
    }
  }

  if (!options.skipTrend) {
    pushQualityTrendSnapshot(summary)
  }

  return {
    summary,
    issues: cappedIssues,
    trend: getLivestockQualityTrend(24),
    generatedAt: new Date().toISOString()
  }
}

export function getLivestockQualityScores() {
  const animals = getLocalList('cattalytics:animals')
  const goats = getLocalList('cattalytics:goats')
  const flocks = getLocalList('cattalytics:flocks')
  const bsfColonies = getLocalList('cattalytics:bsf:colonies')
  const canines = animals.filter((a) => a?.groupId === 'G-008')

  const report = getLivestockDataQualityReport({ maxIssues: 200, includeDismissed: true, skipTrend: true })
  const moduleIssueCounts = {
    dairy: report.summary.modules.dairy,
    goat: report.summary.modules.goat,
    canine: report.summary.modules.canine,
    poultry: report.summary.modules.poultry,
    bsf: report.summary.modules.bsf
  }

  const moduleEntities = {
    dairy: Math.max(1, animals.length),
    goat: Math.max(1, goats.length),
    canine: Math.max(1, canines.length),
    poultry: Math.max(1, flocks.length),
    bsf: Math.max(1, bsfColonies.length)
  }

  const toScore = (issues, entities) => {
    const densityPenalty = Math.min(70, (issues / entities) * 60)
    const volumePenalty = Math.min(30, issues * 4)
    const score = Math.round(Math.max(0, 100 - densityPenalty - volumePenalty))
    return score
  }

  return {
    dairy: { score: toScore(moduleIssueCounts.dairy, moduleEntities.dairy), issues: moduleIssueCounts.dairy },
    goat: { score: toScore(moduleIssueCounts.goat, moduleEntities.goat), issues: moduleIssueCounts.goat },
    canine: { score: toScore(moduleIssueCounts.canine, moduleEntities.canine), issues: moduleIssueCounts.canine },
    poultry: { score: toScore(moduleIssueCounts.poultry, moduleEntities.poultry), issues: moduleIssueCounts.poultry },
    bsf: { score: toScore(moduleIssueCounts.bsf, moduleEntities.bsf), issues: moduleIssueCounts.bsf }
  }
}

export function getMilkPhase2Insights(records = []) {
  const list = Array.isArray(records) ? records : []

  const monthTotals = {}
  const yearTotals = {}

  list.forEach((item) => {
    const date = parseDateSafe(item?.date || item?.timestamp)
    if (!date) return

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const yearKey = String(date.getFullYear())
    const liters = Number(item?.liters || 0)
    const sold = Number(item?.milkSold || 0)
    const revenue = Number(item?.totalPrice || 0)

    if (!monthTotals[monthKey]) monthTotals[monthKey] = { liters: 0, sold: 0, revenue: 0, count: 0 }
    if (!yearTotals[yearKey]) yearTotals[yearKey] = { liters: 0, sold: 0, revenue: 0, count: 0 }

    monthTotals[monthKey].liters += liters
    monthTotals[monthKey].sold += sold
    monthTotals[monthKey].revenue += revenue
    monthTotals[monthKey].count += 1

    yearTotals[yearKey].liters += liters
    yearTotals[yearKey].sold += sold
    yearTotals[yearKey].revenue += revenue
    yearTotals[yearKey].count += 1
  })

  const dayTotals = {}
  list.forEach((item) => {
    if (!item?.date) return
    if (!dayTotals[item.date]) dayTotals[item.date] = 0
    dayTotals[item.date] += Number(item?.liters || 0)
  })

  const dayKeys = Object.keys(dayTotals).sort()
  const recentDays = dayKeys.slice(-14)
  const previousDays = dayKeys.slice(-28, -14)
  const avgRecent = recentDays.length
    ? recentDays.reduce((sum, d) => sum + dayTotals[d], 0) / recentDays.length
    : 0
  const avgPrevious = previousDays.length
    ? previousDays.reduce((sum, d) => sum + dayTotals[d], 0) / previousDays.length
    : 0
  const trendDelta = avgRecent - avgPrevious

  return {
    monthTotals,
    yearTotals,
    trend: {
      avgRecent,
      avgPrevious,
      delta: trendDelta,
      direction: trendDelta > 0.01 ? 'up' : trendDelta < -0.01 ? 'down' : 'flat'
    }
  }
}

export function getTreatmentPhase2Insights(records = []) {
  const list = Array.isArray(records) ? records : []
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const withDue = list.filter((r) => parseDateSafe(r?.nextDue))
  const overdue = withDue.filter((r) => parseDateSafe(r.nextDue) < startToday)
  const dueIn7Days = withDue.filter((r) => {
    const d = parseDateSafe(r.nextDue)
    if (!d) return false
    const diffDays = Math.floor((d - startToday) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7
  })
  const vaccinations = list.filter((r) => String(r?.treatmentType || '').toLowerCase() === 'vaccination')
  const vaccinationDueSoon = vaccinations.filter((r) => {
    const d = parseDateSafe(r?.nextDue)
    if (!d) return false
    const diffDays = Math.floor((d - startToday) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 30
  })

  return {
    overdue,
    dueIn7Days,
    vaccinations,
    vaccinationDueSoon
  }
}

export function getMeasurementPhase2Insights(records = [], targetWeights = {}) {
  const list = Array.isArray(records) ? records : []
  const byAnimal = {}

  list.forEach((item) => {
    if (!item?.animalId) return
    if (!byAnimal[item.animalId]) byAnimal[item.animalId] = []
    if (String(item.type || '').toLowerCase() === 'weight' && Number.isFinite(Number(item.value))) {
      byAnimal[item.animalId].push({ date: item.date, value: Number(item.value) })
    }
  })

  const result = {}
  Object.keys(byAnimal).forEach((animalId) => {
    const rows = byAnimal[animalId].filter((r) => parseDateSafe(r.date)).sort((a, b) => new Date(a.date) - new Date(b.date))
    if (rows.length === 0) return

    const first = rows[0]
    const latest = rows[rows.length - 1]
    const days = Math.max(1, Math.floor((new Date(latest.date) - new Date(first.date)) / (1000 * 60 * 60 * 24)))
    const growthRatePerDay = (latest.value - first.value) / days
    const target = Number(targetWeights?.[animalId] || 0)
    const progressPct = target > 0 ? Math.max(0, Math.min(100, (latest.value / target) * 100)) : null

    result[animalId] = {
      growthRatePerDay,
      firstWeight: first.value,
      latestWeight: latest.value,
      targetWeight: target > 0 ? target : null,
      progressPct
    }
  })

  return result
}
