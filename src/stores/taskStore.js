import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      filters: {
        search: '',
        status: 'all',
        priority: 'all',
        assignee: 'all'
      },
      sortBy: 'dueDate',

      setTasks: (tasks) => set({ tasks }),
      
      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, {
          ...task,
          id: task.id || `TASK-${Date.now()}`,
          createdAt: task.createdAt || new Date().toISOString(),
          status: task.status || 'pending'
        }]
      })),
      
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      })),
      
      toggleTaskStatus: (id) => set((state) => ({
        tasks: state.tasks.map(t => 
          t.id === id 
            ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' }
            : t
        )
      })),
      
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),
      
      resetFilters: () => set({
        filters: { search: '', status: 'all', priority: 'all', assignee: 'all' }
      }),
      
      setSortBy: (sortBy) => set({ sortBy }),
      
      getFilteredTasks: () => {
        const { tasks, filters, sortBy } = get()
        let filtered = [...tasks]
        
        if (filters.search) {
          const search = filters.search.toLowerCase()
          filtered = filtered.filter(t => 
            (t.title?.toLowerCase().includes(search)) ||
            (t.description?.toLowerCase().includes(search))
          )
        }
        
        if (filters.status !== 'all') {
          filtered = filtered.filter(t => t.status === filters.status)
        }
        
        if (filters.priority !== 'all') {
          filtered = filtered.filter(t => t.priority === filters.priority)
        }
        
        if (filters.assignee !== 'all') {
          filtered = filtered.filter(t => t.assignedTo === filters.assignee)
        }
        
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'dueDate':
              return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31')
            case 'priority':
              const priorityOrder = { high: 0, medium: 1, low: 2 }
              return priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium']
            case 'status':
              return (a.status || '').localeCompare(b.status || '')
            default:
              return 0
          }
        })
        
        return filtered
      },
      
      getTaskStats: () => {
        const { tasks } = get()
        const today = new Date().toISOString().split('T')[0]
        
        return {
          total: tasks.length,
          completed: tasks.filter(t => t.status === 'completed').length,
          pending: tasks.filter(t => t.status === 'pending').length,
          overdue: tasks.filter(t => 
            t.status !== 'completed' && t.dueDate && t.dueDate < today
          ).length,
          dueToday: tasks.filter(t => 
            t.status !== 'completed' && t.dueDate === today
          ).length,
          byPriority: {
            high: tasks.filter(t => t.priority === 'high').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            low: tasks.filter(t => t.priority === 'low').length
          }
        }
      },
      
      loadFromLocalStorage: () => {
        try {
          const stored = localStorage.getItem('cattalytics:tasks')
          if (stored) {
            set({ tasks: JSON.parse(stored) })
          }
        } catch (e) {
          console.error('Failed to load tasks:', e)
        }
      },
      
      syncToLocalStorage: () => {
        localStorage.setItem('cattalytics:tasks', JSON.stringify(get().tasks))
      }
    }),
    {
      name: 'task-store',
      partialize: (state) => ({ tasks: state.tasks, sortBy: state.sortBy })
    }
  )
)

export default useTaskStore
