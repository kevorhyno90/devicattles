# Phase 2 Implementation - Quick Start Guide

**Status:** Ready to implement immediately  
**Difficulty:** Medium - Most code is provided, just integrate  
**Time Estimate:** 4-6 hours to complete all features

---

## 🚀 Quick Start (Pick One)

### Option A: Start with Disease Detection (Easiest, 2 hours)
1. Install TensorFlow: `npm install @tensorflow/tfjs`
2. Create `src/modules/DiseaseDetection.jsx` (see PHASE2_SMART_FEATURES.md)
3. Test with animal photo
4. **Done!** ✅

### Option B: Build Smart Alerts (Medium, 2 hours)
1. Copy `src/lib/alertRuleEngine.js` and `prebuiltRules.js`
2. Create `src/modules/AlertRuleBuilder.jsx` (see code below)
3. Load pre-built rules for your farm
4. **Done!** ✅

### Option C: Complete Voice Commands (Medium, 1 hour)
1. Read VoiceCommandCenter.jsx - it's 90% complete
2. Add voice feedback (TTS) - 10 lines of code
3. Test in Chrome/Edge
4. **Done!** ✅

### Option D: Do All Three (Advanced, 5-6 hours)
Start Monday, finish by Wednesday. Prioritize as:
1. Voice Commands completion (1 hour)
2. Disease Detection setup (2 hours)
3. Smart Alerts rules (2-3 hours)

---

## 1️⃣ Voice Commands - 10 Lines to Complete

**File:** `src/modules/VoiceCommandCenter.jsx`

**Add this after the result state update (line ~120):**

```jsx
// Add voice feedback effect
useEffect(() => {
  if (result?.message && !isListening) {
    speakResult(result.message);
  }
}, [result, isListening]);

// Add voice feedback function
const speakResult = (message) => {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
};
```

**Test:**
```
1. Open VoiceCommandCenter
2. Click microphone
3. Say: "Record milk yield 25 liters for Bessie"
4. Should hear: "Command executed"
```

---

## 2️⃣ Disease Detection - 5 Steps

### Step 1: Install Package
```bash
npm install @tensorflow/tfjs
```

### Step 2: Create Component File
**File:** `src/modules/DiseaseDetection.jsx`

Copy this complete component:

```jsx
import React, { useState, useRef } from 'react';
import { analyzeAnimalImage, loadDiseaseModel } from '../lib/diseaseDetection';
import { DataLayer } from '../lib/dataLayer';

export default function DiseaseDetection() {
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animals, setAnimals] = useState([]);
  const [modelReady, setModelReady] = useState(false);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    loadDiseaseModel()
      .then(() => setModelReady(true))
      .catch(err => console.error('Model load error:', err));
    
    loadAnimals();
  }, []);

  const loadAnimals = async () => {
    try {
      const data = await DataLayer.animals.getAll();
      setAnimals(data.filter(a => a.status === 'Active'));
    } catch (e) {
      console.error('Failed to load animals:', e);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large (max 5MB)');
      return;
    }

    setImage(file);
    
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    
    setAnalysis(null);
  };

  const analyzeImage = async () => {
    if (!image || !selectedAnimal) {
      alert('Please select both animal and image');
      return;
    }

    setLoading(true);
    try {
      const animal = animals.find(a => a.id === selectedAnimal);
      const result = await analyzeAnimalImage(image, {
        species: animal.species,
        breed: animal.breed,
        age: animal.age
      });

      setAnalysis(result);

      if (result.success && result.detected_diseases.length > 0) {
        const topDisease = result.detected_diseases[0];
        await DataLayer.animals.update(animal.id, {
          lastHealthCheck: new Date().toISOString(),
          lastDetectedIssue: {
            disease: topDisease.name,
            confidence: topDisease.confidence,
            date: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      setAnalysis({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ marginBottom: '8px' }}>🔍 AI Disease Detection</h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Upload animal photos for AI-powered health analysis
          {!modelReady && ' (Loading AI model...)'}
        </p>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
            Select Animal
          </label>
          <select
            value={selectedAnimal || ''}
            onChange={(e) => setSelectedAnimal(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="">Choose an animal...</option>
            {animals.map(animal => (
              <option key={animal.id} value={animal.id}>
                {animal.name || animal.tag} ({animal.breed})
              </option>
            ))}
          </select>
        </div>

        <div style={{
          border: '2px dashed #e5e7eb',
          borderRadius: '8px',
          padding: '32px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
        onClick={() => fileInputRef.current.click()}
        >
          {imagePreview ? (
            <div>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '6px'
                }}
              />
              <button
                onClick={() => fileInputRef.current.click()}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Change Image
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📸</div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                Click to upload photo
              </div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                or drag and drop
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
        </div>

        <button
          onClick={analyzeImage}
          disabled={!image || !selectedAnimal || loading || !modelReady}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#9ca3af' : '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading || !image ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '🔄 Analyzing...' : '📊 Analyze Image'}
        </button>
      </div>

      {analysis && (
        <div className="card" style={{
          padding: '24px',
          background: analysis.success ? '#f0fdf4' : '#fef2f2',
          border: `2px solid ${analysis.success ? '#10b981' : '#ef4444'}`
        }}>
          {analysis.success ? (
            <>
              <h3 style={{ margin: '0 0 16px 0' }}>✅ Analysis Complete</h3>
              
              {analysis.detected_diseases.length > 0 ? (
                <>
                  <h4 style={{ margin: '16px 0 8px 0' }}>Potential Issues Detected:</h4>
                  {analysis.detected_diseases.map((disease, idx) => (
                    <div key={idx} style={{
                      padding: '12px',
                      background: '#fff',
                      borderLeft: `4px solid ${disease.urgency === 'CRITICAL' ? '#ef4444' : disease.urgency === 'HIGH' ? '#f59e0b' : '#10b981'}`,
                      marginBottom: '12px',
                      borderRadius: '4px'
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {disease.icon} {disease.name} ({disease.confidence}% confidence)
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                        Severity: {disease.severity}
                      </div>
                      <div style={{ fontSize: '13px' }}>
                        <strong>Actions:</strong>
                        <ul style={{ margin: '4px 0 0 20px' }}>
                          {disease.treatment.slice(0, 3).map((rec, i) => (
                            <li key={i} style={{ fontSize: '13px' }}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p>No obvious health issues detected. Continue monitoring.</p>
              )}
            </>
          ) : (
            <>
              <h3 style={{ margin: '0 0 8px 0' }}>❌ Analysis Failed</h3>
              <p>{analysis.error || 'Unknown error occurred'}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

### Step 3: Add to App.jsx
```jsx
import DiseaseDetection from './modules/DiseaseDetection';

// In your module routing
case 'DiseaseDetection':
  return <DiseaseDetection />;
```

### Step 4: Test
1. Open app
2. Navigate to Disease Detection
3. Select an animal
4. Upload a photo
5. Click "Analyze Image"
6. See results! ✅

---

## 3️⃣ Smart Alerts - 5 Steps

### Step 1: Files Already Created
- `src/lib/alertRuleEngine.js` ✅
- `src/lib/prebuiltRules.js` ✅

### Step 2: Create Rule Builder Component
**File:** `src/modules/AlertRuleBuilder.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { alertRuleEngine, OPERATORS, CATEGORIES, CHANNELS } from '../lib/alertRuleEngine';
import { loadPrebuiltRules, getAvailableRules } from '../lib/prebuiltRules';

export default function AlertRuleBuilder() {
  const [rules, setRules] = useState([]);
  const [selectedRule, setSelectedRule] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    enabled: true,
    trigger: 'immediate',
    priority: 'medium',
    category: 'health',
    conditions: [{ field: '', operator: 'eq', value: '' }],
    message: '',
    channels: ['app']
  });

  useEffect(() => {
    setRules(alertRuleEngine.getAllRules());
  }, []);

  const handleAddRule = () => {
    try {
      const rule = alertRuleEngine.addRule(newRule);
      setRules([...rules, rule]);
      setNewRule({
        name: '',
        enabled: true,
        trigger: 'immediate',
        priority: 'medium',
        category: 'health',
        conditions: [{ field: '', operator: 'eq', value: '' }],
        message: '',
        channels: ['app']
      });
      setShowBuilder(false);
    } catch (error) {
      alert('Error creating rule: ' + error.message);
    }
  };

  const handleLoadPrebuilt = (ruleKey) => {
    try {
      const rule = loadPrebuiltRules([ruleKey])[0];
      setRules([...rules, rule]);
    } catch (error) {
      alert('Error loading rule: ' + error.message);
    }
  };

  const handleDeleteRule = (ruleId) => {
    if (alertRuleEngine.deleteRule(ruleId)) {
      setRules(rules.filter(r => r.id !== ruleId));
    }
  };

  const handleToggleEnabled = (ruleId, enabled) => {
    alertRuleEngine.setRuleEnabled(ruleId, enabled);
    setRules(rules.map(r => r.id === ruleId ? { ...r, enabled } : r));
  };

  const availablePrebuilt = getAvailableRules();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '8px' }}>⚙️ Smart Alert Rules</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        Create custom alert rules to monitor your farm
      </p>

      {/* Pre-built Rules */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 12px 0' }}>📋 Pre-built Rules</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '8px' }}>
          {availablePrebuilt.map(rule => (
            <button
              key={rule.key}
              onClick={() => handleLoadPrebuilt(rule.key)}
              style={{
                padding: '12px',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#eff6ff';
                e.target.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f3f4f6';
                e.target.style.borderColor = '#e5e7eb';
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>{rule.icon} {rule.name}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{rule.category}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Rules */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0 }}>📌 Active Rules ({rules.length})</h3>
          <button
            onClick={() => setShowBuilder(true)}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            + New Rule
          </button>
        </div>

        {rules.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No rules yet. Load a pre-built rule or create a custom one.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rules.map(rule => (
              <div
                key={rule.id}
                style={{
                  padding: '12px',
                  background: rule.enabled ? '#f0fdf4' : '#f3f4f6',
                  border: `1px solid ${rule.enabled ? '#d1fae5' : '#e5e7eb'}`,
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600' }}>
                    {rule.icon} {rule.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {rule.conditions.length} condition(s) • {rule.channels.join(', ')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(e) => handleToggleEnabled(rule.id, e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rule Builder */}
      {showBuilder && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Create Custom Rule</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Rule Name</label>
              <input
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="e.g., Low Feed Alert"
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Priority</label>
              <select
                value={newRule.priority}
                onChange={(e) => setNewRule({ ...newRule, priority: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Message</label>
            <textarea
              value={newRule.message}
              onChange={(e) => setNewRule({ ...newRule, message: e.target.value })}
              placeholder="e.g., {name} needs attention"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                minHeight: '80px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAddRule}
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Create Rule
            </button>
            <button
              onClick={() => setShowBuilder(false)}
              style={{
                padding: '10px 20px',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Step 3: Add to App.jsx
```jsx
import AlertRuleBuilder from './modules/AlertRuleBuilder';

case 'AlertRuleBuilder':
  return <AlertRuleBuilder />;
```

### Step 4: Test
1. Open Alert Rule Builder
2. Click "Load Pre-built Rules"
3. Load "Vaccination Overdue"
4. Enable the rule
5. See it activate! ✅

---

## 🧪 Testing Checklist

### Voice Commands ✅
- [ ] Say "record milk yield 25 liters for Bessie"
- [ ] Hear response (audio feedback)
- [ ] See result in UI
- [ ] Works in Chrome/Edge

### Disease Detection ✅
- [ ] Select animal
- [ ] Upload photo
- [ ] Get analysis result
- [ ] Result logged to animal record

### Smart Alerts ✅
- [ ] Load pre-built rule
- [ ] Enable rule
- [ ] Check alert list
- [ ] Rule appears with checkmark

---

## 📊 Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| Voice Commands | Accuracy | 90%+ |
| Voice Commands | Response time | <2 seconds |
| Disease Detection | Model load time | <5 seconds |
| Disease Detection | Confidence scores | 30-95% range |
| Smart Alerts | Rules created | 10+ |
| Smart Alerts | Evaluation time | <100ms per rule |

---

## 🐛 Troubleshooting

### Voice Commands Not Working
- [ ] Check browser support (Chrome/Edge only)
- [ ] Enable microphone permissions
- [ ] Clear browser cache
- [ ] Check console for errors

### Disease Detection Slow
- [ ] TensorFlow model loading in background (5-10 sec first time)
- [ ] Refresh page to cache model
- [ ] Check network connection
- [ ] Use smaller image files

### Smart Alerts Not Triggering
- [ ] Check if rule is enabled
- [ ] Verify condition fields exist in data
- [ ] Check rule evaluation history
- [ ] Review error messages in console

---

## ✨ Next Steps

After completing these 3 features:

1. **Test Thoroughly** - Use all features for 1 week
2. **Gather Feedback** - Ask users what works/what doesn't
3. **Optimize** - Fix bugs, improve performance
4. **Add More Rules** - Create custom rules for your farm
5. **Integrate Fully** - Connect to main navigation

---

**Ready to build? Pick one feature and start!** 🎯

Time to implement: **2-4 hours for complete setup**
