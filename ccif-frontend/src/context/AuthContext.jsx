import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const STORAGE_KEY = 'ccif-authenticated'

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  function login(username, password) {
    const valid = username === 'siddhi' && password === '123456'
    if (valid) {
      localStorage.setItem(STORAGE_KEY, 'true')
      setIsAuthenticated(true)
    }
    return valid
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setIsAuthenticated(false)
  }

  const value = useMemo(() => ({
    isAuthenticated,
    login,
    logout
  }), [isAuthenticated])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
