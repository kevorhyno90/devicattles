import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useInventoryStore = create(
  persist(
    (set, get) => ({
      items: [],
      filters: {
        search: '',
        category: 'all',
        lowStock: false
      },
      sortBy: 'name',
      alertThreshold: 10,

      setItems: (items) => set({ items }),
      
      addItem: (item) => set((state) => ({
        items: [...state.items, {
          ...item,
          id: item.id || `INV-${Date.now()}`,
          quantity: parseFloat(item.quantity) || 0,
          addedAt: item.addedAt || new Date().toISOString()
        }]
      })),
      
      updateItem: (id, updates) => set((state) => ({
        items: state.items.map(i => i.id === id ? { ...i, ...updates } : i)
      })),
      
      deleteItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),
      
      adjustQuantity: (id, amount) => set((state) => ({
        items: state.items.map(i => 
          i.id === id 
            ? { ...i, quantity: Math.max(0, (i.quantity || 0) + amount) }
            : i
        )
      })),
      
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),
      
      resetFilters: () => set({
        filters: { search: '', category: 'all', lowStock: false }
      }),
      
      setSortBy: (sortBy) => set({ sortBy }),
      
      setAlertThreshold: (threshold) => set({ alertThreshold: threshold }),
      
      getFilteredItems: () => {
        const { items, filters, sortBy } = get()
        let filtered = [...items]
        
        if (filters.search) {
          const search = filters.search.toLowerCase()
          filtered = filtered.filter(i => 
            (i.name?.toLowerCase().includes(search)) ||
            (i.category?.toLowerCase().includes(search))
          )
        }
        
        if (filters.category !== 'all') {
          filtered = filtered.filter(i => i.category === filters.category)
        }
        
        if (filters.lowStock) {
          const threshold = get().alertThreshold
          filtered = filtered.filter(i => (i.quantity || 0) <= threshold)
        }
        
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'name':
              return (a.name || '').localeCompare(b.name || '')
            case 'quantity':
              return (b.quantity || 0) - (a.quantity || 0)
            case 'category':
              return (a.category || '').localeCompare(b.category || '')
            default:
              return 0
          }
        })
        
        return filtered
      },
      
      getInventoryStats: () => {
        const { items, alertThreshold } = get()
        return {
          total: items.length,
          lowStock: items.filter(i => (i.quantity || 0) <= alertThreshold).length,
          outOfStock: items.filter(i => (i.quantity || 0) === 0).length,
          byCategory: items.reduce((acc, i) => {
            acc[i.category || 'Uncategorized'] = (acc[i.category || 'Uncategorized'] || 0) + 1
            return acc
          }, {}),
          totalValue: items.reduce((sum, i) => 
            sum + ((i.quantity || 0) * (i.unitPrice || 0)), 0
          )
        }
      },
      
      getLowStockAlerts: () => {
        const { items, alertThreshold } = get()
        return items
          .filter(i => (i.quantity || 0) <= alertThreshold && (i.quantity || 0) > 0)
          .sort((a, b) => (a.quantity || 0) - (b.quantity || 0))
      },
      
      getOutOfStockItems: () => {
        return get().items.filter(i => (i.quantity || 0) === 0)
      },
      
      loadFromLocalStorage: () => {
        try {
          const stored = localStorage.getItem('cattalytics:inventory')
          if (stored) {
            set({ items: JSON.parse(stored) })
          }
        } catch (e) {
          console.error('Failed to load inventory:', e)
        }
      },
      
      syncToLocalStorage: () => {
        localStorage.setItem('cattalytics:inventory', JSON.stringify(get().items))
      }
    }),
    {
      name: 'inventory-store',
      partialize: (state) => ({
        items: state.items,
        sortBy: state.sortBy,
        alertThreshold: state.alertThreshold
      })
    }
  )
)

export default useInventoryStore
