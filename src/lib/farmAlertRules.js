/**
 * Pre-Built Farm Alert Rules
 * Simplified rules compatible with AlertRuleEngine
 */

export const FARM_ALERT_RULES = [
  {
    name: 'Vaccination Due',
    category: 'health',
    priority: 'high',
    enabled: true,
    conditions: [
      {
        field: 'nextVaccinationDate',
        operator: 'lte',
        value: 'within_7_days'
      }
    ],
    action: 'notify',
    message: '🩺 Animals need vaccination within 7 days',
    channels: ['app', 'push']
  },

  {
    name: 'Low Milk Production',
    category: 'production',
    priority: 'medium',
    enabled: true,
    conditions: [
      {
        field: 'milkYield',
        operator: 'lt',
        value: 'avg_threshold'
      }
    ],
    action: 'notify',
    message: '🥛 Milk production dropped significantly',
    channels: ['app']
  },

  {
    name: 'Feeding Schedule Missed',
    category: 'feeding',
    priority: 'high',
    enabled: true,
    conditions: [
      {
        field: 'lastFed',
        operator: 'gt',
        value: 'twelve_hours'
      }
    ],
    action: 'notify',
    message: '🌾 Some animals not fed - check immediately',
    channels: ['app', 'push']
  },

  {
    name: 'Low Inventory',
    category: 'inventory',
    priority: 'medium',
    enabled: true,
    conditions: [
      {
        field: 'quantity',
        operator: 'lte',
        value: 'minStock'
      }
    ],
    action: 'notify',
    message: '📦 Inventory items below minimum stock',
    channels: ['app']
  },

  {
    name: 'Expired Inventory',
    category: 'inventory',
    priority: 'high',
    enabled: true,
    conditions: [
      {
        field: 'expiryDate',
        operator: 'lte',
        value: 'today'
      }
    ],
    action: 'notify',
    message: '⚠️ Items expired or expiring - remove immediately',
    channels: ['app', 'push']
  },

  {
    name: 'Breeding Ready',
    category: 'breeding',
    priority: 'medium',
    enabled: true,
    conditions: [
      {
        field: 'breedingStatus',
        operator: 'eq',
        value: 'ready'
      }
    ],
    action: 'notify',
    message: '🐄 Animals ready for breeding',
    channels: ['app']
  },

  {
    name: 'Pregnancy Check Due',
    category: 'breeding',
    priority: 'high',
    enabled: true,
    conditions: [
      {
        field: 'pregnancyCheckDue',
        operator: 'eq',
        value: 'true'
      }
    ],
    action: 'notify',
    message: '🔍 Pregnancy checks are due',
    channels: ['app', 'push']
  },

  {
    name: 'Calving Due',
    category: 'breeding',
    priority: 'critical',
    enabled: true,
    conditions: [
      {
        field: 'expectedCalvingDate',
        operator: 'lte',
        value: 'within_7_days'
      }
    ],
    action: 'notify',
    message: '🚨 CRITICAL: Animals expected to calve within 7 days',
    channels: ['app', 'push', 'sms']
  },

  {
    name: 'Negative Balance',
    category: 'finance',
    priority: 'critical',
    enabled: true,
    conditions: [
      {
        field: 'balance',
        operator: 'lt',
        value: 0
      }
    ],
    action: 'notify',
    message: '💰 Account balance is NEGATIVE',
    channels: ['app', 'email', 'sms']
  },

  {
    name: 'High Monthly Expenses',
    category: 'finance',
    priority: 'medium',
    enabled: true,
    conditions: [
      {
        field: 'monthlyExpenses',
        operator: 'gt',
        value: 50000
      }
    ],
    action: 'notify',
    message: '📊 Monthly expenses exceed ₦50,000 threshold',
    channels: ['app']
  },

  {
    name: 'Tasks Overdue',
    category: 'maintenance',
    priority: 'high',
    enabled: true,
    conditions: [
      {
        field: 'dueDate',
        operator: 'lt',
        value: 'today'
      },
      {
        field: 'completed',
        operator: 'eq',
        value: false
      }
    ],
    action: 'notify',
    message: '📋 You have overdue tasks',
    channels: ['app', 'push']
  }
];

/**
 * Install all rules into the alert engine
 */
export function installAllRules(engine) {
  if (!engine || typeof engine.addRule !== 'function') {
    console.error('Invalid alert engine provided');
    return 0;
  }

  // Silently check how many rules are already in the engine
  const existingRules = engine.getAllRules();
  
  // Only add if the engine is empty or doesn't have all rules
  if (existingRules.length === FARM_ALERT_RULES.length) {
    return FARM_ALERT_RULES.length;
  }
  
  // Clear old rules if we have extras (prevents tripling on hot reload)
  if (existingRules.length > FARM_ALERT_RULES.length) {
    for (const rule of existingRules) {
      engine.rules = engine.rules.filter(r => r.id !== rule.id);
    }
    engine.saveRules();
  }

  // Add all rules from FARM_ALERT_RULES
  for (const rule of FARM_ALERT_RULES) {
    try {
      engine.addRule(rule);
    } catch (error) {
      console.error(`Failed to install rule ${rule.name}:`, error.message);
    }
  }
  
  // Count all rules in the engine
  const allRules = engine.getAllRules();
  const installedCount = allRules.length;
  
  return installedCount;
}

/**
 * Get rule by name
 */
export function getRuleByName(ruleName) {
  return FARM_ALERT_RULES.find(r => r.name === ruleName);
}

/**
 * Get rules by category
 */
export function getRulesByCategory(category) {
  return FARM_ALERT_RULES.filter(r => r.category === category);
}

/**
 * Get rules by priority
 */
export function getRulesByPriority(priority) {
  return FARM_ALERT_RULES.filter(r => r.priority === priority);
}

/**
 * Get enabled rules
 */
export function getEnabledRules() {
  return FARM_ALERT_RULES.filter(r => r.enabled);
}

export default {
  FARM_ALERT_RULES,
  installAllRules,
  getRuleByName,
  getRulesByCategory,
  getRulesByPriority,
  getEnabledRules
};
