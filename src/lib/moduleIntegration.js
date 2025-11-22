/**
 * Module Integration Layer
 * 
 * Connects all modules to share data:
 * - Health System gets drugs from main Inventory
 * - Finance auto-records expenses from all modules
 * - Equipment maintenance uses Inventory supplies
 * - All transactions are tracked centrally
 */

/**
 * Get main inventory items (from Inventory module)
 */
export function getMainInventory() {
  try {
    const data = localStorage.getItem('cattalytics:inventory')
    return data ? JSON.parse(data) : []
  } catch (e) {
    return []
  }
}

/**
 * Get veterinary/medical items from main inventory
 */
export function getVeterinaryInventory() {
  const inventory = getMainInventory()
  return inventory.filter(item => 
    item.category === 'Veterinary' || 
    item.category === 'Supplements' ||
    item.subcategory === 'Medicine' ||
    item.subcategory === 'Vaccines' ||
    item.subcategory === 'Dewormer'
  )
}

/**
 * Get feed items from main inventory
 */
export function getFeedInventory() {
  const inventory = getMainInventory()
  return inventory.filter(item => 
    item.category === 'Feed' ||
    item.subcategory === 'Hay' ||
    item.subcategory === 'Grain' ||
    item.subcategory === 'Concentrate'
  )
}

/**
 * Update inventory quantity when used
 */
export function useInventoryItem(itemId, quantityUsed, usedBy = '', purpose = '') {
  try {
    const inventory = getMainInventory()
    const updated = inventory.map(item => {
      if (item.id === itemId) {
        const newQuantity = (item.quantity || 0) - quantityUsed
        const usage = {
          date: new Date().toISOString(),
          quantity: quantityUsed,
          usedBy,
          purpose,
          remainingQuantity: Math.max(0, newQuantity)
        }
        return {
          ...item,
          quantity: Math.max(0, newQuantity),
          usageHistory: [...(item.usageHistory || []), usage],
          lastUsed: new Date().toISOString()
        }
      }
      return item
    })
    
    localStorage.setItem('cattalytics:inventory', JSON.stringify(updated))
    
    // Check if below reorder point
    const item = updated.find(i => i.id === itemId)
    if (item && item.quantity <= (item.reorderPoint || 0)) {
      // Create notification
      createNotification('LOW_STOCK', `${item.name} is below reorder point. Current: ${item.quantity} ${item.unit}`, 'HIGH')
    }
    
    return { success: true, item }
  } catch (e) {
    console.error('Failed to update inventory:', e)
    return { success: false, error: e.message }
  }
}

/**
 * Record expense in Finance module
 */
export function recordExpense(data) {
  try {
    const finances = JSON.parse(localStorage.getItem('cattalytics:finance') || '[]')
    
    const expense = {
      id: 'F-' + Date.now(),
      date: data.date || new Date().toISOString().slice(0, 10),
      amount: -Math.abs(parseFloat(data.amount)),
      type: 'expense',
      category: data.category || 'Other',
      subcategory: data.subcategory || 'Miscellaneous',
      description: data.description || '',
      notes: data.notes || [],
      paymentMethod: data.paymentMethod || 'Cash',
      vendor: data.vendor || '',
      source: data.source || 'Manual', // e.g., 'Health System', 'Feeding', 'Treatment'
      linkedId: data.linkedId || '', // Link to originating record
      autoRecorded: true,
      createdAt: new Date().toISOString()
    }
    
    finances.push(expense)
    localStorage.setItem('cattalytics:finance', JSON.stringify(finances))
    
    return { success: true, expense }
  } catch (e) {
    console.error('Failed to record expense:', e)
    return { success: false, error: e.message }
  }
}

/**
 * Record income in Finance module
 */
export function recordIncome(data) {
  try {
    const finances = JSON.parse(localStorage.getItem('cattalytics:finance') || '[]')
    
    const income = {
      id: 'F-' + Date.now(),
      date: data.date || new Date().toISOString().slice(0, 10),
      amount: Math.abs(parseFloat(data.amount)),
      type: 'income',
      category: data.category || 'Other',
      subcategory: data.subcategory || 'Miscellaneous',
      description: data.description || '',
      notes: data.notes || [],
      paymentMethod: data.paymentMethod || 'Cash',
      vendor: data.vendor || '',
      source: data.source || 'Manual',
      linkedId: data.linkedId || '',
      autoRecorded: true,
      createdAt: new Date().toISOString()
    }
    
    finances.push(income)
    localStorage.setItem('cattalytics:finance', JSON.stringify(finances))
    
    return { success: true, income }
  } catch (e) {
    console.error('Failed to record income:', e)
    return { success: false, error: e.message }
  }
}

/**
 * Record animal treatment with inventory and finance integration
 */
export function recordTreatment(data) {
  try {
    // 1. Use inventory item if specified
    if (data.inventoryItemId && data.quantity) {
      useInventoryItem(
        data.inventoryItemId, 
        data.quantity,
        data.animalId || 'Unknown',
        `Treatment: ${data.treatment || 'Unknown'}`
      )
    }
    
    // 2. Record expense in finance
    if (data.cost && data.cost > 0) {
      recordExpense({
        amount: data.cost,
        category: 'Veterinary',
        subcategory: 'Treatment',
        description: `Treatment: ${data.treatment || 'Unknown'} for ${data.animalName || data.animalId || 'animal'}`,
        vendor: data.veterinarian || 'Farm Staff',
        source: 'Animal Treatment',
        linkedId: data.id,
        date: data.date
      })
    }
    
    return { success: true }
  } catch (e) {
    console.error('Failed to record treatment:', e)
    return { success: false, error: e.message }
  }
}

/**
 * Record animal feeding with inventory and finance integration
 */
export function recordFeeding(data) {
  try {
    // 1. Use inventory item if specified
    if (data.inventoryItemId && data.quantity) {
      useInventoryItem(
        data.inventoryItemId,
        data.quantity,
        data.animalId || 'Unknown',
        `Feeding: ${data.feedType || 'Unknown'}`
      )
    }
    
    // 2. Record expense in finance if cost specified
    if (data.cost && data.cost > 0) {
      recordExpense({
        amount: data.cost,
        category: 'Feed',
        subcategory: data.feedType || 'Mixed',
        description: `Feed for ${data.animalName || data.animalId || 'animal'}: ${data.quantity} ${data.unit || 'units'}`,
        source: 'Animal Feeding',
        linkedId: data.id,
        date: data.date
      })
    }
    
    return { success: true }
  } catch (e) {
    console.error('Failed to record feeding:', e)
    return { success: false, error: e.message }
  }
}

/**
 * Record milk sales income
 */
export function recordMilkSale(data) {
  try {
    return recordIncome({
      amount: data.amount,
      category: 'Milk Sales',
      subcategory: data.buyer ? 'Direct Sales' : 'Wholesale',
      description: `Milk sale: ${data.liters || 0} liters`,
      vendor: data.buyer || 'Buyer',
      source: 'Milk Yield',
      linkedId: data.id,
      date: data.date
    })
  } catch (e) {
    console.error('Failed to record milk sale:', e)
    return { success: false, error: e.message }
  }
}

/**
 * Record animal sale income
 */
export function recordAnimalSale(data) {
  try {
    return recordIncome({
      amount: data.salePrice,
      category: 'Livestock Sales',
      subcategory: data.type || 'Cattle Sales',
      description: `Sale of ${data.animalName || data.tag || 'animal'} (${data.breed || 'Unknown breed'})`,
      vendor: data.buyer || 'Buyer',
      source: 'Animals',
      linkedId: data.id,
      date: data.saleDate || data.date
    })
  } catch (e) {
    console.error('Failed to record animal sale:', e)
    return { success: false, error: e.message }
  }
}

/**
 * Create notification
 */
function createNotification(type, message, priority = 'MEDIUM') {
  try {
    const notifications = JSON.parse(localStorage.getItem('devinsfarm:notifications') || '[]')
    
    const notification = {
      id: 'NOTIF-' + Date.now(),
      type,
      message,
      priority,
      read: false,
      timestamp: new Date().toISOString()
    }
    
    // Keep only last 100 notifications
    notifications.unshift(notification)
    if (notifications.length > 100) {
      notifications.splice(100)
    }
    
    localStorage.setItem('devinsfarm:notifications', JSON.stringify(notifications))
    
    // Trigger notification event
    window.dispatchEvent(new CustomEvent('newNotification'))
    
    return notification
  } catch (e) {
    console.error('Failed to create notification:', e)
    return null
  }
}

/**
 * Get all expenses from a specific source
 */
export function getExpensesBySource(source) {
  try {
    const finances = JSON.parse(localStorage.getItem('cattalytics:finance') || '[]')
    return finances.filter(f => f.source === source && f.type === 'expense')
  } catch (e) {
    return []
  }
}

/**
 * Get all income from a specific source
 */
export function getIncomeBySource(source) {
  try {
    const finances = JSON.parse(localStorage.getItem('cattalytics:finance') || '[]')
    return finances.filter(f => f.source === source && f.type === 'income')
  } catch (e) {
    return []
  }
}

/**
 * Get financial summary by source
 */
export function getFinancialSummary() {
  try {
    const finances = JSON.parse(localStorage.getItem('cattalytics:finance') || '[]')
    
    const bySource = {}
    let totalIncome = 0
    let totalExpenses = 0
    
    finances.forEach(f => {
      const source = f.source || 'Manual'
      if (!bySource[source]) {
        bySource[source] = { income: 0, expenses: 0, net: 0 }
      }
      
      if (f.type === 'income') {
        bySource[source].income += f.amount
        totalIncome += f.amount
      } else {
        bySource[source].expenses += Math.abs(f.amount)
        totalExpenses += Math.abs(f.amount)
      }
      
      bySource[source].net = bySource[source].income - bySource[source].expenses
    })
    
    // Convert bySource object to sources array
    const sources = Object.keys(bySource).map(source => ({
      source,
      income: bySource[source].income,
      expenses: bySource[source].expenses,
      net: bySource[source].net
    }))
    
    return {
      sources,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses
    }
  } catch (e) {
    console.error('Failed to get financial summary:', e)
    return { sources: [], totalIncome: 0, totalExpenses: 0, netProfit: 0 }
  }
}

export default {
  getMainInventory,
  getVeterinaryInventory,
  getFeedInventory,
  useInventoryItem,
  recordExpense,
  recordIncome,
  recordTreatment,
  recordFeeding,
  recordMilkSale,
  recordAnimalSale,
  getExpensesBySource,
  getIncomeBySource,
  getFinancialSummary
}
