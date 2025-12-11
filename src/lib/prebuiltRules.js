/**
 * Pre-built Alert Rules Library
 * Ready-to-use rules for common farm scenarios
 * These can be imported and enabled immediately
 */

import { alertRuleEngine, PRIORITY, CATEGORIES, CHANNELS } from './alertRuleEngine';

/**
 * Pre-defined rule templates for easy setup
 */
export const PREBUILT_RULES = {
  // ========== HEALTH RULES ==========

  mastitis_risk_detected: {
    name: 'Mastitis Risk Detected',
    enabled: false, // User must enable
    trigger: 'immediate',
    priority: PRIORITY.CRITICAL,
    category: CATEGORIES.HEALTH,
    icon: '💉',
    conditions: [
      {
        type: 'animal',
        field: 'lastHealthCheck.disease',
        operator: 'includes',
        value: 'mastitis'
      },
      {
        type: 'animal',
        field: 'lastHealthCheck.confidence',
        operator: 'gte',
        value: 70
      }
    ],
    message: '⚠️ URGENT: {name} shows mastitis risk (confidence: {lastHealthCheck.confidence}%)',
    action: 'notify',
    channels: [CHANNELS.APP, CHANNELS.SMS],
    throttle: 1800000, // 30 minutes
    includeContext: true
  },

  vaccination_overdue: {
    name: 'Vaccination Overdue',
    enabled: false,
    trigger: 'schedule',
    schedule: '0 8 * * *', // Daily at 8 AM
    priority: PRIORITY.HIGH,
    category: CATEGORIES.HEALTH,
    icon: '💉',
    conditions: [
      {
        type: 'animal',
        field: 'status',
        operator: 'eq',
        value: 'Active'
      },
      {
        type: 'animal',
        field: 'daysSinceVaccination',
        operator: 'gte',
        value: 180
      }
    ],
    message: '{name} vaccination overdue by {daysOverdueVaccination} days',
    action: 'notify',
    channels: [CHANNELS.APP],
    throttle: 86400000, // 24 hours
    actionData: {
      navigateTo: 'Animals'
    }
  },

  high_health_risk_score: {
    name: 'High Health Risk Score',
    enabled: false,
    trigger: 'schedule',
    schedule: '0 6 * * *', // Daily at 6 AM
    priority: PRIORITY.HIGH,
    category: CATEGORIES.HEALTH,
    icon: '⚠️',
    conditions: [
      {
        type: 'animal',
        field: 'status',
        operator: 'eq',
        value: 'Active'
      },
      {
        type: 'animal',
        field: 'healthRiskScore',
        operator: 'gte',
        value: 70
      }
    ],
    message: '{name} has high health risk score ({healthRiskScore}/100)',
    action: 'notify',
    channels: [CHANNELS.APP, CHANNELS.EMAIL],
    throttle: 43200000 // 12 hours
  },

  milk_production_drop: {
    name: 'Milk Production Drop',
    enabled: false,
    trigger: 'immediate',
    priority: PRIORITY.HIGH,
    category: CATEGORIES.FEEDING,
    icon: '🥛',
    conditions: [
      {
        type: 'animal',
        field: 'species',
        operator: 'includes',
        value: 'cattle'
      },
      {
        type: 'animal',
        field: 'milkYieldChangePercent',
        operator: 'lt',
        value: -20 // 20% drop
      }
    ],
    message: '{name} milk yield dropped {milkYieldChangePercent}%. Check nutrition and health.',
    action: 'notify',
    channels: [CHANNELS.APP],
    throttle: 3600000 // 1 hour
  },

  respiratory_symptoms: {
    name: 'Respiratory Symptoms Detected',
    enabled: false,
    trigger: 'immediate',
    priority: PRIORITY.HIGH,
    category: CATEGORIES.HEALTH,
    icon: '🌡️',
    conditions: [
      {
        type: 'animal',
        field: 'lastHealthCheck.disease',
        operator: 'includes',
        value: 'respiratory'
      }
    ],
    message: '{name} shows respiratory symptoms. Isolate and monitor closely.',
    action: 'notify',
    channels: [CHANNELS.APP, CHANNELS.SMS],
    throttle: 7200000 // 2 hours
  },

  // ========== BREEDING RULES ==========

  calving_expected_soon: {
    name: 'Calving Expected Soon',
    enabled: false,
    trigger: 'schedule',
    schedule: '0 7 * * *', // Daily at 7 AM
    priority: PRIORITY.HIGH,
    category: CATEGORIES.BREEDING,
    icon: '🐄',
    conditions: [
      {
        type: 'animal',
        field: 'gender',
        operator: 'eq',
        value: 'female'
      },
      {
        type: 'animal',
        field: 'daysUntilCalving',
        operator: 'between',
        value: { min: 1, max: 30 }
      }
    ],
    message: '{name} expected to calve in {daysUntilCalving} days. Prepare calving area.',
    action: 'notify',
    channels: [CHANNELS.APP, CHANNELS.EMAIL],
    throttle: 86400000 // 24 hours
  },

  breeding_ready: {
    name: 'Animal Ready for Breeding',
    enabled: false,
    trigger: 'schedule',
    schedule: '0 8 * * 1', // Weekly Monday at 8 AM
    priority: PRIORITY.LOW,
    category: CATEGORIES.BREEDING,
    icon: '💚',
    conditions: [
      {
        type: 'animal',
        field: 'gender',
        operator: 'eq',
        value: 'female'
      },
      {
        type: 'animal',
        field: 'daysReadyForBreeding',
        operator: 'gt',
        value: 0
      }
    ],
    message: '{name} is ready for breeding. Plan next breeding cycle.',
    action: 'notify',
    channels: [CHANNELS.APP],
    throttle: 604800000 // 7 days
  },

  // ========== FEEDING RULES ==========

  low_feed_inventory: {
    name: 'Low Feed Inventory',
    enabled: false,
    trigger: 'schedule',
    schedule: '0 9 * * *', // Daily at 9 AM
    priority: PRIORITY.MEDIUM,
    category: CATEGORIES.INVENTORY,
    icon: '🌾',
    conditions: [
      {
        type: 'inventory',
        field: 'itemType',
        operator: 'includes',
        value: 'feed'
      },
      {
        type: 'inventory',
        field: 'quantity',
        operator: 'lt',
        value: 10
      }
    ],
    message: '{itemName} low in stock ({quantity} remaining). Reorder soon.',
    action: 'notify',
    channels: [CHANNELS.APP],
    throttle: 86400000 // 24 hours
  },

  critical_feed_shortage: {
    name: 'Critical Feed Shortage',
    enabled: false,
    trigger: 'immediate',
    priority: PRIORITY.CRITICAL,
    category: CATEGORIES.INVENTORY,
    icon: '🚨',
    conditions: [
      {
        type: 'inventory',
        field: 'itemType',
        operator: 'includes',
        value: 'feed'
      },
      {
        type: 'inventory',
        field: 'quantity',
        operator: 'lt',
        value: 2
      }
    ],
    message: '🚨 CRITICAL: {itemName} nearly depleted ({quantity} remaining). Order immediately!',
    action: 'notify',
    channels: [CHANNELS.APP, CHANNELS.SMS, CHANNELS.EMAIL],
    throttle: 1800000 // 30 minutes
  },

  water_quality_concern: {
    name: 'Water Quality Concern',
    enabled: false,
    trigger: 'immediate',
    priority: PRIORITY.HIGH,
    category: CATEGORIES.MAINTENANCE,
    icon: '💧',
    conditions: [
      {
        type: 'farm',
        field: 'waterQualityScore',
        operator: 'lt',
        value: 50
      }
    ],
    message: 'Water quality score below safe level ({waterQualityScore}%). Check and treat water.',
    action: 'notify',
    channels: [CHANNELS.APP, CHANNELS.EMAIL],
    throttle: 3600000 // 1 hour
  },

  // ========== FINANCIAL RULES ==========

  high_daily_expenses: {
    name: 'High Daily Expenses',
    enabled: false,
    trigger: 'schedule',
    schedule: '0 22 * * *', // Daily at 10 PM
    priority: PRIORITY.MEDIUM,
    category: CATEGORIES.FINANCIAL,
    icon: '💰',
    conditions: [
      {
        type: 'finance',
        field: 'dailyExpenses',
        operator: 'gte',
        value: 5000 // KES 5000 or equivalent
      }
    ],
    message: 'High daily expenses: KES {dailyExpenses}. Review spending.',
    action: 'notify',
    channels: [CHANNELS.APP],
    throttle: 86400000 // 24 hours
  },

  revenue_below_target: {
    name: 'Revenue Below Target',
    enabled: false,
    trigger: 'schedule',
    schedule: '0 8 * * 1', // Weekly Monday at 8 AM
    priority: PRIORITY.MEDIUM,
    category: CATEGORIES.FINANCIAL,
    icon: '📊',
    conditions: [
      {
        type: 'finance',
        field: 'weeklyRevenuePercentageOfTarget',
        operator: 'lt',
        value: 80 // Below 80% of target
      }
    ],
    message: 'Weekly revenue at {weeklyRevenuePercentageOfTarget}% of target. Need {revenueShortfall} more KES.',
    action: 'notify',
    channels: [CHANNELS.APP, CHANNELS.EMAIL],
    throttle: 604800000 // 7 days
  },

  // ========== HARVEST RULES ==========

  crop_ready_harvest: {
    name: 'Crop Ready for Harvest',
    enabled: false,
    trigger: 'schedule',
    schedule: '0 6 * * *', // Daily at 6 AM
    priority: PRIORITY.MEDIUM,
    category: CATEGORIES.HARVEST,
    icon: '🌾',
    conditions: [
      {
        type: 'crop',
        field: 'harvestReadiness',
        operator: 'gte',
        value: 85
      },
      {
        type: 'crop',
        field: 'status',
        operator: 'eq',
        value: 'growing'
      }
    ],
    message: '{cropName} is {harvestReadiness}% ready. Plan harvest in next {daysToOptimalHarvest} days.',
    action: 'notify',
    channels: [CHANNELS.APP, CHANNELS.EMAIL],
    throttle: 86400000 // 24 hours
  },

  crop_pest_warning: {
    name: 'Crop Pest Warning',
    enabled: false,
    trigger: 'immediate',
    priority: PRIORITY.HIGH,
    category: CATEGORIES.HARVEST,
    icon: '🐛',
    conditions: [
      {
        type: 'crop',
        field: 'pestPresent',
        operator: 'exists',
        value: true
      },
      {
        type: 'crop',
        field: 'pestSeverity',
        operator: 'gte',
        value: 'medium'
      }
    ],
    message: '{cropName} has {pestSeverity} pest infestation. Apply treatment urgently.',
    action: 'notify',
    channels: [CHANNELS.APP, CHANNELS.SMS],
    throttle: 86400000 // 24 hours
  },

  // ========== MAINTENANCE RULES ==========

  equipment_maintenance_due: {
    name: 'Equipment Maintenance Due',
    enabled: false,
    trigger: 'schedule',
    schedule: '0 7 * * 1', // Weekly Monday at 7 AM
    priority: PRIORITY.MEDIUM,
    category: CATEGORIES.MAINTENANCE,
    icon: '🔧',
    conditions: [
      {
        type: 'equipment',
        field: 'maintenanceOverdue',
        operator: 'exists',
        value: true
      }
    ],
    message: '{equipmentName} maintenance overdue by {maintenanceDaysOverdue} days. Schedule service.',
    action: 'notify',
    channels: [CHANNELS.APP],
    throttle: 604800000 // 7 days
  },

  // ========== WEATHER RULES ==========

  extreme_weather_warning: {
    name: 'Extreme Weather Warning',
    enabled: false,
    trigger: 'immediate',
    priority: PRIORITY.CRITICAL,
    category: CATEGORIES.WEATHER,
    icon: '⛈️',
    conditions: [
      {
        type: 'weather',
        field: 'severity',
        operator: 'eq',
        value: 'extreme'
      }
    ],
    message: '🚨 Extreme weather alert: {weatherDescription}. Secure animals and equipment.',
    action: 'notify',
    channels: [CHANNELS.APP, CHANNELS.SMS],
    throttle: 900000 // 15 minutes
  },

  temperature_warning: {
    name: 'Temperature Warning',
    enabled: false,
    trigger: 'schedule',
    schedule: '0 * * * *', // Every hour
    priority: PRIORITY.HIGH,
    category: CATEGORIES.WEATHER,
    icon: '🌡️',
    conditions: [
      {
        type: 'weather',
        field: 'temperature',
        operator: 'between',
        value: { min: -5, max: 40 }
      }
    ],
    message: 'Temperature extreme: {temperature}°C. Provide shelter and water.',
    action: 'notify',
    channels: [CHANNELS.APP],
    throttle: 3600000 // 1 hour
  }
};

/**
 * Load a pre-built rule
 * @param {string} ruleKey - Key from PREBUILT_RULES
 * @returns {Object} Rule configuration
 */
export function getPrebuiltRule(ruleKey) {
  const rule = PREBUILT_RULES[ruleKey];
  if (!rule) throw new Error(`Rule not found: ${ruleKey}`);
  return rule;
}

/**
 * Load and enable a pre-built rule
 * @param {string} ruleKey - Key from PREBUILT_RULES
 * @returns {Object} Created rule with ID
 */
export function loadPrebuiltRule(ruleKey) {
  const rule = getPrebuiltRule(ruleKey);
  const enabledRule = { ...rule, enabled: true };
  return alertRuleEngine.addRule(enabledRule);
}

/**
 * Load multiple pre-built rules at once
 * @param {string[]} ruleKeys - Array of keys from PREBUILT_RULES
 * @returns {Object[]} Created rules with IDs
 */
export function loadPrebuiltRules(ruleKeys) {
  const createdRules = [];
  for (const key of ruleKeys) {
    try {
      const rule = loadPrebuiltRule(key);
      createdRules.push(rule);
    } catch (error) {
      console.error(`Failed to load rule ${key}:`, error);
    }
  }
  return createdRules;
}

/**
 * Get all available pre-built rule keys
 */
export function getAvailableRules() {
  return Object.keys(PREBUILT_RULES).map(key => ({
    key,
    ...PREBUILT_RULES[key]
  }));
}

/**
 * Get pre-built rules by category
 */
export function getPrebuiltRulesByCategory(category) {
  return Object.entries(PREBUILT_RULES)
    .filter(([, rule]) => rule.category === category)
    .reduce((acc, [key, rule]) => {
      acc[key] = rule;
      return acc;
    }, {});
}

/**
 * Get pre-built rules by priority
 */
export function getPrebuiltRulesByPriority(priority) {
  return Object.entries(PREBUILT_RULES)
    .filter(([, rule]) => rule.priority === priority)
    .reduce((acc, [key, rule]) => {
      acc[key] = rule;
      return acc;
    }, {});
}

/**
 * Quick setup - Load recommended rules for a new farm
 */
export function loadRecommendedRulesForNewFarm() {
  const recommendedRules = [
    'vaccination_overdue',
    'low_feed_inventory',
    'critical_feed_shortage',
    'calving_expected_soon',
    'milk_production_drop',
    'crop_ready_harvest',
    'revenue_below_target',
    'extreme_weather_warning'
  ];

  return loadPrebuiltRules(recommendedRules);
}

export default {
  PREBUILT_RULES,
  getPrebuiltRule,
  loadPrebuiltRule,
  loadPrebuiltRules,
  getAvailableRules,
  getPrebuiltRulesByCategory,
  getPrebuiltRulesByPriority,
  loadRecommendedRulesForNewFarm
};
