import { useState, useEffect, useCallback } from 'react'

export default function useAuthInit({ onLogout } = {}) {
  const [authenticated, setAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    let mounted = true
    import('../lib/appSettings').then(({ isAuthRequired, getDefaultUser }) => {
      import('../lib/auth').then(({ isAuthenticated, getCurrentSession }) => {
        try {
          if (!isAuthRequired()) {
            const defaultUser = getDefaultUser()
            if (mounted) {
              setCurrentUser(defaultUser)
              setAuthenticated(true)
            }
          } else if (isAuthenticated()) {
            const session = getCurrentSession()
            if (mounted) {
              setCurrentUser(session)
              setAuthenticated(true)
            }
          }
        } catch (e) {
          // ignore
        }
      }).catch(() => {})
    }).catch(() => {})

    return () => { mounted = false }
  }, [])

  const handleLoginSuccess = useCallback((user) => {
    setCurrentUser(user)
    setAuthenticated(true)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      const [{ logAction, ACTIONS, ENTITIES }, { logout }] = await Promise.all([
        import('../lib/audit'),
        import('../lib/auth')
      ])
      try {
        logAction(ACTIONS.LOGOUT, ENTITIES.USER, currentUser?.userId || 'unknown', {
          username: currentUser?.username
        })
      } catch (e) {}
      try { logout() } catch (e) {}
    } catch (e) {
      console.warn('Logout failed:', e)
    }

    setAuthenticated(false)
    setCurrentUser(null)
    if (typeof onLogout === 'function') onLogout()
  }, [currentUser, onLogout])

  return { authenticated, currentUser, handleLoginSuccess, handleLogout }
}
