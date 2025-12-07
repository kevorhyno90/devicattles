import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCropStore = create(
  persist(
    (set, get) => ({
      crops: [],
      selectedCrop: null,
      filters: {
        search: '',
        status: 'all',
        season: 'all'
      },
      sortBy: 'name',

      setCrops: (crops) => set({ crops }),
      
      addCrop: (crop) => set((state) => ({
        crops: [...state.crops, { ...crop, id: crop.id || `CROP-${Date.now()}` }]
      })),
      
      updateCrop: (id, updates) => set((state) => ({
        crops: state.crops.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      
      deleteCrop: (id) => set((state) => ({
        crops: state.crops.filter(c => c.id !== id),
        selectedCrop: state.selectedCrop?.id === id ? null : state.selectedCrop
      })),
      
      setSelectedCrop: (crop) => set({ selectedCrop: crop }),
      
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),
      
      resetFilters: () => set({
        filters: { search: '', status: 'all', season: 'all' }
      }),
      
      setSortBy: (sortBy) => set({ sortBy }),
      
      getFilteredCrops: () => {
        const { crops, filters, sortBy } = get()
        let filtered = [...crops]
        
        if (filters.search) {
          const search = filters.search.toLowerCase()
          filtered = filtered.filter(c => 
            (c.name?.toLowerCase().includes(search)) ||
            (c.variety?.toLowerCase().includes(search))
          )
        }
        
        if (filters.status !== 'all') {
          filtered = filtered.filter(c => c.status === filters.status)
        }
        
        if (filters.season !== 'all') {
          filtered = filtered.filter(c => c.season === filters.season)
        }
        
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'name':
              return (a.name || '').localeCompare(b.name || '')
            case 'date':
              return new Date(b.plantingDate || 0) - new Date(a.plantingDate || 0)
            case 'area':
              return (b.area || 0) - (a.area || 0)
            default:
              return 0
          }
        })
        
        return filtered
      },
      
      getCropStats: () => {
        const { crops } = get()
        return {
          total: crops.length,
          byStatus: crops.reduce((acc, c) => {
            acc[c.status || 'Unknown'] = (acc[c.status || 'Unknown'] || 0) + 1
            return acc
          }, {}),
          totalArea: crops.reduce((sum, c) => sum + (parseFloat(c.area) || 0), 0)
        }
      },
      
      loadFromLocalStorage: () => {
        try {
          const stored = localStorage.getItem('cattalytics:crops')
          if (stored) {
            set({ crops: JSON.parse(stored) })
          }
        } catch (e) {
          console.error('Failed to load crops:', e)
        }
      },
      
      syncToLocalStorage: () => {
        localStorage.setItem('cattalytics:crops', JSON.stringify(get().crops))
      }
    }),
    {
      name: 'crop-store',
      partialize: (state) => ({ crops: state.crops, sortBy: state.sortBy })
    }
  )
)

export default useCropStore
