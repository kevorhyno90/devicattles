import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAnimalStore = create(
  persist(
    (set, get) => ({
      animals: [],
      groups: [],
      selectedAnimal: null,
      filters: {
        search: '',
        groupId: 'all',
        status: 'all',
        type: 'all'
      },
      sortBy: 'name',

      // Actions
      setAnimals: (animals) => set({ animals }),
      
      addAnimal: (animal) => set((state) => ({
        animals: [...state.animals, { ...animal, id: animal.id || `A-${Date.now()}` }]
      })),
      
      updateAnimal: (id, updates) => set((state) => ({
        animals: state.animals.map(a => a.id === id ? { ...a, ...updates } : a)
      })),
      
      deleteAnimal: (id) => set((state) => ({
        animals: state.animals.filter(a => a.id !== id),
        selectedAnimal: state.selectedAnimal?.id === id ? null : state.selectedAnimal
      })),
      
      bulkUpdateAnimals: (ids, updates) => set((state) => ({
        animals: state.animals.map(a => ids.includes(a.id) ? { ...a, ...updates } : a)
      })),
      
      setSelectedAnimal: (animal) => set({ selectedAnimal: animal }),
      
      setGroups: (groups) => set({ groups }),
      
      addGroup: (group) => set((state) => ({
        groups: [...state.groups, { ...group, id: group.id || `G-${Date.now()}` }]
      })),
      
      updateGroup: (id, updates) => set((state) => ({
        groups: state.groups.map(g => g.id === id ? { ...g, ...updates } : g)
      })),
      
      deleteGroup: (id) => set((state) => ({
        groups: state.groups.filter(g => g.id !== id)
      })),
      
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),
      
      resetFilters: () => set({
        filters: { search: '', groupId: 'all', status: 'all', type: 'all' }
      }),
      
      setSortBy: (sortBy) => set({ sortBy }),
      
      // Computed
      getFilteredAnimals: () => {
        const { animals, filters, sortBy } = get()
        let filtered = [...animals]
        
        // Apply filters
        if (filters.search) {
          const search = filters.search.toLowerCase()
          filtered = filtered.filter(a => 
            (a.name?.toLowerCase().includes(search)) ||
            (a.tag?.toLowerCase().includes(search)) ||
            (a.id?.toLowerCase().includes(search))
          )
        }
        
        if (filters.groupId !== 'all') {
          filtered = filtered.filter(a => a.groupId === filters.groupId)
        }
        
        if (filters.status !== 'all') {
          filtered = filtered.filter(a => a.status === filters.status)
        }
        
        if (filters.type !== 'all') {
          filtered = filtered.filter(a => a.type === filters.type)
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'name':
              return (a.name || '').localeCompare(b.name || '')
            case 'date':
              return new Date(b.dob || 0) - new Date(a.dob || 0)
            case 'weight':
              return (b.weight || 0) - (a.weight || 0)
            case 'tag':
              return (a.tag || '').localeCompare(b.tag || '')
            default:
              return 0
          }
        })
        
        return filtered
      },
      
      getAnimalById: (id) => {
        return get().animals.find(a => a.id === id)
      },
      
      getAnimalsByGroup: (groupId) => {
        return get().animals.filter(a => a.groupId === groupId)
      },
      
      getAnimalStats: () => {
        const { animals } = get()
        const stats = {
          total: animals.length,
          byType: {},
          byStatus: {},
          byGroup: {}
        }
        
        animals.forEach(a => {
          // By type
          const type = a.type || 'Unknown'
          stats.byType[type] = (stats.byType[type] || 0) + 1
          
          // By status
          const status = a.status || 'Unknown'
          stats.byStatus[status] = (stats.byStatus[status] || 0) + 1
          
          // By group
          const group = a.groupId || 'Unassigned'
          stats.byGroup[group] = (stats.byGroup[group] || 0) + 1
        })
        
        return stats
      },
      
      // Load from localStorage (migration helper)
      loadFromLocalStorage: () => {
        try {
          const stored = localStorage.getItem('cattalytics:animals')
          if (stored) {
            const animals = JSON.parse(stored)
            set({ animals })
          }
          
          const storedGroups = localStorage.getItem('cattalytics:groups')
          if (storedGroups) {
            const groups = JSON.parse(storedGroups)
            set({ groups })
          }
        } catch (e) {
          console.error('Failed to load animals from localStorage:', e)
        }
      },
      
      // Sync to localStorage (for backward compatibility)
      syncToLocalStorage: () => {
        const { animals, groups } = get()
        localStorage.setItem('cattalytics:animals', JSON.stringify(animals))
        localStorage.setItem('cattalytics:groups', JSON.stringify(groups))
      }
    }),
    {
      name: 'animal-store',
      partialize: (state) => ({
        animals: state.animals,
        groups: state.groups,
        sortBy: state.sortBy
      })
    }
  )
)

export default useAnimalStore
