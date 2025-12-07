import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useFinanceStore = create(
  persist(
    (set, get) => ({
      transactions: [],
      filters: {
        search: '',
        type: 'all',
        category: 'all',
        dateFrom: '',
        dateTo: ''
      },
      sortBy: 'date',

      setTransactions: (transactions) => set({ transactions }),
      
      addTransaction: (transaction) => set((state) => ({
        transactions: [...state.transactions, {
          ...transaction,
          id: transaction.id || `TXN-${Date.now()}`,
          timestamp: transaction.timestamp || new Date().toISOString()
        }]
      })),
      
      updateTransaction: (id, updates) => set((state) => ({
        transactions: state.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      
      deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter(t => t.id !== id)
      })),
      
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),
      
      resetFilters: () => set({
        filters: { search: '', type: 'all', category: 'all', dateFrom: '', dateTo: '' }
      }),
      
      setSortBy: (sortBy) => set({ sortBy }),
      
      getFilteredTransactions: () => {
        const { transactions, filters, sortBy } = get()
        let filtered = [...transactions]
        
        if (filters.search) {
          const search = filters.search.toLowerCase()
          filtered = filtered.filter(t => 
            (t.description?.toLowerCase().includes(search)) ||
            (t.category?.toLowerCase().includes(search))
          )
        }
        
        if (filters.type !== 'all') {
          filtered = filtered.filter(t => t.type === filters.type)
        }
        
        if (filters.category !== 'all') {
          filtered = filtered.filter(t => t.category === filters.category)
        }
        
        if (filters.dateFrom) {
          filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.dateFrom))
        }
        
        if (filters.dateTo) {
          filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.dateTo))
        }
        
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'date':
              return new Date(b.date) - new Date(a.date)
            case 'amount':
              return (b.amount || 0) - (a.amount || 0)
            default:
              return 0
          }
        })
        
        return filtered
      },
      
      getFinancialSummary: () => {
        const { transactions } = get()
        const summary = {
          totalIncome: 0,
          totalExpense: 0,
          netProfit: 0,
          byCategory: {},
          recentTransactions: []
        }
        
        transactions.forEach(t => {
          const amount = parseFloat(t.amount) || 0
          if (t.type === 'income') {
            summary.totalIncome += amount
          } else if (t.type === 'expense') {
            summary.totalExpense += amount
          }
          
          const cat = t.category || 'Uncategorized'
          if (!summary.byCategory[cat]) {
            summary.byCategory[cat] = { income: 0, expense: 0 }
          }
          if (t.type === 'income') {
            summary.byCategory[cat].income += amount
          } else {
            summary.byCategory[cat].expense += amount
          }
        })
        
        summary.netProfit = summary.totalIncome - summary.totalExpense
        summary.recentTransactions = [...transactions]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10)
        
        return summary
      },
      
      loadFromLocalStorage: () => {
        try {
          const stored = localStorage.getItem('cattalytics:finance')
          if (stored) {
            set({ transactions: JSON.parse(stored) })
          }
        } catch (e) {
          console.error('Failed to load finance:', e)
        }
      },
      
      syncToLocalStorage: () => {
        localStorage.setItem('cattalytics:finance', JSON.stringify(get().transactions))
      }
    }),
    {
      name: 'finance-store',
      partialize: (state) => ({ transactions: state.transactions, sortBy: state.sortBy })
    }
  )
)

export default useFinanceStore
