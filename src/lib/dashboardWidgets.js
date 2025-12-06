/**
 * Advanced Dashboard Widgets System
 * 
 * Features:
 * - Customizable widget layout
 * - Drag-and-drop positioning
 * - Widget library with 20+ widgets
 * - Save/load layouts per user
 * - Responsive grid system
 * - Widget configuration
 */

import { loadData } from './storage'

// Widget Types
export const WidgetType = {
  // Overview Widgets
  STATS_CARD: 'STATS_CARD',
  QUICK_STATS: 'QUICK_STATS',
  SUMMARY_CHART: 'SUMMARY_CHART',
  
  // Animal Widgets
  ANIMAL_COUNT: 'ANIMAL_COUNT',
  ANIMAL_HEALTH: 'ANIMAL_HEALTH',
  BREEDING_STATUS: 'BREEDING_STATUS',
  MILK_PRODUCTION: 'MILK_PRODUCTION',
  FEEDING_SCHEDULE: 'FEEDING_SCHEDULE',
  
  // Crop Widgets
  CROP_STATUS: 'CROP_STATUS',
  HARVEST_FORECAST: 'HARVEST_FORECAST',
  CROP_ROTATION: 'CROP_ROTATION',
  
  // Financial Widgets
  REVENUE_CHART: 'REVENUE_CHART',
  EXPENSE_BREAKDOWN: 'EXPENSE_BREAKDOWN',
  PROFIT_TREND: 'PROFIT_TREND',
  CASH_FLOW: 'CASH_FLOW',
  
  // Task Widgets
  TASK_LIST: 'TASK_LIST',
  CALENDAR: 'CALENDAR',
  OVERDUE_TASKS: 'OVERDUE_TASKS',
  
  // Alert Widgets
  HEALTH_ALERTS: 'HEALTH_ALERTS',
  INVENTORY_ALERTS: 'INVENTORY_ALERTS',
  SMART_ALERTS: 'SMART_ALERTS',
  
  // Weather & Environment
  WEATHER: 'WEATHER',
  FORECAST: 'FORECAST',
  
  // Analytics
  PREDICTIONS: 'PREDICTIONS',
  PERFORMANCE: 'PERFORMANCE',
  TRENDS: 'TRENDS',
  
  // Custom
  CUSTOM_CHART: 'CUSTOM_CHART',
  NOTES: 'NOTES'
}

// Widget Size Presets
export const WidgetSize = {
  SMALL: { w: 1, h: 1 },      // 1x1 - Small card
  MEDIUM: { w: 2, h: 1 },     // 2x1 - Wide card
  LARGE: { w: 2, h: 2 },      // 2x2 - Large square
  TALL: { w: 1, h: 2 },       // 1x2 - Tall card
  XLARGE: { w: 3, h: 2 },     // 3x2 - Extra wide
  FULL: { w: 4, h: 2 }        // 4x2 - Full width
}

// Widget Definitions
export const WIDGET_LIBRARY = {
  [WidgetType.STATS_CARD]: {
    id: WidgetType.STATS_CARD,
    name: 'Quick Stats',
    description: 'Overview of farm statistics',
    icon: '📊',
    defaultSize: WidgetSize.MEDIUM,
    resizable: true,
    configurable: true,
    category: 'Overview'
  },
  
  [WidgetType.ANIMAL_COUNT]: {
    id: WidgetType.ANIMAL_COUNT,
    name: 'Animal Count',
    description: 'Total animals by species',
    icon: '🐄',
    defaultSize: WidgetSize.SMALL,
    resizable: true,
    configurable: false,
    category: 'Animals'
  },
  
  [WidgetType.ANIMAL_HEALTH]: {
    id: WidgetType.ANIMAL_HEALTH,
    name: 'Health Status',
    description: 'Animal health overview',
    icon: '💊',
    defaultSize: WidgetSize.MEDIUM,
    resizable: true,
    configurable: true,
    category: 'Animals'
  },
  
  [WidgetType.BREEDING_STATUS]: {
    id: WidgetType.BREEDING_STATUS,
    name: 'Breeding Status',
    description: 'Active breeding programs',
    icon: '🐮',
    defaultSize: WidgetSize.MEDIUM,
    resizable: true,
    configurable: false,
    category: 'Animals'
  },
  
  [WidgetType.MILK_PRODUCTION]: {
    id: WidgetType.MILK_PRODUCTION,
    name: 'Milk Production',
    description: 'Daily milk yield trends',
    icon: '🥛',
    defaultSize: WidgetSize.LARGE,
    resizable: true,
    configurable: true,
    category: 'Animals'
  },
  
  [WidgetType.FEEDING_SCHEDULE]: {
    id: WidgetType.FEEDING_SCHEDULE,
    name: 'Feeding Schedule',
    description: 'Upcoming feeding tasks',
    icon: '🌾',
    defaultSize: WidgetSize.MEDIUM,
    resizable: true,
    configurable: false,
    category: 'Animals'
  },
  
  [WidgetType.CROP_STATUS]: {
    id: WidgetType.CROP_STATUS,
    name: 'Crop Status',
    description: 'Active crops overview',
    icon: '🌱',
    defaultSize: WidgetSize.MEDIUM,
    resizable: true,
    configurable: false,
    category: 'Crops'
  },
  
  [WidgetType.HARVEST_FORECAST]: {
    id: WidgetType.HARVEST_FORECAST,
    name: 'Harvest Forecast',
    description: 'Predicted harvest dates',
    icon: '🚜',
    defaultSize: WidgetSize.LARGE,
    resizable: true,
    configurable: true,
    category: 'Crops'
  },
  
  [WidgetType.REVENUE_CHART]: {
    id: WidgetType.REVENUE_CHART,
    name: 'Revenue Chart',
    description: 'Income trends over time',
    icon: '💰',
    defaultSize: WidgetSize.LARGE,
    resizable: true,
    configurable: true,
    category: 'Finance'
  },
  
  [WidgetType.EXPENSE_BREAKDOWN]: {
    id: WidgetType.EXPENSE_BREAKDOWN,
    name: 'Expense Breakdown',
    description: 'Expenses by category',
    icon: '💸',
    defaultSize: WidgetSize.MEDIUM,
    resizable: true,
    configurable: true,
    category: 'Finance'
  },
  
  [WidgetType.PROFIT_TREND]: {
    id: WidgetType.PROFIT_TREND,
    name: 'Profit Trend',
    description: 'Net profit over time',
    icon: '📈',
    defaultSize: WidgetSize.LARGE,
    resizable: true,
    configurable: true,
    category: 'Finance'
  },
  
  [WidgetType.CASH_FLOW]: {
    id: WidgetType.CASH_FLOW,
    name: 'Cash Flow',
    description: 'Income vs expenses',
    icon: '💵',
    defaultSize: WidgetSize.MEDIUM,
    resizable: true,
    configurable: true,
    category: 'Finance'
  },
  
  [WidgetType.TASK_LIST]: {
    id: WidgetType.TASK_LIST,
    name: 'Task List',
    description: 'Upcoming tasks',
    icon: '✅',
    defaultSize: WidgetSize.MEDIUM,
    resizable: true,
    configurable: true,
    category: 'Tasks'
  },
  
  [WidgetType.CALENDAR]: {
    id: WidgetType.CALENDAR,
    name: 'Calendar',
    description: 'Monthly calendar view',
    icon: '📅',
    defaultSize: WidgetSize.LARGE,
    resizable: true,
    configurable: false,
    category: 'Tasks'
  },
  
  [WidgetType.OVERDUE_TASKS]: {
    id: WidgetType.OVERDUE_TASKS,
    name: 'Overdue Tasks',
    description: 'Tasks past due date',
    icon: '⚠️',
    defaultSize: WidgetSize.SMALL,
    resizable: true,
    configurable: false,
    category: 'Tasks'
  },
  
  [WidgetType.HEALTH_ALERTS]: {
    id: WidgetType.HEALTH_ALERTS,
    name: 'Health Alerts',
    description: 'Animal health warnings',
    icon: '🚨',
    defaultSize: WidgetSize.MEDIUM,
    resizable: true,
    configurable: false,
    category: 'Alerts'
  },
  
  [WidgetType.INVENTORY_ALERTS]: {
    id: WidgetType.INVENTORY_ALERTS,
    name: 'Inventory Alerts',
    description: 'Low stock warnings',
    icon: '📦',
    defaultSize: WidgetSize.SMALL,
    resizable: true,
    configurable: false,
    category: 'Alerts'
  },
  
  [WidgetType.SMART_ALERTS]: {
    id: WidgetType.SMART_ALERTS,
    name: 'Smart Alerts',
    description: 'AI-generated alerts',
    icon: '🔔',
    defaultSize: WidgetSize.MEDIUM,
    resizable: true,
    configurable: true,
    category: 'Alerts'
  },
  
  [WidgetType.WEATHER]: {
    id: WidgetType.WEATHER,
    name: 'Current Weather',
    description: 'Real-time weather',
    icon: '🌤️',
    defaultSize: WidgetSize.SMALL,
    resizable: false,
    configurable: true,
    category: 'Weather'
  },
  
  [WidgetType.FORECAST]: {
    id: WidgetType.FORECAST,
    name: '5-Day Forecast',
    description: 'Weather forecast',
    icon: '🌦️',
    defaultSize: WidgetSize.MEDIUM,
    resizable: true,
    configurable: true,
    category: 'Weather'
  },
  
  [WidgetType.PREDICTIONS]: {
    id: WidgetType.PREDICTIONS,
    name: 'AI Predictions',
    description: 'ML-powered forecasts',
    icon: '🔮',
    defaultSize: WidgetSize.LARGE,
    resizable: true,
    configurable: true,
    category: 'Analytics'
  },
  
  [WidgetType.PERFORMANCE]: {
    id: WidgetType.PERFORMANCE,
    name: 'Performance Metrics',
    description: 'Farm performance KPIs',
    icon: '📊',
    defaultSize: WidgetSize.LARGE,
    resizable: true,
    configurable: true,
    category: 'Analytics'
  },
  
  [WidgetType.TRENDS]: {
    id: WidgetType.TRENDS,
    name: 'Trends Analysis',
    description: 'Long-term trends',
    icon: '📉',
    defaultSize: WidgetSize.XLARGE,
    resizable: true,
    configurable: true,
    category: 'Analytics'
  },
  
  [WidgetType.NOTES]: {
    id: WidgetType.NOTES,
    name: 'Quick Notes',
    description: 'Farm notes and reminders',
    icon: '📝',
    defaultSize: WidgetSize.MEDIUM,
    resizable: true,
    configurable: false,
    category: 'Custom'
  }
}

// Default Dashboard Layout
export const DEFAULT_LAYOUT = [
  { id: 'widget-1', type: WidgetType.STATS_CARD, x: 0, y: 0, ...WidgetSize.MEDIUM, config: {} },
  { id: 'widget-2', type: WidgetType.ANIMAL_COUNT, x: 2, y: 0, ...WidgetSize.SMALL, config: {} },
  { id: 'widget-3', type: WidgetType.TASK_LIST, x: 3, y: 0, ...WidgetSize.SMALL, config: { limit: 5 } },
  { id: 'widget-4', type: WidgetType.REVENUE_CHART, x: 0, y: 1, ...WidgetSize.LARGE, config: { period: 'month' } },
  { id: 'widget-5', type: WidgetType.HEALTH_ALERTS, x: 2, y: 1, ...WidgetSize.MEDIUM, config: {} },
  { id: 'widget-6', type: WidgetType.WEATHER, x: 0, y: 3, ...WidgetSize.SMALL, config: {} },
  { id: 'widget-7', type: WidgetType.SMART_ALERTS, x: 1, y: 3, ...WidgetSize.MEDIUM, config: { limit: 3 } }
]

// Storage Keys
const LAYOUT_KEY = 'cattalytics:dashboard:layout'
const WIDGETS_KEY = 'cattalytics:dashboard:widgets'

// Layout Management
export function saveLayout(layout) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
    return true
  } catch (error) {
    console.error('Error saving dashboard layout:', error)
    return false
  }
}

export function loadLayout() {
  try {
    const saved = localStorage.getItem(LAYOUT_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
    return DEFAULT_LAYOUT
  } catch (error) {
    console.error('Error loading dashboard layout:', error)
    return DEFAULT_LAYOUT
  }
}

export function resetLayout() {
  try {
    localStorage.removeItem(LAYOUT_KEY)
    return DEFAULT_LAYOUT
  } catch (error) {
    console.error('Error resetting dashboard layout:', error)
    return DEFAULT_LAYOUT
  }
}

// Widget Management
export function addWidget(type, position = null) {
  const layout = loadLayout()
  const widget = WIDGET_LIBRARY[type]
  
  if (!widget) {
    console.error('Unknown widget type:', type)
    return null
  }
  
  const newWidget = {
    id: `widget-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    x: position?.x || 0,
    y: position?.y || getNextAvailableY(layout),
    ...widget.defaultSize,
    config: {}
  }
  
  layout.push(newWidget)
  saveLayout(layout)
  
  return newWidget
}

export function removeWidget(widgetId) {
  const layout = loadLayout()
  const filtered = layout.filter(w => w.id !== widgetId)
  saveLayout(filtered)
  return filtered
}

export function updateWidget(widgetId, updates) {
  const layout = loadLayout()
  const updated = layout.map(w => 
    w.id === widgetId ? { ...w, ...updates } : w
  )
  saveLayout(updated)
  return updated
}

export function updateWidgetConfig(widgetId, config) {
  const layout = loadLayout()
  const updated = layout.map(w => 
    w.id === widgetId ? { ...w, config: { ...w.config, ...config } } : w
  )
  saveLayout(updated)
  return updated
}

export function duplicateWidget(widgetId) {
  const layout = loadLayout()
  const original = layout.find(w => w.id === widgetId)
  
  if (!original) return null
  
  const duplicate = {
    ...original,
    id: `widget-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    x: original.x,
    y: getNextAvailableY(layout)
  }
  
  layout.push(duplicate)
  saveLayout(layout)
  
  return duplicate
}

// Helper Functions
function getNextAvailableY(layout) {
  if (layout.length === 0) return 0
  const maxY = Math.max(...layout.map(w => w.y + w.h))
  return maxY
}

// Widget Categories
export function getWidgetsByCategory() {
  const categories = {}
  
  Object.values(WIDGET_LIBRARY).forEach(widget => {
    const category = widget.category || 'Other'
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(widget)
  })
  
  return categories
}

// Preset Layouts
export const PRESET_LAYOUTS = {
  default: {
    name: 'Default Dashboard',
    description: 'Balanced overview of all farm operations',
    layout: DEFAULT_LAYOUT
  },
  
  livestock: {
    name: 'Livestock Focus',
    description: 'Optimized for livestock management',
    layout: [
      { id: 'widget-1', type: WidgetType.ANIMAL_COUNT, x: 0, y: 0, ...WidgetSize.SMALL, config: {} },
      { id: 'widget-2', type: WidgetType.ANIMAL_HEALTH, x: 1, y: 0, ...WidgetSize.MEDIUM, config: {} },
      { id: 'widget-3', type: WidgetType.BREEDING_STATUS, x: 3, y: 0, ...WidgetSize.SMALL, config: {} },
      { id: 'widget-4', type: WidgetType.MILK_PRODUCTION, x: 0, y: 1, ...WidgetSize.LARGE, config: {} },
      { id: 'widget-5', type: WidgetType.FEEDING_SCHEDULE, x: 2, y: 1, ...WidgetSize.MEDIUM, config: {} },
      { id: 'widget-6', type: WidgetType.HEALTH_ALERTS, x: 0, y: 3, ...WidgetSize.MEDIUM, config: {} },
      { id: 'widget-7', type: WidgetType.TASK_LIST, x: 2, y: 3, ...WidgetSize.MEDIUM, config: { limit: 10 } }
    ]
  },
  
  crops: {
    name: 'Crop Management',
    description: 'Optimized for crop farming',
    layout: [
      { id: 'widget-1', type: WidgetType.CROP_STATUS, x: 0, y: 0, ...WidgetSize.MEDIUM, config: {} },
      { id: 'widget-2', type: WidgetType.WEATHER, x: 2, y: 0, ...WidgetSize.SMALL, config: {} },
      { id: 'widget-3', type: WidgetType.FORECAST, x: 3, y: 0, ...WidgetSize.SMALL, config: {} },
      { id: 'widget-4', type: WidgetType.HARVEST_FORECAST, x: 0, y: 1, ...WidgetSize.LARGE, config: {} },
      { id: 'widget-5', type: WidgetType.TASK_LIST, x: 2, y: 1, ...WidgetSize.MEDIUM, config: {} },
      { id: 'widget-6', type: WidgetType.CALENDAR, x: 0, y: 3, ...WidgetSize.LARGE, config: {} }
    ]
  },
  
  financial: {
    name: 'Financial Overview',
    description: 'Focus on farm finances',
    layout: [
      { id: 'widget-1', type: WidgetType.CASH_FLOW, x: 0, y: 0, ...WidgetSize.MEDIUM, config: {} },
      { id: 'widget-2', type: WidgetType.PROFIT_TREND, x: 2, y: 0, ...WidgetSize.MEDIUM, config: {} },
      { id: 'widget-3', type: WidgetType.REVENUE_CHART, x: 0, y: 1, ...WidgetSize.LARGE, config: { period: 'year' } },
      { id: 'widget-4', type: WidgetType.EXPENSE_BREAKDOWN, x: 2, y: 1, ...WidgetSize.LARGE, config: { period: 'month' } },
      { id: 'widget-5', type: WidgetType.PREDICTIONS, x: 0, y: 3, ...WidgetSize.XLARGE, config: {} }
    ]
  },
  
  analytics: {
    name: 'Analytics Dashboard',
    description: 'Deep insights and predictions',
    layout: [
      { id: 'widget-1', type: WidgetType.PERFORMANCE, x: 0, y: 0, ...WidgetSize.LARGE, config: {} },
      { id: 'widget-2', type: WidgetType.SMART_ALERTS, x: 2, y: 0, ...WidgetSize.MEDIUM, config: {} },
      { id: 'widget-3', type: WidgetType.TRENDS, x: 0, y: 2, ...WidgetSize.XLARGE, config: {} },
      { id: 'widget-4', type: WidgetType.PREDICTIONS, x: 0, y: 4, ...WidgetSize.LARGE, config: {} },
      { id: 'widget-5', type: WidgetType.PROFIT_TREND, x: 2, y: 4, ...WidgetSize.LARGE, config: {} }
    ]
  },
  
  minimal: {
    name: 'Minimal View',
    description: 'Clean, focused dashboard',
    layout: [
      { id: 'widget-1', type: WidgetType.STATS_CARD, x: 0, y: 0, ...WidgetSize.LARGE, config: {} },
      { id: 'widget-2', type: WidgetType.TASK_LIST, x: 2, y: 0, ...WidgetSize.MEDIUM, config: { limit: 5 } },
      { id: 'widget-3', type: WidgetType.SMART_ALERTS, x: 0, y: 2, ...WidgetSize.MEDIUM, config: { limit: 3 } },
      { id: 'widget-4', type: WidgetType.WEATHER, x: 2, y: 2, ...WidgetSize.SMALL, config: {} }
    ]
  }
}

export function applyPresetLayout(presetName) {
  const preset = PRESET_LAYOUTS[presetName]
  if (!preset) {
    console.error('Unknown preset:', presetName)
    return null
  }
  
  saveLayout(preset.layout)
  return preset.layout
}

// Widget Data Fetchers
export function getWidgetData(widgetType, config = {}) {
  switch (widgetType) {
    case WidgetType.ANIMAL_COUNT:
      return getAnimalCountData()
    
    case WidgetType.TASK_LIST:
      return getTaskListData(config.limit || 5)
    
    case WidgetType.HEALTH_ALERTS:
      return getHealthAlertsData()
    
    case WidgetType.INVENTORY_ALERTS:
      return getInventoryAlertsData()
    
    case WidgetType.REVENUE_CHART:
      return getRevenueChartData(config.period || 'month')
    
    case WidgetType.EXPENSE_BREAKDOWN:
      return getExpenseBreakdownData(config.period || 'month')
    
    case WidgetType.MILK_PRODUCTION:
      return getMilkProductionData(config.period || 'week')
    
    case WidgetType.CROP_STATUS:
      return getCropStatusData()
    
    case WidgetType.BREEDING_STATUS:
      return getBreedingStatusData()
    
    case WidgetType.FEEDING_SCHEDULE:
      return getFeedingScheduleData()
    
    default:
      return null
  }
}

// Data fetcher implementations
function getAnimalCountData() {
  const animals = loadData('cattalytics:animals', [])
  const bySpecies = {}
  
  animals.forEach(animal => {
    const species = animal.species || 'Other'
    bySpecies[species] = (bySpecies[species] || 0) + 1
  })
  
  return {
    total: animals.length,
    bySpecies,
    active: animals.filter(a => a.status === 'Active').length
  }
}

function getTaskListData(limit = 5) {
  const tasks = loadData('cattalytics:tasks', [])
  const today = new Date().toISOString().split('T')[0]
  
  return tasks
    .filter(t => t.status !== 'completed' && t.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, limit)
}

function getHealthAlertsData() {
  const animals = loadData('cattalytics:animals', [])
  const alerts = []
  
  animals.forEach(animal => {
    if (animal.healthAlerts && animal.healthAlerts.length > 0) {
      alerts.push(...animal.healthAlerts.map(alert => ({
        ...alert,
        animalName: animal.name,
        animalTag: animal.tagNumber
      })))
    }
  })
  
  return alerts.slice(0, 10)
}

function getInventoryAlertsData() {
  const inventory = loadData('cattalytics:inventory', [])
  return inventory
    .filter(item => item.quantity <= (item.reorderPoint || 0))
    .slice(0, 10)
}

function getRevenueChartData(period) {
  const finance = loadData('cattalytics:finance', [])
  const income = finance.filter(t => t.type === 'income')
  
  // Group by date
  const data = {}
  income.forEach(t => {
    const date = t.date
    data[date] = (data[date] || 0) + t.amount
  })
  
  return Object.entries(data).map(([date, amount]) => ({ date, amount }))
}

function getExpenseBreakdownData(period) {
  const finance = loadData('cattalytics:finance', [])
  const expenses = finance.filter(t => t.type === 'expense')
  
  const byCategory = {}
  expenses.forEach(e => {
    const category = e.category || 'Other'
    byCategory[category] = (byCategory[category] || 0) + e.amount
  })
  
  return byCategory
}

function getMilkProductionData(period) {
  const milkRecords = loadData('cattalytics:milk-yield', [])
  const last7Days = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayTotal = milkRecords
      .filter(r => r.date === dateStr)
      .reduce((sum, r) => sum + (r.quantity || 0), 0)
    
    last7Days.push({ date: dateStr, quantity: dayTotal })
  }
  
  return last7Days
}

function getCropStatusData() {
  const crops = loadData('cattalytics:crops:v2', [])
  const byStatus = {}
  
  crops.forEach(crop => {
    const status = crop.status || 'Unknown'
    byStatus[status] = (byStatus[status] || 0) + 1
  })
  
  return {
    total: crops.length,
    byStatus
  }
}

function getBreedingStatusData() {
  const breeding = loadData('cattalytics:breeding', [])
  return {
    total: breeding.length,
    active: breeding.filter(b => b.status === 'active').length,
    successful: breeding.filter(b => b.status === 'successful').length
  }
}

function getFeedingScheduleData() {
  const feeding = loadData('cattalytics:feeding', [])
  const today = new Date().toISOString().split('T')[0]
  
  return feeding
    .filter(f => f.date === today)
    .slice(0, 5)
}
