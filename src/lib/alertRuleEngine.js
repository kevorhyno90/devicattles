/**
 * Advanced Alert Rule Engine
 * Allows custom alert rules with flexible condition evaluation
 * 
 * Supports:
 * - Custom rule creation
 * - Complex condition evaluation
 * - Multiple notification channels
 * - Rule scheduling and triggers
 * - Alert performance optimization
 */

import { saveData, loadData } from './storage';
import { showNotification } from './notifications';
import { logAction } from './audit';

export class AlertRuleEngine {
  constructor() {
    this.rules = loadData('alert_rules', []);
    this.evaluationCache = new Map();
    this.evaluationHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Add custom alert rule
   * @example
   * engine.addRule({
   *   name: 'High Mastitis Risk',
   *   enabled: true,
   *   trigger: 'schedule',
   *   schedule: '0 * * * *', // Every hour
   *   priority: 'high',
   *   category: 'health',
   *   conditions: [
   *     { 
   *       type: 'animal',
   *       field: 'lastHealthCheck.disease',
   *       operator: 'includes',
   *       value: 'mastitis'
   *     },
   *     {
   *       type: 'animal',
   *       field: 'lastHealthCheck.confidence',
   *       operator: 'gte',
   *       value: 70
   *     }
   *   ],
   *   action: 'notify',
   *   channels: ['email', 'app', 'sms'],
   *   message: 'Mastitis risk detected for {name}. Immediate action required.',
   *   throttle: 3600000 // 1 hour - prevent duplicate alerts
   * })
   */
  addRule(rule) {
    // Validate rule
    const validation = this.validateRule(rule);
    if (!validation.valid) {
      throw new Error(`Invalid rule: ${validation.error}`);
    }

    // Check for duplicate rule name and skip silently
    if (this.rules.some(r => r.name === rule.name)) {
      console.log(`⏭️ Rule "${rule.name}" already exists, skipping...`);
      return null;
    }

    const newRule = {
      id: this.generateId(),
      ...rule,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastTriggered: null,
      triggerCount: 0,
      enabled: rule.enabled !== false,
      throttle: rule.throttle || 3600000 // 1 hour default
    };

    this.rules.push(newRule);
    this.saveRules();

    logAction('rule_created', {
      ruleName: newRule.name,
      ruleId: newRule.id,
      category: newRule.category
    });

    return newRule;
  }

  /**
   * Update existing rule
   */
  updateRule(ruleId, updates) {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index === -1) throw new Error('Rule not found');

    const oldRule = this.rules[index];
    this.rules[index] = {
      ...oldRule,
      ...updates,
      updatedAt: new Date().toISOString(),
      id: ruleId // Preserve ID
    };

    this.saveRules();

    logAction('rule_updated', {
      ruleName: this.rules[index].name,
      ruleId: ruleId,
      changes: Object.keys(updates)
    });

    return this.rules[index];
  }

  /**
   * Delete rule by ID
   */
  deleteRule(ruleId) {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index === -1) return false;

    const rule = this.rules[index];
    this.rules.splice(index, 1);
    this.saveRules();

    logAction('rule_deleted', {
      ruleName: rule.name,
      ruleId: ruleId
    });

    return true;
  }

  /**
   * Enable/disable rule
   */
  setRuleEnabled(ruleId, enabled) {
    return this.updateRule(ruleId, { enabled });
  }

  /**
   * Evaluate all rules against data
   */
  async evaluateAllRules(dataContext) {
    const alerts = [];
    const now = new Date();

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      // Check if rule should be evaluated
      if (!this.shouldEvaluateRule(rule)) continue;

      // Check throttle to prevent duplicate alerts
      if (this.isThrottled(rule)) continue;

      try {
        // Evaluate conditions
        const conditionsMet = await this.evaluateConditions(
          rule.conditions,
          dataContext
        );

        if (conditionsMet) {
          const alert = this.generateAlert(rule, dataContext);
          alerts.push(alert);

          // Update rule tracking
          rule.lastTriggered = now.toISOString();
          rule.triggerCount = (rule.triggerCount || 0) + 1;

          // Log evaluation
          this.recordEvaluation({
            ruleId: rule.id,
            timestamp: now,
            triggered: true,
            alertId: alert.id
          });
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
        this.recordEvaluation({
          ruleId: rule.id,
          timestamp: now,
          triggered: false,
          error: error.message
        });
      }
    }

    this.saveRules();
    return alerts;
  }

  /**
   * Evaluate specific rule against data
   */
  async evaluateRule(ruleId, dataContext) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) throw new Error('Rule not found');

    const conditionsMet = await this.evaluateConditions(
      rule.conditions,
      dataContext
    );

    return {
      ruleId,
      conditionsMet,
      conditions: rule.conditions.map(cond => ({
        ...cond,
        evaluated: true,
        met: this.evaluateCondition(cond, dataContext)
      }))
    };
  }

  /**
   * Evaluate all conditions (AND logic)
   */
  async evaluateConditions(conditions, dataContext) {
    // All conditions must be true (AND logic)
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, dataContext)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluate single condition
   */
  evaluateCondition(condition, dataContext) {
    const { field, operator, value } = condition;

    // Get field value from context
    const fieldValue = this.getNestedProperty(dataContext, field);

    // Evaluate based on operator
    switch (operator) {
      case 'eq':
        return fieldValue === value;
      case 'neq':
        return fieldValue !== value;
      case 'gt':
        return Number(fieldValue) > Number(value);
      case 'gte':
        return Number(fieldValue) >= Number(value);
      case 'lt':
        return Number(fieldValue) < Number(value);
      case 'lte':
        return Number(fieldValue) <= Number(value);
      case 'includes':
        return Array.isArray(fieldValue)
          ? fieldValue.includes(value)
          : String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case 'regex':
        return new RegExp(value, 'i').test(fieldValue);
      case 'between':
        return Number(fieldValue) >= Number(value.min) && Number(fieldValue) <= Number(value.max);
      case 'exists':
        return fieldValue !== null && fieldValue !== undefined;
      case 'empty':
        return !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0);
      case 'contains':
        return String(fieldValue).includes(String(value));
      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Generate alert from triggered rule
   */
  generateAlert(rule, dataContext) {
    return {
      id: this.generateId('alert'),
      ruleId: rule.id,
      ruleName: rule.name,
      priority: rule.priority || 'medium',
      category: rule.category,
      message: this.interpolateMessage(rule.message, dataContext),
      detailedMessage: this.generateDetailedMessage(rule, dataContext),
      action: rule.action,
      actionData: rule.actionData,
      channels: rule.channels || ['app'],
      timestamp: new Date().toISOString(),
      status: 'new',
      dismissed: false,
      context: this.extractRelevantContext(dataContext, rule)
    };
  }

  /**
   * Generate detailed alert message with context
   */
  generateDetailedMessage(rule, dataContext) {
    const lines = [rule.message];

    // Add context information
    if (rule.includeContext !== false) {
      for (const cond of rule.conditions) {
        const value = this.getNestedProperty(dataContext, cond.field);
        lines.push(`• ${cond.field}: ${value}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Extract relevant context from data
   */
  extractRelevantContext(dataContext, rule) {
    const context = {};

    // Extract all fields referenced in conditions
    for (const cond of rule.conditions) {
      const value = this.getNestedProperty(dataContext, cond.field);
      context[cond.field] = value;
    }

    return context;
  }

  /**
   * Interpolate variables in message
   * Supports: {fieldName}, {nested.field.name}
   */
  interpolateMessage(template, dataContext) {
    if (!template) return '';

    let message = template;
    const matches = template.match(/{[\w.]+}/g) || [];

    for (const match of matches) {
      const key = match.slice(1, -1);
      const value = this.getNestedProperty(dataContext, key);
      message = message.replace(match, value || '?');
    }

    return message;
  }

  /**
   * Check if rule should be evaluated
   */
  shouldEvaluateRule(rule) {
    if (rule.trigger === 'immediate') return true;
    if (rule.trigger === 'schedule') {
      return this.cronMatches(rule.schedule, new Date());
    }
    return false;
  }

  /**
   * Check if rule is throttled (prevent duplicate alerts)
   */
  isThrottled(rule) {
    if (!rule.throttle || !rule.lastTriggered) return false;

    const timeSinceLastTrigger =
      Date.now() - new Date(rule.lastTriggered).getTime();
    return timeSinceLastTrigger < rule.throttle;
  }

  /**
   * Simple cron matching
   * Supports: "0 * * * *" (every hour), "0 0 * * *" (daily), etc.
   */
  cronMatches(cronExpression, date = new Date()) {
    if (!cronExpression) return true;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ');

    if (minute !== '*' && parseInt(minute) !== date.getMinutes()) return false;
    if (hour !== '*' && parseInt(hour) !== date.getHours()) return false;
    if (dayOfMonth !== '*' && parseInt(dayOfMonth) !== date.getDate()) return false;
    if (month !== '*' && parseInt(month) - 1 !== date.getMonth()) return false;
    if (dayOfWeek !== '*' && parseInt(dayOfWeek) !== date.getDay()) return false;

    return true;
  }

  /**
   * Get nested property from object
   */
  getNestedProperty(obj, path) {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Validate rule configuration
   */
  validateRule(rule) {
    if (!rule.name) return { valid: false, error: 'Rule name required' };
    if (!rule.conditions || !Array.isArray(rule.conditions)) {
      return { valid: false, error: 'Conditions required (array)' };
    }
    if (rule.conditions.length === 0) {
      return { valid: false, error: 'At least one condition required' };
    }

    for (const cond of rule.conditions) {
      if (!cond.field || !cond.operator) {
        return { valid: false, error: 'Invalid condition structure' };
      }
    }

    if (!rule.action) return { valid: false, error: 'Action required' };
    if (!rule.message) return { valid: false, error: 'Message required' };

    return { valid: true };
  }

  /**
   * Record evaluation for debugging
   */
  recordEvaluation(evaluation) {
    this.evaluationHistory.push(evaluation);

    // Trim history if too large
    if (this.evaluationHistory.length > this.maxHistorySize) {
      this.evaluationHistory = this.evaluationHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get evaluation history for debugging
   */
  getEvaluationHistory(ruleId = null, limit = 50) {
    let history = this.evaluationHistory;

    if (ruleId) {
      history = history.filter(h => h.ruleId === ruleId);
    }

    return history.slice(-limit);
  }

  /**
   * Generate unique IDs
   */
  generateId(prefix = 'rule') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save rules to storage
   */
  saveRules() {
    try {
      saveData('alert_rules', this.rules);
    } catch (error) {
      console.error('Failed to save rules:', error);
    }
  }

  /**
   * Get all rules
   */
  getAllRules() {
    return this.rules;
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId) {
    return this.rules.find(r => r.id === ruleId);
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category) {
    return this.rules.filter(r => r.category === category);
  }

  /**
   * Get enabled rules
   */
  getEnabledRules() {
    return this.rules.filter(r => r.enabled);
  }

  /**
   * Get rule statistics
   */
  getStatistics() {
    return {
      totalRules: this.rules.length,
      enabledRules: this.rules.filter(r => r.enabled).length,
      totalAlertsTrigger: this.rules.reduce((sum, r) => sum + (r.triggerCount || 0), 0),
      rulesByCategory: this.getRulesByCategory(),
      recentEvaluations: this.evaluationHistory.slice(-10)
    };
  }

  /**
   * Reset evaluation data
   */
  resetEvaluationData() {
    this.evaluationHistory = [];
    for (const rule of this.rules) {
      rule.triggerCount = 0;
      rule.lastTriggered = null;
    }
    this.saveRules();
  }

  /**
   * Toggle rule enabled/disabled state
   */
  toggleRule(ruleId, enabled) {
    const rule = this.getRule(ruleId);
    if (rule) {
      rule.enabled = enabled;
      this.saveRules();
      return true;
    }
    return false;
  }
}

/**
 * Available operators for conditions
 */
export const OPERATORS = {
  eq: { label: 'equals', value: 'eq' },
  neq: { label: 'not equals', value: 'neq' },
  gt: { label: 'greater than', value: 'gt' },
  gte: { label: 'greater than or equal', value: 'gte' },
  lt: { label: 'less than', value: 'lt' },
  lte: { label: 'less than or equal', value: 'lte' },
  includes: { label: 'includes', value: 'includes' },
  contains: { label: 'contains', value: 'contains' },
  regex: { label: 'matches regex', value: 'regex' },
  between: { label: 'between', value: 'between' },
  exists: { label: 'exists', value: 'exists' },
  empty: { label: 'is empty', value: 'empty' }
};

/**
 * Available actions
 */
export const ACTIONS = {
  notify: 'notify',
  email: 'email',
  sms: 'sms',
  webhook: 'webhook',
  updateRecord: 'updateRecord',
  createTask: 'createTask'
};

/**
 * Alert priority levels
 */
export const PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Alert categories
 */
export const CATEGORIES = {
  HEALTH: 'health',
  BREEDING: 'breeding',
  FEEDING: 'feeding',
  HARVEST: 'harvest',
  INVENTORY: 'inventory',
  FINANCIAL: 'financial',
  MAINTENANCE: 'maintenance',
  WEATHER: 'weather',
  CUSTOM: 'custom'
};

/**
 * Notification channels
 */
export const CHANNELS = {
  APP: 'app',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  WEBHOOK: 'webhook'
};

// Create singleton instance
export const alertRuleEngine = new AlertRuleEngine();

export default alertRuleEngine;
