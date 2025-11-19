// Client-side authentication system
// Uses localStorage for simplicity - can be upgraded to server-based auth later

const AUTH_KEY = 'devinsfarm:auth'
const USERS_KEY = 'devinsfarm:users'

// User roles with permissions
export const ROLES = {
  MANAGER: {
    name: 'Farm Manager',
    permissions: ['read', 'write', 'delete', 'manage_users', 'view_financials']
  },
  WORKER: {
    name: 'Farm Worker',
    permissions: ['read', 'write']
  },
  VETERINARIAN: {
    name: 'Veterinarian',
    permissions: ['read', 'write', 'view_health']
  },
  VIEWER: {
    name: 'Viewer',
    permissions: ['read']
  }
}

// Default users (for demo - in production, these would be in a database)
const DEFAULT_USERS = [
  {
    id: 'user-001',
    username: 'admin',
    password: 'admin123', // In production: use bcrypt hash
    name: 'Farm Administrator',
    role: 'MANAGER',
    email: 'admin@devinsfarm.com',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-002',
    username: 'worker',
    password: 'worker123',
    name: 'John Worker',
    role: 'WORKER',
    email: 'worker@devinsfarm.com',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-003',
    username: 'vet',
    password: 'vet123',
    name: 'Dr. Sarah Wilson',
    role: 'VETERINARIAN',
    email: 'vet@devinsfarm.com',
    createdAt: new Date().toISOString()
  }
]

// Initialize users if not present
function initUsers() {
  const existing = localStorage.getItem(USERS_KEY)
  if (!existing) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS))
  }
}

// Get all users (admin only)
export function getAllUsers() {
  initUsers()
  const raw = localStorage.getItem(USERS_KEY)
  return raw ? JSON.parse(raw) : DEFAULT_USERS
}

// Login
export function login(username, password) {
  initUsers()
  const users = getAllUsers()
  const user = users.find(u => u.username === username && u.password === password)
  
  if (!user) {
    return { success: false, error: 'Invalid username or password' }
  }

  // Create session
  const session = {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    email: user.email,
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  }

  localStorage.setItem(AUTH_KEY, JSON.stringify(session))
  
  return { success: true, user: session }
}

// Logout
export function logout() {
  localStorage.removeItem(AUTH_KEY)
  return { success: true }
}

// Get current session
export function getCurrentSession() {
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return null

  const session = JSON.parse(raw)
  
  // Update last activity
  session.lastActivity = new Date().toISOString()
  localStorage.setItem(AUTH_KEY, JSON.stringify(session))
  
  return session
}

// Check if user is authenticated
export function isAuthenticated() {
  return getCurrentSession() !== null
}

// Check if user has permission
export function hasPermission(permission) {
  const session = getCurrentSession()
  if (!session) return false

  const role = ROLES[session.role]
  return role && role.permissions.includes(permission)
}

// Check if user has role
export function hasRole(roleName) {
  const session = getCurrentSession()
  return session && session.role === roleName
}

// Get user display name
export function getCurrentUserName() {
  const session = getCurrentSession()
  return session ? session.name : 'Guest'
}

// Get user role display name
export function getCurrentUserRole() {
  const session = getCurrentSession()
  if (!session) return 'Guest'
  const role = ROLES[session.role]
  return role ? role.name : session.role
}

// Add new user (admin only)
export function addUser(userData) {
  if (!hasPermission('manage_users')) {
    return { success: false, error: 'Permission denied' }
  }

  const users = getAllUsers()
  
  // Check if username already exists
  if (users.find(u => u.username === userData.username)) {
    return { success: false, error: 'Username already exists' }
  }

  const newUser = {
    id: 'user-' + Date.now(),
    username: userData.username,
    password: userData.password, // In production: hash with bcrypt
    name: userData.name,
    role: userData.role || 'WORKER',
    email: userData.email || '',
    createdAt: new Date().toISOString()
  }

  users.push(newUser)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))

  return { success: true, user: newUser }
}

// Update user (admin only or own profile)
export function updateUser(userId, updates) {
  const session = getCurrentSession()
  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  // Allow users to update their own profile, or admins to update anyone
  if (userId !== session.userId && !hasPermission('manage_users')) {
    return { success: false, error: 'Permission denied' }
  }

  const users = getAllUsers()
  const index = users.findIndex(u => u.id === userId)
  
  if (index === -1) {
    return { success: false, error: 'User not found' }
  }

  // Prevent non-admins from changing their own role
  if (userId === session.userId && updates.role && !hasPermission('manage_users')) {
    delete updates.role
  }

  users[index] = { ...users[index], ...updates }
  localStorage.setItem(USERS_KEY, JSON.stringify(users))

  return { success: true, user: users[index] }
}

// Delete user (admin only)
export function deleteUser(userId) {
  if (!hasPermission('manage_users')) {
    return { success: false, error: 'Permission denied' }
  }

  const session = getCurrentSession()
  if (userId === session.userId) {
    return { success: false, error: 'Cannot delete your own account' }
  }

  const users = getAllUsers()
  const filtered = users.filter(u => u.id !== userId)
  
  if (filtered.length === users.length) {
    return { success: false, error: 'User not found' }
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(filtered))

  return { success: true }
}

// Change password
export function changePassword(currentPassword, newPassword) {
  const session = getCurrentSession()
  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  const users = getAllUsers()
  const user = users.find(u => u.id === session.userId)
  
  if (!user || user.password !== currentPassword) {
    return { success: false, error: 'Current password is incorrect' }
  }

  user.password = newPassword // In production: hash with bcrypt
  localStorage.setItem(USERS_KEY, JSON.stringify(users))

  return { success: true }
}

// Initialize on load
if (typeof window !== 'undefined') {
  initUsers()
}
