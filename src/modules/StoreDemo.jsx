import React, { useEffect } from 'react'
import { useAnimalStore, useTaskStore, useFinanceStore, useUIStore } from '../stores'

/**
 * Store Integration Demo
 * Shows how to use Zustand stores across the app
 */
export default function StoreDemo() {
  const { showSuccess, showError, showInfo, showWarning } = useUIStore()
  
  // Animal store example
  const animals = useAnimalStore(state => state.animals)
  const addAnimal = useAnimalStore(state => state.addAnimal)
  const getAnimalStats = useAnimalStore(state => state.getAnimalStats)
  const animalStats = getAnimalStats()
  
  // Task store example
  const tasks = useTaskStore(state => state.tasks)
  const getTaskStats = useTaskStore(state => state.getTaskStats)
  const taskStats = getTaskStats()
  const addTask = useTaskStore(state => state.addTask)
  
  // Finance store example
  const getFinancialSummary = useFinanceStore(state => state.getFinancialSummary)
  const financialSummary = getFinancialSummary()
  const addTransaction = useFinanceStore(state => state.addTransaction)
  
  const handleAddSampleAnimal = () => {
    addAnimal({
      name: 'Test Cow ' + Date.now(),
      type: 'Cattle',
      breed: 'Holstein',
      status: 'Active',
      tag: 'TAG-' + Date.now()
    })
    showSuccess('Animal added successfully!')
  }
  
  const handleAddSampleTask = () => {
    addTask({
      title: 'Check water troughs',
      priority: 'high',
      status: 'pending',
      dueDate: new Date().toISOString().split('T')[0]
    })
    showInfo('Task created!')
  }
  
  const handleAddTransaction = () => {
    addTransaction({
      type: 'income',
      category: 'Milk Sales',
      amount: 150.50,
      description: 'Daily milk sales',
      date: new Date().toISOString().split('T')[0]
    })
    showSuccess('Transaction recorded!')
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>
        🏪 Zustand Store Integration Demo
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Animal Store Stats */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🐄 Animal Store
          </h2>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
            <strong>Total Animals:</strong> {animalStats.total}
          </div>
          {Object.entries(animalStats.byType).map(([type, count]) => (
            <div key={type} style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
              {type}: {count}
            </div>
          ))}
          <button
            onClick={handleAddSampleAnimal}
            style={{
              marginTop: '16px',
              padding: '10px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Add Sample Animal
          </button>
        </div>
        
        {/* Task Store Stats */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ✅ Task Store
          </h2>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            <strong>Total:</strong> {taskStats.total}
          </div>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
            Completed: {taskStats.completed}
          </div>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
            Pending: {taskStats.pending}
          </div>
          <div style={{ fontSize: '13px', color: '#ef4444', marginBottom: '4px' }}>
            Overdue: {taskStats.overdue}
          </div>
          <div style={{ fontSize: '13px', color: '#f59e0b', marginBottom: '4px' }}>
            Due Today: {taskStats.dueToday}
          </div>
          <button
            onClick={handleAddSampleTask}
            style={{
              marginTop: '16px',
              padding: '10px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Add Sample Task
          </button>
        </div>
        
        {/* Finance Store Stats */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💰 Finance Store
          </h2>
          <div style={{ fontSize: '14px', color: '#10b981', marginBottom: '8px' }}>
            <strong>Income:</strong> ${financialSummary.totalIncome.toFixed(2)}
          </div>
          <div style={{ fontSize: '14px', color: '#ef4444', marginBottom: '8px' }}>
            <strong>Expenses:</strong> ${financialSummary.totalExpense.toFixed(2)}
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            marginTop: '12px',
            color: financialSummary.netProfit >= 0 ? '#10b981' : '#ef4444'
          }}>
            Net: ${financialSummary.netProfit.toFixed(2)}
          </div>
          <button
            onClick={handleAddTransaction}
            style={{
              marginTop: '16px',
              padding: '10px 16px',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Add Transaction
          </button>
        </div>
      </div>
      
      {/* Toast Demo Buttons */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          🔔 Toast Notifications Demo
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => showSuccess('Operation completed successfully!')}
            style={{
              padding: '10px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Show Success
          </button>
          <button
            onClick={() => showError('An error occurred! Please try again.')}
            style={{
              padding: '10px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Show Error
          </button>
          <button
            onClick={() => showWarning('Warning: This action cannot be undone')}
            style={{
              padding: '10px 16px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Show Warning
          </button>
          <button
            onClick={() => showInfo('Information: System maintenance scheduled')}
            style={{
              padding: '10px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Show Info
          </button>
        </div>
      </div>
      
      {/* Code Examples */}
      <div style={{ marginTop: '32px', background: '#f9fafb', padding: '20px', borderRadius: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          📝 Usage Examples
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Import stores:</h3>
          <pre style={{
            background: '#1f2937',
            color: '#e5e7eb',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '13px',
            overflow: 'auto'
          }}>
{`import { useAnimalStore, useTaskStore, useUIStore } from '../stores'`}
          </pre>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Use in component:</h3>
          <pre style={{
            background: '#1f2937',
            color: '#e5e7eb',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '13px',
            overflow: 'auto'
          }}>
{`// Get state
const animals = useAnimalStore(state => state.animals)

// Get action
const addAnimal = useAnimalStore(state => state.addAnimal)

// Get computed value
const stats = useAnimalStore(state => state.getAnimalStats())

// Use action
addAnimal({ name: 'Bessie', type: 'Cattle' })

// Show toast
const { showSuccess } = useUIStore()
showSuccess('Animal added!')`}
          </pre>
        </div>
        
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Available Stores:</h3>
          <ul style={{ fontSize: '14px', color: '#666', paddingLeft: '20px' }}>
            <li><strong>useAnimalStore</strong> - Animals and groups management</li>
            <li><strong>useCropStore</strong> - Crop management</li>
            <li><strong>useFinanceStore</strong> - Financial transactions</li>
            <li><strong>useTaskStore</strong> - Task management</li>
            <li><strong>useInventoryStore</strong> - Inventory management</li>
            <li><strong>useUIStore</strong> - UI state and notifications</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
