/**
 * Automatic Notification Triggers
 * Generates notifications based on data changes and conditions
 */

import { showNotification, scheduleReminder, NOTIFICATION_TYPES, PRIORITIES } from './notifications'
import { loadData } from './storage'

/**
 * Check and notify for treatment due dates
 */
export function checkTreatmentReminders() {
  try {
    const treatments = loadData('treatments', [])
    if (!Array.isArray(treatments)) {
      console.warn('Treatments data is not an array:', typeof treatments)
      return
    }
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    treatments.forEach(treatment => {
      if (treatment.nextDue) {
        const nextDue = new Date(treatment.nextDue)
        
        // Notify for treatments due today
        if (nextDue.toDateString() === now.toDateString()) {
          showNotification('Treatment Due Today', {
            body: `Treatment for ${treatment.animalName || treatment.animalId} is due today`,
            type: NOTIFICATION_TYPES.TREATMENT,
            priority: PRIORITIES.HIGH,
            data: { treatmentId: treatment.id, animalId: treatment.animalId }
          })
        }
        
        // Notify for treatments due tomorrow
        if (nextDue.toDateString() === tomorrow.toDateString()) {
          showNotification('Treatment Due Tomorrow', {
            body: `Treatment for ${treatment.animalName || treatment.animalId} is due tomorrow`,
            type: NOTIFICATION_TYPES.TREATMENT,
            priority: PRIORITIES.MEDIUM,
            data: { treatmentId: treatment.id, animalId: treatment.animalId }
          })
        }
      }
    })
  } catch (error) {
    console.error('Error checking treatment reminders:', error)
  }
}

/**
 * Check and notify for breeding due dates
 */
export function checkBreedingReminders() {
  try {
    const breeding = loadData('breeding', [])
    if (!Array.isArray(breeding)) {
      console.warn('Breeding data is not an array:', typeof breeding)
      return
    }
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    breeding.forEach(record => {
      if (record.dueDate && (record.status === 'Pregnant' || record.status === 'Confirmed')) {
        const dueDate = new Date(record.dueDate)
        
        // Notify for overdue pregnancies
        if (dueDate < now) {
          showNotification('⚠️ Breeding Overdue', {
            body: `${record.animalName || record.animalId} is overdue for birth (Due: ${dueDate.toLocaleDateString()})`,
            type: NOTIFICATION_TYPES.BREEDING,
            priority: PRIORITIES.URGENT,
            data: { breedingId: record.id, animalId: record.animalId }
          })
        }
        
        // Notify for births due within next 7 days
        else if (dueDate >= now && dueDate <= next7Days) {
          const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))
          showNotification('Birth Expected Soon', {
            body: `${record.animalName || record.animalId} expected to give birth in ${daysUntil} day(s)`,
            type: NOTIFICATION_TYPES.BREEDING,
            priority: PRIORITIES.HIGH,
            data: { breedingId: record.id, animalId: record.animalId }
          })
        }
      }
    })
  } catch (error) {
    console.error('Error checking breeding reminders:', error)
  }
}

/**
 * Check and notify for task deadlines
 */
export function checkTaskReminders() {
  try {
    const tasks = loadData('tasks', [])
    if (!Array.isArray(tasks)) {
      console.warn('Tasks data is not an array:', typeof tasks)
      return
    }
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    tasks.forEach(task => {
      if (task.dueDate && task.status !== 'Completed') {
        const dueDate = new Date(task.dueDate)
        
        // Notify for overdue tasks
        if (dueDate < now) {
          showNotification('⚠️ Task Overdue', {
            body: `"${task.title}" is overdue`,
            type: NOTIFICATION_TYPES.TASK,
            priority: PRIORITIES.URGENT,
            data: { taskId: task.id }
          })
        }
        
        // Notify for tasks due today
        else if (dueDate.toDateString() === now.toDateString()) {
          showNotification('Task Due Today', {
            body: `"${task.title}" is due today`,
            type: NOTIFICATION_TYPES.TASK,
            priority: PRIORITIES.HIGH,
            data: { taskId: task.id }
          })
        }
        
        // Notify for tasks due tomorrow
        else if (dueDate.toDateString() === tomorrow.toDateString()) {
          showNotification('Task Due Tomorrow', {
            body: `"${task.title}" is due tomorrow`,
            type: NOTIFICATION_TYPES.TASK,
            priority: PRIORITIES.MEDIUM,
            data: { taskId: task.id }
          })
        }
      }
    })
  } catch (error) {
    console.error('Error checking task reminders:', error)
  }
}

/**
 * Check and notify for low inventory
 */
export function checkInventoryAlerts(lowThreshold = 10, criticalThreshold = 5) {
  try {
    const inventory = loadData('inventory', [])
    if (!Array.isArray(inventory)) {
      console.warn('Inventory data is not an array:', typeof inventory)
      return
    }
    
    inventory.forEach(item => {
      const quantity = parseFloat(item.quantity) || 0
      
      // Critical stock alert
      if (quantity > 0 && quantity <= criticalThreshold) {
        showNotification('🚨 Critical Stock Alert', {
          body: `"${item.name}" is critically low (${quantity} ${item.unit || 'units'} remaining)`,
          type: NOTIFICATION_TYPES.INVENTORY,
          priority: PRIORITIES.URGENT,
          data: { itemId: item.id }
        })
      }
      
      // Low stock warning
      else if (quantity > criticalThreshold && quantity <= lowThreshold) {
        showNotification('Low Stock Warning', {
          body: `"${item.name}" is running low (${quantity} ${item.unit || 'units'} remaining)`,
          type: NOTIFICATION_TYPES.INVENTORY,
          priority: PRIORITIES.MEDIUM,
          data: { itemId: item.id }
        })
      }
      
      // Out of stock
      else if (quantity <= 0) {
        showNotification('⚠️ Out of Stock', {
          body: `"${item.name}" is out of stock`,
          type: NOTIFICATION_TYPES.INVENTORY,
          priority: PRIORITIES.HIGH,
          data: { itemId: item.id }
        })
      }
    })
  } catch (error) {
    console.error('Error checking inventory alerts:', error)
  }
}

/**
 * Check all automatic notifications
 * Call this periodically (e.g., every hour or when app loads)
 */
export function checkAllAutoNotifications() {
  checkTreatmentReminders()
  checkBreedingReminders()
  checkTaskReminders()
  checkInventoryAlerts()
}

/**
 * Schedule reminder when treatment is added/updated
 */
export function scheduleTreatmentReminder(treatment) {
  if (treatment.nextDue) {
    scheduleReminder({
      type: NOTIFICATION_TYPES.TREATMENT,
      title: 'Treatment Due',
      body: `Treatment for ${treatment.animalName || treatment.animalId}`,
      dueDate: treatment.nextDue,
      entityId: treatment.id,
      entityType: 'treatment',
      priority: PRIORITIES.HIGH
    })
  }
}

/**
 * Schedule reminder when breeding record is added/updated
 */
export function scheduleBreedingReminder(breeding) {
  if (breeding.dueDate && (breeding.status === 'Pregnant' || breeding.status === 'Confirmed')) {
    scheduleReminder({
      type: NOTIFICATION_TYPES.BREEDING,
      title: 'Birth Expected',
      body: `${breeding.animalName || breeding.animalId} expected to give birth`,
      dueDate: breeding.dueDate,
      entityId: breeding.id,
      entityType: 'breeding',
      priority: PRIORITIES.HIGH
    })
  }
}

/**
 * Schedule reminder when task is added/updated
 */
export function scheduleTaskReminder(task) {
  if (task.dueDate && task.status !== 'Completed') {
    scheduleReminder({
      type: NOTIFICATION_TYPES.TASK,
      title: 'Task Due',
      body: task.title,
      dueDate: task.dueDate,
      entityId: task.id,
      entityType: 'task',
      priority: task.priority || PRIORITIES.MEDIUM
    })
  }
}
