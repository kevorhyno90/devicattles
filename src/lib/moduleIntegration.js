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

/**
 * Get all pets from PetManagement
 */
export function getPets() {
  try {
    const data = localStorage.getItem('cattalytics:pets')
    return data ? JSON.parse(data) : []
  } catch (e) {
    return []
  }
}

/**
 * Get pet expenses for Finance module
 */
export function getPetExpenses() {
  try {
    const pets = getPets()
    const expenses = []
    
    pets.forEach(pet => {
      // Grooming expenses
      if (pet.groomingLog && pet.groomingLog.length > 0) {
        pet.groomingLog.forEach(grooming => {
          if (grooming.cost && grooming.cost > 0) {
            expenses.push({
              date: grooming.date,
              amount: grooming.cost,
              category: 'Pet Care',
              subcategory: 'Grooming',
              description: `Grooming for ${pet.name}: ${grooming.serviceType}`,
              vendor: grooming.groomer || 'Groomer',
              source: 'PetManagement',
              linkedId: pet.id,
              petName: pet.name
            })
          }
        })
      }
      
      // Health/Vet expenses
      if (pet.healthRecords && pet.healthRecords.length > 0) {
        pet.healthRecords.forEach(record => {
          if (record.cost && record.cost > 0) {
            expenses.push({
              date: record.date,
              amount: record.cost,
              category: 'Pet Care',
              subcategory: 'Veterinary',
              description: `Vet visit for ${pet.name}: ${record.diagnosis || 'Checkup'}`,
              vendor: record.veterinarian || 'Veterinarian',
              source: 'PetManagement',
              linkedId: pet.id,
              petName: pet.name
            })
          }
        })
      }
      
      // Vaccination expenses
      if (pet.vaccinations && pet.vaccinations.length > 0) {
        pet.vaccinations.forEach(vac => {
          if (vac.cost && vac.cost > 0) {
            expenses.push({
              date: vac.dateGiven,
              amount: vac.cost,
              category: 'Pet Care',
              subcategory: 'Vaccination',
              description: `${vac.vaccineName} vaccination for ${pet.name}`,
              vendor: vac.veterinarian || 'Veterinary Clinic',
              source: 'PetManagement',
              linkedId: pet.id,
              petName: pet.name
            })
          }
        })
      }
      
      // Feeding expenses (if tracked)
      if (pet.feedingSchedule && pet.feedingSchedule.cost) {
        const monthlyCost = parseFloat(pet.feedingSchedule.cost) || 0
        if (monthlyCost > 0) {
          expenses.push({
            date: new Date().toISOString().slice(0, 10),
            amount: monthlyCost,
            category: 'Pet Care',
            subcategory: 'Feed',
            description: `Monthly food for ${pet.name}: ${pet.feedingSchedule.foodType}`,
            vendor: 'Pet Store',
            source: 'PetManagement',
            linkedId: pet.id,
            petName: pet.name,
            recurring: 'monthly'
          })
        }
      }
    })
    
    return expenses
  } catch (e) {
    console.error('Failed to get pet expenses:', e)
    return []
  }
}

/**
 * Get pet tasks/reminders for Tasks module
 */
export function getPetTasks() {
  try {
    const pets = getPets()
    const tasks = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    pets.forEach(pet => {
      // Vaccination reminders
      if (pet.vaccinations && pet.vaccinations.length > 0) {
        pet.vaccinations.forEach(vac => {
          if (vac.nextDue) {
            const dueDate = new Date(vac.nextDue)
            dueDate.setHours(0, 0, 0, 0)
            const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
            
            if (daysUntil >= 0 && daysUntil <= 30) {
              tasks.push({
                id: `pet-vac-${pet.id}-${vac.vaccineName}`,
                title: `${vac.vaccineName} vaccination due for ${pet.name}`,
                description: `${pet.species} vaccination due on ${vac.nextDue}`,
                dueDate: vac.nextDue,
                priority: daysUntil <= 7 ? 'HIGH' : 'MEDIUM',
                category: 'Pet Care',
                subcategory: 'Vaccination',
                status: 'pending',
                source: 'PetManagement',
                linkedId: pet.id,
                petName: pet.name
              })
            }
          }
        })
      }
      
      // Medication reminders
      if (pet.medications && pet.medications.length > 0) {
        pet.medications.forEach(med => {
          const endDate = new Date(med.endDate)
          endDate.setHours(0, 0, 0, 0)
          
          if (endDate >= today) {
            tasks.push({
              id: `pet-med-${pet.id}-${med.name}`,
              title: `Give ${med.name} to ${pet.name}`,
              description: `Dosage: ${med.dosage}, Frequency: ${med.frequency}`,
              dueDate: new Date().toISOString().slice(0, 10),
              priority: 'HIGH',
              category: 'Pet Care',
              subcategory: 'Medication',
              status: 'pending',
              recurring: med.frequency,
              source: 'PetManagement',
              linkedId: pet.id,
              petName: pet.name
            })
          }
        })
      }
      
      // Grooming reminders (if last grooming was >60 days ago)
      if (pet.groomingLog && pet.groomingLog.length > 0) {
        const lastGrooming = pet.groomingLog.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        )[0]
        const lastGroomDate = new Date(lastGrooming.date)
        const daysSince = Math.ceil((today - lastGroomDate) / (1000 * 60 * 60 * 24))
        
        if (daysSince >= 60) {
          tasks.push({
            id: `pet-groom-${pet.id}`,
            title: `Grooming due for ${pet.name}`,
            description: `Last groomed ${daysSince} days ago`,
            dueDate: new Date().toISOString().slice(0, 10),
            priority: 'LOW',
            category: 'Pet Care',
            subcategory: 'Grooming',
            status: 'pending',
            source: 'PetManagement',
            linkedId: pet.id,
            petName: pet.name
          })
        }
      }
    })
    
    return tasks
  } catch (e) {
    console.error('Failed to get pet tasks:', e)
    return []
  }
}

/**
 * Get pet schedules for Schedules module
 */
export function getPetSchedules() {
  try {
    const pets = getPets()
    const schedules = []
    
    pets.forEach(pet => {
      // Feeding schedules
      if (pet.feedingSchedule && pet.feedingSchedule.times) {
        const times = pet.feedingSchedule.times.split(',').map(t => t.trim())
        times.forEach(time => {
          schedules.push({
            id: `pet-feed-${pet.id}-${time}`,
            title: `Feed ${pet.name}`,
            description: `${pet.feedingSchedule.foodType}, ${pet.feedingSchedule.portion}`,
            time: time,
            frequency: 'daily',
            category: 'Pet Care',
            subcategory: 'Feeding',
            source: 'PetManagement',
            linkedId: pet.id,
            petName: pet.name
          })
        })
      }
      
      // Upcoming vet appointments (from health records with follow-up dates)
      if (pet.healthRecords && pet.healthRecords.length > 0) {
        pet.healthRecords.forEach(record => {
          if (record.followUpDate) {
            const followUp = new Date(record.followUpDate)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            if (followUp >= today) {
              schedules.push({
                id: `pet-vet-${pet.id}-${record.date}`,
                title: `Vet follow-up for ${pet.name}`,
                description: `Follow-up: ${record.diagnosis || 'Checkup'}`,
                date: record.followUpDate,
                time: '09:00',
                category: 'Pet Care',
                subcategory: 'Veterinary',
                source: 'PetManagement',
                linkedId: pet.id,
                petName: pet.name
              })
            }
          }
        })
      }
      
      // Breeding schedules (heat cycles, expected births)
      if (pet.breedingRecords && pet.breedingRecords.length > 0) {
        pet.breedingRecords.forEach(breeding => {
          if (breeding.expectedBirthDate) {
            const birthDate = new Date(breeding.expectedBirthDate)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            if (birthDate >= today) {
              schedules.push({
                id: `pet-birth-${pet.id}-${breeding.breedingDate}`,
                title: `Expected birth for ${pet.name}`,
                description: `Partner: ${breeding.partner || 'Unknown'}`,
                date: breeding.expectedBirthDate,
                category: 'Pet Care',
                subcategory: 'Breeding',
                source: 'PetManagement',
                linkedId: pet.id,
                petName: pet.name
              })
            }
          }
        })
      }
    })
    
    return schedules
  } catch (e) {
    console.error('Failed to get pet schedules:', e)
    return []
  }
}

/**
 * Record pet expense
 */
export function recordPetExpense(data) {
  try {
    return recordExpense({
      amount: data.amount,
      category: 'Pet Care',
      subcategory: data.subcategory || 'Other',
      description: data.description,
      vendor: data.vendor || '',
      source: 'PetManagement',
      linkedId: data.petId,
      date: data.date
    })
  } catch (e) {
    console.error('Failed to record pet expense:', e)
    return { success: false, error: e.message }
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
  getFinancialSummary,
  getPets,
  getPetExpenses,
  getPetTasks,
  getPetSchedules,
  recordPetExpense
}
