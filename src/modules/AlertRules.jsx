import { useState, useEffect } from 'react';
import { alertRuleEngine } from '../lib/alertRuleEngine';
import { FARM_ALERT_RULES, installAllRules } from '../lib/farmAlertRules';

export default function AlertRules() {
  const [rules, setRules] = useState([]);
  const [status, setStatus] = useState(null);
  const [testingRule, setTestingRule] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [evaluationHistory, setEvaluationHistory] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    initializeRules();
    loadStatus();
  }, []);

  const initializeRules = () => {
    // Install all rules if not already installed
    installAllRules(alertRuleEngine);
    loadRules();
  };

  const loadRules = () => {
    const allRules = alertRuleEngine.getAllRules();
    setRules(allRules);
  };

  const loadStatus = () => {
    const stats = alertRuleEngine.getStatistics();
    setStatus(stats);
  };

  const toggleRule = (ruleId, enabled) => {
    alertRuleEngine.toggleRule(ruleId, enabled);
    loadRules();
    loadStatus();
  };

  const testRule = async (rule) => {
    setTestingRule(rule.id);
    setTestResult(null);

    try {
      const result = await rule.execute();
      setTestResult({
        ruleId: rule.id,
        ...result,
        timestamp: new Date().toISOString()
      });

      // Add to history
      setEvaluationHistory(prev => [{
        ruleId: rule.id,
        ruleName: rule.name,
        triggered: result.triggered,
        timestamp: new Date().toISOString(),
        data: result
      }, ...prev.slice(0, 19)]); // Keep last 20
    } catch (error) {
      setTestResult({
        ruleId: rule.id,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTestingRule(null);
    }
  };

  const evaluateAllRules = async () => {
    setTestingRule('all');
    const results = await alertRuleEngine.evaluateAllRules();
    
    // Add to history
    results.forEach(result => {
      if (result.triggered) {
        setEvaluationHistory(prev => [{
          ruleId: result.ruleId,
          ruleName: result.ruleName,
          triggered: true,
          timestamp: new Date().toISOString(),
          severity: result.severity
        }, ...prev.slice(0, 19)]);
      }
    });

    setTestingRule(null);
    loadStatus();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      health: '🏥',
      breeding: '🐄',
      feeding: '🌾',
      inventory: '📦',
      financial: '💰',
      maintenance: '🔧',
      production: '📊',
      environment: '🌤️'
    };
    return icons[category] || '📋';
  };

  const categories = ['all', ...new Set(rules.map(r => r.category))];
  const filteredRules = activeCategory === 'all' 
    ? rules 
    : rules.filter(r => r.category === activeCategory);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Alert Rules</h1>
        <p className="text-gray-600">
          Configure and monitor automated farm alerts for proactive management
        </p>
      </div>

      {/* Status Card */}
      {status && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 mb-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-blue-100 text-sm mb-1">Total Rules</div>
              <div className="text-2xl font-bold">{status.totalRules}</div>
            </div>
            <div>
              <div className="text-blue-100 text-sm mb-1">Enabled</div>
              <div className="text-2xl font-bold">{status.enabledRules}</div>
            </div>
            <div>
              <div className="text-blue-100 text-sm mb-1">Triggers</div>
              <div className="text-2xl font-bold">{status.totalAlertsTrigger || 0}</div>
            </div>
            <div>
              <div className="text-blue-100 text-sm mb-1">Last Evaluation</div>
              <div className="text-sm font-medium">
                {(status.recentEvaluations && status.recentEvaluations.length > 0)
                  ? 'Recently evaluated'
                  : 'Not yet run'}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={evaluateAllRules}
              disabled={testingRule === 'all'}
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {testingRule === 'all' ? '⏳ Evaluating...' : '🔄 Evaluate All Rules'}
            </button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category === 'all' ? '📋 All' : `${getCategoryIcon(category)} ${category}`}
          </button>
        ))}
      </div>

      {/* Rules Grid */}
      <div className="grid gap-4 mb-8">
        {filteredRules.map(rule => (
          <div
            key={rule.id}
            className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-4 flex-1">
                {/* Enable Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(e) => toggleRule(rule.id, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>

                {/* Rule Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getCategoryIcon(rule.category)}</span>
                    <h3 className="text-lg font-bold text-gray-900">{rule.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${getPriorityColor(rule.priority)}`}>
                      {rule.priority?.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">{rule.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Category:</span> {rule.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Trigger:</span> {rule.trigger}
                    </span>
                    {rule.schedule && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Schedule:</span> {rule.schedule}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={() => testRule(rule)}
                disabled={testingRule === rule.id}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingRule === rule.id ? '⏳ Testing...' : '🧪 Test Rule'}
              </button>
            </div>

            {/* Test Result */}
            {testResult?.ruleId === rule.id && (
              <div className={`mt-4 p-4 rounded-lg ${
                testResult.error 
                  ? 'bg-red-50 border border-red-200' 
                  : testResult.triggered 
                    ? 'bg-yellow-50 border border-yellow-200' 
                    : 'bg-green-50 border border-green-200'
              }`}>
                {testResult.error ? (
                  <div>
                    <div className="flex items-center gap-2 text-red-800 font-bold mb-2">
                      ❌ Test Failed
                    </div>
                    <p className="text-red-700 text-sm">{testResult.error}</p>
                  </div>
                ) : testResult.triggered ? (
                  <div>
                    <div className="flex items-center gap-2 text-yellow-800 font-bold mb-2">
                      ⚠️ Rule Triggered
                    </div>
                    <p className="text-yellow-700 text-sm mb-2">
                      This rule would create an alert right now.
                    </p>
                    <pre className="text-xs bg-white/50 p-2 rounded overflow-auto">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 text-green-800 font-bold mb-2">
                      ✅ Rule Passed
                    </div>
                    <p className="text-green-700 text-sm">
                      No conditions met - rule did not trigger.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Evaluation History */}
      {evaluationHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Alert History</h2>
          <div className="space-y-2">
            {evaluationHistory.map((entry, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  entry.triggered ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {entry.triggered ? '⚠️' : '✅'}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{entry.ruleName}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  entry.triggered ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-700'
                }`}>
                  {entry.triggered ? 'TRIGGERED' : 'PASSED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">📘 How to Use Alert Rules</h3>
        <ul className="space-y-2 text-blue-800 text-sm">
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5">1.</span>
            <span><strong>Toggle rules</strong> on/off using the switch - enabled rules run automatically</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5">2.</span>
            <span><strong>Test any rule</strong> to see if it would trigger with current data</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5">3.</span>
            <span><strong>Auto-evaluation</strong> runs every 5 minutes when active</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5">4.</span>
            <span><strong>Notifications</strong> are sent when rules trigger (check your notification settings)</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
