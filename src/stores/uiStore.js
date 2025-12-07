import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUIStore = create(
  persist(
    (set, get) => ({
      // View state
      currentView: 'dashboard',
      previousView: null,
      sidebarOpen: true,
      modalOpen: false,
      modalContent: null,
      
      // Theme
      theme: 'light',
      
      // Notifications
      notifications: [],
      unreadCount: 0,
      
      // Loading states
      loading: {},
      
      // Toasts
      toasts: [],
      
      // Search
      globalSearchOpen: false,
      globalSearchQuery: '',
      
      // Actions
      setView: (view) => set((state) => ({
        currentView: view,
        previousView: state.currentView
      })),
      
      goBack: () => set((state) => ({
        currentView: state.previousView || 'dashboard',
        previousView: null
      })),
      
      toggleSidebar: () => set((state) => ({
        sidebarOpen: !state.sidebarOpen
      })),
      
      openModal: (content) => set({
        modalOpen: true,
        modalContent: content
      }),
      
      closeModal: () => set({
        modalOpen: false,
        modalContent: null
      }),
      
      setTheme: (theme) => set({ theme }),
      
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      })),
      
      addNotification: (notification) => set((state) => ({
        notifications: [{
          id: `notif-${Date.now()}`,
          timestamp: new Date().toISOString(),
          read: false,
          ...notification
        }, ...state.notifications],
        unreadCount: state.unreadCount + 1
      })),
      
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      })),
      
      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      })),
      
      clearNotifications: () => set({
        notifications: [],
        unreadCount: 0
      }),
      
      setLoading: (key, isLoading) => set((state) => ({
        loading: { ...state.loading, [key]: isLoading }
      })),
      
      isLoading: (key) => {
        return get().loading[key] || false
      },
      
      addToast: (toast) => {
        const id = `toast-${Date.now()}`
        set((state) => ({
          toasts: [...state.toasts, {
            id,
            type: 'info',
            duration: 3000,
            ...toast
          }]
        }))
        
        // Auto-remove toast
        if (toast.duration !== 0) {
          setTimeout(() => {
            get().removeToast(id)
          }, toast.duration || 3000)
        }
        
        return id
      },
      
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      })),
      
      showSuccess: (message, duration = 3000) => {
        get().addToast({ type: 'success', message, duration })
      },
      
      showError: (message, duration = 5000) => {
        get().addToast({ type: 'error', message, duration })
      },
      
      showInfo: (message, duration = 3000) => {
        get().addToast({ type: 'info', message, duration })
      },
      
      showWarning: (message, duration = 4000) => {
        get().addToast({ type: 'warning', message, duration })
      },
      
      toggleGlobalSearch: () => set((state) => ({
        globalSearchOpen: !state.globalSearchOpen,
        globalSearchQuery: state.globalSearchOpen ? '' : state.globalSearchQuery
      })),
      
      setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
      
      // Preferences
      preferences: {
        compactMode: false,
        showTips: true,
        autoSave: true,
        soundEnabled: true
      },
      
      updatePreferences: (prefs) => set((state) => ({
        preferences: { ...state.preferences, ...prefs }
      }))
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        preferences: state.preferences
      })
    }
  )
)

export default useUIStore
