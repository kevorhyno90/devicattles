import { useState, useEffect } from 'react';
import { predictiveAnalytics } from '../lib/predictiveAnalytics';
import { DataLayer } from '../lib/dataLayer';

export default function PredictiveDashboard() {
  const [animals, setAnimals] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedPrediction, setSelectedPrediction] = useState('milk');
  const [daysAhead, setDaysAhead] = useState(7);
  const [targetWeight, setTargetWeight] = useState('');
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedOptimization, setFeedOptimization] = useState(null);

  useEffect(() => {
    loadAnimals();
    loadFeedOptimization();
  }, []);

  const loadAnimals = async () => {
    const data = await DataLayer.animals.getAll();
    setAnimals(data);
  };

  const loadFeedOptimization = async () => {
    const result = await predictiveAnalytics.optimizeFeedCosts();
    setFeedOptimization(result);
  };

  const generatePrediction = async () => {
    if (!selectedAnimal) {
      alert('Please select an animal first');
      return;
    }

    setLoading(true);
    setPredictions(null);

    try {
      let result;
      
      switch (selectedPrediction) {
        case 'milk':
          result = await predictiveAnalytics.predictMilkYieldForAnimal(
            selectedAnimal,
            parseInt(daysAhead)
          );
          break;
        
        case 'weight':
          if (!targetWeight || parseFloat(targetWeight) <= 0) {
            alert('Please enter a valid target weight');
            setLoading(false);
            return;
          }
          result = await predictiveAnalytics.predictWeightGain(
            selectedAnimal,
            parseFloat(targetWeight)
          );
          break;
        
        case 'breeding':
          result = await predictiveAnalytics.predictBreedingSuccess(selectedAnimal);
          break;
        
        default:
          result = { success: false, error: 'Unknown prediction type' };
      }

      setPredictions(result);
    } catch (error) {
      console.error('Prediction failed:', error);
      setPredictions({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'increasing': return 'text-green-600';
      case 'decreasing': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-blue-600';
    }
  };

  const getConfidenceColor = (confidence) => {
    const conf = parseFloat(confidence);
    if (conf >= 80) return 'bg-green-500';
    if (conf >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Predictive Analytics Dashboard</h1>
        <p className="text-gray-600">
          AI-powered predictions for milk yield, weight gain, breeding success, and feed optimization
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Controls */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Generate Prediction</h2>

            {/* Animal Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Animal
              </label>
              <select
                value={selectedAnimal || ''}
                onChange={(e) => setSelectedAnimal(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose an animal...</option>
                {animals.map(animal => (
                  <option key={animal.id} value={animal.id}>
                    {animal.name} - {animal.tagId || animal.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Prediction Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prediction Type
              </label>
              <div className="space-y-2">
                <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPrediction === 'milk' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    value="milk"
                    checked={selectedPrediction === 'milk'}
                    onChange={(e) => setSelectedPrediction(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">🥛 Milk Yield</div>
                    <div className="text-xs text-gray-500">Forecast daily production</div>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPrediction === 'weight' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    value="weight"
                    checked={selectedPrediction === 'weight'}
                    onChange={(e) => setSelectedPrediction(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">⚖️ Weight Gain</div>
                    <div className="text-xs text-gray-500">Time to target weight</div>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPrediction === 'breeding' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    value="breeding"
                    checked={selectedPrediction === 'breeding'}
                    onChange={(e) => setSelectedPrediction(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">🐄 Breeding Success</div>
                    <div className="text-xs text-gray-500">Success probability</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Prediction Parameters */}
            {selectedPrediction === 'milk' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days Ahead
                </label>
                <select
                  value={daysAhead}
                  onChange={(e) => setDaysAhead(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
            )}

            {selectedPrediction === 'weight' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Weight (kg)
                </label>
                <input
                  type="number"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder="e.g., 500"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generatePrediction}
              disabled={loading || !selectedAnimal}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Generating...' : '🎯 Generate Prediction'}
            </button>

            {/* Quick Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-3">Quick Stats</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Animals:</span>
                  <span className="font-bold">{animals.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Predictions Today:</span>
                  <span className="font-bold">{predictions ? 1 : 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prediction Results */}
          {predictions ? (
            predictions.success ? (
              <div>
                {/* Milk Yield Prediction */}
                {selectedPrediction === 'milk' && predictions.predictions && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900">
                        🥛 {daysAhead}-Day Milk Yield Forecast
                      </h2>
                      <span className={`px-4 py-2 rounded-full text-white text-sm font-bold ${getConfidenceColor(predictions.confidence)}`}>
                        {predictions.confidence}% Confidence
                      </span>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-blue-600 text-sm mb-1">Trend</div>
                        <div className={`text-2xl font-bold ${getTrendColor(predictions.trend)}`}>
                          {getTrendIcon(predictions.trend)} {predictions.trend}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-green-600 text-sm mb-1">Avg Historical</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {predictions.historicalAverage} L
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-purple-600 text-sm mb-1">Avg Predicted</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {predictions.predictedAverage} L
                        </div>
                      </div>
                    </div>

                    {/* Change Indicator */}
                    <div className={`p-4 rounded-lg mb-6 ${
                      parseFloat(predictions.changePercent) > 0 
                        ? 'bg-green-50 border border-green-200' 
                        : parseFloat(predictions.changePercent) < 0
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {parseFloat(predictions.changePercent) > 0 ? '📈 Expected Increase' : 
                           parseFloat(predictions.changePercent) < 0 ? '📉 Expected Decrease' :
                           '➡️ Stable Production'}
                        </span>
                        <span className="text-2xl font-bold">
                          {predictions.changePercent > 0 ? '+' : ''}{predictions.changePercent}%
                        </span>
                      </div>
                    </div>

                    {/* Daily Predictions */}
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Daily Forecast</h3>
                      <div className="space-y-2">
                        {predictions.predictions.map((pred, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-600">Day {pred.day}</span>
                              <span className="text-sm text-gray-500">{pred.date}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-900">{pred.predicted} L</span>
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(100, (parseFloat(pred.predicted) / 30) * 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{pred.confidence}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Weight Gain Prediction */}
                {selectedPrediction === 'weight' && predictions.weeklyPredictions && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      ⚖️ Weight Gain Forecast to {predictions.targetWeight} kg
                    </h2>

                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-blue-600 text-sm mb-1">Current Weight</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {predictions.currentWeight} kg
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-green-600 text-sm mb-1">Target Weight</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {predictions.targetWeight} kg
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-purple-600 text-sm mb-1">Daily Gain</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {predictions.avgDailyGain} kg
                        </div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="text-orange-600 text-sm mb-1">Days to Target</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {predictions.daysToTarget}
                        </div>
                      </div>
                    </div>

                    {/* Target Date */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-900">🎯 Estimated Target Date</span>
                        <span className="text-xl font-bold text-green-900">
                          {new Date(predictions.estimatedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Weekly Milestones */}
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Weekly Milestones</h3>
                      <div className="space-y-2">
                        {predictions.weeklyPredictions.map((week, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-600">Week {week.week}</span>
                              <span className="text-sm text-gray-500">{week.date}</span>
                            </div>
                            <span className="font-bold text-gray-900">{week.weight} kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Breeding Success Prediction */}
                {selectedPrediction === 'breeding' && predictions.successRate && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      🐄 Breeding Success Analysis for {predictions.animalName}
                    </h2>

                    {/* Success Rate */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 mb-6">
                      <div className="text-center">
                        <div className="text-blue-100 text-sm mb-2">Success Probability</div>
                        <div className="text-6xl font-bold mb-2">{predictions.successRate}%</div>
                        <div className="text-blue-100">
                          Confidence: {predictions.confidence}
                        </div>
                      </div>
                    </div>

                    {/* Influencing Factors */}
                    <div className="mb-6">
                      <h3 className="font-bold text-gray-900 mb-3">Influencing Factors</h3>
                      <div className="space-y-3">
                        {predictions.factors.map((factor, idx) => (
                          <div key={idx} className={`p-4 rounded-lg border-2 ${
                            factor.impact === 'positive' 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-orange-200 bg-orange-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">
                                  {factor.impact === 'positive' ? '✅' : '⚠️'}
                                </span>
                                <span className="font-medium text-gray-900">{factor.factor}</span>
                              </div>
                              <span className={`font-bold ${
                                factor.impact === 'positive' ? 'text-green-700' : 'text-orange-700'
                              }`}>
                                {factor.value}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className={`p-4 rounded-lg ${
                      parseFloat(predictions.successRate) > 60
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <h4 className="font-bold text-gray-900 mb-2">💡 Recommendation</h4>
                      <p className="text-gray-700">{predictions.recommendation}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-red-900 mb-2">❌ Prediction Failed</h3>
                <p className="text-red-700">{predictions.error || predictions.message || 'Unknown error'}</p>
              </div>
            )
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Ready to Generate Predictions</h3>
              <p className="text-blue-700 mb-4">
                Select an animal and prediction type to get AI-powered insights
              </p>
              <ul className="text-left text-blue-800 text-sm space-y-2 max-w-md mx-auto">
                <li>✓ Milk yield forecast (7-30 days ahead)</li>
                <li>✓ Weight gain timeline to target</li>
                <li>✓ Breeding success probability analysis</li>
                <li>✓ All predictions use historical data patterns</li>
              </ul>
            </div>
          )}

          {/* Feed Cost Optimization */}
          {feedOptimization?.success && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                🌾 Feed Cost Optimization
              </h2>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-purple-600 text-sm mb-1">Monthly Cost</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₦{feedOptimization.totalMonthlyCost}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-green-600 text-sm mb-1">Potential Savings</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₦{feedOptimization.potentialSavings}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-blue-600 text-sm mb-1">Savings %</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {feedOptimization.savingsPercent}%
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Recommendations</h3>
                <div className="space-y-3">
                  {feedOptimization.recommendations.map((rec, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900">{rec.feedType}</h4>
                        <span className="text-sm font-bold text-purple-600">
                          ₦{rec.monthlyCost}/month
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                        <div>Daily Use: {rec.avgDailyUse} kg</div>
                        <div>Cost/kg: ₦{rec.costPerKg}</div>
                      </div>
                      <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        💡 {rec.suggestion}
                      </div>
                      {parseFloat(rec.potentialSavings) > 0 && (
                        <div className="text-sm font-bold text-green-600 mt-2">
                          💰 Save ₦{rec.potentialSavings}/month
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
