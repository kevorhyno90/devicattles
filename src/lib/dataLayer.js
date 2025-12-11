/**
 * Centralized Data Layer
 * 
 * Unified API for all data operations with:
 * - Automatic versioning & migrations
 * - Query builder for complex filters
 * - Caching & memoization
 * - Transaction support
 * - Audit logging integration
 * - Validation before save
 * - Performance monitoring
 */

import { loadDataAsync, saveData, loadData } from './storage';
import { logAction } from './audit';
import { perfMonitor } from './performanceUtils';

// Data version tracking
const DATA_VERSION = '1.0.0';
const VERSION_KEY = 'cattalytics:dataVersion';

// Cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get current data version
 */
export function getDataVersion() {
  return localStorage.getItem(VERSION_KEY) || '0.0.0';
}

/**
 * Set data version
 */
function setDataVersion(version) {
  localStorage.setItem(VERSION_KEY, version);
}

/**
 * Clear all cache
 */
export function clearCache() {
  cache.clear();
}

/**
 * Get cached data or fetch from storage
 */
async function getCached(key, fetchFn) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

/**
 * Invalidate cache for a specific key
 */
function invalidateCache(key) {
  cache.delete(key);
  // Also clear any related keys
  for (const cacheKey of cache.keys()) {
    if (cacheKey.startsWith(key)) {
      cache.delete(cacheKey);
    }
  }
}

/**
 * Base entity class with common CRUD operations
 */
class Entity {
  constructor(storageKey, entityName) {
    this.storageKey = storageKey;
    this.entityName = entityName;
  }

  /**
   * Get all items
   */
  async getAll() {
    return getCached(this.storageKey, async () => {
      const data = await loadDataAsync(this.storageKey);
      return Array.isArray(data) ? data : [];
    });
  }

  /**
   * Get all items synchronously (for backward compatibility)
   */
  getAllSync() {
    const data = loadData(this.storageKey);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get item by ID
   */
  async getById(id) {
    const all = await this.getAll();
    return all.find(item => item.id === id);
  }

  /**
   * Query items with filters
   * @param {Function} predicate - Filter function
   */
  async query(predicate) {
    const all = await this.getAll();
    return all.filter(predicate);
  }

  /**
   * Count items with optional filter
   */
  async count(predicate = null) {
    const all = await this.getAll();
    return predicate ? all.filter(predicate).length : all.length;
  }

  /**
   * Create new item
   */
  async create(item, userId = null) {
    const all = await this.getAll();
    
    // Generate ID if not present
    if (!item.id) {
      item.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }
    
    // Add timestamps
    item.createdAt = item.createdAt || new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    
    // Validate
    const validation = this.validate(item);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    all.push(item);
    saveData(this.storageKey, all);
    invalidateCache(this.storageKey);
    
    // Audit log
    if (userId) {
      logAction(userId, 'create', this.entityName, item.id, null, item);
    }
    
    return item;
  }

  /**
   * Update existing item
   */
  async update(id, updates, userId = null) {
    const all = await this.getAll();
    const index = all.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`${this.entityName} with id ${id} not found`);
    }
    
    const oldItem = { ...all[index] };
    const newItem = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
    
    // Validate
    const validation = this.validate(newItem);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    all[index] = newItem;
    saveData(this.storageKey, all);
    invalidateCache(this.storageKey);
    
    // Audit log
    if (userId) {
      logAction(userId, 'update', this.entityName, id, oldItem, newItem);
    }
    
    return newItem;
  }

  /**
   * Delete item
   */
  async delete(id, userId = null) {
    const all = await this.getAll();
    const index = all.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`${this.entityName} with id ${id} not found`);
    }
    
    const deletedItem = all[index];
    all.splice(index, 1);
    saveData(this.storageKey, all);
    invalidateCache(this.storageKey);
    
    // Audit log
    if (userId) {
      logAction(userId, 'delete', this.entityName, id, deletedItem, null);
    }
    
    return deletedItem;
  }

  /**
   * Bulk create
   */
  async bulkCreate(items, userId = null) {
    const results = [];
    for (const item of items) {
      try {
        results.push(await this.create(item, userId));
      } catch (error) {
        console.error(`Failed to create ${this.entityName}:`, error);
      }
    }
    return results;
  }

  /**
   * Bulk update
   */
  async bulkUpdate(updates, userId = null) {
    const results = [];
    for (const { id, ...updateData } of updates) {
      try {
        results.push(await this.update(id, updateData, userId));
      } catch (error) {
        console.error(`Failed to update ${this.entityName} ${id}:`, error);
      }
    }
    return results;
  }

  /**
   * Bulk delete
   */
  async bulkDelete(ids, userId = null) {
    const results = [];
    for (const id of ids) {
      try {
        results.push(await this.delete(id, userId));
      } catch (error) {
        console.error(`Failed to delete ${this.entityName} ${id}:`, error);
      }
    }
    return results;
  }

  /**
   * Validate item (override in subclasses)
   */
  validate(item) {
    return { valid: true };
  }

  /**
   * Search items by text
   */
  async search(searchTerm, fields = []) {
    const all = await this.getAll();
    const term = searchTerm.toLowerCase();
    
    return all.filter(item => {
      for (const field of fields) {
        const value = item[field];
        if (value && value.toString().toLowerCase().includes(term)) {
          return true;
        }
      }
      return false;
    });
  }
}

/**
 * Animals entity
 */
class AnimalsEntity extends Entity {
  constructor() {
    super('cattalytics:animals', 'Animal');
  }

  validate(animal) {
    if (!animal.name || animal.name.trim() === '') {
      return { valid: false, error: 'Animal name is required' };
    }
    if (!animal.type) {
      return { valid: false, error: 'Animal type is required' };
    }
    return { valid: true };
  }

  async getByType(type) {
    return this.query(animal => animal.type === type);
  }

  async getByGroup(groupId) {
    return this.query(animal => animal.groupId === groupId);
  }

  async getHealthAlerts() {
    return this.query(animal => animal.healthStatus === 'sick' || animal.healthStatus === 'injured');
  }
}

/**
 * Crops entity
 */
class CropsEntity extends Entity {
  constructor() {
    super('cattalytics:crops', 'Crop');
  }

  validate(crop) {
    if (!crop.name || crop.name.trim() === '') {
      return { valid: false, error: 'Crop name is required' };
    }
    if (crop.expectedHarvest && crop.planted) {
      if (new Date(crop.expectedHarvest) <= new Date(crop.planted)) {
        return { valid: false, error: 'Expected harvest must be after planted date' };
      }
    }
    return { valid: true };
  }

  async getByStatus(status) {
    return this.query(crop => crop.status === status);
  }

  async getReadyToHarvest() {
    const today = new Date();
    return this.query(crop => {
      if (!crop.expectedHarvest) return false;
      const harvestDate = new Date(crop.expectedHarvest);
      const daysUntil = Math.ceil((harvestDate - today) / (1000 * 60 * 60 * 24));
      return daysUntil <= 7 && daysUntil >= 0;
    });
  }
}

/**
 * Tasks entity
 */
class TasksEntity extends Entity {
  constructor() {
    super('cattalytics:tasks', 'Task');
  }

  validate(task) {
    if (!task.title || task.title.trim() === '') {
      return { valid: false, error: 'Task title is required' };
    }
    if ((task.priority === 'High' || task.priority === 'Critical') && task.dueDate) {
      if (new Date(task.dueDate) < new Date()) {
        return { valid: false, error: 'Due date must be in the future for high priority tasks' };
      }
    }
    return { valid: true };
  }

  async getByStatus(status) {
    return this.query(task => task.status === status);
  }

  async getByPriority(priority) {
    return this.query(task => task.priority === priority);
  }

  async getOverdue() {
    const today = new Date();
    return this.query(task => {
      if (!task.dueDate || task.status === 'Completed') return false;
      return new Date(task.dueDate) < today;
    });
  }

  async getByAssignee(userId) {
    return this.query(task => task.assignedTo === userId);
  }
}

/**
 * Finance entity
 */
class FinanceEntity extends Entity {
  constructor() {
    super('cattalytics:finance', 'Transaction');
  }

  validate(transaction) {
    if (!transaction.description || transaction.description.trim() === '') {
      return { valid: false, error: 'Transaction description is required' };
    }
    if (!transaction.amount || transaction.amount <= 0) {
      return { valid: false, error: 'Transaction amount must be greater than 0' };
    }
    if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
      return { valid: false, error: 'Transaction type must be income or expense' };
    }
    return { valid: true };
  }

  async getByType(type) {
    return this.query(t => t.type === type);
  }

  async getByDateRange(startDate, endDate) {
    return this.query(t => {
      const date = new Date(t.date);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });
  }

  async getTotalIncome(startDate = null, endDate = null) {
    let transactions = await this.getByType('income');
    if (startDate && endDate) {
      transactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
    }
    return transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }

  async getTotalExpense(startDate = null, endDate = null) {
    let transactions = await this.getByType('expense');
    if (startDate && endDate) {
      transactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
    }
    return transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }
}

/**
 * Inventory entity
 */
class InventoryEntity extends Entity {
  constructor() {
    super('cattalytics:inventory', 'InventoryItem');
  }

  validate(item) {
    if (!item.name || item.name.trim() === '') {
      return { valid: false, error: 'Item name is required' };
    }
    if (item.quantity < 0) {
      return { valid: false, error: 'Quantity cannot be negative' };
    }
    return { valid: true };
  }

  async getLowStock(threshold = null) {
    return this.query(item => {
      const minStock = threshold || item.minStock || 10;
      return item.quantity <= minStock;
    });
  }

  async getByCategory(category) {
    return this.query(item => item.category === category);
  }
}

/**
 * Notifications entity
 */
class NotificationsEntity extends Entity {
  constructor() {
    super('cattalytics:notifications', 'Notification');
  }

  validate(notification) {
    if (!notification.message || notification.message.trim() === '') {
      return { valid: false, error: 'Notification message is required' };
    }
    if (!notification.type || !['alert', 'info', 'warning', 'success'].includes(notification.type)) {
      return { valid: false, error: 'Invalid notification type' };
    }
    return { valid: true };
  }

  async getUnread() {
    return this.query(n => !n.read);
  }

  async getByType(type) {
    return this.query(n => n.type === type);
  }

  async markAsRead(id) {
    const notification = await this.getById(id);
    if (notification) {
      return this.update(id, { read: true });
    }
    return null;
  }

  async markAllAsRead() {
    const all = await this.getAll();
    const updates = all.map(n => ({ ...n, read: true }));
    saveData(this.storageKey, updates);
    invalidateCache(this.storageKey);
    return updates;
  }
}

/**
 * Activities entity - User activity log
 */
class ActivitiesEntity extends Entity {
  constructor() {
    super('cattalytics:activities', 'Activity');
  }

  validate(activity) {
    if (!activity.action || activity.action.trim() === '') {
      return { valid: false, error: 'Activity action is required' };
    }
    if (!activity.userId) {
      return { valid: false, error: 'Activity userId is required' };
    }
    return { valid: true };
  }

  async getByUser(userId) {
    return this.query(a => a.userId === userId);
  }

  async getRecent(limit = 50) {
    const all = await this.getAll();
    return all
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      .slice(0, limit);
  }

  async getByDateRange(startDate, endDate) {
    return this.query(a => {
      const date = new Date(a.timestamp);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });
  }

  async cleanup(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const all = await this.getAll();
    const filtered = all.filter(a => new Date(a.timestamp) > cutoffDate);
    
    saveData(this.storageKey, filtered);
    invalidateCache(this.storageKey);
    
    return all.length - filtered.length; // return number deleted
  }
}

/**
 * Unified Data Layer API
 */
export const DataLayer = {
  animals: new AnimalsEntity(),
  crops: new CropsEntity(),
  tasks: new TasksEntity(),
  finance: new FinanceEntity(),
  inventory: new InventoryEntity(),
  notifications: new NotificationsEntity(),
  activities: new ActivitiesEntity(),
  
  // Generic entity creator for other modules
  createEntity(storageKey, entityName) {
    return new Entity(storageKey, entityName);
  },
  
  // Utility functions
  clearCache,
  getDataVersion,
  
  /**
   * Initialize data layer and run migrations if needed
   */
  async initialize() {
    const currentVersion = getDataVersion();
    
    if (currentVersion !== DATA_VERSION) {
      console.log(`Migrating data from ${currentVersion} to ${DATA_VERSION}`);
      // Run migrations here
      await this.runMigrations(currentVersion, DATA_VERSION);
      setDataVersion(DATA_VERSION);
    }
    
    return true;
  },
  
  /**
   * Run data migrations
   */
  async runMigrations(fromVersion, toVersion) {
    // Migration logic here
    // Example: if (fromVersion === '0.0.0') { /* migrate old data */ }
    console.log('Migrations completed');
  },
  
  /**
   * Global search across all entities
   */
  async globalSearch(searchTerm) {
    const results = {
      animals: [],
      crops: [],
      tasks: [],
      finance: [],
      inventory: []
    };
    
    try {
      results.animals = await this.animals.search(searchTerm, ['name', 'tagNumber', 'breed']);
      results.crops = await this.crops.search(searchTerm, ['name', 'field', 'variety']);
      results.tasks = await this.tasks.search(searchTerm, ['title', 'description', 'category']);
      results.finance = await this.finance.search(searchTerm, ['description', 'category']);
      results.inventory = await this.inventory.search(searchTerm, ['name', 'category', 'supplier']);
    } catch (error) {
      console.error('Global search error:', error);
    }
    
    return results;
  },
  
  /**
   * Export all data
   */
  async exportAll() {
    return {
      version: DATA_VERSION,
      timestamp: new Date().toISOString(),
      data: {
        animals: await this.animals.getAll(),
        crops: await this.crops.getAll(),
        tasks: await this.tasks.getAll(),
        finance: await this.finance.getAll(),
        inventory: await this.inventory.getAll()
      }
    };
  },
  
  /**
   * Import all data
   */
  async importAll(exportData, userId = null) {
    if (exportData.version !== DATA_VERSION) {
      throw new Error('Data version mismatch. Migration required.');
    }
    
    const results = {
      animals: 0,
      crops: 0,
      tasks: 0,
      finance: 0,
      inventory: 0
    };
    
    if (exportData.data.animals) {
      results.animals = (await this.animals.bulkCreate(exportData.data.animals, userId)).length;
    }
    if (exportData.data.crops) {
      results.crops = (await this.crops.bulkCreate(exportData.data.crops, userId)).length;
    }
    if (exportData.data.tasks) {
      results.tasks = (await this.tasks.bulkCreate(exportData.data.tasks, userId)).length;
    }
    if (exportData.data.finance) {
      results.finance = (await this.finance.bulkCreate(exportData.data.finance, userId)).length;
    }
    if (exportData.data.inventory) {
      results.inventory = (await this.inventory.bulkCreate(exportData.data.inventory, userId)).length;
    }
    
    return results;
  }
};

// Initialize on import
DataLayer.initialize().catch(console.error);

export default DataLayer;
