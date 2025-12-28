import { loadData, saveData } from './storage'
import { showNotification } from './notifications'
import { logAction, ACTIONS } from './audit'
import { getCurrentWeather, getFarmLocation } from './weatherApi'

/**
 * Voice Commands System
 * Natural language processing for farm management commands
 * Examples:
 * - "Add 50kg feed to inventory"
 * - "Record milk yield 25 liters for Bessie"
 * - "Show me all sick animals"
 * - "Create task: Check water troughs"
 */

// Command patterns with regex matching
const COMMAND_PATTERNS = [
  // Inventory commands
  {
    pattern: /add (\d+(?:\.\d+)?)\s*(kg|liters?|l|units?|bags?|pieces?)\s+(?:of\s+)?(.+?)\s+to\s+inventory/i,
    handler: handleAddInventory,
    category: 'inventory'
  },
  {
    pattern: /(?:remove|deduct|use|consume) (\d+(?:\.\d+)?)\s*(kg|liters?|l|units?|bags?|pieces?)\s+(?:of\s+)?(.+?)\s+from\s+inventory/i,
    handler: handleRemoveInventory,
    category: 'inventory'
  },
  
  // Milk yield commands
  {
    pattern: /record (?:milk )?yield (?:of )?(\d+(?:\.\d+)?)\s*(?:liters?|l)\s+for\s+(.+)/i,
    handler: handleRecordMilkYield,
    category: 'milk'
  },
  {
    pattern: /(?:add|record) milk (\d+(?:\.\d+)?)\s*(?:liters?|l)?\s+(?:for\s+)?(.+)/i,
    handler: handleRecordMilkYield,
    category: 'milk'
  },
  
  // Animal commands
  {
    pattern: /(?:show|list|find|get)\s+(?:me\s+)?(?:all\s+)?sick\s+animals?/i,
    handler: handleShowSickAnimals,
    category: 'animals'
  },
  {
    pattern: /(?:show|list|find|get)\s+(?:me\s+)?(?:all\s+)?animals?\s+(?:with\s+)?status\s+(.+)/i,
    handler: handleShowAnimalsByStatus,
    category: 'animals'
  },
  {
    pattern: /(?:add|create|register)\s+(?:new\s+)?animal\s+(?:named\s+)?(.+)/i,
    handler: handleAddAnimal,
    category: 'animals'
  },
  
  // Task commands
  {
    pattern: /(?:create|add|new)\s+task:?\s*(.+)/i,
    handler: handleCreateTask,
    category: 'tasks'
  },
  {
    pattern: /(?:complete|finish|done)\s+task\s+(.+)/i,
    handler: handleCompleteTask,
    category: 'tasks'
  },
  {
    pattern: /(?:show|list|get)\s+(?:me\s+)?(?:all\s+)?(?:pending|overdue|upcoming)\s+tasks?/i,
    handler: handleShowTasks,
    category: 'tasks'
  },
  
  // Finance commands
  {
    pattern: /(?:add|record)\s+(?:an?\s+)?(?:income|revenue|sale)\s+(?:of\s+)?(\d+(?:\.\d+)?)\s+(?:kes|shillings?)?\s+for\s+(.+)/i,
    handler: handleAddIncome,
    category: 'finance'
  },
  {
    pattern: /(?:add|record)\s+(?:an?\s+)?expense\s+(?:of\s+)?(\d+(?:\.\d+)?)\s+(?:kes|shillings?)?\s+for\s+(.+)/i,
    handler: handleAddExpense,
    category: 'finance'
  },
  
  // Crop commands
  {
    pattern: /plant (\d+(?:\.\d+)?)\s+(?:acres?|hectares?)\s+of\s+(.+)/i,
    handler: handlePlantCrop,
    category: 'crops'
  },
  {
    pattern: /harvest (.+)/i,
    handler: handleHarvestCrop,
    category: 'crops'
  },
  
  // Search commands
  {
    pattern: /(?:search|find|look for)\s+(.+)/i,
    handler: handleSearch,
    category: 'search'
  },
  
  // Weather commands
  {
    pattern: /(?:what's|what is|show|get|check)\s+(?:the\s+)?weather/i,
    handler: handleWeather,
    category: 'weather'
  },
  {
    pattern: /(?:is it|will it)\s+(?:rain|raining)/i,
    handler: handleWeatherRain,
    category: 'weather'
  },
  {
    pattern: /(?:what's|what is)\s+(?:the\s+)?temperature/i,
    handler: handleWeatherTemperature,
    category: 'weather'
  },
  
  // Navigation commands
  {
    pattern: /(?:go to|open|show)\s+(.+)/i,
    handler: handleNavigation,
    category: 'navigation'
  }
]

/**
 * Process voice command
 */
export function processVoiceCommand(transcript, onNavigate) {
  const normalized = transcript.trim().toLowerCase()
  
  for (const { pattern, handler, category } of COMMAND_PATTERNS) {
    const match = normalized.match(pattern)
    if (match) {
      try {
        const result = handler(match, onNavigate)
        logAction(ACTIONS.CREATE, 'voice_command', Date.now().toString(), {
          command: transcript,
          category,
          success: true
        })
        return {
          success: true,
          message: result.message,
          action: result.action,
          data: result.data
        }
      } catch (error) {
        console.error('Command handler error:', error)
        return {
          success: false,
          message: `Failed to execute command: ${error.message}`
        }
      }
    }
  }
  
  return {
    success: false,
    message: "I didn't understand that command. Try saying:\n- 'Add 50kg feed to inventory'\n- 'Record milk yield 25 liters for Bessie'\n- 'Show me all sick animals'\n- 'Create task: Check water troughs'"
  }
}

/**
 * Command Handlers
 */

function handleAddInventory(match) {
  const [, quantity, unit, itemName] = match
  const inventory = loadData('cattalytics:inventory', [])
  
  // Find existing item or create new
  let item = inventory.find(i => i.name.toLowerCase().includes(itemName.toLowerCase()))
  
  if (item) {
    item.quantity = (parseFloat(item.quantity) || 0) + parseFloat(quantity)
    item.updatedAt = new Date().toISOString()
  } else {
    item = {
      id: Date.now().toString(),
      name: itemName.charAt(0).toUpperCase() + itemName.slice(1),
      quantity: parseFloat(quantity),
      unit,
      category: 'Feed',
      location: 'Main Store',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    inventory.push(item)
  }
  
  saveData('cattalytics:inventory', inventory)
  showNotification({
    title: '✅ Inventory Updated',
    body: `Added ${quantity} ${unit} of ${itemName}`
  })
  
  return {
    message: `Added ${quantity} ${unit} of ${itemName} to inventory`,
    action: 'inventory_added',
    data: item
  }
}

function handleRemoveInventory(match) {
  const [, quantity, unit, itemName] = match
  const inventory = loadData('cattalytics:inventory', [])
  
  const item = inventory.find(i => i.name.toLowerCase().includes(itemName.toLowerCase()))
  
  if (!item) {
    throw new Error(`Item "${itemName}" not found in inventory`)
  }
  
  const newQuantity = (parseFloat(item.quantity) || 0) - parseFloat(quantity)
  if (newQuantity < 0) {
    throw new Error(`Insufficient quantity. Only ${item.quantity} ${item.unit} available`)
  }
  
  item.quantity = newQuantity
  item.updatedAt = new Date().toISOString()
  
  saveData('cattalytics:inventory', inventory)
  showNotification({
    title: '✅ Inventory Updated',
    body: `Removed ${quantity} ${unit} of ${itemName}`
  })
  
  return {
    message: `Removed ${quantity} ${unit} of ${itemName} from inventory. Remaining: ${newQuantity} ${unit}`,
    action: 'inventory_removed',
    data: item
  }
}

function handleRecordMilkYield(match) {
  const [, amount, animalName] = match
  const animals = loadData('cattalytics:animals', [])
  
  const animal = animals.find(a => 
    a.name?.toLowerCase().includes(animalName.toLowerCase()) ||
    a.tagNumber?.toLowerCase().includes(animalName.toLowerCase())
  )
  
  if (!animal) {
    throw new Error(`Animal "${animalName}" not found`)
  }
  
  // Save milk yield record
  const milkRecords = loadData('cattalytics:milk-yield', [])
  const record = {
    id: Date.now().toString(),
    animalId: animal.id,
    animalName: animal.name || animal.tagNumber,
    amount: parseFloat(amount),
    date: new Date().toISOString(),
    session: 'Morning',
    createdAt: new Date().toISOString()
  }
  milkRecords.push(record)
  saveData('cattalytics:milk-yield', milkRecords)
  
  showNotification({
    title: '🥛 Milk Recorded',
    body: `${amount}L from ${animal.name || animal.tagNumber}`
  })
  
  return {
    message: `Recorded ${amount} liters of milk from ${animal.name || animal.tagNumber}`,
    action: 'milk_recorded',
    data: record
  }
}

function handleShowSickAnimals(match, onNavigate) {
  const animals = loadData('cattalytics:animals', [])
  const sickAnimals = animals.filter(a => 
    a.status === 'Sick' || 
    (a.healthAlerts && a.healthAlerts.length > 0) ||
    (a.healthStatus && a.healthStatus.toLowerCase().includes('sick'))
  )
  
  if (sickAnimals.length === 0) {
    return {
      message: 'No sick animals found. All animals are healthy!',
      action: 'search_animals',
      data: []
    }
  }
  
  const animalList = sickAnimals.map(a => a.name || a.tagNumber).join(', ')
  
  if (onNavigate) {
    onNavigate('animals')
  }
  
  return {
    message: `Found ${sickAnimals.length} sick animal(s): ${animalList}`,
    action: 'search_animals',
    data: sickAnimals
  }
}

function handleShowAnimalsByStatus(match, onNavigate) {
  const [, status] = match
  const animals = loadData('cattalytics:animals', [])
  
  const filtered = animals.filter(a => 
    a.status?.toLowerCase().includes(status.toLowerCase())
  )
  
  if (filtered.length === 0) {
    return {
      message: `No animals found with status "${status}"`,
      action: 'search_animals',
      data: []
    }
  }
  
  if (onNavigate) {
    onNavigate('animals')
  }
  
  return {
    message: `Found ${filtered.length} animal(s) with status "${status}"`,
    action: 'search_animals',
    data: filtered
  }
}

function handleAddAnimal(match) {
  const [, name] = match
  
  return {
    message: `To add animal "${name}", please fill out the complete form with breed, age, and other details`,
    action: 'navigate_to_add_animal',
    data: { suggestedName: name }
  }
}

function handleCreateTask(match) {
  const [, taskTitle] = match
  const tasks = loadData('cattalytics:tasks', [])
  
  const task = {
    id: Date.now().toString(),
    title: taskTitle.trim(),
    description: 'Created via voice command',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    createdAt: new Date().toISOString()
  }
  
  tasks.push(task)
  saveData('cattalytics:tasks', tasks)
  
  showNotification({
    title: '✅ Task Created',
    body: taskTitle
  })
  
  return {
    message: `Created task: "${taskTitle}"`,
    action: 'task_created',
    data: task
  }
}

function handleCompleteTask(match) {
  const [, taskTitle] = match
  const tasks = loadData('cattalytics:tasks', [])
  
  const task = tasks.find(t => 
    t.title.toLowerCase().includes(taskTitle.toLowerCase())
  )
  
  if (!task) {
    throw new Error(`Task "${taskTitle}" not found`)
  }
  
  task.status = 'completed'
  task.completedAt = new Date().toISOString()
  
  saveData('cattalytics:tasks', tasks)
  
  showNotification({
    title: '✅ Task Completed',
    body: task.title
  })
  
  return {
    message: `Marked task "${task.title}" as completed`,
    action: 'task_completed',
    data: task
  }
}

function handleShowTasks(match, onNavigate) {
  const tasks = loadData('cattalytics:tasks', [])
  const pending = tasks.filter(t => t.status !== 'completed')
  
  if (onNavigate) {
    onNavigate('tasks')
  }
  
  return {
    message: `You have ${pending.length} pending task(s)`,
    action: 'show_tasks',
    data: pending
  }
}

function handleAddIncome(match) {
  const [, amount, description] = match
  const transactions = loadData('cattalytics:finance', [])
  
  const transaction = {
    id: Date.now().toString(),
    type: 'income',
    amount: parseFloat(amount),
    description: description.trim(),
    category: 'Sales',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
  
  transactions.push(transaction)
  saveData('cattalytics:finance', transactions)
  
  showNotification({
    title: '💰 Income Recorded',
    body: `KES ${amount} - ${description}`
  })
  
  return {
    message: `Recorded income of KES ${amount} for ${description}`,
    action: 'income_added',
    data: transaction
  }
}

function handleAddExpense(match) {
  const [, amount, description] = match
  const transactions = loadData('cattalytics:finance', [])
  
  const transaction = {
    id: Date.now().toString(),
    type: 'expense',
    amount: parseFloat(amount),
    description: description.trim(),
    category: 'General',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
  
  transactions.push(transaction)
  saveData('cattalytics:finance', transactions)
  
  showNotification({
    title: '💸 Expense Recorded',
    body: `KES ${amount} - ${description}`
  })
  
  return {
    message: `Recorded expense of KES ${amount} for ${description}`,
    action: 'expense_added',
    data: transaction
  }
}

function handlePlantCrop(match) {
  const [, area, cropName] = match
  
  return {
    message: `To plant ${area} acres of ${cropName}, please use the Crops module to add complete details`,
    action: 'navigate_to_crops',
    data: { suggestedCrop: cropName, suggestedArea: area }
  }
}

function handleHarvestCrop(match) {
  const [, cropName] = match
  
  return {
    message: `To record harvest for ${cropName}, please use the Crops module`,
    action: 'navigate_to_crops',
    data: { suggestedCrop: cropName }
  }
}

function handleSearch(match, onNavigate) {
  const [, query] = match
  
  if (onNavigate) {
    // Trigger global search if available
    window.dispatchEvent(new CustomEvent('globalSearch', { detail: query }))
  }
  
  return {
    message: `Searching for "${query}"...`,
    action: 'search',
    data: { query }
  }
}

function handleNavigation(match, onNavigate) {
  const [, destination] = match
  const moduleMap = {
    'dashboard': 'dashboard',
    'animals': 'animals',
    'livestock': 'animals',
    'cattle': 'animals',
    'crops': 'crops',
    'tasks': 'tasks',
    'finance': 'finance',
    'money': 'finance',
    'inventory': 'inventory',
    'stock': 'inventory',
    'reports': 'reports',
    'settings': 'settings',
    'alerts': 'alerts',
    'notifications': 'notifications',
    'weather': 'weather'
  }
  
  const module = moduleMap[destination.toLowerCase().trim()]
  
  if (module && onNavigate) {
    onNavigate(module)
    return {
      message: `Navigating to ${module}`,
      action: 'navigate',
      data: { module }
    }
  }
  
  return {
    message: `Module "${destination}" not found`,
    action: 'navigation_failed',
    data: null
  }
}

async function handleWeather(match, onNavigate) {
  try {
    const location = getFarmLocation()
    const apiKey = localStorage.getItem('cattalytics:weather:apikey') || null
    const weather = await getCurrentWeather(location, apiKey)
    
    return {
      message: `Current weather in ${weather.location}: ${weather.temperature}°C, ${weather.description}. Humidity ${weather.humidity}%, Wind ${weather.windSpeed} m/s. Say 'go to weather' for full forecast.`,
      action: 'weather_retrieved',
      data: weather
    }
  } catch (error) {
    return {
      message: `Unable to get weather data. Try: 'go to weather' to see the dashboard.`,
      action: 'weather_failed',
      data: null
    }
  }
}

async function handleWeatherRain(match, onNavigate) {
  try {
    const location = getFarmLocation()
    const apiKey = localStorage.getItem('cattalytics:weather:apikey') || null
    const weather = await getCurrentWeather(location, apiKey)
    
    const isRainy = weather.description.toLowerCase().includes('rain')
    const humidity = weather.humidity
    
    let message = isRainy 
      ? `Yes, it's ${weather.description} right now.`
      : `No rain currently. ${weather.description}. Humidity is ${humidity}%.`
    
    return {
      message,
      action: 'weather_rain_check',
      data: { isRainy, weather }
    }
  } catch (error) {
    return {
      message: `Unable to check rain conditions. Go to weather dashboard for details.`,
      action: 'weather_failed',
      data: null
    }
  }
}

async function handleWeatherTemperature(match, onNavigate) {
  try {
    const location = getFarmLocation()
    const apiKey = localStorage.getItem('cattalytics:weather:apikey') || null
    const weather = await getCurrentWeather(location, apiKey)
    
    return {
      message: `Current temperature is ${weather.temperature}°C. Feels like ${weather.feelsLike}°C. High/Low: ${weather.tempMax}°/${weather.tempMin}°C.`,
      action: 'weather_temperature',
      data: weather
    }
  } catch (error) {
    return {
      message: `Unable to get temperature. Check the weather dashboard.`,
      action: 'weather_failed',
      data: null
    }
  }
}

/**
 * Get command suggestions based on current context
 */
export function getCommandSuggestions(context = 'general') {
  const suggestions = {
    general: [
      "Add 50kg feed to inventory",
      "Record milk yield 25 liters for Bessie",
      "Show me all sick animals",
      "Create task: Check water troughs",
      "What's the weather?",
      "Go to weather"
    ],
    inventory: [
      "Add 100kg maize to inventory",
      "Remove 20 liters medicine from inventory",
      "Show inventory status"
    ],
    animals: [
      "Show all sick animals",
      "Show animals with status active",
      "Record milk yield 30 liters for cow 123"
    ],
    tasks: [
      "Create task: Vaccinate calves",
      "Complete task: Feed animals",
      "Show all pending tasks"
    ],
    finance: [
      "Add income 10000 for crop sales",
      "Add expense 5000 for veterinary services",
      "Show financial summary"
    ],
    weather: [
      "What's the weather?",
      "Is it raining?",
      "What's the temperature?",
      "Go to weather"
    ]
  }
  
  return suggestions[context] || suggestions.general
}
