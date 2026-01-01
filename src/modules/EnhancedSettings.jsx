import React, { useState, useEffect } from 'react'
import { useTheme } from '../lib/theme'
import {
  getEnhancedSettings,
  saveEnhancedSettings,
  saveEnhancedSettingsWithHistory,
  getSettingsHistory,
  restoreSettingsFromHistory,
  clearSettingsHistory,
  updateSettingsSection,
  addCustomField,
  updateCustomField,
  deleteCustomField,
  getCustomFields,
  getUserSettings,
  saveUserSettings,
  getEffectiveSettings,
  clearUserSettings,
  CURRENCIES,
  LANGUAGES,
  TIMEZONES,
  formatCurrency,
  formatDate,
  exportEnhancedSettings,
  importEnhancedSettings,
  resetEnhancedSettings
} from '../lib/enhancedSettings'

export default function EnhancedSettings() {
  const [settings, setSettings] = useState(getEnhancedSettings())
  const [activeTab, setActiveTab] = useState('farm')
  const [saved, setSaved] = useState(false)
  const [settingsHistory, setSettingsHistory] = useState(getSettingsHistory())
  const [currentUser, setCurrentUser] = useState(null)
  const [useUserSettings, setUseUserSettings] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    // Get current user and load their settings
    import('../lib/auth').then(({ getCurrentSession }) => {
      const session = getCurrentSession()
      if (session) {
        setCurrentUser(session)
        const userSettings = getUserSettings(session.userId)
        if (userSettings) {
          setUseUserSettings(true)
          setSettings(getEffectiveSettings(session.userId))
        } else {
          setSettings(getEnhancedSettings())
        }
      } else {
        setSettings(getEnhancedSettings())
      }
    })
    setSettingsHistory(getSettingsHistory())
  }, [])

  const handleSave = () => {
    // Save to user-specific or global settings based on preference
    if (currentUser && useUserSettings) {
      if (saveUserSettings(currentUser.userId, settings)) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        window.dispatchEvent(new Event('settingsUpdated'))
      }
    } else {
      if (saveEnhancedSettingsWithHistory(settings, 'Manual save')) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        setSettingsHistory(getSettingsHistory())
        window.dispatchEvent(new Event('settingsUpdated'))
      }
    }
  }

  const handleToggleUserSettings = () => {
    if (!currentUser) return
    
    if (useUserSettings) {
      // Switch to global settings
      if (confirm('Switch to global settings? Your personal preferences will be kept but not used.')) {
        setUseUserSettings(false)
        setSettings(getEnhancedSettings())
      }
    } else {
      // Switch to user-specific settings
      if (confirm('Enable personal preferences? You can customize settings just for your account.')) {
        setUseUserSettings(true)
        const effectiveSettings = getEffectiveSettings(currentUser.userId)
        saveUserSettings(currentUser.userId, effectiveSettings)
        setSettings(effectiveSettings)
      }
    }
  }

  const handleClearUserSettings = () => {
    if (!currentUser) return
    if (confirm('Clear your personal settings and revert to global settings?')) {
      if (clearUserSettings(currentUser.userId)) {
        setUseUserSettings(false)
        setSettings(getEnhancedSettings())
        alert('✅ Personal settings cleared!')
      }
    }
  }

  // Validation for settings fields
  const validateField = (section, field, value) => {
    const errors = {}
    
    // Email validation
    if (field === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        errors[`${section}.${field}`] = 'Invalid email format'
      }
    }
    
    // Phone validation
    if (field === 'phone' && value) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
      if (!phoneRegex.test(value.replace(/\s/g, ''))) {
        errors[`${section}.${field}`] = 'Invalid phone format'
      }
    }
    
    // Number range validation
    if (field === 'sessionTimeout' && value < 5) {
      errors[`${section}.${field}`] = 'Session timeout must be at least 5 minutes'
    }
    if (field === 'passwordMinLength' && (value < 4 || value > 32)) {
      errors[`${section}.${field}`] = 'Password length must be between 4 and 32'
    }
    if (field === 'itemsPerPage' && (value < 5 || value > 100)) {
      errors[`${section}.${field}`] = 'Items per page must be between 5 and 100'
    }
    if (field === 'refreshInterval' && value < 10) {
      errors[`${section}.${field}`] = 'Refresh interval must be at least 10 seconds'
    }
    if (field === 'backupFrequency' && value < 1) {
      errors[`${section}.${field}`] = 'Backup frequency must be at least 1 day'
    }
    if (field === 'lowStockThreshold' && (value < 0 || value > 100)) {
      errors[`${section}.${field}`] = 'Threshold must be between 0 and 100'
    }
    
    return errors
  }

  const handleRestoreHistory = (historyId) => {
    if (confirm('Are you sure you want to restore settings from this point in history?')) {
      const result = restoreSettingsFromHistory(historyId)
      if (result.success) {
        setSettings(result.settings)
        setSettingsHistory(getSettingsHistory())
        window.location.reload()
      } else {
        alert('❌ Failed to restore settings: ' + result.error)
      }
    }
  }

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all settings history? This cannot be undone.')) {
      if (clearSettingsHistory()) {
        setSettingsHistory([])
        alert('✅ History cleared successfully!')
      }
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      resetEnhancedSettings()
      setSettings(getEnhancedSettings())
      window.location.reload()
    }
  }

  const handleExport = () => {
    exportEnhancedSettings()
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      await importEnhancedSettings(file)
      setSettings(getEnhancedSettings())
      alert('✅ Settings imported successfully!')
      window.location.reload()
    } catch (err) {
      alert('❌ Failed to import settings: ' + err.message)
    }
  }

  const updateSection = (section, field, value) => {
    // Validate the field
    const fieldErrors = validateField(section, field, value)
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      // Remove old error for this field
      delete newErrors[`${section}.${field}`]
      // Add new errors if any
      return { ...newErrors, ...fieldErrors }
    })
    
    setSettings(prev => {
      const updated = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }
      // Advanced audit logging for every settings change
      // ...existing code...
      try {
        // Dynamically import logAction from audit.js
        import('../lib/audit').then(({ logAction, ACTIONS, ENTITIES }) => {
          logAction(
            ACTIONS.UPDATE,
            ENTITIES.SYSTEM,
            section,
            {
              key: field,
              value,
              prevValue: prev[section][field]
            }
          )
        })
      } catch (err) {
        // Fail silently for audit logging
      }
      // ...existing code...
      return updated
    })
  }

  const tabs = [
    { id: 'farm', icon: '🏡', label: 'Farm Info' },
    { id: 'regional', icon: '🌍', label: 'Regional' },
    { id: 'notifications', icon: '🔔', label: 'Notifications' },
    { id: 'integrations', icon: '🔗', label: 'Integrations' },
    { id: 'data', icon: '💾', label: 'Data' },
    { id: 'security', icon: '🔐', label: 'Security' },
    { id: 'system', icon: '⚙️', label: 'System' },
    { id: 'custom', icon: '🎨', label: 'Custom Fields' },
    { id: 'history', icon: '📜', label: 'History' }
  ]

  const { theme, toggleTheme } = useTheme()

  // User access control: Only MANAGER can edit settings, others view-only
  const [canEdit, setCanEdit] = useState(false);
  useEffect(() => {
    import('../lib/auth').then(({ getCurrentSession }) => {
      const session = getCurrentSession();
      setCanEdit(session && session.role === 'MANAGER');
    });
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px' }}>Enhanced Settings</h2>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Customize your farm management experience
            {currentUser && (
              <span style={{ marginLeft: '8px' }}>
                • Logged in as <strong>{currentUser.name}</strong>
                {useUserSettings && (
                  <span style={{
                    marginLeft: '8px',
                    background: '#dbeafe',
                    color: '#1e40af',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    👤 Personal Settings
                  </span>
                )}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {currentUser && (
            <button
              onClick={handleToggleUserSettings}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                background: useUserSettings ? '#3b82f6' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {useUserSettings ? '👤 Personal' : '🌍 Global'}
            </button>
          )}
          {currentUser && useUserSettings && (
            <button
              onClick={handleClearUserSettings}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              title="Clear personal settings and revert to global"
            >
              ↩️ Reset
            </button>
          )}
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              background: showPreview ? '#8b5cf6' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            title="Toggle visual preview"
          >
            {showPreview ? '👁️ Hide Preview' : '👁️ Show Preview'}
          </button>
                    <button
                      onClick={toggleTheme}
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        background: theme === 'dark' ? '#374151' : '#f3f4f6',
                        color: theme === 'dark' ? '#f9fafb' : '#1f2937',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontWeight: '600'
                      }}
                    >
                      {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                    </button>
          <button onClick={handleExport} style={{ padding: '8px 16px', fontSize: '14px' }}>
            📥 Export
          </button>
          <label style={{ 
            padding: '8px 16px', 
            fontSize: '14px',
            cursor: 'pointer',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600'
          }}>
            📤 Import
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {saved && (
        <div style={{
          background: '#d1fae5',
          border: '1px solid #10b981',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#065f46',
          fontWeight: '600'
        }}>
          ✅ Settings saved successfully!
        </div>
      )}

      {Object.keys(validationErrors).length > 0 && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #ef4444',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#991b1b'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>
            ⚠️ {Object.keys(validationErrors).length} Validation Error(s):
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {Object.entries(validationErrors).map(([field, error]) => (
              <li key={field}>
                <strong>{field}:</strong> {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e5e7eb', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 16px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              color: activeTab === tab.id ? '#059669' : '#6b7280',
              borderBottom: activeTab === tab.id ? '2px solid #059669' : '2px solid transparent',
              marginBottom: '-2px',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {showPreview && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '24px',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: '600' }}>
            👁️ Live Preview
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
            <div>
              <div style={{ opacity: 0.9, marginBottom: '4px' }}>Currency Format:</div>
              <div style={{ fontWeight: '600', fontSize: '18px' }}>
                {formatCurrency(12345.67)}
              </div>
            </div>
            <div>
              <div style={{ opacity: 0.9, marginBottom: '4px' }}>Date Format:</div>
              <div style={{ fontWeight: '600', fontSize: '18px' }}>
                {formatDate(new Date(), true)}
              </div>
            </div>
            <div>
              <div style={{ opacity: 0.9, marginBottom: '4px' }}>Theme:</div>
              <div style={{ fontWeight: '600', fontSize: '18px' }}>
                {settings.system?.theme || 'catalytics'}
              </div>
            </div>
            <div>
              <div style={{ opacity: 0.9, marginBottom: '4px' }}>Items Per Page:</div>
              <div style={{ fontWeight: '600', fontSize: '18px' }}>
                {settings.system?.itemsPerPage || 20}
              </div>
            </div>
            <div>
              <div style={{ opacity: 0.9, marginBottom: '4px' }}>Measurement System:</div>
              <div style={{ fontWeight: '600', fontSize: '18px' }}>
                {settings.regional?.measurementSystem === 'metric' ? 'Metric (kg, L)' : 'Imperial (lbs, gal)'}
              </div>
            </div>
            <div>
              <div style={{ opacity: 0.9, marginBottom: '4px' }}>Language:</div>
              <div style={{ fontWeight: '600', fontSize: '18px' }}>
                {settings.regional?.language?.toUpperCase() || 'EN'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {activeTab === 'farm' && <FarmInfoTab settings={settings.farmInfo} updateSection={updateSection} canEdit={canEdit} />}
        {activeTab === 'regional' && <RegionalTab settings={settings.regional} updateSection={updateSection} canEdit={canEdit} />}
        {activeTab === 'notifications' && <NotificationsTab settings={settings.notifications} updateSection={updateSection} canEdit={canEdit} />}
        {activeTab === 'integrations' && <IntegrationsTab settings={settings.integrations} updateSection={updateSection} canEdit={canEdit} />}
        {activeTab === 'data' && <DataManagementTab settings={settings.dataManagement} updateSection={updateSection} canEdit={canEdit} />}
        {activeTab === 'security' && <SecurityTab settings={settings.security} updateSection={updateSection} canEdit={canEdit} />}
        {activeTab === 'system' && <SystemTab settings={settings.system} updateSection={updateSection} canEdit={canEdit} />}
        {activeTab === 'custom' && <CustomFieldsTab customFields={settings.customFields} onRefresh={() => setSettings(getEnhancedSettings())} canEdit={canEdit} />}
        {activeTab === 'history' && <HistoryTab history={settingsHistory} onRestore={handleRestoreHistory} onClear={handleClearHistory} canEdit={canEdit} />}
      </div>

      <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button onClick={handleReset} style={{ 
          padding: '12px 24px', 
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: canEdit ? 'pointer' : 'not-allowed',
          opacity: canEdit ? 1 : 0.5
        }} disabled={!canEdit}>
          Reset to Defaults
        </button>
        <button onClick={handleSave} style={{ 
          padding: '12px 32px', 
          background: '#059669',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: canEdit ? 'pointer' : 'not-allowed',
          fontSize: '16px',
          opacity: canEdit ? 1 : 0.5
        }} disabled={!canEdit}>
          💾 Save All Settings
        </button>
      </div>
    </div>
  )
}

function FarmInfoTab({ settings, updateSection }) {
  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>🏡 Farm Information</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <InputField
          label="Farm Name"
          value={settings.farmName}
          onChange={(v) => updateSection('farmInfo', 'farmName', v)}
        />
        <InputField
          label="Business Name"
          value={settings.businessName}
          onChange={(v) => updateSection('farmInfo', 'businessName', v)}
        />
        <InputField
          label="Owner Name"
          value={settings.ownerName}
          onChange={(v) => updateSection('farmInfo', 'ownerName', v)}
        />
        <InputField
          label="Location"
          value={settings.location}
          onChange={(v) => updateSection('farmInfo', 'location', v)}
        />
        <InputField
          label="Address"
          value={settings.address}
          onChange={(v) => updateSection('farmInfo', 'address', v)}
        />
        <InputField
          label="City"
          value={settings.city}
          onChange={(v) => updateSection('farmInfo', 'city', v)}
        />
        <InputField
          label="State/Province"
          value={settings.state}
          onChange={(v) => updateSection('farmInfo', 'state', v)}
        />
        <InputField
          label="Country"
          value={settings.country}
          onChange={(v) => updateSection('farmInfo', 'country', v)}
        />
        <InputField
          label="Postal Code"
          value={settings.postalCode}
          onChange={(v) => updateSection('farmInfo', 'postalCode', v)}
        />
        <InputField
          label="Phone"
          type="tel"
          value={settings.phone}
          onChange={(v) => updateSection('farmInfo', 'phone', v)}
        />
        <InputField
          label="Email"
          type="email"
          value={settings.email}
          onChange={(v) => updateSection('farmInfo', 'email', v)}
        />
        <InputField
          label="Website"
          value={settings.website}
          onChange={(v) => updateSection('farmInfo', 'website', v)}
        />
        <InputField
          label="Registration Number"
          value={settings.registrationNumber}
          onChange={(v) => updateSection('farmInfo', 'registrationNumber', v)}
        />
        <InputField
          label="Tax ID"
          value={settings.taxId}
          onChange={(v) => updateSection('farmInfo', 'taxId', v)}
        />
      </div>
    </div>
  )
}

function RegionalTab({ settings, updateSection }) {
  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>🌍 Regional Preferences</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <SelectField
          label="Currency"
          value={settings.currency}
          onChange={(v) => {
            const currency = CURRENCIES.find(c => c.code === v)
            updateSection('regional', 'currency', v)
            if (currency) {
              updateSection('regional', 'currencySymbol', currency.symbol)
            }
          }}
          options={CURRENCIES.map(c => ({ value: c.code, label: `${c.code} - ${c.name}` }))}
        />
        
        <SelectField
          label="Currency Position"
          value={settings.currencyPosition}
          onChange={(v) => updateSection('regional', 'currencyPosition', v)}
          options={[
            { value: 'before', label: 'Before amount ($100)' },
            { value: 'after', label: 'After amount (100$)' }
          ]}
        />

        <SelectField
          label="Measurement System"
          value={settings.measurementSystem}
          onChange={(v) => updateSection('regional', 'measurementSystem', v)}
          options={[
            { value: 'metric', label: 'Metric (kg, L, km)' },
            { value: 'imperial', label: 'Imperial (lbs, gal, mi)' }
          ]}
        />

        <SelectField
          label="Date Format"
          value={settings.dateFormat}
          onChange={(v) => updateSection('regional', 'dateFormat', v)}
          options={[
            { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (22/11/2025)' },
            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (11/22/2025)' },
            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-11-22)' }
          ]}
        />

        <SelectField
          label="Time Format"
          value={settings.timeFormat}
          onChange={(v) => updateSection('regional', 'timeFormat', v)}
          options={[
            { value: '24h', label: '24-hour (13:00)' },
            { value: '12h', label: '12-hour (1:00 PM)' }
          ]}
        />

        <SelectField
          label="Timezone"
          value={settings.timezone}
          onChange={(v) => updateSection('regional', 'timezone', v)}
          options={TIMEZONES.map(tz => ({ value: tz.value, label: tz.label }))}
        />

        <SelectField
          label="Language"
          value={settings.language}
          onChange={(v) => updateSection('regional', 'language', v)}
          options={LANGUAGES.map(lang => ({ value: lang.code, label: lang.name }))}
        />

        <SelectField
          label="First Day of Week"
          value={settings.firstDayOfWeek}
          onChange={(v) => updateSection('regional', 'firstDayOfWeek', v)}
          options={[
            { value: 'sunday', label: 'Sunday' },
            { value: 'monday', label: 'Monday' }
          ]}
        />
      </div>
      
      <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px', marginTop: '12px' }}>
        <strong>Preview:</strong>
        <div style={{ marginTop: '8px', fontSize: '14px' }}>
          <div>Currency: {formatCurrency(12345.67)}</div>
          <div>Date: {formatDate(new Date(), true)}</div>
        </div>
      </div>
    </div>
  )
}

function NotificationsTab({ settings, updateSection }) {
  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>🔔 Notification Preferences</h3>
      
      <CheckboxField
        label="Enable Notifications"
        checked={settings.enableNotifications}
        onChange={(v) => updateSection('notifications', 'enableNotifications', v)}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <CheckboxField
          label="Email Notifications"
          checked={settings.emailNotifications}
          onChange={(v) => updateSection('notifications', 'emailNotifications', v)}
        />
        <CheckboxField
          label="Sound Alerts"
          checked={settings.soundAlerts}
          onChange={(v) => updateSection('notifications', 'soundAlerts', v)}
        />
        <CheckboxField
          label="Visual Alerts"
          checked={settings.visualAlerts}
          onChange={(v) => updateSection('notifications', 'visualAlerts', v)}
        />
        <NumberField
          label="Reminder Advance (hours)"
          value={settings.reminderAdvance}
          onChange={(v) => updateSection('notifications', 'reminderAdvance', v)}
        />
        <NumberField
          label="Auto-Check Frequency (minutes)"
          value={settings.autoNotificationFrequency}
          onChange={(v) => updateSection('notifications', 'autoNotificationFrequency', v)}
        />
        <NumberField
          label="Low Stock Threshold (%)"
          value={settings.lowStockThreshold}
          onChange={(v) => updateSection('notifications', 'lowStockThreshold', v)}
        />
      </div>

      <div style={{ marginTop: '12px' }}>
        <strong style={{ display: 'block', marginBottom: '12px' }}>Enable Reminders For:</strong>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <CheckboxField
            label="Tasks"
            checked={settings.taskReminders}
            onChange={(v) => updateSection('notifications', 'taskReminders', v)}
          />
          <CheckboxField
            label="Health Issues"
            checked={settings.healthReminders}
            onChange={(v) => updateSection('notifications', 'healthReminders', v)}
          />
          <CheckboxField
            label="Schedules"
            checked={settings.scheduleReminders}
            onChange={(v) => updateSection('notifications', 'scheduleReminders', v)}
          />
          <CheckboxField
            label="Financial Alerts"
            checked={settings.financialAlerts}
            onChange={(v) => updateSection('notifications', 'financialAlerts', v)}
          />
          <CheckboxField
            label="Inventory Alerts"
            checked={settings.inventoryAlerts}
            onChange={(v) => updateSection('notifications', 'inventoryAlerts', v)}
          />
          <CheckboxField
            label="Breeding Events"
            checked={settings.breedingReminders}
            onChange={(v) => updateSection('notifications', 'breedingReminders', v)}
          />
          <CheckboxField
            label="Vaccinations"
            checked={settings.vaccinationReminders}
            onChange={(v) => updateSection('notifications', 'vaccinationReminders', v)}
          />
        </div>
      </div>
    </div>
  )
}

function IntegrationsTab({ settings, updateSection, canEdit }) {
  const [weatherApiKey, setWeatherApiKey] = React.useState(localStorage.getItem('cattalytics:weather:apikey') || '');
  const [saved, setSaved] = React.useState(false);

  const handleSaveWeatherKey = () => {
    if (weatherApiKey.trim()) {
      localStorage.setItem('cattalytics:weather:apikey', weatherApiKey);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      localStorage.removeItem('cattalytics:weather:apikey');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>🔗 Third-Party Integrations</h3>
      
      {saved && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '12px', borderRadius: '6px' }}>
          ✓ Integration settings saved successfully!
        </div>
      )}

      <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: '600' }}>🌤️ Weather Service</h4>
        <p style={{ color: '#6b7280', margin: '0 0 12px', fontSize: '0.9rem' }}>
          Get real-time weather data for your farm. Get a free API key from{' '}
          <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
            OpenWeatherMap
          </a>
        </p>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>
            OpenWeatherMap API Key
          </label>
          <input
            type="password"
            value={weatherApiKey}
            onChange={(e) => setWeatherApiKey(e.target.value)}
            placeholder="Enter your API key (leave empty for demo mode)"
            disabled={!canEdit}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              opacity: canEdit ? 1 : 0.6,
              cursor: canEdit ? 'text' : 'not-allowed'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSaveWeatherKey}
            disabled={!canEdit}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: canEdit ? '#3b82f6' : '#d1d5db',
              color: '#fff',
              border: 'none',
              cursor: canEdit ? 'pointer' : 'not-allowed',
              fontWeight: '500',
              fontSize: '0.9rem'
            }}
          >
            💾 Save API Key
          </button>
          {weatherApiKey && (
            <button
              onClick={() => {
                setWeatherApiKey('');
                localStorage.removeItem('cattalytics:weather:apikey');
              }}
              disabled={!canEdit}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: canEdit ? '#ef4444' : '#d1d5db',
                color: '#fff',
                border: 'none',
                cursor: canEdit ? 'pointer' : 'not-allowed',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              🗑️ Clear
            </button>
          )}
        </div>

        <div style={{ marginTop: '12px', padding: '8px', background: '#fef3c7', borderRadius: '4px', fontSize: '0.85rem', color: '#92400e' }}>
          📌 <strong>Tip:</strong> Without an API key, weather data will use demo mode with placeholder values.
        </div>
      </div>

      <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: '600' }}>📦 More Integrations Coming</h4>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '0.9rem' }}>
          Support for additional services like SMS, email, and data analytics will be added soon.
        </p>
      </div>
    </div>
  );
}

function DataManagementTab({ settings, updateSection }) {
  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>💾 Data Management</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <CheckboxField
          label="Enable Auto-Backup"
          checked={settings.autoBackup}
          onChange={(v) => updateSection('dataManagement', 'autoBackup', v)}
        />
        <NumberField
          label="Backup Frequency (days)"
          value={settings.backupFrequency}
          onChange={(v) => updateSection('dataManagement', 'backupFrequency', v)}
        />
        <SelectField
          label="Backup Format"
          value={settings.backupFormat}
          onChange={(v) => updateSection('dataManagement', 'backupFormat', v)}
          options={[
            { value: 'json', label: 'JSON' },
            { value: 'excel', label: 'Excel' }
          ]}
        />
        <NumberField
          label="Data Retention (days)"
          value={settings.dataRetentionDays}
          onChange={(v) => updateSection('dataManagement', 'dataRetentionDays', v)}
        />
        <CheckboxField
          label="Auto-Delete Old Data"
          checked={settings.autoDeleteOldData}
          onChange={(v) => updateSection('dataManagement', 'autoDeleteOldData', v)}
        />
        <CheckboxField
          label="Compress Backups"
          checked={settings.compressBackups}
          onChange={(v) => updateSection('dataManagement', 'compressBackups', v)}
        />
        <CheckboxField
          label="Include Photos in Backup"
          checked={settings.includePhotos}
          onChange={(v) => updateSection('dataManagement', 'includePhotos', v)}
        />
        <CheckboxField
          label="Enable Cloud Sync"
          checked={settings.cloudSync}
          onChange={(v) => updateSection('dataManagement', 'cloudSync', v)}
        />
        <NumberField
          label="Sync Frequency (minutes)"
          value={settings.syncFrequency}
          onChange={(v) => updateSection('dataManagement', 'syncFrequency', v)}
        />
      </div>

      {settings.lastBackupDate && (
        <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '8px' }}>
          <strong>Last Backup:</strong> {formatDate(settings.lastBackupDate, true)}
        </div>
      )}
    </div>
  )
}

function SecurityTab({ settings, updateSection }) {
  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>🔐 Security & Privacy</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <CheckboxField
          label="Require Authentication"
          checked={settings.requireAuth}
          onChange={(v) => updateSection('security', 'requireAuth', v)}
        />
        <NumberField
          label="Session Timeout (minutes)"
          value={settings.sessionTimeout}
          onChange={(v) => updateSection('security', 'sessionTimeout', v)}
        />
        <CheckboxField
          label="Auto-Lock Screen"
          checked={settings.autoLockScreen}
          onChange={(v) => updateSection('security', 'autoLockScreen', v)}
        />
        <NumberField
          label="Auto-Lock Time (minutes)"
          value={settings.autoLockTime}
          onChange={(v) => updateSection('security', 'autoLockTime', v)}
        />
        <NumberField
          label="Min Password Length"
          value={settings.passwordMinLength}
          onChange={(v) => updateSection('security', 'passwordMinLength', v)}
        />
        <CheckboxField
          label="Require Strong Password"
          checked={settings.requireStrongPassword}
          onChange={(v) => updateSection('security', 'requireStrongPassword', v)}
        />
        <CheckboxField
          label="Encrypt Local Data"
          checked={settings.encryptData}
          onChange={(v) => updateSection('security', 'encryptData', v)}
        />
        <CheckboxField
          label="Show Sensitive Data"
          checked={settings.showSensitiveData}
          onChange={(v) => updateSection('security', 'showSensitiveData', v)}
        />
        <CheckboxField
          label="Two-Factor Authentication"
          checked={settings.twoFactorAuth}
          onChange={(v) => updateSection('security', 'twoFactorAuth', v)}
        />
        <CheckboxField
          label="Enable Audit Log"
          checked={settings.auditLog}
          onChange={(v) => updateSection('security', 'auditLog', v)}
        />
        <CheckboxField
          label="Allow Data Sharing"
          checked={settings.dataSharing}
          onChange={(v) => updateSection('security', 'dataSharing', v)}
        />
      </div>
    </div>
  )
}

function SystemTab({ settings, updateSection }) {
  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>⚙️ System Preferences</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <SelectField
          label="Default View on Startup"
          value={settings.defaultView}
          onChange={(v) => updateSection('system', 'defaultView', v)}
          options={[
            { value: 'dashboard', label: 'Dashboard' },
            { value: 'animals', label: 'Animals' },
            { value: 'tasks', label: 'Tasks' },
            { value: 'finance', label: 'Finance' },
            { value: 'crops', label: 'Crops' }
          ]}
        />
        <NumberField
          label="Items Per Page"
          value={settings.itemsPerPage}
          onChange={(v) => updateSection('system', 'itemsPerPage', v)}
        />
        <CheckboxField
          label="Auto-Refresh Dashboard"
          checked={settings.autoRefreshDashboard}
          onChange={(v) => updateSection('system', 'autoRefreshDashboard', v)}
        />
        <NumberField
          label="Refresh Interval (seconds)"
          value={settings.refreshInterval}
          onChange={(v) => updateSection('system', 'refreshInterval', v)}
        />
        <CheckboxField
          label="Enable Offline Mode"
          checked={settings.offlineMode}
          onChange={(v) => updateSection('system', 'offlineMode', v)}
        />
        <CheckboxField
          label="Show Tooltips"
          checked={settings.showTooltips}
          onChange={(v) => updateSection('system', 'showTooltips', v)}
        />
        <CheckboxField
          label="Compact View"
          checked={settings.compactView}
          onChange={(v) => updateSection('system', 'compactView', v)}
        />
        <CheckboxField
          label="Enable Animations"
          checked={settings.animationsEnabled}
          onChange={(v) => updateSection('system', 'animationsEnabled', v)}
        />
        <SelectField
          label="Default Animal Sort"
          value={settings.defaultAnimalSort}
          onChange={(v) => updateSection('system', 'defaultAnimalSort', v)}
          options={[
            { value: 'name', label: 'Name' },
            { value: 'id', label: 'ID' },
            { value: 'age', label: 'Age' },
            { value: 'date', label: 'Date Added' }
          ]}
        />
        <SelectField
          label="Default Task Sort"
          value={settings.defaultTaskSort}
          onChange={(v) => updateSection('system', 'defaultTaskSort', v)}
          options={[
            { value: 'dueDate', label: 'Due Date' },
            { value: 'priority', label: 'Priority' },
            { value: 'status', label: 'Status' }
          ]}
        />
        <CheckboxField
          label="Show Completed Tasks"
          checked={settings.showCompletedTasks}
          onChange={(v) => updateSection('system', 'showCompletedTasks', v)}
        />
        <CheckboxField
          label="Developer Mode"
          checked={settings.developerMode}
          onChange={(v) => updateSection('system', 'developerMode', v)}
        />
        <CheckboxField
          label="Enable Debug Logs"
          checked={settings.debugLogs}
          onChange={(v) => updateSection('system', 'debugLogs', v)}
        />
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text', tooltip, error }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
        {label}
        {tooltip && (
          <span
            title={tooltip}
            style={{
              marginLeft: '6px',
              cursor: 'help',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '700'
            }}
          >
            ?
          </span>
        )}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: error ? '2px solid #ef4444' : '1px solid #d1d5db',
          fontSize: '14px',
          background: error ? '#fee2e2' : 'white'
        }}
      />
      {error && (
        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
          {error}
        </div>
      )}
    </div>
  )
}

function SelectField({ label, value, onChange, options, tooltip }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
        {label}
        {tooltip && (
          <span
            title={tooltip}
            style={{
              marginLeft: '6px',
              cursor: 'help',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '700'
            }}
          >
            ?
          </span>
        )}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          fontSize: '14px'
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

function NumberField({ label, value, onChange, tooltip, error }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
        {label}
        {tooltip && (
          <span
            title={tooltip}
            style={{
              marginLeft: '6px',
              cursor: 'help',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '700'
            }}
          >
            ?
          </span>
        )}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: error ? '2px solid #ef4444' : '1px solid #d1d5db',
          fontSize: '14px',
          background: error ? '#fee2e2' : 'white'
        }}
      />
      {error && (
        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
          {error}
        </div>
      )}
    </div>
  )
}

function CheckboxField({ label, checked, onChange, tooltip }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
      />
      <label style={{ fontWeight: '500', fontSize: '14px', cursor: 'pointer' }}>
        {label}
        {tooltip && (
          <span
            title={tooltip}
            style={{
              marginLeft: '6px',
              cursor: 'help',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '700'
            }}
          >
            ?
          </span>
        )}
      </label>
    </div>
  )
}

function CustomFieldsTab({ customFields, onRefresh, canEdit }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newField, setNewField] = useState({ key: '', value: '', type: 'text', label: '' })

  const handleAddField = () => {
    if (!newField.key || !newField.label) {
      alert('❌ Please provide both field key and label')
      return
    }
    if (addCustomField(newField.key, newField.value, newField.type, newField.label)) {
      setShowAddForm(false)
      setNewField({ key: '', value: '', type: 'text', label: '' })
      onRefresh()
      alert('✅ Custom field added successfully!')
    } else {
      alert('❌ Failed to add custom field')
    }
  }

  const handleDeleteField = (fieldKey) => {
    if (confirm(`Are you sure you want to delete the custom field "${fieldKey}"?`)) {
      if (deleteCustomField(fieldKey)) {
        onRefresh()
        alert('✅ Custom field deleted successfully!')
      } else {
        alert('❌ Failed to delete custom field')
      }
    }
  }

  const handleUpdateField = (fieldKey, newValue) => {
    const result = updateCustomField(fieldKey, newValue)
    if (result.success) {
      onRefresh()
    } else {
      alert('❌ Failed to update custom field: ' + result.error)
    }
  }

  const fieldKeys = Object.keys(customFields)

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>🎨 Custom Fields</h3>
          <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>
            Add your own custom settings fields to track farm-specific data
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {showAddForm ? '❌ Cancel' : '➕ Add Field'}
          </button>
        )}
      </div>

      {showAddForm && (
        <div style={{
          background: '#f0fdf4',
          border: '2px solid #10b981',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: '600' }}>Add New Custom Field</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <InputField
              label="Field Key (unique identifier)"
              value={newField.key}
              onChange={(v) => setNewField({ ...newField, key: v.toLowerCase().replace(/\s+/g, '_') })}
            />
            <InputField
              label="Field Label (display name)"
              value={newField.label}
              onChange={(v) => setNewField({ ...newField, label: v })}
            />
            <SelectField
              label="Field Type"
              value={newField.type}
              onChange={(v) => setNewField({ ...newField, type: v })}
              options={[
                { value: 'text', label: 'Text' },
                { value: 'number', label: 'Number' },
                { value: 'boolean', label: 'Yes/No' },
                { value: 'date', label: 'Date' }
              ]}
            />
            {newField.type === 'text' && (
              <InputField
                label="Default Value"
                value={newField.value}
                onChange={(v) => setNewField({ ...newField, value: v })}
              />
            )}
            {newField.type === 'number' && (
              <NumberField
                label="Default Value"
                value={newField.value}
                onChange={(v) => setNewField({ ...newField, value: v })}
              />
            )}
            {newField.type === 'boolean' && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Default Value</label>
                <CheckboxField
                  label="Enabled"
                  checked={newField.value}
                  onChange={(v) => setNewField({ ...newField, value: v })}
                />
              </div>
            )}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAddField}
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✅ Add Field
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                padding: '10px 20px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {fieldKeys.length === 0 ? (
        <div style={{
          background: '#f3f4f6',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
          <div style={{ fontSize: '16px', fontWeight: '600' }}>No custom fields yet</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>Add custom fields to track farm-specific data</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {fieldKeys.map(key => {
            const field = customFields[key]
            return (
              <div
                key={key}
                style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  padding: '16px',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                      {field.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Key: <code style={{ background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px' }}>{key}</code>
                      {' • '}
                      Type: {field.type}
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleDeleteField(key)}
                      style={{
                        padding: '6px 12px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
                <div>
                  {field.type === 'text' && (
                    <InputField
                      label="Value"
                      value={field.value}
                      onChange={(v) => handleUpdateField(key, v)}
                    />
                  )}
                  {field.type === 'number' && (
                    <NumberField
                      label="Value"
                      value={field.value}
                      onChange={(v) => handleUpdateField(key, v)}
                    />
                  )}
                  {field.type === 'boolean' && (
                    <CheckboxField
                      label="Enabled"
                      checked={field.value}
                      onChange={(v) => handleUpdateField(key, v)}
                    />
                  )}
                  {field.type === 'date' && (
                    <InputField
                      label="Value"
                      type="date"
                      value={field.value}
                      onChange={(v) => handleUpdateField(key, v)}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{
        background: '#eff6ff',
        border: '1px solid #3b82f6',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#1e40af'
      }}>
        <strong>💡 Tip:</strong> Custom fields let you add any farm-specific settings you need. These are saved with your other settings and can be exported/imported.
      </div>
    </div>
  )
}

function HistoryTab({ history, onRestore, onClear, canEdit }) {
  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>📜 Settings Change History</h3>
          <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>
            View and restore previous settings versions (last {history.length} changes)
          </p>
        </div>
        {canEdit && history.length > 0 && (
          <button
            onClick={onClear}
            style={{
              padding: '8px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🗑️ Clear History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div style={{
          background: '#f3f4f6',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📜</div>
          <div style={{ fontSize: '16px', fontWeight: '600' }}>No history available</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>Settings changes will be tracked here</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {history.map((entry, index) => (
            <div
              key={entry.id}
              style={{
                background: index === 0 ? '#f0fdf4' : '#f9fafb',
                border: index === 0 ? '2px solid #10b981' : '1px solid #e5e7eb',
                padding: '16px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{
                    background: index === 0 ? '#10b981' : '#6b7280',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {index === 0 ? 'CURRENT' : `${index + 1}`}
                  </span>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>
                    {entry.comment || 'Settings updated'}
                  </span>
                </div>
                <div style={{ color: '#6b7280', fontSize: '13px' }}>
                  📅 {formatDate(entry.timestamp, true)} • 👤 {entry.user}
                </div>
              </div>
              {canEdit && index > 0 && (
                <button
                  onClick={() => onRestore(entry.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  ↩️ Restore
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{
        background: '#eff6ff',
        border: '1px solid #3b82f6',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#1e40af'
      }}>
        <strong>💡 Tip:</strong> Settings are automatically saved to history. You can restore any previous version by clicking the Restore button.
      </div>
    </div>
  )
}
